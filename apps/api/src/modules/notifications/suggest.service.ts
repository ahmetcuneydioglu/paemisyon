import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { NotificationCategory } from '@prisma/client';
import { CATEGORY_POLICY } from './notification.categories';
import { BODY_MAX, TEMPLATE_VARIABLES, templateWarnings, TITLE_MAX } from './template';

const MODEL = 'claude-sonnet-5-5';
/** Ret (refusal) olursa sunucu tarafında aynı istek bu modelle yeniden koşar. */
const FALLBACK_MODEL = 'claude-sonnet-5';
/**
 * Sonnet 5.5'te düşünme hep açıktır ve düşünme jetonları `max_tokens`'tan yer. 800 sınırında
 * düşünme ~550–700 jeton tutuyor, JSON yarıda kesiliyordu (stop_reason=max_tokens → "çözümlenemedi";
 * 19 Kas 2026). Sınır yalnız tavan; kullanılan kadar ödenir.
 */
const MAX_TOKENS = 16000;

/** Yapılandırılmış çıktı şeması: yanıt bu JSON'a uymak zorunda (serbest metin ayrıştırması yok). */
const SUGGESTION_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, body: { type: 'string' } },
        required: ['title', 'body'],
        additionalProperties: false,
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
} as const;

export type SuggestInput = {
  category: NotificationCategory;
  /** Editörün amacı: "haftalık denemeye katılımı artır", "sınava 7 gün kala moral" … */
  goal: string;
  /** Varsa mevcut taslak; model onu iyileştirir. */
  draft?: { title?: string; body?: string } | null;
  count?: number;
};

export type Suggestion = {
  title: string;
  body: string;
  warnings: { code: string; message: string }[];
  /** emoji/yasaklı kelime: gönderilemez; panel soluk gösterir. */
  blocked: boolean;
};

/**
 * AI metin önerisi (Doc 52 F3): Claude yalnız ÖNERİR, insan onayı zorunlu — öneri doğrudan gönderilmez,
 * forma yazılır ve editör düzenler. Makine denetimi: karakter sınırı, emoji ve yasaklı kelime (Doc 26 dili).
 * Kaynak etiketi, kişisel veri ya da soru metni modele gitmez; yalnız kategori, amaç ve taslak.
 */
@Injectable()
export class SuggestService {
  private readonly logger = new Logger(SuggestService.name);
  private readonly client: Anthropic | null;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    this.client = key ? new Anthropic({ apiKey: key }) : null;
  }

  get available(): boolean {
    return this.client != null;
  }

  async suggest(input: SuggestInput): Promise<Suggestion[]> {
    if (!this.client)
      throw new ServiceUnavailableException('AI önerisi kapalı: ANTHROPIC_API_KEY tanımlı değil.');
    const n = Math.min(Math.max(input.count ?? 3, 1), 5);
    const policy = CATEGORY_POLICY[input.category];
    const system = [
      'Sen Paemisyon (polis amirliği sınavına hazırlık uygulaması) için bildirim metni yazan bir editörsün.',
      'Dil: Türkçe, "sen" hitabı, sakin ve meslek dilinde ("nöbet", "devriye", "tur"); abartı yok, ünlem yok, EMOJİ YOK.',
      'Yasak kalıplar: "seni özledik", "geri dön", "fırsatları kaçırma", "kaçırma!". Suçlayıcı ya da baskı kuran dil yok.',
      `Başlık en çok ${TITLE_MAX} karakter, gövde en çok ${BODY_MAX} karakter; eylem imalı, somut (sayı/konu varsa kullan).`,
      `Kullanılabilir değişkenler (çift süslü parantezle): ${TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(' ')}. Gerekmiyorsa kullanma.`,
      `Tam ${n} öneri ver; her biri ayrı bir yaklaşım olsun.`,
    ].join('\n');
    const user = [
      `Kategori: ${policy.label} (${input.category}).`,
      `Amaç: ${input.goal.trim()}`,
      input.draft?.title || input.draft?.body
        ? `Mevcut taslak — başlık: "${input.draft.title ?? ''}", gövde: "${input.draft.body ?? ''}". Taslağı temel al ama kopyalama.`
        : '',
      // Taslak varken model "geliştir"i tek sürüm diye okuyup 1 öneri dönüyordu (19 Kas 2026).
      `suggestions dizisine tam ${n} öğe yaz: ${n} ayrı başlık+gövde çifti, her biri farklı bir yaklaşım.`,
    ]
      .filter(Boolean)
      .join('\n');
    let res: Anthropic.Beta.BetaMessage;
    try {
      res = await this.client.beta.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // Kısa metin işi: derin düşünme gerekmiyor, panel yanıtı beklerken gecikme düşük kalsın.
        output_config: {
          effort: 'low',
          format: { type: 'json_schema', schema: SUGGESTION_SCHEMA },
        },
        betas: ['server-side-fallback-2026-06-01'],
        fallbacks: [{ model: FALLBACK_MODEL }],
        system,
        messages: [{ role: 'user', content: user }],
      });
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) {
        this.logger.warn(`AI öneri hız sınırına takıldı: ${e.message}`);
        throw new ServiceUnavailableException(
          'AI önerisi yoğunluk nedeniyle bekliyor; bir dakika sonra tekrar dene.',
        );
      }
      this.logger.error(`AI öneri üretilemedi: ${String(e)}`);
      throw new ServiceUnavailableException('AI önerisi şu an üretilemiyor; birazdan tekrar dene.');
    }
    if (res.stop_reason === 'refusal') {
      this.logger.warn(`AI öneri reddedildi: ${res.stop_details?.category ?? '—'}`);
      throw new ServiceUnavailableException(
        'AI bu amaç için öneri üretmedi; amacı farklı ifade edip tekrar dene.',
      );
    }
    if (res.stop_reason === 'max_tokens') {
      this.logger.error(`AI öneri jeton sınırında kesildi: ${JSON.stringify(res.usage)}`);
      throw new ServiceUnavailableException('AI önerisi yarıda kesildi; tekrar dene.');
    }
    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    const parsed = this.parse(text);
    if (parsed.length === 0) {
      this.logger.error(`AI öneri çözümlenemedi (stop=${res.stop_reason}): ${text.slice(0, 300)}`);
      throw new ServiceUnavailableException('AI önerisi çözümlenemedi; tekrar dene.');
    }
    return parsed.slice(0, n).map((p) => {
      const warnings = templateWarnings(p.title, p.body);
      return {
        ...p,
        warnings,
        blocked: warnings.some((w) => w.code === 'emoji' || w.code === 'forbidden'),
      };
    });
  }

  /** Şemalı çıktı `{ suggestions: [...] }`; yine de alanlar tek tek doğrulanır (boş metin elenir). */
  private parse(text: string): { title: string; body: string }[] {
    try {
      const arr = (JSON.parse(text) as { suggestions?: unknown } | null)?.suggestions;
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(
          (x): x is { title: string; body: string } =>
            !!x &&
            typeof x === 'object' &&
            typeof (x as { title?: unknown }).title === 'string' &&
            typeof (x as { body?: unknown }).body === 'string',
        )
        .map((x) => ({ title: x.title.trim(), body: x.body.trim() }))
        .filter((x) => x.title && x.body);
    } catch {
      return [];
    }
  }
}
