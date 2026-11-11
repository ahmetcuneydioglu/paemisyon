/**
 * Doc 58 — Nun Akademi "İdare Hukuku 333 Çözümlü Soru" sorularını bankaya yazar.
 *
 * Sorular YAYINCININDIR (kullanıcı yayıncıyla görüştü, PDF kullanıma açık —
 * 11 Kas 2026). AI üretimi değildir; biz yalnız cevap anahtarını kurduk:
 * pilotta (1–33) iki bağımsız çözücü + çözüm videosunun altyazısı (son onay
 * altyazı gözcüsünde); 34–333'te üç bağımsız çözücü, oy birliği (video 2–7
 * kanalın üyelerine kapalı — kullanıcı kararı 12 Kas 2026).
 *
 * KAPSAM: `cozum/uygunluk.json` karar = KABUL olan, `cozum/aciklama.json`'da
 * açıklaması yazılmış sorular. Anahtar `cozum/altyazi.json` (durum = kesin).
 * Kök, PDF metninin aynısıdır; yalnız `kokDuzeltilmis` doluysa o kullanılır
 * (yazım hatası, "kaynağa göre" ibaresi — kaynak kullanıcıya gösterilmez).
 *
 * sourceLabel: "Nun Akademi — İdare Hukuku 333 Çözümlü Soru — No <n>" (yalnız
 * admin panelde görünür; SettingsService.showQuestionSource kapalı). Konu,
 * uygunluk gözcüsünün `konu` alanından (İdare Hukuku dersindeki konu adı).
 * Sorular `in_review` düşer — yayını admin verir.
 *
 *   npx tsx scripts/nun-bankaya-yaz.ts <parti-dosyası adı, ör. nun-001-033>   # kuru
 *   APPLY=1 npx tsx scripts/nun-bankaya-yaz.ts nun-001-033                   # yaz
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Difficulty } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/58-nun-idare-hukuku';
const APPLY = process.env.APPLY === '1';
const base = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  datasources: { db: { url: base.includes('connection_limit') ? base : `${base}${base.includes('?') ? '&' : '?'}connection_limit=1` } },
});
const SIK = ['A', 'B', 'C', 'D', 'E'] as const;

type Aday = { no: number; kok: string; siklar: Record<string, string> };

async function main() {
  const parti = process.argv[2];
  if (!parti) throw new Error('kullanım: … <parti-dosyası adı, ör. nun-001-033>');
  const aday: Aday[] = JSON.parse(readFileSync(`${KOK}/aday/${parti}.json`, 'utf8'));
  const oku = <T,>(f: string): Map<number, T> =>
    new Map((JSON.parse(readFileSync(`${KOK}/cozum/${f}`, 'utf8')) as (T & { no: number })[]).map((x) => [x.no, x]));
  // Pilot (1–33) dosya adları: altyazi.json / uygunluk.json / aciklama.json.
  // Sonraki partiler (video 2–7 üyelere kapalı): <parti>-anahtar.json (üç çözücü,
  // oy birliği — anahtar-birlestir.py), <parti>-uygunluk.json, <parti>-aciklama.json.
  const pilot = parti === 'nun-001-033';
  const anahtar = oku<{ cevap: string; durum: string }>(pilot ? 'altyazi.json' : `${parti}-anahtar.json`);
  const uygun = oku<{ karar: string; konu: string; sinavDegeri: number }>(pilot ? 'uygunluk.json' : `${parti}-uygunluk.json`);
  const acik = oku<{ aciklama: string; dayanak?: string; kokDuzeltilmis?: string }>(pilot ? 'aciklama.json' : `${parti}-aciklama.json`);

  // Konu adları İdare Hukuku dersinden; 657 ve 4483 PAEMİSYON'da Polis Mevzuatı
  // dersinde durduğu için o dersin konuları da tanınır (uygunluk gözcüsü kararı).
  const dersler = await prisma.course.findMany({
    where: { name: { in: ['İdare Hukuku', 'Polis Mevzuatı'] }, deletedAt: null },
    select: { name: true, topics: { where: { deletedAt: null }, select: { id: true, name: true } } },
  });
  if (!dersler.some((d) => d.name === 'İdare Hukuku')) throw new Error('İdare Hukuku dersi bulunamadı');
  const konuId = new Map(dersler.flatMap((d) => d.topics.map((t) => [t.name, t.id] as const)));

  const eleme: Record<string, number[]> = { red: [], anahtarBelirsiz: [], aciklamaYok: [], konuYok: [], sikEksik: [] };
  const sec = [] as { a: Aday; kok: string; dogru: string; konu: string; aciklama: string; dayanak: string | null; hash: string }[];
  for (const a of aday) {
    const u = uygun.get(a.no);
    if (!u || u.karar !== 'KABUL') { eleme.red.push(a.no); continue; }
    const k = anahtar.get(a.no);
    if (!k || k.durum !== 'kesin' || !SIK.includes(k.cevap as never)) { eleme.anahtarBelirsiz.push(a.no); continue; }
    const ac = acik.get(a.no);
    if (!ac?.aciklama?.trim()) { eleme.aciklamaYok.push(a.no); continue; }
    if (!konuId.has(u.konu)) { eleme.konuYok.push(a.no); continue; }
    if (SIK.some((l) => !a.siklar[l]?.trim())) { eleme.sikEksik.push(a.no); continue; }
    const kok = (ac.kokDuzeltilmis?.trim() || a.kok).trim();
    sec.push({
      a, kok, dogru: k.cevap, konu: u.konu, aciklama: ac.aciklama.trim(), dayanak: ac.dayanak?.trim() || null,
      hash: questionFingerprint(kok, SIK.map((l) => a.siklar[l].trim())),
    });
  }

  const mevcut = await prisma.questionVersion.findMany({
    where: { contentHash: { in: sec.map((s) => s.hash) }, question: { deletedAt: null } },
    select: { contentHash: true },
  });
  const carpisan = new Set(mevcut.map((m) => m.contentHash));
  const yaz = sec.filter((s) => !carpisan.has(s.hash));

  console.log(`parti              : ${parti} (${aday.length} soru)`);
  console.log(`elendi             : ${JSON.stringify(eleme)}`);
  console.log(`bankada zaten var  : ${sec.length - yaz.length}`);
  console.log(`YAZILACAK          : ${yaz.length}  (hepsi in_review)`);
  console.log(`konu               : ${JSON.stringify(yaz.reduce<Record<string, number>>((o, s) => ({ ...o, [s.konu]: (o[s.konu] ?? 0) + 1 }), {}))}`);
  if (!APPLY) { console.log('\n(kuru çalışma — APPLY=1 ile yazılır)'); return; }

  const satir = yaz.map((s) => ({ ...s, qid: randomUUID(), vid: randomUUID() }));
  await prisma.$transaction(async (tx) => {
    await tx.question.createMany({ data: satir.map((s) => ({ id: s.qid, topicId: konuId.get(s.konu)!, articleNo: null })) });
    await tx.questionVersion.createMany({
      data: satir.map((s) => ({
        id: s.vid, questionId: s.qid, versionNo: 1, stem: s.kok, explanation: s.aciklama,
        difficulty: Difficulty.medium,
        // Video doğrulaması olmayan partilerde etikete işaret düşülür (panelde ayırt edilsin).
        sourceLabel: `Nun Akademi — İdare Hukuku 333 Çözümlü Soru — No ${s.a.no}${pilot ? '' : ' (anahtar: 3 çözücü)'}`,
        contentHash: s.hash, status: 'in_review' as const,
      })),
    });
    await tx.questionOption.createMany({
      data: satir.flatMap((s) => SIK.map((l, i) => ({
        questionVersionId: s.vid, label: l, text: s.a.siklar[l].trim(), isCorrect: l === s.dogru, sortOrder: i,
      }))),
    });
    // Künye yalnız madde atfıysa yazılır ("Anayasa md 123"); "doktrin: …" bir madde künyesi değildir.
    const ref = satir
      .filter((s) => s.dayanak && /\bmd\b|madde/i.test(s.dayanak))
      .map((s) => ({ questionVersionId: s.vid, citation: s.dayanak!.replace(/\s*\/\s*doktrin:.*$/i, '') }));
    if (ref.length) await tx.legalReference.createMany({ data: ref });
    console.log(`\n✓ ${satir.length} soru yazıldı (in_review) · ${ref.length} künye`);
  }, { timeout: 120_000 });
}
main().finally(() => prisma.$disconnect());
