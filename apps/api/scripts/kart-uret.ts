/**
 * Doc 56 §8.3 — Bilgi kartı üretimi: ünite girdisi (ozet-girdi.ts) + yayındaki ünite özeti → model → deste JSON.
 *
 *   cd apps/api && npx tsx scripts/kart-uret.ts <girdi.json> <unite.json> <cikti.json> [--hedef 28]
 *   cd apps/api && npx tsx scripts/kart-uret.ts --onar <girdi.json> <deste.json>   (yalnız stil kapısı)
 *   cd apps/api && npx tsx scripts/kart-uret.ts <girdi.json> - <cikti.json> --slug tck-… --baslik "…"   (ünite özeti yok: TCK)
 *   sonra: npx tsx scripts/kart-dogrula-uzak.ts <cikti.json> --md > <cikti>.dogrulama.md   (canlı madde metni)
 *   sonra: npx tsx scripts/kart-yukle.ts <cikti.json> [--replace]                           (in_review; yayın panelden)
 *
 * Girdi: `docs/53-konu-ozetleri/uniteler/girdi-<slug>.json` (madde metinleri + çıkmış sorular) ve
 * `uniteler/<slug>.json` (ünite özeti: rule / numbers / trap / compare blokları kart hammaddesidir).
 * Deste başlığı (topicId, legislationSlug, unitSlug, sourceLabel) betikçe doldurulur; model yalnız kartları yazar.
 *
 * İstem kuralları (CLAUDE.md Doc 56 istisnası): her kart ≥1 gerçek madde referansı; cevap/açıklamadaki
 * her sayı madde metninde geçer ya da derivedNumbers formülüyle türetilir; yanlış şık sayıları
 * counterNumbers'a; aynı cevaba giden ikinci kart yok; kanunda olmayan yetki/süre/şart yok. Kaynak etiketi
 * istemde YOK (4 Eyl 2026 kuralı). Boşluk (cloze) kartı pilot kararıyla üretilmez (--cloze ile açılır).
 *
 * Model: claude-opus-5-5; sunucu tarafı fallback açık ('default' zinciri, ozet-uret.ts kalıbı).
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync } from 'fs';
import type { FlashcardDeckJson, FlashcardJson } from '../src/modules/flashcards/kart-dogrulayici';
import type { SummaryUnitJson } from '../src/modules/summaries/ozet-dogrulayici';
import { articleLabel } from '../src/modules/summaries/unite-eslesme';
import type { OzetGirdi } from './ozet-girdi';

const MODEL = 'claude-opus-5-5';

const args = process.argv.slice(2);
const hedefIdx = args.indexOf('--hedef');
const hedef = hedefIdx >= 0 ? Number(args.splice(hedefIdx, 2)[1]) : 28;
const clozeIdx = args.indexOf('--cloze');
const clozeAcik = clozeIdx >= 0 ? (args.splice(clozeIdx, 1), true) : false;
const baslikIdx = args.indexOf('--baslik');
const baslik = baslikIdx >= 0 ? args.splice(baslikIdx, 2)[1] : '';
const slugIdx = args.indexOf('--slug');
const partiSlug = slugIdx >= 0 ? args.splice(slugIdx, 2)[1] : '';
const onarIdx = args.indexOf('--onar');
const onarKipi = onarIdx >= 0 ? (args.splice(onarIdx, 1), true) : false;
const [girdiPath, unitePath, out] = args;
if (
  !girdiPath ||
  !unitePath ||
  (!onarKipi && (!out || !Number.isFinite(hedef) || hedef < 10 || hedef > 60))
) {
  console.error(
    'kullanım: kart-uret.ts <girdi.json> <unite.json> <cikti.json> [--hedef 10–60] [--cloze]',
  );
  console.error(
    '          kart-uret.ts --onar <girdi.json> <deste.json>   (yalnız stil kapısı, yerinde yazar)',
  );
  process.exit(2);
}

const SYSTEM = `Sen Paemisyon'un bilgi kartı (flashcard) yazarısın. Polis akademisi sınavına (PAEM) hazırlanan yetişkin
okurlar için, verilen RESMÎ MADDE METİNLERİNDEN iki yüzlü kartlar üretirsin: ön yüz tek cevaplı bir soru, arka yüz
kısa ve kesin cevap. Çıktın yalnızca JSON'dur.

KESİN KURALLAR
1. Her kart "articleRefs" ile en az bir madde numarasına bağlanır; cevabın ve açıklamanın dayanağı o maddelerin
   metnindedir. Metinde olmayan hiçbir yetki, süre, şart, istisna ya da kurum yazma. Tarihçe ("2017 değişikliğiyle…"),
   doktrin, içtihat, amaç yorumu ("…kişiyi serbest tutmak içindir") YOK. Mülga maddeye ve mülga hükme kart yazma;
   Anayasa Mahkemesi iptaliyle boşluk kalan ("(İptal ibare: …) (…)" işaretli) fıkradan da kart yazma: iptalle konusu
   kalmayan cümle (ör. "kolluk amirinin kararı 24 saatte hâkim onayına sunulur") kart olamaz. Metinde mülga olduğu
   belirtilen bir hükme atıf yapan bentten de kart yazma (atfın hedefi yoksa kart yanlış öğretir). Aynı şekilde:
   kalkmış kurumu anan hüküm (İcra Vekilleri Heyeti, Bakanlar Kurulu, Başbakanlık, …Müsteşarlığı), başka kanunun
   mülga ya da başka konuda yeniden yazılmış maddesine atıf, süresi dolmuş geçici/geçiş hükmü ("…altı ay içinde
   kurulur", "…kuruluncaya kadar"), eski para birimi tutarı ("…milyon/milyar lira", 2005 öncesi TL), kalkmış organ ya
   da düzenleme (il daimi encümeni, Seyrüsefer Talimatnamesi, Matbuat Kanunu) ve 765 sayılı eski TCK'ya atıf
   ("Ceza Kanununun 546 ncı maddesi") ve bileşimi ya da işleyişi kalkmış makamlara dayanan kurul/komisyon (umumi
   müfettiş, Büyük Erkanıharbiye…) → kart yazılmaz; bunlar yürürlükteki düzeni öğretmez. Eski kanunlardaki kurum
   adlarını metindeki hâliyle yaz; güncel karşılığı parantezle YALNIZ kesin bilinen ad değişikliğinde ekle (Dahiliye
   Vekili → İçişleri Bakanı), kurum birleşmesi/bölünmesinde (Maliye Vekili, Umum Müdürlük…) eşleme yapma; çekim eki
   parantezden ÖNCE gelir: "Mesuliyet Dahiliye Vekilindedir (İçişleri Bakanı)". Farklı dönem maddelerindeki derece numaralarını başka
   maddedeki rütbe cetveline EŞLEME (1937 tarihli "altıncı derece" bugünkü cetvelin 6. satırı değildir); 657 öncesi
   maaş/derece düzenine, "Vekaletçe" gibi kalkmış usule dayanan hükümden kart yazma. Aynı konuyu (terfi, bekleme
   süresi, sicil, meslekten çıkarma…) kanunun güncel bir maddesi (ör. 3201 md 55) yeniden düzenliyorsa, eski tarihli
   maddenin (md 47, 56, 65–67 gibi) düzeninden kart yazma; güncel maddeyi esas al. Atıf yapılan mülga kanunun adını
   (743 sayılı Türk Kanunu Medenisi, 765 sayılı TCK, 1412 sayılı CMUK…) ön yüzde güncel çerçeve gibi kullanma.
   "Ancak", "bununla birlikte" ile başlayan istisna cümlesini doğru kurala bağla: istisna hangi kaydı kaldırıyorsa
   onu söyle (md 78'de yüzde beş hali 30 ay kaydının istisnasıdır; 1 yıl kala yasağını kaldırmaz). Ön yüzde tek soru
   sor; "ve" ile iki soruyu birleştirme. Cevap, maddedeki yetkiyi başka kuruma yükleme (yetki kimdeyse o).
2. "back" ve "explanation" içindeki her SAYI (rakam ya da yazıyla: 600, üç, yüzde beş, 15 gün) ya referans maddenin
   metninde geçer ya da "derivedNumbers" içinde açık formülle türetilir:
   {"value":301,"expr":"floor(600 / 2) + 1","refs":["75","84"],"note":"üye tamsayısının salt çoğunluğu"}.
   Formül işlenenleri (600 gibi) refs'teki madde metninde geçmelidir; 1, 2, 7 ve 100 serbesttir; "ceil" ve "floor"
   kullanılabilir. Tuzak kartında "yanlış şık" olarak andığın sayıları "counterNumbers" listesine koy
   (bu sayılar referans metninde GEÇMEMELİDİR). Madde atfı ("md 84") ve liste numarası sayı sayılmaz.
   Emin olmadığın sayıyı yazma; sayıyı değil kuralı sor.
3. Kart türleri:
   - "qa": kavram/kurum/kural sorusu. Ön yüz "Kim…? Ne…? Hangi…? …mı?" biçiminde tek cevaplı soru.
   - "numeric": sayı, süre, oran, yeter sayı sorusu. Arka yüz sayıyı ve bağlamını verir. Yalnız METİNDE YAZAN
     sayıları sor (600 üye, 15 gün, beşte üç); "maddede kaç unsur/nitelik/sebep sayılır?" gibi SAYIM soruları YASAK
     (o sayı metinde geçmez, sınav da onu sormaz). Sayılan şeylerin kendisini sor ("hangi sebeplerle ayırım
     gözetilemez?"), sayısını değil.
   - "trap": çıkmış soruların YANLIŞ ŞIKLARINDAN türeyen "sık karıştırılan" sorusu; arka yüz "Hayır/Evet" ile başlar,
     doğrusunu söyler. Olumsuz iddia ("X yapamaz", "Y değildir") yalnız referans maddenin metni açıkça öyle diyorsa;
     başka bölümden çıkan iddiaya o maddeyi de referans ver. Kartta ŞIK yoktur: "şık", "çeldirici", "seçenek"
     deme; yanlış bilgiyi doğrudan yalanla ("Yasak 1 yıl kala başlar; 2 yıl diye bir kayıt yok").
   - Tuzak kartının ön yüzü YALNIZ referans maddenin metninde geçen bir öğeyle kurulur ("teminat", "ilçe", "7 gün" gibi
     başka kanundan ya da hiçbir metinden gelmeyen bir öğeyi anıp çürütme). Tuzak, AYNI MADDEDEKİ iki öğenin
     karıştırılması ya da o maddedeki şartın atlanması üzerine kurulur; başka bir maddedeki sayıyı, süreyi ya da
     hali bu maddeye taşıyıp çürütme (çapraz tuzak YASAK). counterNumbers'a yalnız referans maddede geçen sayı girer.
   - Tuzak ön yüzü OLUMLU soru kalıbında kurulur ("…kesin midir?", "…yapılabilir mi?"); "…edilemez mi?",
     "…yasak mıdır?" gibi olumsuz kalıp kullanılmaz (verilen "Hayır" iki yöne okunur).
   - "Evet/Hayır" cevabını koşulsuz bırakma: aynı maddedeki diğer kayıtlar (dönemde bir defa, 30 ay gibi) varsa
     arka yüzde bir cümleyle an.${
       clozeAcik
         ? '\n   - "cloze": ön yüzde boşluk (___) olan madde cümlesi; arka yüz boşluğu dolduran ifade.'
         : '\n   - "cloze" türü KULLANMA.'
     }
4. Biçim: "front" ≤ 300 karakter, tek soru, tek cevap. "back" ≤ 300 karakter, 1–2 cümle, cevabı ilk kelimede ver.
   "explanation" ≤ 800 karakter, isteğe bağlı: neden böyle, hangi komşu kuralla karışır, hangi istisna var.
   Açıklama YALNIZ "articleRefs"teki maddelerin içeriğini anlatır: başka bir maddeyle ya da maddede olmayan bir
   kavramla KARŞILAŞTIRMA yapmaz ("X md 56'da değil bu maddede geçer" yazma), sınav taktiği vermez ("karıştırma",
   "…sorulursa hatırla", "…düşün", "atlarsan yanılırsın"), maddede geçmeyen bir öğeyi çürütmez ("X listede yok",
   "Y diye bir kayıt yazılmaz", "geçmez" yazma; tuzak kartının arka yüzü hariç). Kurala uymayan açıklama betikçe
   reddedilir.
   Sayılan şeyleri metindeki tam ifadesiyle an ("kanunun öngördüğü meslek sırları"). "numeric" kartın cevabı bir
   sayı ya da süredir; cevap "derhal" gibi sayısızsa kart "qa" olur.
   "difficulty": 1 (temel), 2 (orta), 3 (ayrıntı/tuzak). Ön yüzdeki sayı soru kurgusudur ("600 üyeden kaçı…"),
   denetlenmez; ama arka yüze taşıdığın her sayı 2. kurala girer.
5. Karışım ve sıra: hedef sayıya yakın kart; yaklaşık %45 qa, %35 numeric, %20 trap. Zorluk: ~%20 1, ~%45 2, ~%35 3.
   Kartlar madde sırasıyla; aynı maddeden art arda en çok 3 kart. Ünite özetindeki "numbers" satırları ve "trap"
   maddeleri öncelikli hammaddedir; çıkmış sorular "ne soruluyor" ve "neyle karıştırılıyor" bilgisini verir.
6. Aynı cevaba giden ikinci kart YOK (ön yüzü farklı olsa da). Her kart bağımsız okunmalı: "yukarıdaki", "bu ünite"
   deme. Soru metinlerini kopyalama. "AI", "model", "özet", "kart" sözcüklerini kart metninde kullanma. Hiçbir
   kaynak kitap ya da sınav adı yazma.
7. Dil: sıcak, doğrudan, "sen" dili; hukuk terimleri metindeki hâliyle; kısaltma yerine tam ad (ilk geçişte).

ÖRNEK KARTLAR (biçim için; içerik başka üniteden):
{"kind":"numeric","difficulty":1,"front":"Türkiye Büyük Millet Meclisi kaç milletvekilinden oluşur?","back":"600 milletvekili; genel oyla seçilir.","explanation":"Salt çoğunluk ve ara seçim eşiği bu sayıdan türetilir.","articleRefs":["75"]}
{"kind":"numeric","difficulty":3,"front":"Devamsızlık yüzünden üyeliğin düşmesi için eşik nedir ve Genel Kurul hangi çoğunlukla karar verir?","back":"Özürsüz ya da izinsiz 1 ay içinde toplam 5 birleşim günü; Genel Kurul üye tamsayısının salt çoğunluğuyla (600 üyede 301 oy) karar verebilir.","explanation":"Toplantıya katılanların değil, üye tamsayısının salt çoğunluğu aranır.","articleRefs":["84","75"],"derivedNumbers":[{"value":301,"expr":"floor(600 / 2) + 1","refs":["75","84"],"note":"üye tamsayısının salt çoğunluğu"}]}
{"kind":"trap","difficulty":3,"front":"Genel seçime 2 yıl kala ara seçim yapılabilir mi?","back":"Evet; 1 yıl kala yasağına takılmaz. Her seçim döneminde bir defa ve genel seçimden 30 ay geçmiş olma kuralları ayrıca aranır.","explanation":"Boşalma olunca her zaman ara seçime gidilmez: dönemde bir defa, 30 ay ve genel seçime 1 yıl kala kayıtları vardır.","articleRefs":["78"]}
{"kind":"trap","difficulty":2,"front":"Toplantı yeter sayısı üye tamsayısının yarısı mıdır?","back":"Hayır. Meclis üye tamsayısının en az üçte biriyle toplanır; yarısı diye bir kayıt yok.","explanation":"Karar yeter sayısı ayrıdır: toplantıya katılanların salt çoğunluğu, ama hiçbir zaman üye tamsayısının dörtte birinin bir fazlasından az olamaz.","articleRefs":["96"],"counterNumbers":[]}

ÇIKTI: Tek bir JSON nesnesi: {"cards":[...]}. Kod bloğu, açıklama, ön söz yok.`;

function etiket(g: OzetGirdi): string {
  return articleLabel({
    articleFrom: g.range.from,
    articleTo: g.range.to,
    articleNos: g.articleNos ?? [],
  });
}

/** Ünite özetinin kart hammaddesi olan blokları (exam_stats/bridge betik üretir, modele girmez). */
function ozetBloklari(u: SummaryUnitJson): string {
  const satir = (b: Record<string, unknown>): string => {
    const refs = Array.isArray(b.articleRefs)
      ? ` [md ${(b.articleRefs as string[]).join(', ')}]`
      : '';
    if (Array.isArray(b.rows)) {
      const rows = (b.rows as Record<string, unknown>[])
        .map((r) =>
          'label' in r
            ? `  - ${String(r.label)}: ${String(r.value)}${Array.isArray(r.refs) ? ` [md ${(r.refs as string[]).join(', ')}]` : ''}`
            : `  - ${String(r.aspect)}: ${String(r.left)} | ${String(r.right)}`,
        )
        .join('\n');
      return `### [${String(b.type)}] ${String(b.title ?? '')}${refs}\n${rows}`;
    }
    return `### [${String(b.type)}] ${String(b.title ?? '')}${refs}\n${String(b.body ?? '')}`;
  };
  return (u.blocks as unknown as Record<string, unknown>[])
    .filter((b) => !['exam_stats', 'bridge'].includes(String(b.type)))
    .map(satir)
    .join('\n\n');
}

