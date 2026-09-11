/**
 * Doc 42 — KPSS 2025 Kamu Yönetimi adaylarını bankaya karşı tarar.
 *
 * İki tur: TAM eşleşme (`questionFingerprint`) ve aynı DERSİN sorularıyla
 * kelime kümesi benzerliği (Jaccard). Yakın eşler SİLİNMEZ, insana gösterilir.
 *
 * Tam eşleşme taraması SİLİNMİŞ soruları da kapsar: kullanıcı bir soruyu
 * panelden elediyse o soru "bankada yok" değil, "istenmiyor" demektir; yeni
 * parti diye tekrar önüne koymak onun kararını geri alır.
 *
 * SALT OKUMA.
 *   npx tsx scripts/kpss-mukerrer-tara.ts <doc-dizini>
 *
 * Doc 44 gibi, `dogru`/`konuId`/`ders`/`konu` alanları zaten dolu bir
 * `aday.json` ile gelen partiler için:
 *
 *   npx tsx scripts/kpss-mukerrer-tara.ts <doc-dizini> --aday
 *
 * Bu kipte script SALT TARAR — aday dosyasını yeniden yazmaz.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const YAKINLIK_ESIGI = 0.55;
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const p = new PrismaClient();

const KALIP = new Set([
  'aşağıdakilerden', 'aşağıdaki', 'hangisi', 'hangileri', 'değildir', 'aşağıdakilerin',
  'verilen', 'yukarıda', 'yukarıdaki', 'bir', 've', 'ile', 'için', 'olarak', 'bu', 'da', 'de',
  'sayılı', 'kanunu', 'göre', 'kanun', 'hangisidir', 'yanlıştır', 'sayılmamıştır',
]);
const kelimeler = (t: string) =>
  new Set(
    t.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
      .filter((w) => w.length > 2 && !KALIP.has(w)),
  );
const jaccard = (a: Set<string>, b: Set<string>) => {
  const kesisim = [...a].filter((x) => b.has(x)).length;
  return kesisim / (a.size + b.size - kesisim || 1);
};

async function main() {
  const doc = process.argv[2];
  if (!doc) throw new Error('kullanım: kpss-mukerrer-tara.ts <doc-dizini>');

  const hazirAday = process.argv[3] === '--aday';
  const transkript = JSON.parse(
    readFileSync(hazirAday ? `${doc}/aday.json` : `${doc}/transkript/a.json`, 'utf8'));
  const anahtar: Record<string, string> = hazirAday
    ? Object.fromEntries(transkript.map((s: any) => [s.id, s.dogru]))
    : JSON.parse(readFileSync(`${doc}/anahtar-22.json`, 'utf8'));
  const sinif: Record<string, any> = hazirAday
    ? Object.fromEntries(transkript.map((s: any) => [s.id, { konuId: s.konuId, ders: s.ders, konu: s.konu }]))
    : JSON.parse(readFileSync(`${doc}/siniflandirma.json`, 'utf8'));

  const banka = await p.questionVersion.findMany({
    where: { status: { in: ['published', 'in_review', 'draft', 'archived'] } },
    select: {
      stem: true, status: true, contentHash: true,
      question: { select: { id: true, deletedAt: true, topic: { select: { name: true, course: { select: { name: true } } } } } },
      options: { select: { text: true } },
    },
  });

  const tam = new Map<string, string>();
  const dersBazli = new Map<string, { stem: string; durum: string; kume: Set<string> }[]>();
  for (const v of banka) {
    const fp = v.contentHash ?? questionFingerprint(v.stem, v.options.map((o) => o.text));
    const ders = v.question.topic.course.name;
    const silinmis = v.question.deletedAt ? ' · SİLİNMİŞ' : '';
    if (!tam.has(fp)) tam.set(fp, `${ders}/${v.question.topic.name} (${v.status}${silinmis})`);
    if (v.question.deletedAt) continue;
    if (!dersBazli.has(ders)) dersBazli.set(ders, []);
    dersBazli.get(ders)!.push({ stem: v.stem, durum: v.status, kume: kelimeler(v.stem) });
  }

  const temiz: any[] = [];
  const cakisan: any[] = [];
  const yakin: any[] = [];
  for (const s of transkript) {
    const k = sinif[s.id];
    if (!k) throw new Error(`${s.id}: sınıflandırmada yok`);
    const fp = questionFingerprint(s.kok, SIKLAR.map((l) => s.siklar[l]));
    if (tam.has(fp)) { cakisan.push({ id: s.id, nerede: tam.get(fp) }); continue; }
    const kume = kelimeler(s.kok);
    const en = (dersBazli.get(k.ders) ?? [])
      .map((b) => ({ ...b, skor: jaccard(kume, b.kume) }))
      .sort((a, b) => b.skor - a.skor)[0];
    if (en && en.skor >= YAKINLIK_ESIGI)
      yakin.push({ id: s.id, skor: Number(en.skor.toFixed(2)), durum: en.durum, stem: en.stem.replace(/\n/g, ' ').slice(0, 95) });
    temiz.push({ ...s, dogru: anahtar[s.id] ?? null, konuId: k.konuId, ders: k.ders, konu: k.konu });
  }

  console.log(`aday             : ${transkript.length}`);
  console.log(`bankada TAM eş   : ${cakisan.length}`);
  for (const c of cakisan) console.log(`   ${c.id} → ${c.nerede}`);
  console.log(`YAKIN eş (≥${YAKINLIK_ESIGI}) : ${yakin.length}   ← insan bakacak, elenmedi`);
  for (const y of yakin) console.log(`   ${y.id} ~${y.skor} (${y.durum}) ${y.stem}`);
  const eksikAnahtar = temiz.filter((t) => !t.dogru);
  if (eksikAnahtar.length) throw new Error(`anahtarsız soru: ${eksikAnahtar.map((t) => t.id).join(', ')}`);
  console.log(`aday kalan       : ${temiz.length}`);
  // `--aday` kipinde dosya ZATEN elde kurulmuştu; üstüne yazmak sessizce
  // alan kaybettirebilir (ör. transkriptçinin `not` alanı).
  if (!hazirAday) writeFileSync(`${doc}/aday.json`, JSON.stringify(temiz, null, 1));
}
main().finally(() => p.$disconnect());
