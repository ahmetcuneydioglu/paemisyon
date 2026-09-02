/**
 * Eski PAEM/Misyon (Firebase paem-45a67) kullanici export'unu TEMIZ ve
 * KADEMELI duyuru listesine cevirir. SALT OKUR — veritabanina dokunmaz.
 *
 * Neden kademe: liste eski (kitlenin ~%87'si 2020-2022 aktif). 5.400 adrese
 * tek seferde gonderim, yuksek bounce/sikayet uretip alan adi itibarini
 * yakar ve SONRAKI e-postalar da spam'e duser. Once en taze grup gonderilir,
 * olculur, sonra geriye dogru acilir.
 *
 * Ayiklananlar: e-postasiz kayitlar, bicimsel gecersizler, mukerrerler ve
 * Apple gizli aktarma adresleri (kullanici istedigi an kapatabilir; ayri
 * dosyaya yazilir, istenirse kullanilir).
 *
 *   npx tsx scripts/eski-kullanici-listesi.ts <export.json> <cikti-dizini>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

type FbUser = {
  localId: string; email?: string; emailVerified?: boolean; displayName?: string;
  phoneNumber?: string; createdAt?: string; lastSignedInAt?: string;
  providerUserInfo?: Array<{ providerId?: string }>;
};

const EPOSTA = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;
const GIZLI = /privaterelay\.appleid\.com$/i;
const yil = (ms?: string) => (ms ? new Date(Number(ms)).getUTCFullYear() : 0);

(() => {
  const [, , girdi, cikti] = process.argv;
  const ham: FbUser[] = JSON.parse(readFileSync(girdi, 'utf8')).users ?? [];
  mkdirSync(cikti, { recursive: true });

  const gorulen = new Set<string>();
  const temiz: any[] = [], gizli: any[] = [], atilan: Record<string, number> = {};
  const at = (k: string) => { atilan[k] = (atilan[k] ?? 0) + 1; };

  for (const u of ham) {
    const e = (u.email ?? '').trim().toLowerCase();
    if (!e) { at('e-posta yok'); continue; }
    if (!EPOSTA.test(e)) { at('bicim gecersiz'); continue; }
    if (gorulen.has(e)) { at('mukerrer'); continue; }
    gorulen.add(e);
    // Son temas: son giris yoksa kayit tarihi.
    const sonYil = yil(u.lastSignedInAt) || yil(u.createdAt);
    const kayit = {
      eposta: e,
      ad: (u.displayName ?? '').trim() || null,
      dogrulanmis: !!u.emailVerified,
      sonTemasYili: sonYil,
      kayitYili: yil(u.createdAt),
      saglayici: [...new Set((u.providerUserInfo ?? []).map((p) => p.providerId).filter(Boolean))].join(',') || 'password',
      firebaseUid: u.localId,
    };
    (GIZLI.test(e) ? gizli : temiz).push(kayit);
  }

  // KADEME: son temas yilina gore. 1 = en taze, once gonderilir.
  const kademeAdi = (y: number) => (y >= 2023 ? '1-taze-2023+' : y === 2022 ? '2-2022' : y === 2021 ? '3-2021' : '4-2020-ve-oncesi');
  const kademeler = new Map<string, any[]>();
  for (const k of temiz) {
    const ad = kademeAdi(k.sonTemasYili);
    (kademeler.get(ad) ?? kademeler.set(ad, []).get(ad)!).push(k);
  }

  const csv = (satirlar: any[]) =>
    ['eposta,ad,dogrulanmis,son_temas_yili,saglayici',
      ...satirlar.map((r) => [r.eposta, `"${(r.ad ?? '').replace(/"/g, '""')}"`, r.dogrulanmis, r.sonTemasYili, r.saglayici].join(','))].join('\n');

  for (const [ad, satirlar] of [...kademeler].sort()) {
    writeFileSync(`${cikti}/kademe-${ad}.csv`, csv(satirlar));
    const dog = satirlar.filter((r) => r.dogrulanmis).length;
    console.log(`kademe-${ad}.csv  ${String(satirlar.length).padStart(5)} adres   (dogrulanmis ${dog})`);
  }
  writeFileSync(`${cikti}/apple-gizli-adresler.csv`, csv(gizli));
  writeFileSync(`${cikti}/tumu.json`, JSON.stringify(temiz, null, 1));

  console.log(`\nTEMIZ TEKIL ADRES: ${temiz.length}   (Apple gizli ayri: ${gizli.length})`);
  console.log('ayiklananlar:', JSON.stringify(atilan));
})();