function userMessage(g: OzetGirdi, u: SummaryUnitJson): string {
  const maddeler = g.articles
    .map(
      (a) =>
        `### MADDE ${a.no}${a.title ? ' — ' + a.title : ''} (çıkmış soru: ${a.questionCount})\n${a.text}`,
    )
    .join('\n\n');
  const sorular = g.questions
    .map(
      (q, i) =>
        `${i + 1}. [md ${q.articleNos.join(', ')}] ${q.stem.replace(/\s+/g, ' ')}\n   ` +
        q.options
          .map((o) => `${o.isCorrect ? '✓' : '✗'} ${o.text.replace(/\s+/g, ' ')}`)
          .join(' | '),
    )
    .join('\n');
  return [
    `ÜNİTE: ${u.unit.title}${u.unit.subtitle ? ' — ' + u.unit.subtitle : ''}`,
    `legislationSlug: ${g.legislation.slug} · maddeler: ${etiket(g)} · HEDEF: ${hedef} kart`,
    ...(g.articleNos?.length
      ? [
          `Madde numaralarını AYNEN bu biçimde kullan ("articleRefs" ve atıflarda): ${g.articleNos.map((n) => `"${n}"`).join(', ')}. ` +
            '"Ek 6", "Geçici 2", "4/A" birer madde numarasıdır; "Ek 6" kart metninde "Ek 6" diye yazılır, 6 sayı sayılmaz.',
        ]
      : []),
    '',
    '## RESMÎ MADDE METİNLERİ',
    maddeler,
    '',
    ...(u.blocks?.length
      ? [
          '## ÜNİTE ÖZETİ (hammadde; cümleleri kopyalama, bilgiyi soruya çevir)',
          ozetBloklari(u),
          '',
        ]
      : []),
    '## BU MADDELERDEN ÇIKMIŞ SORULAR (✓ doğru, ✗ yanlış şık — tuzak kartları buradan)',
    sorular || '(soru yok)',
  ].join('\n');
}

