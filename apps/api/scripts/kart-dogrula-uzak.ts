/**
 * Doc 56 — Bilgi kartı destesini CANLI public API'den çekilen madde metinlerine karşı doğrula.
 * Veritabanı bağlantısı gerekmez (DATABASE_URL olmayan ortamlar: editör, CI, cloud oturumu).
 *
 *   cd apps/api && npx tsx scripts/kart-dogrula-uzak.ts <deste.json> [--md] [--api https://…/api/v1]
 *   cd apps/api && npx tsx scripts/kart-dogrula-uzak.ts <deste.json> --metin <maddeler.json>
 *
 * Aynı saf doğrulayıcı (`kart-dogrulayici.ts`); metin kaynağı `/public/mevzuat/<slug>/oku`
 * (yalnız yayındaki maddeler — yayında olmayan madde "madde yok" sayılır) ya da `--metin` ile
 * verilen `{name, articles:[{no,text}]}` dosyası (API'ye erişilemeyen ortam). Kusur varsa çıkış 1.
 */
import { readFileSync } from 'fs';
import type { ArticleText } from '../src/modules/summaries/ozet-dogrulayici';
import { validateDeck, type FlashcardDeckJson } from '../src/modules/flashcards/kart-dogrulayici';

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
if (!file) {
  console.error('kullanım: kart-dogrula-uzak.ts <deste.json> [--md] [--api <base>]');
  process.exit(2);
}
const md = args.includes('--md');
const apiIdx = args.indexOf('--api');
const api =
  (apiIdx >= 0 ? args[apiIdx + 1] : process.env.API_BASE_URL) ?? 'https://api.paemisyon.com/api/v1';
const metinIdx = args.indexOf('--metin');
const metinDosyasi = metinIdx >= 0 ? args[metinIdx + 1] : null;

interface Okuma {
  name: string;
  articles: { no: string; text: string }[];
}

(async () => {
  const data = JSON.parse(readFileSync(file, 'utf8')) as FlashcardDeckJson;
  let okuma: Okuma;
  if (metinDosyasi) okuma = JSON.parse(readFileSync(metinDosyasi, 'utf8')) as Okuma;
  else {
    // Kaynak metin (Doc 56 §12) hiçbir public uçtan okunmaz: pasajlar ya --metin dosyasından ya da
    // veritabanından (kart-dogrula.ts) doğrulanır.
    if (!data.deck.legislationSlug)
      throw new Error(
        'Kaynak metin destesi: --metin <pasajlar.json> ver ya da kart-dogrula.ts kullan.',
      );
    const res = await fetch(`${api}/public/mevzuat/${data.deck.legislationSlug}/oku`);
    if (!res.ok) throw new Error(`Mevzuat okunamadı: ${data.deck.legislationSlug} (${res.status})`);
    okuma = ((await res.json()) as { data: Okuma }).data;
  }
  const byNo = new Map<string, ArticleText>(
    okuma.articles.map((a) => [a.no, { articleNo: a.no, text: a.text }]),
  );
  const r = validateDeck(data, byNo);
  if (md) {
    console.log(
      `# ${okuma.name} — ${data.cards.length} kart · ${r.ok ? 'geçti' : `${r.fails} kusur`} · kaynak ${metinDosyasi ?? api}\n`,
    );
    for (const c of r.cards) {
      console.log(`## ${c.index + 1}. [${c.kind}] ${c.front}${c.ok ? '' : ' — KUSUR'}`);
      for (const l of c.lines) console.log(`- ${l}`);
      console.log('');
    }
  } else {
    console.log(
      `${r.ok ? 'GEÇTİ' : 'KUSUR'}: ${data.cards.length} kart, ${r.fails} kusur (${okuma.articles.length} madde okundu)`,
    );
    for (const c of r.cards.filter((x) => !x.ok)) {
      console.log(`  [${c.index + 1}] ${c.front}`);
      for (const i of c.issues) console.log(`     ✗ ${i}`);
    }
  }
  process.exit(r.ok ? 0 : 1);
})();
