/**
 * Doc 39 — bankaya yazıldıktan SONRA reddedilen soruyu onay kuyruğundan çeker.
 *
 * Gerekçe: iki tur denetim işletilen partilerde bir soru birinci turda KABUL
 * alıp yazılmış, ikinci turda RED almış olabilir. 3201-p6'da tam bu oldu:
 * Ek 35'in uygulama penceresi 31/12/2020'de kapanmışken, aynı maddeye dayanan
 * q30 dosyadan çıkarıldı ama bankaya yazılmış q31/q32 "dokunma" kuralı yüzünden
 * kaldı. Tükenmiş hükmü öğreten soru onay kuyruğunda bırakılmaz.
 *
 * GÜVENLİK KİLİTLERİ — hepsi sağlanmazsa soru ATLANIR, script devam etmez:
 *   - sourceLabel "Mevzuat türetimi" ile başlamalı (başka soruya dokunulmaz)
 *   - status = in_review olmalı (YAYINDAKİ soruya asla dokunulmaz)
 *   - Question.currentVersionId null olmalı (yayına bağlı sürüm değil)
 *   - zaten deletedAt taşıyorsa dokunulmaz
 *
 * YAYINDAN=1: yayına alınmış soruyu da çeker. Varsayılan olarak KAPALIDIR ve
 * yalnız kullanıcının o soru için verdiği açık kararla kullanılır — yayın da
 * yayından çekme de insanın kararıdır. Yaptığı iş panelin archive() ucuyla
 * birebir aynıdır: yayındaki sürüm `archived`, Question.currentVersionId null,
 * soru soft-delete. (Fark: script bir kullanıcı adına çalışmadığı için denetim
 * kaydı düşmez; gerekçe rapor/durum.md'ye yazılır.)
 *
 *   npx tsx scripts/doc39-soru-geri-cek.ts <doc-dizini> <parti> <id…>
 *   APPLY=1 … ile uygulanır
 *   APPLY=1 YAYINDAN=1 … yayındakini de çeker
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const YAYINDAN = process.env.YAYINDAN === '1';
const SIKLAR = ['A', 'B', 'C', 'D', 'E'] as const;
const prisma = new PrismaClient();

async function main() {
  const [doc, parti, ...idler] = process.argv.slice(2);
  if (!doc || !parti || !idler.length)
    throw new Error('kullanım: doc39-soru-geri-cek.ts <doc-dizini> <parti> <id…>');

  const aday = JSON.parse(readFileSync(`${doc}/aday/${parti}.json`, 'utf8'));
  const hedef = idler.map((id) => {
    const q = aday.find((x: any) => x.id === id || x.id === `${parti}-${id}`);
    if (!q) throw new Error(`${id} aday dosyasında yok`);
    return { id: q.id, hash: questionFingerprint(q.kok.trim(), SIKLAR.map((l) => q.siklar[l].trim())) };
  });

  const surumler = await prisma.questionVersion.findMany({
    where: { contentHash: { in: hedef.map((h) => h.hash) } },
    select: {
      id: true, contentHash: true, status: true, sourceLabel: true, stem: true,
      question: { select: { id: true, currentVersionId: true, deletedAt: true } },
    },
  });

  const cekilecek: string[] = [];
  const yayindanCekilecek: string[] = [];
  for (const h of hedef) {
    const bulunan = surumler.filter((s) => s.contentHash === h.hash);
    if (!bulunan.length) { console.log(`${h.id}: bankada YOK — atlandı`); continue; }
    for (const s of bulunan) {
      const engel =
        !s.sourceLabel?.startsWith('Mevzuat türetimi') ? 'sourceLabel uymuyor'
        : s.status === 'published' && YAYINDAN ? null
        : s.status !== 'in_review' ? `status=${s.status} (YAYINDA olabilir)`
        : s.question.currentVersionId != null ? 'yayına bağlı sürüm'
        : s.question.deletedAt != null ? 'zaten çekilmiş'
        : null;
      if (engel) { console.log(`${h.id}: ATLANDI — ${engel}`); continue; }
      const yayinda = s.status === 'published';
      console.log(`${h.id}: ${yayinda ? 'YAYINDAN çekilecek' : 'çekilecek'} — "${s.stem.slice(0, 70)}…"`);
      (yayinda ? yayindanCekilecek : cekilecek).push(s.question.id);
    }
  }

  console.log(`\nÇEKİLECEK: ${cekilecek.length} kuyruktan · ${yayindanCekilecek.length} YAYINDAN`);
  if (!APPLY) { console.log('(kuru çalışma — APPLY=1 ile uygulanır)'); return; }
  if (cekilecek.length) {
    const { count } = await prisma.question.updateMany({
      where: { id: { in: cekilecek }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    console.log(`✓ ${count} soru onay kuyruğundan çekildi (soft delete)`);
  }
  // Yayındakiler panelin archive() ucuyla aynı adımlardan geçer.
  for (const id of yayindanCekilecek) {
    await prisma.$transaction(async (tx) => {
      await tx.questionVersion.updateMany({
        where: { questionId: id, status: 'published' },
        data: { status: 'archived', archivedAt: new Date() },
      });
      await tx.question.update({ where: { id }, data: { currentVersionId: null, deletedAt: new Date() } });
    });
    console.log(`✓ ${id} YAYINDAN çekildi (arşivlendi)`);
  }
}
main().finally(() => prisma.$disconnect());
