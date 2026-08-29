/**
 * Doc 32 — HEDEFLI KUME URETICISI (son care).
 *
 * Normal kume ureticisi (denetim-dosyala.ts) dayanak maddeyi IDF benzerligiyle
 * TAHMIN eder. Bu, soru koku ile madde metni ortak ayirt edici kelime tasidiginda
 * calisir; tasimadiginda calismaz. CMK'da kalan belirsizler tam bu gruptu:
 * soru "temyiz suresi" diyor ama m.291'in metninde "temyiz suresi" ibaresi
 * gecmiyor; soru "susma hakki" diyor ama m.147 "haklarin bildirilmesi" basligini
 * tasiyor. Motor bu maddeleri hicbir turda bulamadi.
 *
 * Cozum: DENETCININ KENDISI hangi maddeyi aradigini raporunda soyluyor
 * ("gercek dayanak CMK m.291'dir, kumede yok"). Bu script o bilgiyi girdi alir
 * ve maddeyi TAM METINLE, tahmin olmadan kumeye koyar. Boylece denetci ikinci
 * turda karari kaynakla verebilir.
 *
 * SALT OKUR — soruya dokunmaz, yalniz kume dosyasi yazar.
 *
 *   npx tsx scripts/hedefli-kume.ts --harita <json> --cikti <dizin>
 *
 * Harita bicimi: { "<soru id oneki>": ["<Kanun adi parcasi>|<madde no>", ...] }
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';

const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

const SORU_SINIR = 6;        // hedefli kumede madde metni buyuk; dosya basina az soru
const METIN_SINIR = 20_000;  // tek madde icin tavan (m.161 gibi uzun maddeler icin)

(async () => {
  const harita: Record<string, string[]> = JSON.parse(readFileSync(arg('--harita')!, 'utf-8'));
  const cikti = arg('--cikti')!;

  const maddeler = await p.lawArticle.findMany({
    where: { deletedAt: null, status: 'published' },
    select: { articleNo: true, title: true, text: true, sourceUrl: true,
      topic: { select: { name: true } },
      section: { select: { heading: true, parent: { select: { heading: true } } } } } });

  const rows = await p.questionVersion.findMany({
    where: { status: 'published', question: { deletedAt: null } },
    select: { id: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      question: { select: { articleNo: true, topic: { select: { name: true } } } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } } });

  // Madde araması: "Kanun adi parcasi|no" -> kayit. Komsu maddeler de eklenir,
  // cunku aranan hukum bitisik maddede olabilir (denetci "m.43-48" diyebiliyor).
  const bul = (istek: string) => {
    const i = istek.lastIndexOf('|');
    const kanun = istek.slice(0, i).toLocaleLowerCase('tr');
    const no = istek.slice(i + 1);
    return maddeler.find((m) => (m.topic?.name ?? '').toLocaleLowerCase('tr').includes(kanun) && m.articleNo === no);
  };

  const paketler: Array<{ soru: (typeof rows)[number]; mNolar: string[] }> = [];
  for (const [onek, istekler] of Object.entries(harita)) {
    const r = rows.find((x) => x.id.startsWith(onek));
    if (!r) { console.log(`!! ${onek} yayinda bulunamadi — atlandi`); continue; }
    const genis = new Set<string>();
    for (const s of istekler) {
      genis.add(s);
      const i = s.lastIndexOf('|');
      const kanun = s.slice(0, i);
      const no = Number(s.slice(i + 1));
      if (Number.isFinite(no)) { genis.add(`${kanun}|${no - 1}`); genis.add(`${kanun}|${no + 1}`); }
    }
    const bulunan = [...genis].filter((s) => bul(s));
    const eksik = istekler.filter((s) => !bul(s));
    if (eksik.length) console.log(`   ${onek}: BANKADA YOK -> ${eksik.join(', ')}`);
    if (!bulunan.length) { console.log(`!! ${onek} icin hicbir madde bulunamadi — atlandi`); continue; }
    paketler.push({ soru: r, mNolar: bulunan });
  }

  mkdirSync(cikti, { recursive: true });
  let n = 0, yazilan = 0;
  for (let i = 0; i < paketler.length; i += SORU_SINIR) {
    const dilim = paketler.slice(i, i + SORU_SINIR);
    const mSet = new Set<string>();
    for (const x of dilim) for (const k of x.mNolar) mSet.add(k);
    const mMetin = [...mSet].map((k) => {
      const m = bul(k)!;
      const ham = m.text.replace(/\s+/g, ' ').trim();
      const bolum = m.section ? [m.section.parent?.heading, m.section.heading].filter(Boolean).join(' / ') : null;
      return { kanun: m.topic?.name ?? '?', no: m.articleNo, baslik: m.title, bolum, rol: 'hedefli',
        metin: ham.length > METIN_SINIR ? ham.slice(0, METIN_SINIR) + ' […]' : ham };
    });
    const ad = `${cikti}/kume-${String(++n).padStart(3, '0')}.json`;
    writeFileSync(ad, JSON.stringify({
      konu: 'hedefli denetim (dayanak madde elle verildi)',
      kaynakUrl: 'https://www.mevzuat.gov.tr/',
      kumeAnahtari: 'hedefli',
      maddeler: mMetin,
      sorular: dilim.map((x) => ({
        id: x.soru.id.slice(0, 8),
        kok: x.soru.stem.replace(/\s+/g, ' ').trim(),
        siklar: x.soru.options.map((o) => ({ harf: o.label, metin: o.text.replace(/\s+/g, ' ').trim(), isaretliDogru: o.isCorrect })),
        mevcutAciklama: x.soru.explanation?.trim() || null,
        kaynakEtiketi: x.soru.sourceLabel,
        sinavdaKullanim: x.soru._count.examQuestions,
        bagliMadde: x.soru.question.articleNo,
        bagliKanun: x.soru.question.topic?.name ?? null,
        adayMaddeler: x.mNolar,
      })),
    }, null, 1));
    yazilan += dilim.length;
  }
  console.log(`hedefli kume: ${yazilan} soru -> ${n} dosya (${cikti})`);
})().finally(() => p.$disconnect());
