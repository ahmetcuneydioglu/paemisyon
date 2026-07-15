#!/usr/bin/env python3
"""MEB/ÖDSGM soru kitapçığı PDF'ini admin toplu içe aktarma CSV'sine çevirir.

Kullanım:
    python3 meb-kitapcik-to-csv.py <kitapcik.pdf> [cikti.csv]

Çıktı sütunları admin panel şablonuyla birebir (Doc 9 §4.4):
    soru | A | B | C | D | E | dogru | aciklama | zorluk

Notlar:
- Cevap anahtarı kitapçığın SON sayfalarında aranır ("CEVAP ANAHTARI" başlığı).
- Satır sonu tirelemesi onarılır ("sayıl-\nmamıştır" → "sayılmamıştır").
- Görsel/tablo içerebilecek sorular uyarı olarak listelenir (metin çıkarımı
  görseli taşıyamaz) — panelde editoryal kontrolde ayıklanmalı.
- ⚠️ TELİF: MEB kitapçıkları "her hakkı saklıdır" uyarısı taşır. Bu araç
  teknik dönüştürücüdür; içeriğin yayım hakkı ayrıca temin edilmelidir.
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf gerekli: pip3 install --user pypdf")

OPTION_RE = re.compile(r"^([A-E])\)\s*")
QNUM_RE = re.compile(r"^(\d{1,3})\.\s+")
KEY_LINE_RE = re.compile(r"^(\d{1,3})\.\s*([A-E])\s*$")
# Sayfa üstbilgileri: kitapçık adı, sayfa no, kurum adı.
HEADER_PATTERNS = [
    re.compile(r"^ÖLÇME, DEĞERLENDİRME VE SINAV HİZMETLERİ GENEL MÜDÜRLÜĞÜ$"),
    re.compile(r"^\d{1,3}$"),  # tek başına sayfa numarası
]


def dehyphenate(text: str) -> str:
    """Satır sonu tirelerini onarır, kalan satır sonlarını boşluğa çevirir."""
    text = re.sub(r"-\s*\n\s*", "", text)
    text = re.sub(r"\s*\n\s*", " ", text)
    return re.sub(r"\s{2,}", " ", text).strip()


def extract_lines(reader: PdfReader, booklet_header: str) -> tuple[list[str], dict[int, str]]:
    """Soru sayfalarının satırlarını ve cevap anahtarını döndürür."""
    question_lines: list[str] = []
    answer_key: dict[int, str] = {}
    in_key = False

    for page in reader.pages:
        text = page.extract_text() or ""
        if "CEVAP ANAHTARI" in text:
            in_key = True
        # Soru sayfaları ÖDSGM üstbilgisi taşır; kapak/talimat sayfalarındaki
        # numaralı maddeler ("1. Adaylar...") soru sanılmasın diye atlanır.
        if not in_key and "ÖLÇME, DEĞERLENDİRME VE SINAV HİZMETLERİ" not in text:
            continue
        for raw in text.splitlines():
            line = raw.strip()
            if not line:
                continue
            if in_key:
                m = KEY_LINE_RE.match(line)
                if m:
                    answer_key[int(m.group(1))] = m.group(2)
                continue
            if line == booklet_header or any(p.match(line) for p in HEADER_PATTERNS):
                continue
            # Kitapçık sonu ibaresi son şıkka yapışmasın.
            line = re.sub(r"\s*TEST BİTTİ\..*$", "", line)
            if line:
                question_lines.append(line)

    return question_lines, answer_key


def parse_questions(lines: list[str]) -> list[dict]:
    """Satırları soru bloklarına böler: numara → gövde → A-E şıkları."""
    questions: list[dict] = []
    current: dict | None = None
    part: str | None = None  # 'stem' | 'A'..'E'

    def flush() -> None:
        if current is not None:
            questions.append(current)

    expected_no = 1
    for line in lines:
        qm = QNUM_RE.match(line)
        # Yeni soru: beklenen numarayla başlar (gövdedeki "5. madde" gibi
        # metinleri soru başı sanmamak için sıra denetimi şart).
        if qm and int(qm.group(1)) == expected_no:
            flush()
            current = {"no": expected_no, "stem": QNUM_RE.sub("", line), "options": {}}
            part = "stem"
            expected_no += 1
            continue
        if current is None:
            continue
        om = OPTION_RE.match(line)
        if om:
            part = om.group(1)
            current["options"][part] = OPTION_RE.sub("", line)
            continue
        # Devam satırı: bulunduğu bölüme eklenir.
        if part == "stem":
            current["stem"] += "\n" + line
        elif part is not None:
            current["options"][part] += "\n" + line
    flush()
    return questions


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    pdf_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else pdf_path.with_suffix(".csv")

    reader = PdfReader(str(pdf_path))
    first = (reader.pages[0].extract_text() or "").splitlines()
    booklet_header = first[0].strip() if first else ""

    lines, answer_key = extract_lines(reader, booklet_header)
    questions = parse_questions(lines)

    warnings: list[str] = []
    rows: list[list[str]] = []
    for q in questions:
        stem = dehyphenate(q["stem"])
        opts = {k: dehyphenate(v) for k, v in q["options"].items()}
        correct = answer_key.get(q["no"], "")
        if not correct:
            warnings.append(f"Soru {q['no']}: cevap anahtarında yok")
        missing = [l for l in "ABCD" if l not in opts]
        if missing:
            warnings.append(f"Soru {q['no']}: eksik şık {missing} — görsel/tablo olabilir, elle kontrol et")
        if re.search(r"yukarıdaki|aşağıdaki (tablo|şekil|görsel|grafik)", stem, re.IGNORECASE):
            warnings.append(f"Soru {q['no']}: görsel/tablo referansı içeriyor olabilir")
        rows.append([
            stem,
            opts.get("A", ""), opts.get("B", ""), opts.get("C", ""),
            opts.get("D", ""), opts.get("E", ""),
            correct,
            "",       # aciklama: MEB metni kopyalanmaz — editoryal yazılır
            "orta",   # zorluk: varsayılan; panelde düzenlenebilir
        ])

    with out_path.open("w", newline="", encoding="utf-8-sig") as f:  # BOM: TR Excel uyumu
        w = csv.writer(f)
        w.writerow(["soru", "A", "B", "C", "D", "E", "dogru", "aciklama", "zorluk"])
        w.writerows(rows)

    print(f"Soru: {len(rows)} | Cevap anahtarı: {len(answer_key)} | Çıktı: {out_path}")
    if warnings:
        print(f"\nUyarılar ({len(warnings)}):")
        for msg in warnings:
            print(" -", msg)


if __name__ == "__main__":
    main()
