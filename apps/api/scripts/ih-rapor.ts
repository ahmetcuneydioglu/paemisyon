/**
 * Doc 33 — denetim sonuçlarından İNSAN OKUYACAĞI raporu üretir (SALT OKUMA).
 *
 * Kullanıcı kararı (4 Eyl 2026): UYARI ve ÇELİŞKİ alan sorular bankaya
 * GİRMEZ, rapora düşer. Bu dosya o raporun kaynağıdır.
 *
 *   npx tsx scripts/ih-rapor.ts            → RAPOR.md yazar
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';

type Karar = {
  id: string; karar: string; kitapCevabi: string; d1: string | null; d2: string | null;
  guven: (string | undefined)[]; dayanak: string | null; gerekce: string | null; uyarilar: string[];
};

const kor = new Map<string, { kok: string; siklar: Record<string, string>; bolum: string; kaynak: string }>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x) && !x.startsWith('b90') && !x.startsWith('b91'))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  for (const q of o.sorular) kor.set(q.id, { kok: q.kok, siklar: q.siklar, bolum: o.baslik, kaynak: o.kaynakKodu });
}
const notlar: Record<string, string> = existsSync(`${KOK}/kitap-notlari.json`)
  ? JSON.parse(readFileSync(`${KOK}/kitap-notlari.json`, 'utf8')) : {};

const hepsi: Karar[] = [];
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x) && !x.startsWith('b90'))) {
  hepsi.push(...JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8')));
}
hepsi.sort((a, b) => {
  const [ab, an] = a.id.slice(1).split('-').map(Number);
  const [bb, bn] = b.id.slice(1).split('-').map(Number);
  return ab - bb || an - bn;
});

const say = (k: string) => hepsi.filter((x) => x.karar === k).length;
const satirlar: string[] = [];
satirlar.push('# Doc 33 — İnsan Hakları Partisi: Denetim Raporu\n');
satirlar.push(`Denetlenen soru: **${hepsi.length}** · ONAY ${say('ONAY')} · ZAYIF-ONAY ${say('ZAYIF-ONAY')} · UYARI ${say('UYARI')} · ÇELİŞKİ ${say('CELISKI')}\n`);
satirlar.push('Yöntem: her soru, cevap anahtarını görmeyen **iki bağımsız denetçi** tarafından resmî');
satirlar.push('metne karşı çözüldü. İkisi de kitapla aynı cevaba vardıysa ONAY; ayrıştıysa ÇELİŞKİ');
satirlar.push('(hakem turuna gider); cevap tuttuğu hâlde soruda kusur bildirildiyse UYARI.\n');
satirlar.push('**Bankaya yalnız ONAY ve ZAYIF-ONAY girer.** Aşağıdakiler senin kararını bekliyor.\n');

const yaz = (baslik: string, filtre: (k: Karar) => boolean, aciklama: string) => {
  const grup = hepsi.filter(filtre);
  if (!grup.length) return;
  satirlar.push(`\n---\n\n## ${baslik} (${grup.length})\n\n${aciklama}\n`);
  for (const k of grup) {
    const q = kor.get(k.id);
    if (!q) continue;
    satirlar.push(`\n### ${k.id} · ${q.bolum}\n`);
    satirlar.push(`**${q.kok}**\n`);
    for (const [l, t] of Object.entries(q.siklar)) {
      const im = [l === k.kitapCevabi ? 'kitap' : '', l === k.d1 ? 'd1' : '', l === k.d2 ? 'd2' : ''].filter(Boolean).join('+');
      satirlar.push(`- ${im ? `**[${im}]** ` : ''}${l}) ${t}`);
    }
    if (k.dayanak) satirlar.push(`\nDayanak: \`${k.dayanak}\``);
    if (k.gerekce) satirlar.push(`\nDenetçi gerekçesi: ${k.gerekce}`);
    for (const u of k.uyarilar) satirlar.push(`\n> ⚠ ${u}`);
    if (notlar[k.id]) satirlar.push(`\nKitabın notu: _${notlar[k.id]}_`);
  }
};

yaz('ÇELİŞKİ — cevap anahtarı tartışmalı',
  (k) => k.karar === 'CELISKI',
  'İki denetçi de kitabın cevabından FARKLI bir şıkta birleşti. Ya anahtar yanlış, ya soru birden çok savunulabilir cevaba açık.');
yaz('UYARI — cevap doğru, soruda kusur var',
  (k) => k.karar === 'UYARI',
  'Cevap anahtarı tuttu ama denetçi soruda bir kusur bildirdi: ikinci savunulabilir şık, yanıltıcı kök, eskimiş bilgi ya da yazım bozukluğu.');

writeFileSync(`${KOK}/RAPOR.md`, satirlar.join('\n'));
console.log(`RAPOR.md yazıldı · ${hepsi.length} soru · UYARI ${say('UYARI')} · ÇELİŞKİ ${say('CELISKI')}`);
console.log(`bankaya aday (ONAY+ZAYIF): ${say('ONAY') + say('ZAYIF-ONAY')}`);
