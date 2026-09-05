/**
 * Doc 35 — kör denetçilerin sonucunu üreten ajanın anahtarıyla karşılaştırır.
 *
 * Mevzuat partilerinden farkı: burada denetçi olguyu KENDİ bulmak zorundaydı.
 * Bu yüzden "doğrulanamadı" ayrı bir karardır ve bankaya girişi engeller —
 * bağımsız olarak yeniden bulunamayan olgu, kaynaklı sayılmaz.
 *
 *   ONAY           iki denetçi de anahtarla aynı + ikisi de doğruladı
 *   UYARI          cevap tuttu ama soruda kusur bildirildi
 *   DOGRULANAMADI  en az bir denetçi birincil kaynak bulamadı
 *   CELISKI        denetçiler kendi aralarında ya da anahtarla ayrıştı
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/35-guncel-kultur';

/**
 * TAMAMLANMIŞ ALANLAR — şık dengelemesi çalıştıktan sonra bu alanların
 * anahtarları değişti, oysa denetçi kayıtları dengeleme ÖNCESİ harflere ait.
 * Yeniden birleştirmek toplu SAHTE çelişki üretir. Bu alanların kararı zaten
 * verildi ve soruları bankaya yazıldı; birleştirmenin dışında tutulurlar.
 *
 * Kural: bir alan dengelendiyse bir daha birleştirilmez. Yeni alanlar
 * dengelemeden ÖNCE birleştirilmelidir.
 */
const TAMAMLANDI = new Set([
  'ekonomi-teknoloji-savunma', 'kultur-sanat-bilim', 'spor',
  'turkiye-siyaset-mevzuat', 'uluslararasi',
]);

const T: Record<string, number> = {};
const tumKararlar: any[] = [];
const alanlar = [...new Set(readdirSync(`${KOK}/denetim`).map((f) => /^(.+)-d[12]\.json$/.exec(f)?.[1]).filter(Boolean) as string[])].sort();

for (const alan of alanlar) {
  if (TAMAMLANDI.has(alan)) { console.log(`${alan.padEnd(26)} — tamamlandı (dengelendi, bankaya yazıldı)`); continue; }
  const y1 = `${KOK}/denetim/${alan}-d1.json`, y2 = `${KOK}/denetim/${alan}-d2.json`;
  if (!existsSync(y1) || !existsSync(y2)) { console.log(`${alan.padEnd(26)} denetim eksik`); continue; }
  const m1 = new Map(JSON.parse(readFileSync(y1, 'utf8')).map((x: any) => [x.id, x]));
  const m2 = new Map(JSON.parse(readFileSync(y2, 'utf8')).map((x: any) => [x.id, x]));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(`${KOK}/parti/${alan}-anahtar.json`, 'utf8'));
  const meta: Record<string, any> = JSON.parse(readFileSync(`${KOK}/parti/${alan}-meta.json`, 'utf8'));

  const kararlar = Object.entries(anahtar).map(([id, uretilen]) => {
    const a: any = m1.get(id), b: any = m2.get(id);
    if (!a || !b) return { id, alan, karar: 'EKSIK', uretilenCevap: uretilen };
    const dogrulanamadi = a.dogrulanamadi || b.dogrulanamadi;
    const ikisiAyni = a.cevap === b.cevap;
    const anahtarTuttu = ikisiAyni && a.cevap === uretilen;
    const uyarilar = [a.uyari, b.uyari].filter(Boolean);
    const dusuk = a.guven === 'dusuk' || b.guven === 'dusuk';

    let karar: string;
    if (dogrulanamadi) karar = 'DOGRULANAMADI';
    else if (!anahtarTuttu) karar = 'CELISKI';
    else if (uyarilar.length) karar = 'UYARI';
    else if (dusuk) karar = 'ZAYIF';
    else karar = 'ONAY';

    return { id, alan, karar, uretilenCevap: uretilen, d1: a.cevap, d2: b.cevap,
             guven: [a.guven, b.guven], uyarilar,
             denetciKaynaklari: [a.kaynakUrl, b.kaynakUrl].filter(Boolean),
             gerekce: a.gerekce, meta: meta[id] };
  });
  writeFileSync(`${KOK}/denetim/${alan}-karar.json`, JSON.stringify(kararlar, null, 1));
  tumKararlar.push(...kararlar);
  const say = (k: string) => kararlar.filter((x) => x.karar === k).length;
  for (const k of ['ONAY', 'ZAYIF', 'UYARI', 'DOGRULANAMADI', 'CELISKI', 'EKSIK']) T[k] = (T[k] ?? 0) + say(k);
  console.log(`${alan.padEnd(26)} ${String(kararlar.length).padStart(3)} → ONAY ${say('ONAY')} · ZAYIF ${say('ZAYIF')} · UYARI ${say('UYARI')} · DOĞRULANAMADI ${say('DOGRULANAMADI')} · ÇELİŞKİ ${say('CELISKI')}`);
}
console.log(`\nTOPLAM ${tumKararlar.length} → ${Object.entries(T).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