/**
 * Stil kapısı (denetim oturumu önerisi, 6 Kas 2026): açıklamada sınav taktiği / şık dili / maddede olmayan
 * öğeyi çürütme kalıpları; arka yüzde yalnız şık dili. "sayılmaz" tuzak cevabında meşru olduğundan taranmaz.
 */
const YASAK_ACIKLAMA =
  /(?<!fesat )karıştır|yer değiştir|atlarsan|yanılırsın|hatırla|düşün\b|(?<!\p{L})şık|çeldirici|diye bir .{0,40}(yok|yazılmaz|geçmez)|geçmez|maddelerinde değil|listede yok|sorulursa|sorulduğunda|\bmd\s*[\d\/A-ZÇĞİÖŞÜ]+['’]?(?:deki|daki|teki|taki)\b[^.]{0,80}\bise\b/iu;
const YASAK_ARKA =
  /(?<!\p{L})şık|çeldirici|diye bir .{0,40}(yok|yazılmaz|geçmez)|listede yok|maddelerinde değil/iu;

/** Ön yüzde olumsuz soru kalıbı ("…edilemez mi?", "…değil midir?"): cevap iki yöne okunur, kart yeniden kurulur. */
const YASAK_ON = /(maz|mez|mazlar|mezler|değil|yok|yasak)\s*m[ıiuü](dır|dir|dur|dür)?\s*\?\s*$/iu;

export function stilKusuru(c: FlashcardJson): string | null {
  if (YASAK_ON.test(c.front ?? '')) return 'ön yüzde olumsuz soru kalıbı';
  const a = (c.back ?? '').match(YASAK_ARKA);
  if (a) return `arka yüzde yasak kalıp: "${a[0]}"`;
  const m = (c.explanation ?? '').match(YASAK_ACIKLAMA);
  return m ? `açıklamada yasak kalıp: "${m[0]}"` : null;
}

/** Yasak kalıplı açıklamaları modele TEK TUR yeniden yazdırır; hâlâ kusurluysa açıklamayı düşürür. */
async function stilKapisi(
  client: Anthropic,
  g: OzetGirdi,
  cards: FlashcardJson[],
): Promise<{ onarilan: number; dusurulen: number }> {
  const kusurlu = cards.map((c, i) => ({ i, k: stilKusuru(c) })).filter((x) => x.k);
  if (!kusurlu.length) return { onarilan: 0, dusurulen: 0 };
  for (const x of kusurlu) console.log(`  stil kapısı [${x.i + 1}] ${x.k}`);
  const maddeler = new Map(g.articles.map((a) => [a.no, a.text]));
  const istek = kusurlu.map(({ i }) => {
    const c = cards[i];
    const metin = c.articleRefs
      .map((n) => `### MADDE ${n}\n${maddeler.get(n) ?? '(metin yok)'}`)
      .join('\n\n');
    const arkaKusur = YASAK_ARKA.test(c.back ?? '') || YASAK_ON.test(c.front ?? '');
    return (
      `## KART ${i + 1}\nfront: ${c.front}\nback${arkaKusur ? ' (REDDEDİLDİ)' : ''}: ${c.back}\n` +
      `explanation${arkaKusur ? '' : ' (REDDEDİLDİ)'}: ${c.explanation ?? ''}\n${metin}`
    );
  });
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default' as unknown as Anthropic.Beta.BetaFallbackParam[],
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content:
          'Aşağıdaki kartlarda REDDEDİLDİ işaretli alan 4. kurala aykırı bulundu (taktik, şık dili, maddede hiç geçmeyen ' +
          'bir öğeyi anıp çürütme — "7 gün diye bir kayıt yok" — ya da başka maddeyle karşılaştırma). Her kart için YALNIZ ' +
          'reddedilen alanı yeniden yaz. Arka yüz reddedildiyse kart maddede olmayan bir öğe üzerine kurulmuştur: ' +
          'KARTIN TAMAMINI (front, back, explanation) aynı madde(ler)den, metinde geçen bir öğeyle yeniden kur; tür ' +
          'gerekirse qa olur. Yalnız açıklama reddedildiyse yalnız explanation. İçerik: sadece referans maddenin kendi ' +
          'içeriği (şart, istisna, komşu hüküm); arka yüz cevabı ilk kelimede verir; ≤ 600 karakter; sayı kuralı (2) geçerli. ' +
          'Çıktı: {"cards":[{"index":<1 tabanlı>,"kind":"...","front":"...","back":"...","explanation":"..."}]} — yalnız JSON; ' +
          'yeniden yazılmayan alanı koyma.\n\n' +
          istek.join('\n\n'),
      },
    ],
  });
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let yeni: {
    cards: {
      index: number;
      kind?: FlashcardJson['kind'];
      front?: string;
      back?: string;
      explanation?: string;
    }[];
  } = { cards: [] };
  try {
    yeni = JSON.parse(text);
  } catch {
    console.error('  stil kapısı: onarım JSON ayrıştırılamadı; kusurlu açıklamalar düşürülüyor.');
  }
  let onarilan = 0;
  let dusurulen = 0;
  for (const { i } of kusurlu) {
    const y = yeni.cards?.find((c) => c.index === i + 1);
    const arkaKusur = YASAK_ARKA.test(cards[i].back ?? '') || YASAK_ON.test(cards[i].front ?? '');
    if (arkaKusur) {
      // Arka yüz kusuru = kart maddede olmayan öğe üzerine kurulmuş: kartın tamamı yeniden yazılır (refs korunur).
      const aday: FlashcardJson = {
        ...cards[i],
        kind:
          y?.kind && ['qa', 'numeric', 'trap', 'cloze'].includes(y.kind) ? y.kind : cards[i].kind,
        front: y?.front ?? cards[i].front,
        back: y?.back ?? cards[i].back,
        explanation: y?.explanation,
        counterNumbers: [],
      };
      if (
        y?.front &&
        y?.back &&
        !stilKusuru(aday) &&
        aday.front.length <= 400 &&
        aday.back.length <= 400
      ) {
        cards[i] = aday;
        onarilan++;
      } else {
        console.error(
          `  stil kapısı [${i + 1}] KART kusurlu kaldı — ELLE BAK: ${cards[i].front.slice(0, 80)}`,
        );
      }
      continue;
    }
    const aday: FlashcardJson = { ...cards[i], explanation: y?.explanation };
    if (y?.explanation && !stilKusuru(aday)) {
      cards[i].explanation = y.explanation;
      onarilan++;
    } else {
      delete cards[i].explanation;
      dusurulen++;
    }
  }
  console.log(`  stil kapısı: ${onarilan} açıklama yeniden yazıldı, ${dusurulen} düşürüldü`);
  return { onarilan, dusurulen };
}

