/**
 * Doc 39 — üç bağımsız denetçinin kararlarını tek karara indirir.
 *
 * KURAL (kullanıcı talebi): denetçiler birbirine itiraz edebilir ve görüş
 * ayrılığı sürdükçe soru KABUL EDİLMEZ. Bu yüzden birleştirme oy çokluğu
 * DEĞİL, oy BİRLİĞİ arar:
 *   üçü de ONAY                → KABUL
 *   herhangi biri RED          → RED   (şüphe sorunun aleyhinedir)
 *   herhangi biri REVIZYON     → REVIZYON (üreticiye geri döner, bir tur)
 *   bir denetçi karar yazmamış → REVIZYON (denetlenmemiş soru kabul edilmez)
 *
 * İkinci turdan sonra hâlâ REVIZYON kalan soru RED sayılır; TUR=2 ile çağrılır.
 *
 *   npx tsx scripts/doc39-denetim-birlestir.ts <doc-dizini> <parti>
 *   TUR=2 npx tsx scripts/doc39-denetim-birlestir.ts docs/39-… 2911-p1
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROLLER = ['mevzuat', 'kalite', 'dil'] as const;
type Karar = 'ONAY' | 'REVIZYON' | 'RED';
type Satir = { id: string; karar: Karar; gerekce?: string; oneri?: string };

const [doc, parti] = process.argv.slice(2);
if (!doc || !parti) throw new Error('kullanım: doc39-denetim-birlestir.ts <doc-dizini> <parti>');
const SON_TUR = process.env.TUR === '2';

const aday: { id: string }[] = JSON.parse(readFileSync(`${doc}/aday/${parti}.json`, 'utf8'));

/**
 * İnsan kararı katmanı — `denetim/<parti>-insan.json`.
 * Bir denetçinin REVIZYON itirazı yalnız açıklama metnine ilişkinse ve düzeltme
 * insan tarafından uygulanıp mevzuat metniyle doğrulandıysa, itiraz burada
 * kapatılır. DENETÇİ DOSYASI ASLA DEĞİŞTİRİLMEZ — itiraz ve kapanış gerekçesi
 * karar dosyasında yan yana durur, iz kaybolmaz. RED'i kapatmaz: hukuki kusur
 * insan notuyla değil, sorunun yeniden yazılmasıyla giderilir.
 */
type Insan = { id: string; not: string };
const insanYol = `${doc}/denetim/${parti}-insan.json`;
const insan = new Map<string, string>(
  (existsSync(insanYol) ? (JSON.parse(readFileSync(insanYol, 'utf8')) as Insan[]) : [])
    .map((x) => [x.id, x.not]),
);
const oy = new Map<string, Partial<Record<(typeof ROLLER)[number], Satir>>>();
for (const rol of ROLLER) {
  const yol = `${doc}/denetim/${parti}-${rol}.json`;
  if (!existsSync(yol)) throw new Error(`denetçi çıktısı eksik: ${yol}`);
  for (const s of JSON.parse(readFileSync(yol, 'utf8')) as Satir[])
    oy.set(s.id, { ...oy.get(s.id), [rol]: s });
}

const sonuc: { id: string; karar: string; itirazlar: string[] }[] = [];
const sayac: Record<string, number> = { KABUL: 0, REVIZYON: 0, RED: 0 };
for (const q of aday) {
  const o = oy.get(q.id) ?? {};
  const eksik = ROLLER.filter((r) => !o[r]);
  const itirazlar = ROLLER.filter((r) => o[r] && o[r]!.karar !== 'ONAY')
    .map((r) => `${r}: ${o[r]!.karar} — ${o[r]!.gerekce ?? ''}${o[r]!.oneri ? ` | öneri: ${o[r]!.oneri}` : ''}`);
  // ONAY verirken bile yazılmış çekince, insan gözden geçirmesi için taşınır.
  const cekince = ROLLER.filter((r) => o[r]?.karar === 'ONAY' && o[r]!.gerekce?.trim())
    .map((r) => `${r} (onayladı, çekince): ${o[r]!.gerekce}`);

  const insanNotu = insan.get(q.id);
  let karar: string;
  if (eksik.length) karar = 'REVIZYON', itirazlar.push(`denetlenmedi: ${eksik.join(', ')}`);
  else if (ROLLER.some((r) => o[r]!.karar === 'RED')) karar = 'RED';
  else if (itirazlar.length && insanNotu) karar = 'KABUL', itirazlar.push(`İNSAN KARARI (itiraz kapatıldı): ${insanNotu}`);
  else if (itirazlar.length) karar = SON_TUR ? 'RED' : 'REVIZYON';
  else karar = 'KABUL';
  sayac[karar]++;
  sonuc.push({ id: q.id, karar, itirazlar: [...itirazlar, ...cekince] });
}

writeFileSync(`${doc}/denetim/${parti}-karar.json`, JSON.stringify(sonuc, null, 2));
console.log(`${parti}: ${aday.length} aday → KABUL ${sayac.KABUL} · REVIZYON ${sayac.REVIZYON} · RED ${sayac.RED}${SON_TUR ? '  (son tur)' : ''}`);
for (const s of sonuc.filter((x) => x.karar !== 'KABUL'))
  console.log(`\n[${s.karar}] ${s.id}\n  ${s.itirazlar.join('\n  ')}`);
