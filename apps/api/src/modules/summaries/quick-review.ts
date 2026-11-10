import type { PublicBlock } from "./summaries.service";

/** Editoryal kısa pilot. Erişim ve kaynak maddeler yayınlı üniteden gelir. */
const GENERAL = [
  {
    "type": "rule",
    "title": "Devletin kimliği",
    "body": "**Şekli:** Cumhuriyet.\n**Nitelikleri:** Demokratik, laik ve sosyal bir hukuk devleti; insan haklarına saygılı, Atatürk milliyetçiliğine bağlı.\n**Bütünlüğü:** Ülkesi ve milletiyle bölünmez.\n**Dili:** Türkçe · **Başkenti:** Ankara\n**Bayrağı:** Beyaz ay yıldızlı al bayrak · **Millî marşı:** İstiklal Marşı.",
    "articleRefs": [
      "1",
      "2",
      "3"
    ]
  },
  {
    "type": "rule",
    "title": "Değişiklik teklifine de kapalı",
    "body": "**Değiştirilemez ve değiştirilmesi teklif edilemez:**\n- Devletin Cumhuriyet olması (md 1).\n- Cumhuriyetin nitelikleri (md 2).\n- md 3’ün bütün hükümleri.\n**Başkent de bu korumanın içindedir.**",
    "articleRefs": [
      "1",
      "2",
      "3",
      "4"
    ]
  },
  {
    "type": "rule",
    "title": "Devletin amaçları: fiilleri hatırla",
    "body": "**Korumak:** Bağımsızlık, bütünlük, ülkenin bölünmezliği, Cumhuriyet ve demokrasi.\n**Sağlamak:** Kişilerin ve toplumun refah, huzur ve mutluluğu.\n**Kaldırmaya çalışmak:** Temel hakları sosyal hukuk devleti ve adalet ilkeleriyle bağdaşmayacak biçimde sınırlayan siyasal, ekonomik ve sosyal engeller.\n**Hazırlamaya çalışmak:** İnsanın maddi ve manevi gelişimi için gerekli şartlar.",
    "articleRefs": [
      "5"
    ]
  },
  {
    "type": "rule",
    "title": "Egemenlik: sahibi Millet",
    "body": "Egemenlik **kayıtsız şartsız Milletindir.**\nMillet, egemenliğini **Anayasanın koyduğu esaslara göre, yetkili organları eliyle** kullanır.\nKullanılması kişiye, zümreye veya sınıfa bırakılamaz. Kaynağını Anayasadan almayan devlet yetkisi kullanılamaz.",
    "articleRefs": [
      "6"
    ]
  },
  {
    "type": "rule",
    "title": "Yasama · yürütme · yargı",
    "body": "**Yasama:** Türk Milleti adına TBMM; **devredilemez**.\n**Yürütme yetkisi ve görevi:** Cumhurbaşkanı; Anayasaya ve kanunlara uygun kullanır ve yerine getirir.\n**Yargı:** Türk Milleti adına **bağımsız ve tarafsız mahkemeler**.\n**Ayırt et:** “Türk Milleti adına” md 7 ve md 9’da vardır; md 8’de yer almaz.",
    "articleRefs": [
      "7",
      "8",
      "9"
    ]
  },
  {
    "type": "rule",
    "title": "Eşitlik: ayrıcalık yok",
    "body": "Herkes kanun önünde eşittir. **Kişi, aile, zümre veya sınıfa imtiyaz tanınamaz.**\nKadınlar ve erkekler eşit haklara sahiptir; devlet bu eşitliği yaşama geçirmekle yükümlüdür.\nKadın–erkek eşitliğini sağlayan tedbirler eşitliğe aykırı yorumlanamaz; çocuklar, yaşlılar, özürlüler, harp ve vazife şehitlerinin dul ve yetimleri ile malul ve gaziler için tedbirler aykırı sayılmaz.\nDevlet organları ve idare makamları bütün işlemlerinde eşitliğe uyar.",
    "articleRefs": [
      "10"
    ]
  },
  {
    "type": "rule",
    "title": "Anayasa herkesi bağlar",
    "body": "Anayasa hükümleri **yasama, yürütme ve yargı organlarını; idare makamlarını; diğer kuruluş ve kişileri** bağlayan temel hukuk kurallarıdır.\n**Kanunlar Anayasaya aykırı olamaz.**",
    "articleRefs": [
      "11"
    ]
  },
  {
    "type": "trap",
    "title": "Son bakış: iki yasağı ayır",
    "body": "**Egemenlik (md 6):** Kullanılması kişiye, zümreye veya sınıfa **bırakılamaz**.\n**Eşitlik (md 10):** Kişiye, **aileye**, zümreye veya sınıfa **imtiyaz tanınamaz**.\n“Aile” eşitlik hükmündedir; yasaklanan davranışlar da farklıdır.",
    "articleRefs": [
      "6",
      "10"
    ]
  }
] as const;

export const hasQuickReview = (slug: string) => slug === "anayasa-genel-esaslar";
export function quickReview(slug: string, blocks: PublicBlock[]): PublicBlock[] | null {
  if (!hasQuickReview(slug)) return null;
  const articles = new Map(blocks.flatMap(b => b.articles).map(a => [a.no, a]));
  if (GENERAL.some(b => b.articleRefs.some(no => !articles.has(no)))) return null;
  return GENERAL.map((b, i) => ({ id: `quick-${i}`, type: b.type, title: b.title, body: b.body, rows: null, articles: b.articleRefs.map(no => articles.get(no)!) }));
}
