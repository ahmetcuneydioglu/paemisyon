/**
 * Doc 53 §4 adım 2 — Ünite üretimi: girdi JSON (ozet-girdi.ts) → model → ünite JSON.
 *
 *   cd apps/api && npx tsx scripts/ozet-uret.ts <girdi.json> <slug> "<ünite başlığı>" <cikti.json> [--topic <topicId>]
 *   sonra: npx tsx scripts/ozet-dogrula.ts <cikti.json> --md   (geçmeyen kart düşer / düzeltilir)
 *   sonra: npx tsx scripts/ozet-yukle.ts  <cikti.json>         (in_review; yayın panelden)
 *
 * İstem kuralları (Doc 53 §4): referanssız cümle yok; tarihçe/doktrin iddiası yok; sayı yalnız
 * metinde geçerse ya da derivedNumbers formülüyle; yanlış şık sayıları counterNumbers'a;
 * exam_stats ve bridge kartlarını MODEL YAZMAZ (betik doldurur). Kaynak etiketi istemde yok.
 * Çıktı JSON şeması pilotla aynı (docs/53-konu-ozetleri/pilot/anayasa-yasama-1.json).
 *
 * Model: claude-opus-5-5 (varsayılan, skill kuralı). Sunucu tarafı fallback açık: güvenlik
 * sınıflandırıcısı reddederse istek aynı çağrıda yedek modelde tamamlanır.
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import type { SummaryUnitJson } from '../src/modules/summaries/ozet-dogrulayici';
import type { OzetGirdi } from './ozet-girdi';

const MODEL = 'claude-opus-5-5';

const args = process.argv.slice(2);
const topicIdx = args.indexOf('--topic');
const topicOverride = topicIdx >= 0 ? args.splice(topicIdx, 2)[1] : undefined;
const [girdiPath, slug, title, out] = args;
if (!girdiPath || !slug || !title || !out) {
  console.error('kullanım: ozet-uret.ts <girdi.json> <slug> "<başlık>" <cikti.json> [--topic <topicId>]');
  process.exit(2);
}

const SYSTEM = `Sen Paemisyon'un konu özeti yazarısın. Polis akademisi sınavına (PAEM) hazırlanan yetişkin
okurlar için, verilen resmî madde metinlerinden KART DİZİSİ üretirsin. Çıktın yalnızca JSON'dur.

KESİN KURALLAR
1. Her kart "articleRefs" ile en az bir madde numarasına bağlanır; referans verilen maddenin metninde
   dayanağı olmayan hiçbir cümle yazma. Tarihçe ("2017 değişikliğiyle…"), doktrin, içtihat, yorum YOK.
2. Karttaki her SAYI ya referans maddenin metninde geçer (rakam ya da yazıyla) ya da
   "derivedNumbers" içinde açık formülle türetilir (örn. 600 üyenin salt çoğunluğu: {"value":301,"expr":"floor(600 / 2) + 1","refs":["75","84"]}).
   Kartın "yanlış şık" olarak andığı sayıları "counterNumbers" listesine koy (metinde geçmemeli).
   Liste numarası ("1.", "2.") ve madde atfı ("md 84", "84. madde") sayı sayılmaz.
3. Kart türleri ve biçimleri:
   - concept: tek fikir, bir paragraf, "body". Sıcak, kısa, "sen" dili.
   - rule: kural + şart + istisna, madde imlâsına yakın, "body" (kalın ve liste kullanabilirsin).
   - numbers: "rows": [{"label","value","refs"}] — sayı ve süre tablosu; "body" YOK. Satırlı kartlarda da
     "articleRefs" ZORUNLUDUR: satırlardaki refs'lerin birleşimi.
   - compare: "rows": [{"aspect","left","right","refs"}] — iki kurum/kavram yan yana; "body" YOK.
   - trap: soru köklerinden ve YANLIŞ ŞIKLARDAN türetilen "sık karıştırılan" uyarısı, "body".
   - exam_stats ve bridge: SEN YAZMA. Ünite sonuna şu iki kartı sabit koy:
     {"type":"exam_stats","title":"Sınav der ki","rows":[],"articleRefs":[],"generated":true}
     {"type":"bridge","title":"Bu üniteden soru çöz","articleRefs":[],"generated":true}
4. Sıra: kavram → kurallar ve tuzaklar madde sırasıyla → ünite ortasında ve sonunda birer numbers tablosu →
   gerekirse compare → exam_stats → bridge. 14–24 kart; ünite 10–15 dakikada okunmalı.
5. Dil: kavram ve tuzak kartlarında sıcak ve doğrudan; tablolarda kuru. Hukuk terimleri metindeki hâliyle.
   "AI", "model", "özet" sözcüklerini kart metninde kullanma. Hiçbir kaynak kitap/sınav adı yazma.
6. Soru metinlerini kopyalama; onlardan yalnız "ne soruluyor" ve "neyle karıştırılıyor" bilgisini çıkar.

ÇIKTI: Tek bir JSON nesnesi: {"unit":{...},"blocks":[...]}. Kod bloğu, açıklama, ön söz yok.`;

function userMessage(g: OzetGirdi, topicId: string): string {
  const maddeler = g.articles
    .map((a) => `### MADDE ${a.no}${a.title ? ' — ' + a.title : ''} (çıkmış soru: ${a.questionCount})\n${a.text}`)
    .join('\n\n');
  const sorular = g.questions
    .map(
      (q, i) =>
        `${i + 1}. [md ${q.articleNos.join(', ')}] ${q.stem.replace(/\s+/g, ' ')}\n   ` +
        q.options.map((o) => `${o.isCorrect ? '✓' : '✗'} ${o.text.replace(/\s+/g, ' ')}`).join(' | '),
    )
    .join('\n');
  return [
    `ÜNİTE: ${title}`,
    `slug: ${slug} · legislationSlug: ${g.legislation.slug} · topicId: ${topicId} · madde aralığı: ${g.range.from}–${g.range.to}`,
    `"unit" alanları: slug, legislationSlug, topicId, title, subtitle, articleFrom, articleTo, readingMinutes, sourceLabel="AI özeti — ${g.legislation.name}, md ${g.range.from}–${g.range.to}".`,
    '',
    '## RESMÎ MADDE METİNLERİ',
    maddeler,
    '',
    '## BU MADDELERDEN ÇIKMIŞ SORULAR (✓ doğru, ✗ yanlış şık)',
    sorular || '(soru yok)',
  ].join('\n');
}

(async () => {
  const girdi = JSON.parse(readFileSync(girdiPath, 'utf8')) as OzetGirdi;
  const topicId = topicOverride ?? girdi.legislation.topicId;
  if (!topicId) {
    console.error('topicId yok: mevzuat konuya bağlı değil; --topic ver.');
    process.exit(2);
  }
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'high' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage(girdi, topicId) }],
  });
  const res = await stream.finalMessage();
  if (res.stop_reason === 'refusal') {
    console.error('Model reddetti:', res.stop_details?.explanation ?? '');
    process.exit(1);
  }
  if (res.stop_reason === 'max_tokens') {
    console.error('Çıktı kesildi (max_tokens); üniteyi böl ya da sınırı artır.');
    process.exit(1);
  }
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let data: SummaryUnitJson;
  try {
    data = JSON.parse(text) as SummaryUnitJson;
  } catch {
    writeFileSync(out + '.ham.txt', text);
    console.error('JSON ayrıştırılamadı; ham çıktı:', out + '.ham.txt');
    process.exit(1);
  }
  data.unit = {
    ...data.unit,
    slug,
    legislationSlug: girdi.legislation.slug,
    topicId,
    title: data.unit?.title || title,
    articleFrom: girdi.range.from,
    articleTo: girdi.range.to,
    sourceLabel: `AI özeti — ${girdi.legislation.name}, md ${girdi.range.from}–${girdi.range.to}`,
    generatedBy: `${res.model} (ozet-uret.ts)`,
  };
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  console.log(
    `Üretildi: ${data.blocks?.length ?? 0} kart → ${out} · model ${res.model} · giriş ${res.usage.input_tokens} / çıkış ${res.usage.output_tokens} token`,
  );
  console.log(`Sıradaki: npx tsx scripts/ozet-dogrula.ts ${out} --md`);
})();
