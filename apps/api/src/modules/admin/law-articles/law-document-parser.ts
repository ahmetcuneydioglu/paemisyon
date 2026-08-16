import { canonicalArticleNo } from './law-text-parser';

/**
 * Belge-farkındalıklı kanun ayrıştırıcı (Doc 29 §11): düz madde listesine ek
 * olarak Kısım/Bölüm hiyerarşisini ve madde kenar başlıklarını da yakalar.
 * Panel içe aktarımı ve scripts/mevzuat-import.ts aynı çekirdeği kullanır —
 * hangi yoldan yüklenirse yüklensin çıktı kalitesi aynıdır.
 *
 * parseLawText'ten farkı: o yalnız {articleNo, text} verir (geri uyum için
 * duruyor); bu, okuyucunun içindekiler ve başlık ihtiyacını da karşılar.
 */

// "BİRİNCİ KISIM" / "ON YEDİNCİ BÖLÜM" — tamamı büyük harf, 1-3 kelime + tür.
const SECTION_RE = /^\s*((?:[A-ZÇĞİÖŞÜ]+\s+){1,3})(KISIM|BÖLÜM)\s*$/;
// Madde başlığı satırı (law-text-parser ile aynı aile).
const ARTICLE_RE =
  /^\s*(ek\s+madde|geçici\s+madde|madde)\s+(\d+(?:\/[0-9A-Za-zÇĞİÖŞÜçğıöşü]+)?)\s*(?:[–—\-.]\s*)?(.*)$/;

export interface ParsedSection {
  kind: 'KISIM' | 'BÖLÜM';
  /** "BİRİNCİ BÖLÜM — Amaç, Kapsam ve Tanımlar" */
  heading: string;
  order: number;
  /** BÖLÜM'ün bağlı olduğu KISIM sırası (yoksa null). */
  parentOrder: number | null;
}

export interface ParsedDocArticle {
  articleNo: string;
  /** Kenar başlığı: "Yakalama ve yakalanan kişi hakkında yapılacak işlemler". */
  title: string | null;
  text: string;
  sectionOrder: number | null;
}

export interface ParsedDocument {
  sections: ParsedSection[];
  articles: ParsedDocArticle[];
}

/** TR-duyarlı gevşek normalize (kimlik karşılaştırması için). */
function looseNorm(s: string): string {
  const map: Record<string, string> = {
    ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u',
  };
  return s
    .toLocaleLowerCase('tr-TR')
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('');
}

/**
 * PDF ↔ hedef mevzuat kimlik doğrulaması (Doc 29 güven ilkesi): yanlış
 * dosyayı yanlış kanunun üzerine yazmayı içe aktarmadan ÖNCE engeller.
 * mevzuat.gov.tr konsolide metinleri başta "Kanun Numarası : NNNN" taşır;
 * numarasız mevzuatta (yönetmelik) ad-parça örtüşmesine düşülür.
 */
export function verifyLawIdentity(
  raw: string,
  target: { number?: string | null; name: string },
): { ok: boolean; reason?: string } {
  const head = looseNorm(raw.slice(0, 4000));
  const numMatch = /kanun\s+numaras[ıi]\s*:?\s*(\d{3,5})/i.exec(head);

  if (target.number) {
    if (numMatch) {
      return numMatch[1] === target.number
        ? { ok: true }
        : {
            ok: false,
            reason: `PDF "Kanun Numarası ${numMatch[1]}" içeriyor, hedef ${target.number}.`,
          };
    }
    // Numara satırı yoksa ada düş (eski tertip PDF'leri farklı başlayabilir).
  }
  // Ad-parça örtüşmesi: anlamlı kelimelerin en az yarısı (≥2) başta geçmeli.
  const stop = new Set(['sayili', 'kanun', 'kanunu', 'hakkinda', 'dair', 'bazi', 've', 'ile']);
  const tokens = looseNorm(target.name)
    .replace(/[()]/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !stop.has(t) && !/^\d+$/.test(t));
  if (tokens.length === 0) return { ok: true };
  const hits = tokens.filter((t) => head.includes(t)).length;
  const needed = Math.max(2, Math.ceil(tokens.length / 2));
  return hits >= Math.min(needed, tokens.length)
    ? { ok: true }
    : {
        ok: false,
        reason: `PDF başlangıcı "${target.name}" ile örtüşmüyor (${hits}/${tokens.length} kelime).`,
      };
}

