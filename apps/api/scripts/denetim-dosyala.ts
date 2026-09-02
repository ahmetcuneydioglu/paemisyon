/**
 * Doc 32 — DENETIM PAKETI DISA AKTARICI.
 *
 * Bir konunun denetlenmemis yayin sorularini, dayanak madde metinleriyle
 * birlikte kendi kendine yeten JSON kumelerine yazar. SALT OKUR.
 *
 * Amac: dogrulama isini paralel alt ajanlara dagitirken alt ajanlarin
 * VERITABANINA HIC DOKUNMAMASI (Supabase pooler 15 baglanti siniri).
 * Tum DB okumasi burada, tek baglantiyla, bir kez yapilir.
 *
 * Bagli sorular gercek articleNo'suna gore kumelenir; bagli olmayanlar icin
 * IDF agirlikli oneri motorunun ILK UC adayinin metni birlikte verilir ki
 * ajan dogru maddeyi kendisi secebilsin (oneri karar degildir).
 *
 *   npx tsx scripts/denetim-dosyala.ts --konu "Adli ve Önleme" --cikti <dizin>
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const p = new PrismaClient();
const arg = (k: string) => { const i = process.argv.indexOf(k); return i === -1 ? undefined : process.argv[i + 1]; };

const DURAK = new Set(('ve veya ile için göre olan olarak bir bu şu da de ki ise aşağıdakilerden hangisi ' +
  'hangileri hangisinde kaç kaçıncı ne nedir sayılı kanun kanuna kanunu kanununa hakkında ilgili ' +
  'durumunda halinde hâlinde nin nın nun nün den dan tan ten yer alan bulunan gereken aşağıdaki ' +
  'yukarıdakilerden yukarıdaki ifadelerden şıklardan seçeneklerden madde maddesi maddesine göre ' +
  'doğrudur yanlıştır değildir olabilir edilir verilir yapılır olur eder etmek olmak bulunmak').split(/\s+/));
const jetonla = (s: string) => new Set(
  s.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/)
    .filter((w) => w.length > 3 && !DURAK.has(w)));

const SORU_SINIR = 12;       // kume basina en fazla soru (yogunlastirildi: ayni madde metni
                             // birden cok dosyada tekrar okutulmasin diye)
const METIN_SINIR = 22_000;  // BIRINCIL madde icin en fazla karakter
const YARDIMCI_SINIR = 5_000; // yardimci aday maddeler icin en fazla karakter
                              // (3.000'de belirleyici fikra kesiliyordu — olcum partisi)
const KUME_SINIR = 46_000;    // kume dosyasinin toplam madde metni tavani
const ASGARI_ADAY_PAY = 2_200; // bir aday madde HIC kirpilmadan once en az bu kadar
                               // karakter almalidir; altina dusuyorsa dosya zaten
                               // fazla aday tasiyor demektir (dilim kucultulur).
const ADAY = 5;              // oneri motorunun kac adayi verilecegi

// "Meta" maddeler: amac, kapsam, dayanak, tanimlar, yururluk, yurutme.
// IDF motoru bunlari ASLA bulamaz — kisadirlar ve soruyla ortak ayirt edici
// kelime tasimazlar. Oysa sinavlarda duzenli sorulurlar (ornegin "bu Yonetmelik
// hukumlerini kim yurutur"). Bu yuzden her kumeye kosulsuz eklenirler.
const META_RE = /^\s*(amaç|kapsam|dayanak|tanımlar|yürürlük|yürütme)\s*$/i;

(async () => {
  const konuAra = arg('--konu')!;
  const cikti = arg('--cikti')!;
  const t = await p.topic.findFirst({
    where: { name: { contains: konuAra, mode: 'insensitive' }, deletedAt: null },
    select: { id: true, name: true } });
  if (!t) { console.log(`!! konu bulunamadi: ${konuAra}`); return; }

  const DEFTER = `${__dirname}/../../../docs/32-yayin-denetimi/ilerleme.jsonl`;
  const bitmis = new Set<string>();
  let yalnizBelirsiz: Set<string> | null = null;
  if (existsSync(DEFTER))
  {
    // --belirsizi-yenile: defterde `belirsiz` kalmis sorulari YENIDEN kuyruga al.
    // Gerekce: "belirsiz" sorunun kusurlu oldugunu degil, o TURDAKI kume
    // dosyasinin karari veremedigini gosterir. Kume ureticisi duzeldiginde
    // (butce paylasimi, komsu madde genisletmesi) bu sorular yeniden
    // denenmelidir; aksi halde hat kusuru kalici bir "belirsiz" olarak defterde
    // donar. Son kayit kazanir — bir soru sonradan yayimlanabilir olduysa
    // tekrar alinmaz.
    // --yalniz-belirsiz: SADECE defterde `belirsiz` kalmis sorulari al; hic
    // denetlenmemis sorulara dokunma. `--belirsizi-yenile` tek basina
    // "bitmemis + belirsiz" verir; kapsami daraltilmis bir turda (ornegin
    // yalniz riskli alt kume denetlenirken) bu, kapsam disi birakilan sorulari
    // da kuyruga sokar. Bu bayrak turu yalniz yeniden-deneme kumesine kilitler.
    const SADECE_BELIRSIZ = process.argv.includes('--yalniz-belirsiz');
    const YENILE = SADECE_BELIRSIZ || process.argv.includes('--belirsizi-yenile');
    const sinif = new Map<string, string>();
    if (existsSync(DEFTER))
      for (const l of readFileSync(DEFTER, 'utf-8').split('\n')) {
        if (!l.trim()) continue;
        try { const r = JSON.parse(l); sinif.set(String(r.id).slice(0, 8), String(r.sinif ?? '')); }
        catch { /* bozuk satir */ }
      }
    for (const [id, s] of sinif) if (!(YENILE && s === 'belirsiz')) bitmis.add(id);
    // Dar mod: defterde hic gecmeyen (yani hic denetlenmemis) sorular da bitmis sayilir.
    if (SADECE_BELIRSIZ) yalnizBelirsiz = new Set([...sinif].filter(([, s]) => s === 'belirsiz').map(([i]) => i));
  }

  // Aday maddeler TUM KONULARDAN secilir. Olcum partisi gosterdi ki sorularin
  // buyuk kismi kendi konusunun disindaki bir mevzuata dayaniyor (Anayasa
  // konusundaki bir soru TBMM Ictuzugu'ne, 3713 konusundaki bir soru 5233'e...).
  // Yalniz kendi konusuna bakmak bu sorulari cozulemez kiliyordu.
  const hepsi = await p.lawArticle.findMany({
    where: { deletedAt: null, status: 'published' },
    select: { articleNo: true, title: true, text: true, sourceUrl: true,
      topicId: true, topic: { select: { name: true } },
      // Bolum agaci: "hangi bolumde duzenlenmistir" tipi sorular ancak bununla
      // cozulur; madde metinleri bolum basligini tasimiyor.
      section: { select: { heading: true, parent: { select: { heading: true } } } } } });
  const anahtar = (kanun: string, no: string) => `${kanun}|${no}`;
  const mMap = new Map(hepsi.map((m) => [anahtar(m.topic?.name ?? '?', m.articleNo), m]));
  const maddeler = hepsi.filter((m) => m.topicId === t.id);   // meta maddeler icin
  const kaynak = maddeler.find((m) => m.sourceUrl)?.sourceUrl ?? null;

  const mJeton = hepsi.map((m) => ({
    k: anahtar(m.topic?.name ?? '?', m.articleNo),
    kanun: m.topic?.name ?? '?', no: m.articleNo,
    j: jetonla(`${m.title ?? ''} ${m.text}`) }));
  const df = new Map<string, number>();
  for (const m of mJeton) for (const w of m.j) df.set(w, (df.get(w) ?? 0) + 1);

  // --inceleme: henuz yayinlanmamis (in_review) partileri de denetle. Yeni ice
  // aktarilan kitap partileri once burada denetlenir, SONRA yayinlanir; boylece
  // kusurlu soru istemciye hic ulasmaz.
  const INCELEME = process.argv.includes('--inceleme');
  const tumu = await p.questionVersion.findMany({
    where: { status: INCELEME ? { in: ['published', 'in_review'] } : 'published',
      question: { deletedAt: null, topicId: t.id } },
    select: { id: true, stem: true, explanation: true, sourceLabel: true,
      _count: { select: { examQuestions: true } },
      question: { select: { articleNo: true } },
      options: { select: { label: true, text: true, isCorrect: true }, orderBy: { sortOrder: 'asc' } } } });
  // --riskli: yalniz DENETIME DEGER alt kume. Olcut, sorunun icerigiyle degil
  // BANKADAKI EKSIKLIGIYLE ilgilidir: dayanak maddesi hic baglanmamis
  // (articleNo bos) ya da acikama alani bos/anlamsiz kisa. Bu iki eksik,
  // sorunun kaynakla hic karsilastirilmadigina isaret eder. sourceLabel
  // (hangi sinavdan cikti) olcute DAHIL DEGIL — dogrulukla ilgisi yok,
  // ayri bir is kalemi (Asama 2).
  const SADECE_RISKLI = process.argv.includes('--riskli');
  const riskliMi = (r: (typeof tumu)[number]) =>
    !r.question.articleNo || !r.explanation || r.explanation.trim().length < 40;
  // --temiz: RISKLI'nin tersi — madde bagi VE aciklamasi olan sorular. Bu grup
  // B kapsaminda denetlenmedi; kusur orani olcumu icin ornekleme kullanilir.
  const SADECE_TEMIZ = process.argv.includes('--temiz');
  // --ornek N: SISTEMATIK ornekleme (rastgele degil). Havuz id'ye gore siralanir
  // ve esit aralikla N tane secilir; boylece secim TEKRARLANABILIR olur ve
  // havuzun tamamina yayilir (bir madde kumesine yigilmaz).
  const ORNEK = Number(arg('--ornek') ?? 0);
  let rows = tumu
    .filter((r) => !bitmis.has(r.id.slice(0, 8)))
    .filter((r) => !SADECE_RISKLI || riskliMi(r))
    .filter((r) => !SADECE_TEMIZ || !riskliMi(r))
    .filter((r) => yalnizBelirsiz === null || yalnizBelirsiz.has(r.id.slice(0, 8)));
  if (ORNEK > 0 && rows.length > ORNEK) {
    const sirali = [...rows].sort((a, b) => a.id.localeCompare(b.id));
    const adim = sirali.length / ORNEK;
    rows = Array.from({ length: ORNEK }, (_, i) => sirali[Math.floor(i * adim)]);
    console.log(`ORNEKLEM: ${sirali.length} havuzdan sistematik ${rows.length} soru (adim ${adim.toFixed(1)})`);
  }

  const onerUc = (r: (typeof rows)[number]): string[] => {
    const qj = jetonla(`${r.stem} ${r.options.map((o) => o.text).join(' ')}`);
    const puan = mJeton.map((m) => {
      let s = 0;
      for (const w of qj) if (m.j.has(w)) s += Math.log(mJeton.length / (df.get(w) ?? 1));
      // Sorunun KENDI konusundaki maddelere hafif oncelik: dayanak cogunlukla
      // oradadir, ama baska kanunlar da yarisabilsin diye carpan kucuk tutuldu.
      return { k: m.k, s: m.kanun === t.name ? s * 1.15 : s };
    });
    puan.sort((a, b) => b.s - a.s);
    // KENDI KANUNU KOTASI. Aday havuzu TUM konulardan secilir (bu, dayanagi
    // baska mevzuatta olan sorular icin sart). Ama sinirsiz yarisma ters
    // tepiyordu: CMK sorularina IYUK/657 maddeleri gelip gercek dayanak olan
    // CMK m.147, m.161, m.260 disarida kaliyordu — son turda 34 belirsizin
    // neredeyse tamami bu yuzdendi. Cozum: adaylarin en az KOTA kadari sorunun
    // KENDI konusundan alinir, kalan yerler serbest yarisla dolar.
    const KOTA = Math.min(3, ADAY);
    const kendi = puan.filter((x) => x.kanun === t.name).slice(0, KOTA);
    const alinan = new Set(kendi.map((x) => x.k));
    const kalan = puan.filter((x) => !alinan.has(x.k)).slice(0, ADAY - kendi.length);
    return [...kendi, ...kalan].map((x) => x.k);
  };

  // KOMSU MADDE GENISLETMESI.
  // IDF motoru "genel hukumler" tipi soyut maddeleri bulamaz: kisadirlar ve
  // soru kokuyle ortak AYIRT EDICI kelime tasimazlar. TCK olcum partisinde
  // belirsizlerin cogu bu yuzdendi — motor m.12'yi ("Bir yabanci...") getirip
  // gercek dayanak m.11'i ("Vatandas tarafindan islenen suc") disarida
  // birakmisti; ayni desen m.21 (kast) ve m.30 (hata) icin de tekrarlandi.
  // Turk mevzuatinda bitisik maddeler ayni kurumu farkli aciklardan duzenler,
  // bu yuzden her adayin bir onceki ve bir sonraki maddesi de kumeye alinir.
  // Maliyeti dusuktur: madde metni medyani ~500 karakter.
  const komsular = (k: string): string[] => {
    const i = k.lastIndexOf('|');
    const kanun = k.slice(0, i);
    const no = k.slice(i + 1);
    if (!/^\d+$/.test(no)) return [];       // "94/A", "Geçici 2" gibi: komsu hesaplanmaz
    const n = Number(no);
    return [n - 1, n + 1]
      .filter((x) => x >= 1)
      .map((x) => anahtar(kanun, String(x)))
      .filter((x) => mMap.has(x));
  };

  // Baslik meta ise ya da metin kisa ve "yururluge girer"/"yurutur" iceriyorsa
  // meta sayilir (bazi mevzuatta baslik bos gelir).
  const metaNolar = maddeler
    .filter((m) => META_RE.test(m.title ?? '') ||
      (m.text.length < 400 && /(yürürlüğe girer|yürütür|yürütmeye .* yetkili)/i.test(m.text)))
    .map((m) => anahtar(t.name, m.articleNo));

  const soruNes = (r: (typeof rows)[number], adaylar: string[]) => ({
    id: r.id.slice(0, 8),
    kok: r.stem.replace(/\s+/g, ' ').trim(),
    siklar: r.options.map((o) => ({ harf: o.label, metin: o.text.replace(/\s+/g, ' ').trim(), isaretliDogru: o.isCorrect })),
    mevcutAciklama: r.explanation?.trim() || null,
    kaynakEtiketi: r.sourceLabel,
    sinavdaKullanim: r._count.examQuestions,
    bagliMadde: r.question.articleNo,
    bagliKanun: r.question.articleNo ? t.name : null,
    adayMaddeler: adaylar,   // "Kanun adi|madde no" bicimindedir
  });

  // Kumeleme anahtari: bagliysa gercek madde, degilse ilk oneri.
  const grup = new Map<string, Array<ReturnType<typeof soruNes>>>();
  const grupMadde = new Map<string, Set<string>>();
  for (const r of rows) {
    // Bagli soruda birincil = kendi konusunun maddesi; ayrica oneri motorunun
    // adaylari da EKLENIR, cunku sik siklarindan biri baska bir kanuna dayanabilir.
    const kendi = r.question.articleNo ? anahtar(t.name, r.question.articleNo) : null;
    const onerilen = onerUc(r);
    const adaylar = kendi ? [kendi, ...onerilen.filter((x) => x !== kendi).slice(0, ADAY - 1)] : onerilen;
    const k = kendi ?? adaylar[0] ?? '?';
    if (!grup.has(k)) { grup.set(k, []); grupMadde.set(k, new Set()); }
    grup.get(k)!.push(soruNes(r, adaylar));
    for (const a of adaylar) grupMadde.get(k)!.add(a);
    for (const a of metaNolar) grupMadde.get(k)!.add(a);
  }

  // PAKETLEME: kuyrugun kuyrugu tek soruluk kumelerle doluyor ve maliyet madde
  // metninden geldigi icin dosya basina 1 soru cok verimsiz. Kucuk gruplari,
  // soru ve metin tavanlarini asmadan tek dosyada birlestir.
  const kucuk = [...grup].filter(([, v]) => v.length < 4);
  const buyuk = [...grup].filter(([, v]) => v.length >= 4);
  const paketler: Array<[string, typeof rows]> = [...buyuk];
  let kova: typeof rows = [];
  let kovaMadde = new Set<string>();
  let kovaAd = '';
  const kovaMetin = () => [...kovaMadde].reduce((a, k) => a + Math.min(mMap.get(k)?.text.length ?? 0, YARDIMCI_SINIR), 0);
  for (const [k, v] of kucuk) {
    const yeniMadde = new Set([...kovaMadde, ...grupMadde.get(k)!]);
    const tahmin = [...yeniMadde].reduce((a, x) => a + Math.min(mMap.get(x)?.text.length ?? 0, YARDIMCI_SINIR), 0);
    if (kova.length && (kova.length + v.length > SORU_SINIR || tahmin > KUME_SINIR)) {
      paketler.push([kovaAd, kova]);
      kova = []; kovaMadde = new Set(); kovaAd = '';
    }
    if (!kova.length) kovaAd = k;
    kova = [...kova, ...v];
    kovaMadde = new Set([...kovaMadde, ...grupMadde.get(k)!]);
    grupMadde.set(kovaAd, kovaMadde);
  }
  if (kova.length) paketler.push([kovaAd, kova]);
  grup.clear();
  for (const [k, v] of paketler) grup.set(k, v);
  void kovaMetin;

  mkdirSync(cikti, { recursive: true });
  let n = 0, yazilanSoru = 0;
  const dosyalar: string[] = [];
  for (const [kumeAnahtar, sorular] of [...grup].sort((a, b) => b[1].length - a[1].length)) {
    // Metin butcesi DILIM BASINA hesaplanir. Onceki surumde kumenin TUM
    // sorularinin adaylari (12 soru x 5 aday = ~60 madde) tek bir 30k butceyi
    // paylasiyordu: ilk birkac madde butceyi bitiriyor, geri kalanlar
    // "[…kisaltildi…]" olarak yaziliyordu. TCK olcum partisinde 36 dosyanin
    // 30'u boyle cikti ve belirsiz orani %53'e firladi — denetci karari
    // veremiyordu cunku belirleyici fikra dosyada yoktu. Artik her dilim
    // YALNIZ KENDI sorularinin adaylarini tasir ve butce onlara bolunur.
    const dilimBoy = Math.max(1, Math.min(SORU_SINIR, Math.floor(SORU_SINIR / 2)));
    for (let i = 0; i < sorular.length; i += dilimBoy) {
      const dilim = sorular.slice(i, i + dilimBoy);

      const dilimMadde = new Set<string>([kumeAnahtar]);
      for (const s of dilim) for (const a of s.adayMaddeler) dilimMadde.add(a);
      for (const a of metaNolar) dilimMadde.add(a);
      // Komsular metne EKLENIR ama `adayMaddeler` listesine girmez: ajana
      // "bunlar oneri" diye degil, elinin altindaki baglam olarak sunulur.
      for (const a of [...dilimMadde]) for (const c of komsular(a)) dilimMadde.add(c);
      const sirali = [kumeAnahtar, ...[...dilimMadde].filter((x) => x !== kumeAnahtar)];

      // Adil paylasim: birincil maddeden arta kalan butce, aday maddelere
      // ESIT bolunur. Boylece "ilk gelen hepsini yer" davranisi biter; hicbir
      // aday sifir karakterle dosyaya girmez.
      const birincilHam = mMap.get(kumeAnahtar)?.text.replace(/\s+/g, ' ').trim() ?? '';
      const birincilPay = Math.min(birincilHam.length, METIN_SINIR);
      const adaySayisi = Math.max(1, sirali.length - 1);
      const adayPay = Math.max(
        ASGARI_ADAY_PAY,
        Math.min(YARDIMCI_SINIR, Math.floor((KUME_SINIR - birincilPay) / adaySayisi)),
      );

      const mMetin = sirali.map((k, idx) => {
        const m = mMap.get(k);
        const [kanunAd, no] = k.split('|');
        const ham = m ? m.text.replace(/\s+/g, ' ').trim() : '(METIN YOK — LawArticle kaydi eksik)';
        const tavan = idx === 0 ? METIN_SINIR : adayPay;
        const kesik = ham.length > tavan;
        const bolum = m?.section
          ? [m.section.parent?.heading, m.section.heading].filter(Boolean).join(' / ')
          : null;
        return { kanun: kanunAd, no, baslik: m?.title ?? null, bolum,
          rol: idx === 0 ? 'birincil' : 'aday',
          metin: kesik ? ham.slice(0, tavan) + ' […metin bu kumede kisaltildi…]' : ham };
      }).filter((m) => m.metin.length > 30);

      const ad = `${cikti}/kume-${String(++n).padStart(3, '0')}.json`;
      writeFileSync(ad, JSON.stringify({
        konu: t.name, kaynakUrl: kaynak, kumeAnahtari: kumeAnahtar,
        maddeler: mMetin,
        sorular: dilim,
      }, null, 1));
      dosyalar.push(ad);
      yazilanSoru += dilim.length;
    }
  }
  writeFileSync(`${cikti}/_ozet.json`, JSON.stringify({
    konu: t.name, kaynakUrl: kaynak, toplamYayinda: tumu.length,
    denetlenmemis: rows.length, yazilanSoru, kumeSayisi: n, dosyalar }, null, 1));
  console.log(`${t.name}: ${rows.length} denetlenmemis soru -> ${n} kume dosyasi (${yazilanSoru} soru)`);
  console.log(`kaynak: ${kaynak ?? '(sourceUrl bos)'}`);
  console.log(`dizin : ${cikti}`);
})().finally(() => p.$disconnect());
