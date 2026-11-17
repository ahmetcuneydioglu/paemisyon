"""Doc 56 §12 — Ders kitabı PDF'ini kaynak pasajlarına böl (yalnız okur; pasaj listesi JSON üretir).

    pdftotext -bbox-layout kitap.pdf tum.html
    python3 -I apps/api/scripts/kaynak-pdf-bol.py tum.html pasajlar.json <ilk_pdf_sayfa> <son_pdf_sayfa>

Çıktı `kaynak-ekle.ts`'in `passages` alanıdır: [{no, heading, page, text}]. `no` = bölüm numarası + sıra
("2.1.8-01"), `page` = kitaptaki basılı sayfa. Yalnız ANA SÜTUN anlatısı alınır: yan sütun (görsel altı, biyografi,
bilgi notu), üst bilgi, alt zaman şeridi, sayfa numarası, harita etiketi, öğrenciye yöneltilen etkinlik cümlesi,
okuma metni ve ölçme sayfaları atılır; satır ve sayfa sonu hecelemesi birleştirilir.

Geometri KİTABA ÖZGÜDÜR (MEB Ortaöğretim T.C. İnkılap Tarihi ve Atatürkçülük 12, InDesign A4): tek sayfalarda ana
sütun solda (x≈56), çift sayfalarda sağda (x≈231), genişlik ≈308 pt. Başka kitapta ANA_X / ANA_GEN / Y_UST / Y_ALT
ve ATLA kalıbı yeniden ölçülür. Kaynak metin depoya KONMAZ (kitap metni dağıtılmaz); bu betik yalnız araçtır.
Bölmeden sonra: ara başlık listesine ve kısa/şüpheli satırlara göz at, pilot bölümün pasajlarını oku.
"""
import re, html, json, sys
SRC, OUT, P0, P1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ANA_X = (56.0, 231.0); TOL = 7.0; ANA_GEN = 316.0
Y_UST, Y_ALT = 40.0, 742.0
ATLA = re.compile(r'^(Sıra Sizde|Bilgi Notu|Biyografi|Hazırlık Çalışmaları|Görsel \d|Harita \d|Tablo \d|Grafik \d|Şema \d|Bilgi-Yorum|Okuma Metni|Kavramlar|Kazanımlar)', re.I)
BASLIK = re.compile(r'^(\d)\s*\.\s*(\d{1,2})\s*\.(?:\s*(\d{1,2})\s*\.?)?\s+(\S.*)$')
doc = open(SRC, encoding='utf8').read()
pages = re.findall(r'<page [^>]*>(.*?)</page>', doc, re.S)

def bloklar(pg):
    out = []
    for b in re.finditer(r'<block xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</block>', pg, re.S):
        x0, y0, x1, y1 = (float(b.group(i)) for i in range(1, 5))
        lines = []
        for ln in re.finditer(r'<line [^>]*>(.*?)</line>', b.group(5), re.S):
            lines.append(' '.join(html.unescape(w) for w in re.findall(r'<word[^>]*>(.*?)</word>', ln.group(1))))
        out.append((x0, y0, x1, y1, lines))
    return out

def birlestir(lines):
    t = ''
    for l in lines:
        if t.endswith('-') and l[:1].islower(): t = t[:-1] + l      # satır sonu heceleme
        else: t = (t + ' ' + l) if t else l
    return t.strip()

pasajlar, sayim = [], {}
bolum, bolum_ad, alt_baslik, tampon, tampon_sayfa = None, None, None, [], None
HEDEF, TAVAN = 1500, 2600

def bosalt():
    global tampon, tampon_sayfa
    metin = '\n'.join(tampon).strip()
    if bolum and len(metin) >= 120:
        sayim[bolum] = sayim.get(bolum, 0) + 1
        ad = bolum_ad if not alt_baslik else f'{bolum_ad} — {alt_baslik}'
        pasajlar.append({'no': f'{bolum}-{sayim[bolum]:02d}', 'heading': ad[:160], 'page': str(tampon_sayfa), 'text': metin})
    tampon, tampon_sayfa = [], None