(async () => {
  const girdi = JSON.parse(readFileSync(girdiPath, 'utf8')) as OzetGirdi;
  if (onarKipi) {
    // Kapısız üretilmiş desteyi (unitePath = deste.json) stil kapısından geçir, yerinde yaz.
    const deste = JSON.parse(readFileSync(unitePath, 'utf8')) as FlashcardDeckJson;
    const r = await stilKapisi(new Anthropic(), girdi, deste.cards);
    if (r.onarilan || r.dusurulen) {
      deste.deck.generatedBy =
        `${deste.deck.generatedBy ?? ''}; stil kapısı (--onar) ${r.onarilan} açıklama yeniden yazıldı` +
        (r.dusurulen ? `, ${r.dusurulen} düşürüldü` : '');
      writeFileSync(unitePath, JSON.stringify(deste, null, 2) + '\n');
    }
    console.log(`Onarım bitti: ${unitePath}`);
    return;
  }
  // Ünite özeti yoksa ("-"): yalnız madde metni + çıkmış sorulardan üretim (TCK gibi Doc 53 ünitesi olmayan kanunlar).
  const unite: SummaryUnitJson =
    unitePath === '-'
      ? ({
          unit: {
            slug: partiSlug,
            legislationSlug: girdi.legislation.slug,
            topicId: girdi.legislation.topicId,
            title: baslik || etiket(girdi),
          },
          blocks: [],
        } as unknown as SummaryUnitJson)
      : (JSON.parse(readFileSync(unitePath, 'utf8')) as SummaryUnitJson);
  if (unitePath === '-' && (!partiSlug || !baslik)) {
    console.error('Ünitesiz kipte --slug ve --baslik zorunludur.');
    process.exit(2);
  }
  if (unite.unit.legislationSlug !== girdi.legislation.slug) {
    console.error(
      `Mevzuat uyuşmuyor: girdi ${girdi.legislation.slug}, ünite ${unite.unit.legislationSlug}`,
    );
    process.exit(2);
  }
  const topicId = unite.unit.topicId ?? girdi.legislation.topicId;
  if (!topicId) {
    console.error('topicId yok: ünite ve mevzuat konuya bağlı değil.');
    process.exit(2);
  }
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    betas: ['server-side-fallback-2026-07-01'],
    // API 'default' zincirini kabul eder (ozet-uret.ts ile aynı); SDK tipi yalnız açık listeyi tanır.
    fallbacks: 'default' as unknown as Anthropic.Beta.BetaFallbackParam[],
    output_config: { effort: 'high' },
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage(girdi, unite) }],
  });
  const res = await stream.finalMessage();
  if (res.stop_reason === 'refusal') {
    console.error('Model reddetti:', res.stop_details?.explanation ?? '');
    process.exit(1);
  }
  if (res.stop_reason === 'max_tokens') {
    console.error('Çıktı kesildi (max_tokens); hedefi düşür ya da sınırı artır.');
    process.exit(1);
  }
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  let parsed: { cards: FlashcardJson[] };
  try {
    parsed = JSON.parse(text) as { cards: FlashcardJson[] };
  } catch {
    writeFileSync(out + '.ham.txt', text);
    console.error('JSON ayrıştırılamadı; ham çıktı:', out + '.ham.txt');
    process.exit(1);
  }
  if (!Array.isArray(parsed.cards) || !parsed.cards.length) {
    console.error('Çıktıda kart yok.');
    process.exit(1);
  }
  const onarim = await stilKapisi(client, girdi, parsed.cards);
  const data: FlashcardDeckJson = {
    deck: {
      topicId,
      legislationSlug: girdi.legislation.slug,
      ...(unitePath === '-' ? {} : { unitSlug: unite.unit.slug }),
      sourceLabel: `AI bilgi kartı — ${girdi.legislation.name} md ${etiket(girdi)}`,
      generatedBy:
        `${res.model} (kart-uret.ts; kaynak: ${unitePath === '-' ? 'resmî madde metni + çıkmış sorular' : unite.unit.slug + ' özeti + resmî madde metni'}` +
        (onarim.onarilan ? `; stil kapısı ${onarim.onarilan} açıklama yeniden yazıldı` : '') +
        (onarim.dusurulen ? `; ${onarim.dusurulen} açıklama düşürüldü` : '') +
        ')',
    },
    cards: parsed.cards,
  };
  writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
  const turler = data.cards.reduce<Record<string, number>>(
    (m, c) => ((m[c.kind] = (m[c.kind] ?? 0) + 1), m),
    {},
  );
  console.log(
    `Üretildi: ${data.cards.length} kart (${Object.entries(turler)
      .map(([k, v]) => `${k} ${v}`)
      .join(
        ', ',
      )}) → ${out} · model ${res.model} · giriş ${res.usage.input_tokens} / çıkış ${res.usage.output_tokens} token`,
  );
  console.log(`Sıradaki: npx tsx scripts/kart-dogrula-uzak.ts ${out} --md`);
})();
