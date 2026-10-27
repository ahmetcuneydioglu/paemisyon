/**
 * Doc 54 §5 — madde özeti üretimi: girdi JSON (madde-ozeti-girdi.ts) → model → madde başına JSON.
 *
 *   cd apps/api && npx tsx scripts/madde-ozeti-uret.ts <girdi.json> <cikti-dizini>
 *   sonra: npx tsx scripts/madde-ozeti-dogrula.ts <cikti-dizini> --md
 *   sonra: npx tsx scripts/madde-ozeti-yukle.ts <cikti-dizini>
 *
 * Kurallar (Doc 54 §6): lafız ile açıklama ayrı; kanunda olmayan yetki/süre/şart/istisna yok; fıkra ve
 * bent atıfları korunur; sayı yalnız metinde geçerse ya da derivedNumbers formülüyle; diğer mevzuat atfı
 * yalnız metinde açıkça anılan kanun/madde ve verified:false; mülga maddede yalnız başlık + kısa özet;
 * kaynak etiketi istemde yok. Model: claude-opus-5-5, sunucu tarafı fallback açık. Madde başına bir çağrı
 * (uzun maddeler tek yanıtta güvenle biter); dosya zaten varsa atlanır.
 */
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ArticleSummaryJson } from '../src/modules/summaries/madde-ozeti-dogrulayici';
import type { MaddeGirdi } from './madde-ozeti-girdi';

const MODEL = 'claude-opus-5-5';
const [girdiPath, outDir] = process.argv.slice(2);
if (!girdiPath || !outDir) {
  console.error('kullanım: madde-ozeti-uret.ts <girdi.json> <cikti-dizini>');
  process.exit(2);
}

const SYSTEM = `Sen Türk mevzuatı konusunda titiz çalışan bir hukuk araştırmacısı ve polislik sınavlarına hazırlık içeriği
uzmanısın. Verilen RESMÎ madde metninden, Paemisyon'da web ve mobilde yayımlanacak bir MADDE ÖZETİ üretirsin.
Çıktın yalnızca JSON'dur.

KESİN KURALLAR
1. Lafız ile açıklamayı karıştırma: kanunda yazan şey "kanun … der" yoğunluğuyla, senin açıklaman ayrı cümleyle.
2. Kanunda bulunmayan bir yetki, süre, şart, istisna, karar mercii ya da yükümlülük YAZMA. Uygulama bilgisi,
   doktrin, içtihat ve tarihçe yorumu yok. Metindeki değişiklik şerhi ("Ek: 27/3/2015-6638/4 md.") yalnız
   "bu bent 2015'te 6638 sayılı Kanunla eklendi" biçiminde, metinde yazdığı kadar kullanılabilir.
3. Her SAYI (süre, yaş, mesafe, miktar, sayı, kanun numarası, yıl) madde metninde geçmeli. Metinde geçmeyen ama
   açıkça türetilen sayı (ör. bent sayısı) "derivedNumbers" ile formüllü verilir: {"value":4,"expr":"1 + 1 + 1 + 1","refs":["<madde no>"]}.
   Sınav tuzağı olarak andığın YANLIŞ sayıları "counterNumbers" listesine koy.
4. Fıkra ve bent atıflarını koru: "f.2", "f.7-c" biçiminde. Fıkra numarasını metindeki sıraya göre say.
5. Diğer mevzuat atfı ("relatedLegislation") yalnız metinde AÇIKÇA anılan kanun/madde için; "verified": false.
   Aynı kanundaki başka maddeye atıf "md 7" biçiminde ve yalnız metinde geçiyorsa. Kanunun KENDİSİNİ
   "relatedLegislation"a yazma. Metinde olmayan bir sayıyı "yanlış/tuzak" diye anıyorsan MUTLAKA counterNumbers'a ekle.
6. Alanı yalnız anlamlıysa doldur: süre yoksa "timeLimits" boş dizi; istisna yoksa boş. Uydurma yok.
7. Basit hüküm kısa, çok şartlı/istisnalı hüküm ayrıntılı. Kısa paragraflar; "detailed" alanında kalın (**…**)
   ve satır başı liste ("- ") dışında biçim yok. Terimi ilk geçtiği yerde kısaca açıkla.
8. "examReminders": metne dayalı vurgu (karıştırılan kavram, sıra, mercii, istisna); kesin sınav tahmini yok.
   Verilen çıkmış sorular "ne soruluyor / neyle karıştırılıyor" bilgisini verir; soru metnini kopyalama.
9. MÜLGA madde (metin "Mülga" ile başlıyor): yalnız {"repealed":true,"title","shortSummary"} ver; kısa özet
   hangi kanunla kaldırıldığını metinden söyler. Başka alan yok.
10. "AI", "model", "özet" sözcüklerini içerikte kullanma; kaynak kitap/sınav adı yazma.

ÇIKTI ŞEMASI (tek JSON nesnesi, kod bloğu yok):
{"lawSlug","articleNo","repealed"?, "title","shortSummary","detailed","keyPoints":[],"conditions":[],"exceptions":[],
 "timeLimits":[{"label","value","ref"}],"numericalValues":[{"label","value","ref"}],
 "authorityAndLimits":[{"authority","limit","ref"}],"relatedLegislation":[{"law","article","note","verified":false}],
 "examReminders":[],"derivedNumbers":[],"counterNumbers":[]}`;

