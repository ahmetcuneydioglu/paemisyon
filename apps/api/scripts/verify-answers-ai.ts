/**
 * AI cevap denetimi (Doc: soru kalite güvencesi) — bekleyen soruları Claude'a
 * ÇÖZDÜRÜR ve kayıtlı cevap anahtarıyla KARŞILAŞTIRIR. Veritabanına YAZMAZ;
 * yalnız uyuşmazlık raporu üretir — karar her zaman insanda (onay kuyruğu).
 * AI soru üretimi DEĞİLDİR (CLAUDE.md): içerik kaynaktan gelir, AI denetler.
 *
 * Kullanım: npx ts-node scripts/verify-answers-ai.ts [rapor.xlsx]
 *   Varsayılan kapsam: yayınlanmamış (bekleyen) tüm soru sürümleri.
 *
 * Çıktı: konsol özeti + XLSX raporu (yalnız UYUŞMAYAN ve DÜŞÜK GÜVENLİ satırlar).
 * Maliyet: soru başına ~1 kısa çağrı (claude-opus-4-8, ~400 token).
 */
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import * as ExcelJS from 'exceljs';

const MODEL = 'claude-opus-4-8';
const CONCURRENCY = 5;

const outPath =
  process.argv[2] ?? `${process.env.HOME}/Downloads/ai-cevap-denetimi-${Date.now()}.xlsx`;

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error('ANTHROPIC_API_KEY tanımlı değil (.env).');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: key });

const url = process.env.DATABASE_URL!;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes('connection_limit')
        ? url.replace(/connection_limit=\d+/, 'connection_limit=1')
        : `${url}${url.includes('?') ? '&' : '?'}connection_limit=1`,
    },
  },
});

interface Verdict {
  cevap: string; // A-E
  guven: 'yüksek' | 'orta' | 'düşük';
}

async function solve(stem: string, options: { label: string; text: string }[]): Promise<Verdict | null> {
  const prompt =
    `Aşağıdaki çoktan seçmeli soruyu çöz. YALNIZ şu JSON ile yanıtla: ` +
    `{"cevap":"A-E arası tek harf","guven":"yüksek|orta|düşük"}\n` +
    `Emin değilsen guven alanını "düşük" yap; asla uydurma.\n\n` +
    `SORU: ${stem}\n` +
    options.map((o) => `${o.label}) ${o.text}`).join('\n');

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      const m = /\{[^}]*\}/.exec(text);
      if (!m) return null;
      const parsed = JSON.parse(m[0]) as Verdict;
      if (!/^[A-E]$/.test(parsed.cevap)) return null;
      return parsed;
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      if (status === 429 || status === 529 || (status ?? 0) >= 500) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  return null;
}

async function main() {
  const versions = await prisma.questionVersion.findMany({
    where: { status: { not: 'published' }, question: { deletedAt: null } },
    include: {
      options: { orderBy: { sortOrder: 'asc' } },
      question: { select: { id: true, topic: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });
  console.log('denetlenecek bekleyen soru:', versions.length);

  type Row = {
    questionId: string;
    stem: string;
    topic: string;
    kayitli: string;
    kayitliMetin: string;
    ai: string;
    aiMetin: string;
    guven: string;
    durum: 'UYUŞMAZLIK' | 'DÜŞÜK GÜVEN' | 'ÇÖZÜLEMEDİ';
  };
  const flagged: Row[] = [];
  let agree = 0;
  let done = 0;

  // Basit havuzlu eşzamanlılık.
  const queue = [...versions];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const v = queue.shift();
        if (!v) return;
        const stored = v.options.find((o) => o.isCorrect);
        const verdict = await solve(
          v.stem,
          v.options.map((o) => ({ label: o.label, text: o.text })),
        ).catch(() => null);
        done++;
        if (done % 50 === 0) console.log(`… ${done}/${versions.length}`);
        const base = {
          questionId: v.question.id,
          stem: v.stem,
          topic: v.question.topic.name,
          kayitli: stored?.label ?? '?',
          kayitliMetin: stored?.text ?? '',
        };
        if (!verdict) {
          flagged.push({ ...base, ai: '?', aiMetin: '', guven: '-', durum: 'ÇÖZÜLEMEDİ' });
          continue;
        }
        const aiOption = v.options.find((o) => o.label === verdict.cevap);
        if (verdict.cevap !== stored?.label) {
          flagged.push({
            ...base,
            ai: verdict.cevap,
            aiMetin: aiOption?.text ?? '',
            guven: verdict.guven,
            durum: 'UYUŞMAZLIK',
          });
        } else if (verdict.guven === 'düşük') {
          flagged.push({
            ...base,
            ai: verdict.cevap,
            aiMetin: aiOption?.text ?? '',
            guven: verdict.guven,
            durum: 'DÜŞÜK GÜVEN',
          });
          agree++;
        } else {
          agree++;
        }
      }
    }),
  );

  // Rapor: uyuşmazlıklar üstte, sonra düşük güven.
  flagged.sort((a, b) => a.durum.localeCompare(b.durum) * -1 || a.topic.localeCompare(b.topic));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Denetim');
  ws.addRow(['durum', 'konu', 'soru', 'kayıtlı', 'kayıtlı şık', 'AI', 'AI şık', 'AI güven', 'questionId']);
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.columns.forEach((c, i) => (c.width = i === 2 ? 80 : i === 4 || i === 6 ? 35 : 12));
  for (const r of flagged) {
    ws.addRow([r.durum, r.topic, r.stem, r.kayitli, r.kayitliMetin, r.ai, r.aiMetin, r.guven, r.questionId]);
  }
  await wb.xlsx.writeFile(outPath);

  // --bildir: uyuşmazlıkları panel Bildirimler kuyruğuna düşür — onay
  // kuyruğunda kaybolmasınlar; her biri tıklanabilir iş kaydı olur.
  if (process.argv.includes('--bildir')) {
    const admin = await prisma.user.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true },
    });
    if (!admin) throw new Error('Bildirim için admin kullanıcı bulunamadı.');
    let filed = 0;
    for (const r of flagged.filter((f) => f.durum === 'UYUŞMAZLIK')) {
      const exists = await prisma.questionReport.findFirst({
        where: {
          questionId: r.questionId,
          status: 'open',
          message: { startsWith: 'AI cevap denetimi' },
        },
      });
      if (exists) continue;
      await prisma.questionReport.create({
        data: {
          questionId: r.questionId,
          userId: admin.id,
          message:
            `AI cevap denetimi: kayıtlı ${r.kayitli} (${r.kayitliMetin.slice(0, 60)}) — ` +
            `AI önerisi ${r.ai} (${r.aiMetin.slice(0, 60)}), güven: ${r.guven}`,
        },
      });
      filed++;
    }
    console.log('Bildirimler kuyruğuna yazılan:', filed);
  }

  const mismatch = flagged.filter((f) => f.durum === 'UYUŞMAZLIK').length;
  const lowConf = flagged.filter((f) => f.durum === 'DÜŞÜK GÜVEN').length;
  const unsolved = flagged.filter((f) => f.durum === 'ÇÖZÜLEMEDİ').length;
  console.log('──────────────────────────────');
  console.log('AI ile AYNI cevap  :', agree, '/', versions.length);
  console.log('UYUŞMAZLIK         :', mismatch, ' ← elle bakılacaklar');
  console.log('DÜŞÜK GÜVEN (aynı) :', lowConf);
  console.log('ÇÖZÜLEMEDİ         :', unsolved);
  console.log('rapor:', outPath);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
