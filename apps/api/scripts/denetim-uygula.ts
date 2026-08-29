/**
 * Doc 32 — DENETIM SONUCU UYGULAYICI.
 *
 * Paralel denetim hattinin (soru-denetimi workflow) urettigi JSON sonucu alir ve
 * yalniz GUVENLI olanlari veritabanina yazar. Tek baglantiyla, sirali calisir.
 *
 * Otomatik uygulanan:
 *   · defter kaydi (docs/32-yayin-denetimi/ilerleme.jsonl)
 *   · articleNo baglama — yalniz karar=yayimlanabilir ve madde gercekten varsa
 *   · aciklama yazma   — yalniz MEVCUT ACIKLAMA BOSSA
 *
 * ASLA otomatik uygulanmayan (ekrana dokulur, insan karari bekler):
 *   · karar=kusurlu   → kok/cevap degisikligi veya arsivleme gerektirir
 *   · karar=belirsiz  → kaynak eksik
 *   · dolu aciklamanin degistirilmesi → aciklama-degistir.ts ile elle yapilir
 *
 *   npx tsx scripts/denetim-uygula.ts --sonuc <dosya.json>
 *   npx tsx scripts/denetim-uygula.ts --sonuc <dosya.json> --yaz
 *
 * Sonuc dosyasi birden cok kanunun sorularini karisik tasiyabilir: her sorunun
 * konusu ve o konudaki madde varligi tek tek DB'den dogrulanir.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, appendFileSync } from 'fs';

const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };
const TR = /[çğıöşüÇĞİÖŞÜâîû]/;
const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/ilerleme.jsonl`;
const YEDEK = `${__dirname}/../../../docs/32-yayin-denetimi/articleno-yedek.jsonl`;

type Sonuc = {
  id: string; karar: string; dogruKanun?: string | null; dogruMadde: string | null; dayanak: string;
  alinti: string; bulgu: string; aciklama: string | null; yigilmaNotu: string | null;
  karsiDogrulama?: { oySayisi: number; curutenSayi: number; ayakta: boolean; gerekceler: string[] };
};

(async () => {
  const YAZ = process.argv.includes('--yaz');
  const ham = JSON.parse(readFileSync(arg('--sonuc')!, 'utf-8'));
  const sonuclar: Sonuc[] = ham.sonuclar ?? ham;
  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, questionId: true, stem: true, explanation: true,
      question: { select: { articleNo: true, topicId: true, topic: { select: { name: true } } } } } });

  // Sonuctaki sorularin ait oldugu TUM konularin madde listesi tek seferde alinir.
  const ilgiliKonular = new Set<string>();
  for (const s of sonuclar) {
    const r = rows.find((x) => x.id.startsWith(s.id));
    if (r) ilgiliKonular.add(r.question.topicId);
  }
  const maddeVar = new Set<string>();
  const konuAdi = new Map<string, string>();
  for (const tid of ilgiliKonular) {
    for (const m of await p.lawArticle.findMany({ where: { topicId: tid, deletedAt: null }, select: { articleNo: true } }))
      maddeVar.add(`${tid}|${m.articleNo}`);
    konuAdi.set(tid, rows.find((r) => r.question.topicId === tid)?.question.topic?.name ?? tid);
  }

  const defterSatir: string[] = [];
  const baglanacak: Array<{ qid: string; vid: string; madde: string }> = [];
  const aciklanacak: Array<{ vid: string; metin: string }> = [];
  const elle: Sonuc[] = [];
  const atlanan: string[] = [];
  const bugun = new Date().toISOString().slice(0, 10);

  for (const s of sonuclar) {
    const r = rows.find((x) => x.id.startsWith(s.id));
    if (!r) { atlanan.push(`${s.id}: yayinda bulunamadi`); continue; }
    const kAdi = r.question.topic?.name ?? '(konusuz)';

    const kd = s.karsiDogrulama;
    const kdNot = kd ? ` [karsi-dogrulama: ${kd.curutenSayi}/${kd.oySayisi} curuttu, iddia ${kd.ayakta ? 'AYAKTA' : 'DUSTU'}]` : '';
    defterSatir.push(JSON.stringify({
      id: s.id, sinif: s.karar, karar: s.karar,
      konu: `${s.dogruKanun ?? kAdi}${s.dogruMadde ? ` m.${s.dogruMadde}` : ''}`,
      dayanak: s.dayanak, bulgu: `${s.bulgu}${kdNot}`,
      alinti: s.alinti, kaynak: ham.kaynakUrl ?? null, erisim: bugun,
      ...(s.yigilmaNotu ? { yigilma: s.yigilmaNotu } : {}),
    }));

    if (s.karar !== 'yayimlanabilir') { elle.push(s); continue; }

    if (s.dogruMadde) {
      // Dayanak BASKA bir kanunda ise articleNo BAGLANMAZ: articleNo (topicId, articleNo)
      // anahtarini kullanir, yabanci bir kanunun madde numarasi buraya yazilamaz.
      const yabanci = s.dogruKanun != null && !(r.question.topic?.name ?? '').includes(s.dogruKanun) &&
        !s.dogruKanun.includes(r.question.topic?.name ?? '\u0000');
      if (yabanci) {
        atlanan.push(`${s.id}: dayanak baska kanunda (${s.dogruKanun} m.${s.dogruMadde}) — articleNo baglanmadi`);
      } else if (!maddeVar.has(`${r.question.topicId}|${s.dogruMadde}`)) {
        atlanan.push(`${s.id}: m.${s.dogruMadde} LawArticle'da yok — baglanmadi`);
      } else if (r.question.articleNo && r.question.articleNo !== s.dogruMadde) {
        atlanan.push(`${s.id}: zaten m.${r.question.articleNo} bagli, m.${s.dogruMadde} onerildi — DOKUNULMADI`);
      } else if (!r.question.articleNo) {
        baglanacak.push({ qid: r.questionId, vid: r.id, madde: s.dogruMadde });
      }
    }

    if (s.aciklama) {
      if (r.explanation?.trim()) atlanan.push(`${s.id}: aciklama zaten dolu — degistirilmedi`);
      else if (!TR.test(s.aciklama)) atlanan.push(`${s.id}: aciklama Turkce harf icermiyor — REDDEDILDI`);
      else if (s.aciklama.length < 200) atlanan.push(`${s.id}: aciklama <200 karakter — REDDEDILDI`);
      else aciklanacak.push({ vid: r.id, metin: s.aciklama });
    }
  }

  console.log(`sonuc: ${sonuclar.length} | defter: ${defterSatir.length} | baglanacak: ${baglanacak.length} | aciklama: ${aciklanacak.length}`);
  if (elle.length) {
    console.log(`\n!! INSAN KARARI BEKLEYEN ${elle.length} soru:`);
    for (const s of elle) {
      const kd = s.karsiDogrulama;
      console.log(`\n  -- ${s.id}  [${s.karar}]  ${s.dayanak}`);
      console.log(`     BULGU  : ${s.bulgu.slice(0, 400)}`);
      console.log(`     ALINTI : ${s.alinti.slice(0, 300)}`);
      if (kd) console.log(`     KARSI  : ${kd.curutenSayi}/${kd.oySayisi} curuttu — ${kd.ayakta ? 'IDDIA AYAKTA' : 'iddia dustu'}`);
    }
  }
  if (atlanan.length) {
    console.log(`\nAtlananlar (${atlanan.length}):`);
    for (const a of atlanan) console.log(`  ${a}`);
  }
  if (!YAZ) { console.log('\n(KURU CALISMA — --yaz ile uygulanir)'); return; }

  appendFileSync(DEFTER, defterSatir.join('\n') + '\n');
  if (baglanacak.length) {
    appendFileSync(YEDEK, baglanacak.map((b) => JSON.stringify({
      versiyonId: b.vid, questionId: b.qid, eskiArticleNo: null, yeniArticleNo: b.madde })).join('\n') + '\n');
    for (const b of baglanacak) await p.question.update({ where: { id: b.qid }, data: { articleNo: b.madde } });
  }
  for (const a of aciklanacak) await p.questionVersion.update({ where: { id: a.vid }, data: { explanation: a.metin } });
  console.log(`\nYAZILDI: defter ${defterSatir.length} | articleNo ${baglanacak.length} | aciklama ${aciklanacak.length}`);
})().finally(() => p.$disconnect());
