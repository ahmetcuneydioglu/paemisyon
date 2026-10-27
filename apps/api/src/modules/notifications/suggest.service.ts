import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { NotificationCategory } from '@prisma/client';
import { CATEGORY_POLICY } from './notification.categories';
import { BODY_MAX, TEMPLATE_VARIABLES, templateWarnings, TITLE_MAX } from './template';

const MODEL = 'claude-sonnet-5-5';

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
      `YALNIZ JSON döndür: [{"title": "...", "body": "..."}, ...] — tam ${n} öneri, başka metin yok.`,
    ].join('\n');
    const user = [
      `Kategori: ${policy.label} (${input.category}).`,
      `Amaç: ${input.goal.trim()}`,
      input.draft?.title || input.draft?.body
        ? `Mevcut taslak — başlık: "${input.draft.title ?? ''}", gövde: "${input.draft.body ?? ''}". Bunu geliştir, farklı ${n} seçenek ver.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    let text = '';
    try {
      const res = await this.client.messages.create({
        model: MODEL,
        max_tokens: 800,
        system,
        messages: [{ role: 'user', content: user }],
      });
      text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    } catch (e) {
      this.logger.error(`AI öneri üretilemedi: ${String(e)}`);
      throw new ServiceUnavailableException('AI önerisi şu an üretilemiyor; birazdan tekrar dene.');
    }
    const parsed = this.parse(text);
    if (parsed.length === 0)
      throw new ServiceUnavailableException('AI önerisi çözümlenemedi; tekrar dene.');
    return parsed.slice(0, n).map((p) => {
      const warnings = templateWarnings(p.title, p.body);
      return {
        ...p,
        warnings,
        blocked: warnings.some((w) => w.code === 'emoji' || w.code === 'forbidden'),
      };
    });
  }

  private parse(text: string): { title: string; body: string }[] {
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try {
      const arr = JSON.parse(m[0]) as unknown;
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
