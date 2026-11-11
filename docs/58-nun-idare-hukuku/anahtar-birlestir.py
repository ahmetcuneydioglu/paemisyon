"""Doc 58 — üç bağımsız çözücünün cevaplarını OY BİRLİĞİYLE anahtara indirir.

Kural (kullanıcı kararı 12 Kas 2026; video 2–7 üyelere kapalı olduğu için):
  üç çözücü aynı cevap ve hiçbiri "dusuk" değil  → durum "kesin"
  aksi hâlde                                       → durum "belirsiz" (soru alınmaz)
Herhangi bir çözücünün "kusur" notu rapora taşınır (uygunluk gözcüsü görür).

    python3 anahtar-birlestir.py nun-034-133
Çıktı: cozum/<parti>-anahtar.json  [{no, cevap, durum, guven:[…], kusur:[…]}]
"""
import json
import sys
from pathlib import Path

KOK = Path(__file__).parent
parti = sys.argv[1]
aday = json.loads((KOK / 'aday' / f'{parti}.json').read_text())
coz = [
    {x['no']: x for x in json.loads((KOK / 'cozum' / f'{parti}-cozucu-{n}.json').read_text())}
    for n in (1, 2, 3)
]
out, say = [], {'kesin': 0, 'belirsiz': 0}
for q in aday:
    n = q['no']
    satir = [c.get(n) for c in coz]
    if any(s is None for s in satir):
        durum, cevap = 'belirsiz', None
    else:
        cevaplar = {s['cevap'] for s in satir}
        dusuk = any(s.get('guven') == 'dusuk' for s in satir)
        durum = 'kesin' if len(cevaplar) == 1 and not dusuk else 'belirsiz'
        cevap = satir[0]['cevap'] if len(cevaplar) == 1 else None
    say[durum] += 1
    out.append({
        'no': n, 'cevap': cevap, 'durum': durum,
        'cevaplar': [s['cevap'] if s else None for s in satir],
        'guven': [s.get('guven') if s else None for s in satir],
        'kusur': [s['kusur'] for s in satir if s and s.get('kusur')],
    })
(KOK / 'cozum' / f'{parti}-anahtar.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print(parti, say)
for o in out:
    if o['durum'] == 'belirsiz':
        print('  belirsiz', o['no'], o['cevaplar'], o['guven'])