function userMessage(g: MaddeGirdi, a: MaddeGirdi['articles'][number]): string {
  const refs = Object.entries(g.referenced)
    .filter(([no]) => a.text.includes(`${no} `) || a.text.includes(`${no}/`))
    .map(([no, t]) => `### AYNI KANUN MADDE ${no} (bağlam)\n${t}`)
    .join('\n\n');
  const sorular = a.questions
    .map(
      (q, i) =>
        `${i + 1}. ${q.stem.replace(/\s+/g, ' ')}\n   ${q.options.map((o) => `${o.isCorrect ? '✓' : '✗'} ${o.text.replace(/\s+/g, ' ')}`).join(' | ')}`,
    )
    .join('\n');
  return [
    `KANUN: ${g.law.name} (lawSlug: ${g.law.slug}) · MADDE ${a.no}${a.title ? ` — ${a.title}` : ''}`,
    `Komşu maddeler: ${a.neighbors.map((n) => `md ${n.no}${n.title ? ` (${n.title})` : ''}`).join(', ') || '—'}`,
    '',
    '## RESMÎ MADDE METNİ',
    a.text,
    ...(refs ? ['', refs] : []),
    '',
    '## BU MADDEDEN ÇIKMIŞ SORULAR (✓ doğru, ✗ yanlış şık)',
    sorular || '(soru yok)',
  ].join('\n');
}

(async () => {
  const g = JSON.parse(readFileSync(girdiPath, 'utf8')) as MaddeGirdi;
  mkdirSync(outDir, { recursive: true });
  const client = new Anthropic();
  let n = 0;
  for (const a of g.articles) {
    const dosya = join(
      outDir,
      `${g.law.number ?? g.law.slug}-md-${a.no.replace(/[\/\s]/g, '-')}.json`,
    );
    if (existsSync(dosya)) {
      console.log(`atla (var): ${dosya}`);
      continue;
    }
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'high' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage(g, a) }],
    });
    const res = await stream.finalMessage();
    if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') {
      console.error(`md ${a.no}: ${res.stop_reason}`);
      continue;
    }
    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    let data: ArticleSummaryJson;
    try {
      data = JSON.parse(text) as ArticleSummaryJson;
    } catch {
      writeFileSync(dosya + '.ham.txt', text);
      console.error(`md ${a.no}: JSON ayrıştırılamadı → ${dosya}.ham.txt`);
      continue;
    }
    data.lawSlug = g.law.slug;
    data.articleNo = a.no;
    data.verifiedAt = g.verifiedAt;
    data.sourceLabel = `AI madde özeti — ${g.law.number ? `${g.law.number} s.K.` : g.law.name} md ${a.no}`;
    data.generatedBy = `${res.model} (madde-ozeti-uret.ts)`;
    if (a.repealed) data.repealed = true;
    // Kanunun kendisi "ilgili mevzuat" olamaz (model bazen kendi kanununu listeliyor).
    if (g.law.number && Array.isArray(data.relatedLegislation)) {
      data.relatedLegislation = data.relatedLegislation.filter(
        (r) => !new RegExp(`\\b${g.law.number}\\b`).test(r.law),
      );
    }
    writeFileSync(dosya, JSON.stringify(data, null, 2) + '\n');
    n++;
    console.log(
      `md ${a.no} → ${dosya} · giriş ${res.usage.input_tokens} / çıkış ${res.usage.output_tokens}`,
    );
  }
  console.log(
    `\n${n} madde üretildi. Sıradaki: npx tsx scripts/madde-ozeti-dogrula.ts ${outDir} --md`,
  );
})();
