/**
 * İH partisi — kör denetim sonuçlarını cevap anahtarıyla karşılaştırır (SALT OKUMA).
 *
 * Girdi : docs/33-insan-haklari-partisi/denetim/b<NN>-d1.json, -d2.json
 *         docs/33-insan-haklari-partisi/parti/b<NN>-anahtar.json
 * Çıktı : b<NN>-karar.json  +  ekrana özet
 *
 * Karar mantığı (Doc 32 yöntemi):
 *   ONAY      : iki denetçi de anahtarla aynı, ikisi de düşük güvende değil
 *   ZAYIF-ONAY: ikisi de anahtarla aynı ama en az biri "dusuk" güvende
 *   CELISKI   : denetçiler birbiriyle ya da anahtarla ayrışıyor → 3. tur
 *   UYARI     : cevap tutuyor ama denetçi kusur bildirmiş → insan bakacak
 *
 *   npx tsx scripts/ih-denetim-birlestir.ts 07
 *   npx tsx scripts/ih-denetim-birlestir.ts --hepsi
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';

/** Hakem turu kararları (iki hakem MUTABIKSA bağlayıcı) — ih-hakem-topla.ts üretir. */
type Hakem = { karar: 'kitap' | 'denetci' | 'kusurlu'; cevap: string | null; gerekce: string; alinti: string };
const HAKEM: Record<string, Hakem> = existsSync(`${'/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi'}/denetim/hakem-kararlari.json`)
  ? JSON.parse(readFileSync('/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi/denetim/hakem-kararlari.json', 'utf8'))
  : {};

const KOK = '/Users/ahmetcnd/Developer/paemisyon/docs/33-insan-haklari-partisi';
type Kayit = { id: string; cevap: string; guven: string; dayanak: string; gerekce: string; uyari: string | null };

function birlestir(bolum: string) {
  const d1yol = `${KOK}/denetim/b${bolum}-d1.json`;
  const d2yol = `${KOK}/denetim/b${bolum}-d2.json`;
  if (!existsSync(d1yol) || !existsSync(d2yol)) return null;

  const d1: Kayit[] = JSON.parse(readFileSync(d1yol, 'utf8'));
  const d2: Kayit[] = JSON.parse(readFileSync(d2yol, 'utf8'));
  const anahtar: Record<string, string> = JSON.parse(readFileSync(`${KOK}/parti/b${bolum}-anahtar.json`, 'utf8'));
  const m1 = new Map(d1.map((x) => [x.id, x]));
  const m2 = new Map(d2.map((x) => [x.id, x]));

  const kararlar = Object.entries(anahtar).map(([id, kitap]) => {
    const a = m1.get(id);
    const b = m2.get(id);
    const eksik = !a || !b;
    const ikisiAyni = !eksik && a.cevap === b.cevap;
    const kitapUyuyor = ikisiAyni && a.cevap === kitap;
    const dusuk = !eksik && (a.guven === 'dusuk' || b.guven === 'dusuk');
    const uyarilar = [a?.uyari, b?.uyari].filter(Boolean) as string[];

    let karar: string;
    if (eksik) karar = 'EKSIK';
    else if (!kitapUyuyor) karar = 'CELISKI';
    else if (uyarilar.length) karar = 'UYARI';
    else if (dusuk) karar = 'ZAYIF-ONAY';
    else karar = 'ONAY';

    // Hakem turu çelişkiyi bağlayıcı biçimde çözer:
    //   kitap    → anahtar doğrulandı, soru bankaya girebilir
    //   denetci  → ANAHTAR HATALI; düzeltme kullanıcının kararı, bankaya girmez
    //   kusurlu  → tek doğru şık yok; bankaya girmez
    const h = HAKEM[id];
    if (h && karar === 'CELISKI') {
      karar = h.karar === 'kitap' ? (uyarilar.length ? 'UYARI' : 'ONAY')
        : h.karar === 'denetci' ? 'ANAHTAR-HATALI' : 'KUSURLU';
      if (h.karar !== 'kitap') uyarilar.push(`HAKEM: ${h.gerekce}`);
    }

    return {
      id, karar, kitapCevabi: kitap,
      hakemCevabi: HAKEM[id]?.karar === 'denetci' ? HAKEM[id].cevap : null,
      hakemAlintisi: HAKEM[id]?.alinti ?? null,
      d1: a?.cevap ?? null, d2: b?.cevap ?? null,
      guven: [a?.guven, b?.guven], dayanak: a?.dayanak ?? null,
      gerekce: a?.gerekce ?? null, uyarilar,
    };
  });

  writeFileSync(`${KOK}/denetim/b${bolum}-karar.json`, JSON.stringify(kararlar, null, 1));
  const say = (k: string) => kararlar.filter((x) => x.karar === k).length;
  return { bolum, toplam: kararlar.length, onay: say('ONAY'), zayif: say('ZAYIF-ONAY'),
           uyari: say('UYARI'), celiski: say('CELISKI'), eksik: say('EKSIK'), kararlar };
}

function main() {
  const arg = process.argv[2];
  const bolumler = arg === '--hepsi'
    ? [...new Set(readdirSync(`${KOK}/denetim`).map((f) => /^b(\d+)-d1\.json$/.exec(f)?.[1]).filter(Boolean) as string[])].sort()
    : [arg.padStart(2, '0')];

  let T = 0, O = 0, Z = 0, U = 0, C = 0;
  for (const b of bolumler) {
    const r = birlestir(b);
    if (!r) { console.log(`b${b}: denetim dosyaları eksik`); continue; }
    T += r.toplam; O += r.onay; Z += r.zayif; U += r.uyari; C += r.celiski;
    const ek = [
      r.kararlar.filter((x) => x.karar === 'ANAHTAR-HATALI').length && `ANAHTAR-HATALI ${r.kararlar.filter((x) => x.karar === 'ANAHTAR-HATALI').length}`,
      r.kararlar.filter((x) => x.karar === 'KUSURLU').length && `KUSURLU ${r.kararlar.filter((x) => x.karar === 'KUSURLU').length}`,
    ].filter(Boolean).join(' · ');
    console.log(`b${r.bolum}  ${r.toplam} soru → ONAY ${r.onay} · ZAYIF ${r.zayif} · UYARI ${r.uyari} · ÇELİŞKİ ${r.celiski}${r.eksik ? ` · EKSİK ${r.eksik}` : ''}${ek ? ' · ' + ek : ''}`);
    for (const k of r.kararlar.filter((x) => x.karar === 'CELISKI')) {
      console.log(`   ✗ ${k.id}: kitap=${k.kitapCevabi} d1=${k.d1} d2=${k.d2} | ${k.dayanak ?? ''}`);
    }
    for (const k of r.kararlar.filter((x) => x.karar === 'UYARI')) {
      console.log(`   ! ${k.id}: ${k.uyarilar.join(' // ').slice(0, 130)}`);
    }
  }
  if (bolumler.length > 1) {
    console.log(`\nTOPLAM ${T} soru → ONAY ${O} · ZAYIF ${Z} · UYARI ${U} · ÇELİŞKİ ${C}`);
    console.log(`kusur oranı: %${(((C + U) / T) * 100).toFixed(2)}`);
  }
}
main();
