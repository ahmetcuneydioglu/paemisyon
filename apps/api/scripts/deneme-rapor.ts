/**
 * Doc 34 — denetim sonuçlarından insan okuyacağı raporu üretir (SALT OKUMA).
 * Bankaya girmeyen her soru, kökü/şıkları/gerekçesiyle burada toplanır.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/34-paem7-deneme';
const GECER = new Set(['ONAY', 'ZAYIF']);

const kor = new Map<string, any>();
for (const f of readdirSync(`${KOK}/parti`).filter((x) => /-kor\.json$/.test(x) && !/^(onarilan2?|hakem)-/.test(x))) {
  const o = JSON.parse(readFileSync(`${KOK}/parti/${f}`, 'utf8'));
  for (const s of o.sorular) kor.set(s.id, { ...s, ders: o.ders ?? '—' });
}
const kararlar = new Map<string, any>();
for (const f of readdirSync(`${KOK}/denetim`).filter((x) => /-karar\.json$/.test(x) && !/^onarilan2?-/.test(x))) {
  for (const k of JSON.parse(readFileSync(`${KOK}/denetim/${f}`, 'utf8'))) kararlar.set(k.id, k);
}
const elenen = existsSync(`${KOK}/elenen-guncel-kultur.json`)
  ? JSON.parse(readFileSync(`${KOK}/elenen-guncel-kultur.json`, 'utf8')) : [];

const hepsi = [...kararlar.values()].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
const say = (k: string) => hepsi.filter((x) => x.karar === k).length;

const L: string[] = [];
L.push('# Doc 34 — PAEM 7 Deneme (2022): Denetim Raporu\n');
L.push(`Denetlenen soru: **${hepsi.length}** · ONAY ${say('ONAY')} · UYARI ${say('UYARI')} · ÇELİŞKİ ${say('CELISKI')} · ANAHTAR-HATALI ${say('ANAHTAR-HATALI')} · KUSURLU ${say('KUSURLU')} · ESKİMİŞ ${say('ESKIMIS')}\n`);
L.push('Kaynak taranmış PDF olduğu için sorular önce OCR ile çıkarıldı, kusur bildirilen');
L.push('metinler **orijinal sayfa görüntüsüne bakılarak onarıldı**, sonra yeniden denetlendi.');
L.push('Denetçiler 2026 yürürlükteki metne baktı; kitabın 2022 anahtarıyla ayrışma bu yüzden');
L.push('ya anahtar hatası ya da mevzuat değişikliği demek.\n');
L.push(`Güncel kültür bloğu kullanıcı kararıyla elendi: **${elenen.length} soru** (2021-22 olayları).\n`);
L.push('**Bankaya yalnız ONAY ve ZAYIF girer.** Aşağıdakiler kararını bekliyor.\n');

const yaz = (baslik: string, filtre: (k: any) => boolean, aciklama: string) => {
  const grup = hepsi.filter(filtre);
  if (!grup.length) return;
  L.push(`\n---\n\n## ${baslik} (${grup.length})\n\n${aciklama}\n`);
  for (const k of grup) {
    const q = kor.get(k.id);
    if (!q) continue;
    L.push(`\n### ${k.id} · ${q.ders}\n`);
    L.push(`**${q.kok}**\n`);
    for (const [l, t] of Object.entries(q.siklar)) {
      const im = [l === k.kitapCevabi ? 'kitap' : '', l === k.guncelCevap && l !== k.kitapCevabi ? 'güncel' : '',
                  l === k.d1 ? 'd1' : '', l === k.d2 ? 'd2' : ''].filter(Boolean).join('+');
      L.push(`- ${im ? `**[${im}]** ` : ''}${l}) ${t}`);
    }
    if (k.dayanak) L.push(`\nDayanak: \`${k.dayanak}\``);
    if (k.gerekce) L.push(`\nDenetçi gerekçesi: ${k.gerekce}`);
    for (const e of k.eskimeler ?? []) L.push(`\n> ⏱ ESKİME: ${e}`);
    for (const u of k.uyarilar ?? []) L.push(`\n> ⚠ ${u}`);
    if (k.hakemAlintisi) L.push(`\n> ⚖ HAKEM: ${k.hakemAlintisi}`);
  }
};

yaz('ANAHTAR HATALI — hakem kitabı çürüttü', (k) => k.karar === 'ANAHTAR-HATALI',
  'İki hakem de kitabın anahtarının yanlış olduğunda birleşti. Soru sağlam, anahtar düzeltilirse alınabilir.');
yaz('ESKİMİŞ — mevzuat değişti', (k) => k.karar === 'ESKIMIS',
  'Anahtar 2022\'de doğruydu; sonradan yapılan düzenlemeyle cevap değişti. Güncellenirse alınabilir.');
yaz('KUSURLU — tek doğru şık yok', (k) => k.karar === 'KUSURLU',
  'Hakem soruyu sertifikalayamadı; şık kümesi yeniden kurulmadan bankaya girmemeli.');
yaz('ÇELİŞKİ — hakem çözemedi', (k) => k.karar === 'CELISKI',
  'Denetçiler kitapla ayrıştı, hakemler de mutabık kalamadı. İnsan kararı gerekiyor.');
yaz('UYARI — cevap doğru, soruda kusur var', (k) => k.karar === 'UYARI',
  'Cevap anahtarı tuttu ama denetçi soruda bir kusur bildirdi (ikinci savunulabilir şık, yanıltıcı kök, kitabın kendi yazım hatası).');

writeFileSync(`${KOK}/RAPOR.md`, L.join('\n'));
console.log(`RAPOR.md · ${hepsi.length} soru · bankaya aday ${hepsi.filter((k) => GECER.has(k.karar)).length}`);