export function parseDocument(raw: string): ParsedDocument {
  const lines = raw.split('\n');
  const sections: ParsedSection[] = [];
  const articles: { no: string; title: string | null; lines: string[]; sectionOrder: number | null }[] = [];
  let current: (typeof articles)[number] | null = null;
  let currentKisim: number | null = null;
  let currentSection: number | null = null;
  let pendingSection = false;
  let prevLine = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      prevLine = '';
      continue;
    }

    // Bölüm başlığının İKİNCİ satırı: "Amaç, Kapsam ve Tanımlar".
    if (pendingSection) {
      const s = sections[sections.length - 1];
      if (line.length <= 90 && !ARTICLE_RE.test(line.toLocaleLowerCase('tr'))) {
        s.heading = `${s.heading} — ${line}`;
        pendingSection = false;
        prevLine = '';
        continue;
      }
      pendingSection = false;
    }

    const sm = SECTION_RE.exec(line);
    if (sm) {
      const kind = sm[2] as 'KISIM' | 'BÖLÜM';
      const order = sections.length;
      if (kind === 'KISIM') currentKisim = order;
      sections.push({
        kind,
        heading: `${sm[1].trim()} ${kind}`,
        order,
        parentOrder: kind === 'BÖLÜM' ? currentKisim : null,
      });
      currentSection = order;
      pendingSection = true;
      prevLine = '';
      continue;
    }

    const am = ARTICLE_RE.exec(line.toLocaleLowerCase('tr'));
    if (am) {
      const label = am[1].replace(/\s+/, ' ');
      const rawNo =
        label.startsWith('ek') ? `ek ${am[2]}` :
        label.startsWith('geçici') ? `geçici ${am[2]}` : am[2];
      const no = canonicalArticleNo(rawNo);
      if (no) {
        // Kenar başlığı: hemen önceki kısa, noktasız satır (resmî düzen).
        let title: string | null = null;
        if (
          current &&
          prevLine.length > 0 &&
          prevLine.length <= 90 &&
          !/[.:;]$/.test(prevLine) &&
          !SECTION_RE.test(prevLine)
        ) {
          // PDF dipnot numaraları başlığa yapışır ("Kasten yaralama3637");
          // Anayasa kenar başlıklarındaki "II." roman ön eki de düşer.
          title = prevLine
            .replace(/\d+$/, '')
            .replace(/^[IVXLC]+\.\s*/, '')
            .trim();
          // Dipnot rakamı atılınca cümle olduğu ortaya çıkan satır başlık
          // DEĞİL, önceki maddenin devam satırıdır.
          if (/[.:;,]$/.test(title) || title.length < 3) title = null;
          if (title != null) {
            const tail = current.lines[current.lines.length - 1];
            if (tail === prevLine) current.lines.pop();
          }
        }
        if (current) articles.push(current);
        // Başlık satırının madde metni kuyruğu ("Madde 90- (1) …" kalanı):
        // orijinal satırdan etiketi düşerek al (büyük/küçük harf korunur).
        const rest = am[3].length > 0 ? line.slice(line.length - am[3].length) : '';
        current = {
          no,
          title,
          lines: rest ? [rest] : [],
          sectionOrder: currentSection,
        };
        prevLine = '';
        continue;
      }
    }

    if (current) current.lines.push(line);
    prevLine = line;
  }
  if (current) articles.push(current);

  return {
    sections,
    articles: articles
      .map((a) => ({
        articleNo: a.no,
        title: a.title,
        text: a.lines.join('\n').trim(),
        sectionOrder: a.sectionOrder,
      }))
      .filter((a) => a.text.length > 0),
  };
}
