"""Sınav Kalitesi Gözcüsü için KÖR soru dosyası üretir (09-sinav-kalitesi-gozcusu.md).

aday/<parti>.json'dan cevap ve cevabı ele verebilecek alanlar çıkarılır: dogru,
aciklama, dayanak, articleNo, zorluk, tur. Kalan: id, kok, siklar. Gözcü önce bu
dosyayla kör çözer, ancak sonra aday dosyasındaki anahtarı açar.

    python3 kor-dosya.py 3713-p1 6222-p1 …
"""
import json
import sys
from pathlib import Path

KOK = Path(__file__).parent
(KOK / 'kor').mkdir(exist_ok=True)
for parti in sys.argv[1:]:
    aday = json.loads((KOK / 'aday' / f'{parti}.json').read_text())
    kor = [{'id': q['id'], 'kok': q['kok'], 'siklar': q['siklar']} for q in aday]
    (KOK / 'kor' / f'{parti}.json').write_text(json.dumps(kor, ensure_ascii=False, indent=2) + '\n')
    print(parti, len(kor), 'soru → kor/')