atilan = []
for pi in range(P0 - 1, P1):
    bl = bloklar(pages[pi])
    kitap_sayfa = next((l[0] for (x0, y0, x1, y1, l) in bl if y0 > 790 and len(l) == 1 and l[0].isdigit()), str(pi - 1))
    tum = ' '.join(' '.join(l) for *_, l in bl)
    if re.search(r'Ölçme ve Değerlendirme|ÖLÇME VE DEĞERLENDİRME', tum) or not any(abs(x0 - a) < TOL and (x1 - x0) > 250 for (x0, y0, x1, y1, l) in bl for a in ANA_X):
        atilan.append(kitap_sayfa); continue
    ana = min(ANA_X, key=lambda a: -sum(1 for (x0, y0, x1, y1, l) in bl if abs(x0 - a) < TOL and (x1 - x0) > 250))
    # Gövde: ana sütuna hizalı bloklar. Numaralı başlık ortalanmış da olabilir ("2. 3. SEVR…"): hizadan bağımsız alınır.
    govde = sorted([(y0, birlestir(l), x1 - x0, len(l)) for (x0, y0, x1, y1, l) in bl
                    if Y_UST < y0 < Y_ALT and ((abs(x0 - ana) < TOL and (x1 - x0) <= ANA_GEN)
                                               or (len(l) <= 3 and BASLIK.match(birlestir(l)) and len(birlestir(l)) < 140))],
                   key=lambda t: t[0])
    for y0, t, gen, nl in govde:
        t = re.sub(r'\s*\((?:Görsel|Harita|Tablo|Grafik|Şema)\s[\d.]+[^)]*\)', '', t).strip()   # '(Görsel 2.10)' atıfları
        if not t or ATLA.match(t): continue
        m = BASLIK.match(t)
        if m and len(t) < 140 and nl <= 3:
            bosalt()
            bolum = '.'.join(x for x in m.group(1, 2, 3) if x)
            bolum_ad, alt_baslik = m.group(4).strip(), None
            continue
        # numarasız ara başlık: tek satır, kısa, nokta ile bitmiyor, liste maddesi değil
        if nl == 1 and len(t) < 70 and not re.search(r'[.:;,?!]$', t) and not re.match(r'^(\d+[.)]|[a-zçğıöşü]\)|[•\-–])', t) and t[:1].isupper():
            # Tek kelimelik ya da tümü büyük harfli kısa blok harita etiketidir (KARADENİZ, Zonguldak): atılır.
            if len(t.split()) < 2 or t.isupper() or t.startswith('Yıl:'): continue
            bosalt(); alt_baslik = t; continue
        # Öğrenciye yöneltilen etkinlik cümlesi ("…Araştırınız.", "…tartışınız.") anlatı değildir.
        if len(t) < 260 and re.search(r'(araştırınız|tartışınız|yorumlayınız|açıklayınız|karşılaştırınız|değerlendiriniz|yazınız|söyleyiniz)\.?$', t, re.I): continue
        if tampon and tampon[-1].endswith('-') and t[:1].islower():      # sayfa/blok arası heceleme
            tampon[-1] = tampon[-1][:-1] + t
        else:
            if sum(map(len, tampon)) + len(t) > TAVAN or (sum(map(len, tampon)) > HEDEF and re.search(r'[.!?…”"]$', tampon[-1])):
                bosalt()
            tampon.append(t)
        if tampon_sayfa is None: tampon_sayfa = kitap_sayfa
bosalt()
json.dump(pasajlar, open(OUT, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
n = [len(p['text']) for p in pasajlar]
print(f'{len(pasajlar)} pasaj · {sum(n)} karakter · en kısa {min(n)} en uzun {max(n)} ortalama {sum(n)//len(n)} · atılan sayfa: {",".join(atilan)}')
bol = {}
for p in pasajlar: bol.setdefault(p['no'].rsplit('-', 1)[0], []).append(p)
for k, v in bol.items(): print(f'  {k:8s} {len(v):2d} pasaj  s.{v[0]["page"]:>3}  {v[0]["heading"][:70]}')
