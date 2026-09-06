#!/usr/bin/env python3
"""
DENEME KİTAPÇIĞI PDF ÜRETİCİSİ.

Gerçek PAEM kitapçığının düzenini birebir örnek alır (2025 PAEM İlk Derece
Amirlik sınavı incelendi): iki sütun, koyu soru kökü, A)–E) girintili şıklar,
sayfa üstünde küçük sınav adı + büyük kitapçık türü harfi, altta sayfa numarası.
Üstüne bir kapak, cevap anahtarı ve tanıtım sayfası eklenir.

Kullanım:
    npx tsx scripts/deneme-pdf-veri.ts <examId> > /tmp/deneme.json
    python3 scripts/deneme-pdf.py /tmp/deneme.json cikti.pdf [--kitapcik A]

Kopya koruması ayrı adımdır (scripts/pdf-kilitle.py) — üretim ve koruma
birbirine karışmasın, kilitsiz sürüm arşivde kalsın.
"""
import json
import os
import sys
from reportlab.lib.colors import Color, HexColor, white, black
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import Paragraph

# ── Marka ────────────────────────────────────────────────────────────────
LACIVERT = HexColor("#173F72")   # logodan alındı
SARI = HexColor("#FFCB08")
GRI = HexColor("#8A94A6")
ACIK_GRI = HexColor("#E6E9EF")
SITE = "paemisyon.com"

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # apps/api
GORSEL = os.path.join(KOK, "..", "web", "public", "img")
FONT_DIZIN = "/System/Library/Fonts/Supplemental"

# Sayfa ölçüleri — gerçek kitapçıkla aynı sıkılıkta.
SAYFA_G, SAYFA_Y = A4
KENAR_SOL = 18 * mm
KENAR_SAG = 18 * mm
UST = 20 * mm
ALT = 16 * mm
SUTUN_ARA = 8 * mm
SUTUN_G = (SAYFA_G - KENAR_SOL - KENAR_SAG - SUTUN_ARA) / 2


def fontlari_kur():
    """Arial: gerçek kitapçığın yazı tipi ve Türkçe karakterleri tam."""
    pdfmetrics.registerFont(TTFont("Ar", f"{FONT_DIZIN}/Arial.ttf"))
    pdfmetrics.registerFont(TTFont("ArB", f"{FONT_DIZIN}/Arial Bold.ttf"))
    pdfmetrics.registerFont(TTFont("ArI", f"{FONT_DIZIN}/Arial Italic.ttf"))
    pdfmetrics.registerFontFamily("Ar", normal="Ar", bold="ArB", italic="ArI")


# Asılı girinti: numara dışarıda kalır, kökün devam satırları hizalanır —
# gerçek kitapçıkta da böyle ve iki haneli numaralarda kayma olmaz.
KOK_STIL = ParagraphStyle(
    "kok", fontName="ArB", fontSize=8.6, leading=10.6, alignment=4, spaceAfter=0,
    leftIndent=6.5 * mm, firstLineIndent=-6.5 * mm,
)
SIK_STIL = ParagraphStyle(
    "sik", fontName="Ar", fontSize=8.4, leading=10.2, alignment=4,
    leftIndent=6.5 * mm, firstLineIndent=-6.5 * mm,
)


def kacis(s: str) -> str:
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def soru_blogu(q):
    """Bir sorunun (kök + şıklar) akış parçaları ve toplam yüksekliği."""
    parcalar = [Paragraph(f"<b>{q['order']}.</b>&nbsp;&nbsp;{kacis(q['stem'])}", KOK_STIL)]
    for o in q["options"]:
        parcalar.append(Paragraph(f"{kacis(o['label'])})&nbsp;&nbsp;{kacis(o['text'])}", SIK_STIL))
    return parcalar


def blok_yuksekligi(parcalar, genislik):
    y = 0.0
    for i, p in enumerate(parcalar):
        _, h = p.wrap(genislik, 10_000)
        y += h + (1.6 * mm if i == 0 else 0.9 * mm)
    return y


# ── Kapak ────────────────────────────────────────────────────────────────
ACIKLAMALAR = [
    "Bu kitapçıkta <b>{soru} soru</b> vardır. Sınav süresi <b>{sure} dakikadır</b>.",
    "Her sorunun beş seçeneği vardır; yalnızca <b>bir</b> seçenek doğrudur.",
    "Değerlendirmede <b>dört yanlış bir doğruyu götürür</b>. Net = Doğru − (Yanlış / 4).",
    "Cevaplarınızı, kitapçığın sonundaki cevap kâğıdına ya da ayrı bir kâğıda "
    "soru numarasıyla eşleştirerek işaretleyiniz.",
    "Sınav süresince kaynak, hesap makinesi ve iletişim aracı kullanmayınız; "
    "gerçek sınav koşullarını birebir uygulamanız denemenin ölçme değerini artırır.",
    "Süre bitiminde cevaplarınızı kitapçık sonundaki <b>cevap anahtarıyla</b> "
    "karşılaştırınız; ayrıntılı çözümler ve konu bazlı analiz için denemeyi "
    "<b>{site}</b> üzerinden çevrim içi çözebilirsiniz.",
]


def qr_gorseli(veri: str, yol: str):
    import qrcode
    img = qrcode.QRCode(border=1, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
    img.add_data(veri)
    img.make(fit=True)
    img.make_image(fill_color="#173F72", back_color="white").save(yol)
    return yol


def kapak(c, d, kitapcik):
    g, y = SAYFA_G, SAYFA_Y

    # Üst lacivert şerit + logo
    c.setFillColor(LACIVERT)
    c.rect(0, y - 32 * mm, g, 32 * mm, stroke=0, fill=1)
    # Logo lacivert harflidir; koyu şeritte kaybolur — beyaz levha üstüne basılır.
    logo = os.path.join(GORSEL, "logo2.png")
    c.setFillColor(white)
    c.roundRect(KENAR_SOL, y - 25.5 * mm, 58 * mm, 17 * mm, 2.5 * mm, stroke=0, fill=1)
    if os.path.exists(logo):
        c.drawImage(logo, KENAR_SOL + 5 * mm, y - 23 * mm, width=48 * mm, height=14.1 * mm,
                    mask="auto")
    c.setFont("Ar", 8.5)
    c.setFillColor(Color(1, 1, 1, 0.75))
    c.drawRightString(g - KENAR_SAG, y - 15 * mm, "Polis Amirleri Eğitimi Merkezi sınavına hazırlık")
    c.drawRightString(g - KENAR_SAG, y - 20 * mm, SITE)

    # Kitapçık türü kutusu
    kb = 22 * mm
    c.setFillColor(white)
    c.setStrokeColor(LACIVERT)
    c.setLineWidth(1.2)
    c.rect(g - KENAR_SAG - kb, y - 62 * mm, kb, kb, stroke=1, fill=1)
    c.setFillColor(LACIVERT)
    c.setFont("Ar", 6.6)
    c.drawCentredString(g - KENAR_SAG - kb / 2, y - 46.5 * mm, "KİTAPÇIK TÜRÜ")
    c.setFont("ArB", 20)
    c.drawCentredString(g - KENAR_SAG - kb / 2, y - 57 * mm, kitapcik)

    # Başlık bloğu
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 21)
    c.drawString(KENAR_SOL, y - 48 * mm, d["title"].upper())
    c.setFillColor(black)
    c.setFont("Ar", 10.5)
    c.drawString(KENAR_SOL, y - 55.5 * mm, "İLK DERECE AMİRLİK EĞİTİMİ YAZILI SINAVI DENEMESİ")
    c.setFillColor(SARI)
    c.rect(KENAR_SOL, y - 60 * mm, 34 * mm, 1.6 * mm, stroke=0, fill=1)

    # Künye kutuları
    ust = y - 72 * mm
    kutu_y = 15 * mm
    kutular = [("SORU SAYISI", str(d["questionCount"])),
               ("SÜRE", f"{d['durationMinutes']} dakika"),
               ("PUANLAMA", "4 yanlış = 1 doğru")]
    kg = (g - KENAR_SOL - KENAR_SAG - 2 * 4 * mm) / 3
    for i, (b, v) in enumerate(kutular):
        x = KENAR_SOL + i * (kg + 4 * mm)
        c.setFillColor(HexColor("#F4F6FA"))
        c.setStrokeColor(ACIK_GRI)
        c.setLineWidth(0.8)
        c.rect(x, ust - kutu_y, kg, kutu_y, stroke=1, fill=1)
        c.setFillColor(GRI)
        c.setFont("Ar", 6.8)
        c.drawString(x + 4 * mm, ust - 5.6 * mm, b)
        c.setFillColor(LACIVERT)
        c.setFont("ArB", 11)
        c.drawString(x + 4 * mm, ust - 11.8 * mm, v)

    # Aday alanı
    ay = ust - kutu_y - 12 * mm
    c.setFillColor(black)
    c.setFont("ArB", 8.6)
    c.drawString(KENAR_SOL, ay, "ADAYIN")
    c.setFont("Ar", 8.6)
    satirlar = [("ADI SOYADI", 96 * mm), ("T.C. KİMLİK NO", 52 * mm)]
    yy = ay - 8 * mm
    for etiket, uzunluk in satirlar:
        c.setFillColor(GRI)
        c.drawString(KENAR_SOL, yy, f"{etiket}")
        c.setStrokeColor(ACIK_GRI)
        c.setLineWidth(0.8)
        c.line(KENAR_SOL + 34 * mm, yy - 1.2 * mm, KENAR_SOL + 34 * mm + uzunluk, yy - 1.2 * mm)
        yy -= 8.5 * mm

    # Açıklamalar kutusu
    ky = yy - 4 * mm
    metin = [a.format(soru=d["questionCount"], sure=d["durationMinutes"], site=SITE)
             for a in ACIKLAMALAR]
    stil = ParagraphStyle("ack", fontName="Ar", fontSize=8.4, leading=11.6, alignment=4,
                          leftIndent=6 * mm, firstLineIndent=-6 * mm)
    paras = [Paragraph(f"<b>{i+1}.</b>&nbsp;&nbsp;{t}", stil) for i, t in enumerate(metin)]
    ic_g = g - KENAR_SOL - KENAR_SAG - 12 * mm
    yuk = sum(p.wrap(ic_g, 10_000)[1] + 2.4 * mm for p in paras) + 14 * mm
    c.setFillColor(white)
    c.setStrokeColor(LACIVERT)
    c.setLineWidth(1)
    c.rect(KENAR_SOL, ky - yuk, g - KENAR_SOL - KENAR_SAG, yuk, stroke=1, fill=1)
    c.setFillColor(LACIVERT)
    c.rect(KENAR_SOL, ky - 8 * mm, g - KENAR_SOL - KENAR_SAG, 8 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("ArB", 8.4)
    c.drawString(KENAR_SOL + 6 * mm, ky - 5.6 * mm, "SINAVLA İLGİLİ AÇIKLAMALAR")
    yy = ky - 8 * mm - 5 * mm
    for p in paras:
        _, h = p.wrap(ic_g, 10_000)
        p.drawOn(c, KENAR_SOL + 6 * mm, yy - h)
        yy -= h + 2.4 * mm

    # Bölüm dağılımı — kapağın ortasındaki boşluğu dolduran ve gerçekten
    # bilgi veren tek şey: adayın hangi dersten kaç soru geleceğini bilmesi.
    dy = yy - 12 * mm
    c.setFillColor(black)
    c.setFont("ArB", 8.6)
    c.drawString(KENAR_SOL, dy, "SORU DAĞILIMI")
    dy -= 6 * mm
    dagilim = {}
    for q in d["questions"]:
        dagilim[q["course"]] = dagilim.get(q["course"], 0) + 1
    siralı = sorted(dagilim.items(), key=lambda kv: (-kv[1], kv[0]))
    kolon = (g - KENAR_SOL - KENAR_SAG) / 2
    for i, (ders, adet) in enumerate(siralı):
        x = KENAR_SOL + (i % 2) * kolon
        satir_y = dy - (i // 2) * 6.2 * mm
        c.setFillColor(black)
        c.setFont("Ar", 8.4)
        c.drawString(x, satir_y, ders)
        c.setFillColor(LACIVERT)
        c.setFont("ArB", 8.4)
        c.drawString(x + kolon - 16 * mm, satir_y, f"{adet} soru")
        c.setStrokeColor(HexColor("#EDF0F5"))
        c.setLineWidth(0.6)
        c.line(x, satir_y - 2 * mm, x + kolon - 6 * mm, satir_y - 2 * mm)
    dy -= ((len(siralı) + 1) // 2) * 6.2 * mm + 6 * mm

    # DİKKAT şeridi
    c.setFillColor(SARI)
    c.rect(KENAR_SOL, dy - 9 * mm, g - KENAR_SOL - KENAR_SAG, 9 * mm, stroke=0, fill=1)
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 8.2)
    c.drawString(KENAR_SOL + 5 * mm, dy - 5.8 * mm,
                 "DİKKAT: Süreyi tam tutunuz. Deneme, ancak gerçek sınav koşullarında "
                 "çözüldüğünde netiniz hakkında bilgi verir.")

    # Alt tanıtım şeridi
    sy = 30 * mm
    c.setFillColor(HexColor("#F4F6FA"))
    c.rect(0, 0, g, sy, stroke=0, fill=1)
    c.setFillColor(SARI)
    c.rect(0, sy - 1.6 * mm, g, 1.6 * mm, stroke=0, fill=1)
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 10.5)
    c.drawString(KENAR_SOL, sy - 10 * mm, "Aynı denemeyi çevrim içi çöz, netini anında gör")
    c.setFillColor(black)
    c.setFont("Ar", 8.2)
    c.drawString(KENAR_SOL, sy - 15.5 * mm, "Soru bazlı çözüm · konu bazlı kayıp analizi · sıralama")
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 9.5)
    c.drawString(KENAR_SOL, sy - 21.5 * mm, SITE)
    bx = g - KENAR_SAG - 26 * mm - 6 * mm - 62 * mm
    for i, (ad, gen) in enumerate([("appStore.png", 26 * mm), ("playStore.png", 30 * mm)]):
        yol = os.path.join(GORSEL, ad)
        if os.path.exists(yol):
            c.drawImage(yol, bx + i * 32 * mm, sy - 20 * mm,
                        width=gen, height=gen * 34 / (96 if i == 0 else 114), mask="auto")
    qr = qr_gorseli(f"https://{SITE}/denemeler", "/tmp/_qr.png")
    c.drawImage(qr, g - KENAR_SAG - 24 * mm, sy - 26 * mm, width=24 * mm, height=24 * mm)
    c.showPage()


# ── Soru sayfaları ───────────────────────────────────────────────────────
def sayfa_cercevesi(c, d, kitapcik, sayfa_no, sutun_ayraci=True):
    c.setFillColor(black)
    c.setFont("Ar", 7.4)
    c.drawString(KENAR_SOL, SAYFA_Y - 12 * mm, f"{d['title'].upper()} - {kitapcik}")
    c.setFont("ArB", 17)
    c.setFillColor(LACIVERT)
    c.drawRightString(SAYFA_G - KENAR_SAG, SAYFA_Y - 14 * mm, kitapcik)
    c.setStrokeColor(ACIK_GRI)
    c.setLineWidth(0.7)
    c.line(KENAR_SOL, SAYFA_Y - 15.5 * mm, SAYFA_G - KENAR_SAG, SAYFA_Y - 15.5 * mm)
    if sutun_ayraci:
        c.setStrokeColor(HexColor("#C9CFDA"))
        x = KENAR_SOL + SUTUN_G + SUTUN_ARA / 2
        c.line(x, ALT + 4 * mm, x, SAYFA_Y - UST + 2 * mm)
    c.setFillColor(black)
    c.setFont("Ar", 8)
    c.drawCentredString(SAYFA_G / 2, ALT - 4 * mm, str(sayfa_no))
    c.setFillColor(GRI)
    c.setFont("Ar", 6.4)
    c.drawRightString(SAYFA_G - KENAR_SAG, ALT - 4 * mm, SITE)


def sorular(c, d, kitapcik, ilk_sayfa):
    tepe = SAYFA_Y - UST
    dip = ALT + 6 * mm
    sayfa = ilk_sayfa
    sutun = 0
    y = tepe
    sayfa_cercevesi(c, d, kitapcik, sayfa)

    for q in d["questions"]:
        parcalar = soru_blogu(q)
        h = blok_yuksekligi(parcalar, SUTUN_G)
        if y - h < dip:
            sutun += 1
            if sutun > 1:
                c.showPage()
                sayfa += 1
                sayfa_cercevesi(c, d, kitapcik, sayfa)
                sutun = 0
            y = tepe
        x = KENAR_SOL + sutun * (SUTUN_G + SUTUN_ARA)
        for i, p in enumerate(parcalar):
            _, ph = p.wrap(SUTUN_G, 10_000)
            y -= ph + (1.6 * mm if i == 0 else 0.9 * mm)
            p.drawOn(c, x, y)
        y -= 5.5 * mm  # sorular arası nefes
    c.showPage()
    return sayfa + 1


# ── Cevap anahtarı ───────────────────────────────────────────────────────
def cevap_anahtari(c, d, kitapcik, sayfa_no):
    sayfa_cercevesi(c, d, kitapcik, sayfa_no, sutun_ayraci=False)
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 15)
    c.drawString(KENAR_SOL, SAYFA_Y - 28 * mm, "CEVAP ANAHTARI")
    c.setFillColor(black)
    c.setFont("Ar", 8.4)
    c.drawString(KENAR_SOL, SAYFA_Y - 34 * mm,
                 "Netini hesapla: Doğru − (Yanlış / 4).  Ayrıntılı çözümler ve konu analizi için "
                 f"{SITE} üzerinden çöz.")

    qs = d["questions"]
    sut = 5
    satir = (len(qs) + sut - 1) // sut
    hg = (SAYFA_G - KENAR_SOL - KENAR_SAG) / sut
    hy = 6.5 * mm
    y0 = SAYFA_Y - 42 * mm
    for i, q in enumerate(qs):
        s = i % satir
        k = i // satir
        x = KENAR_SOL + k * hg
        yy = y0 - s * hy
        if s % 2 == 0:
            c.setFillColor(HexColor("#F4F6FA"))
            c.rect(x, yy - 2.2 * mm, hg - 3 * mm, hy - 1 * mm, stroke=0, fill=1)
        c.setFillColor(GRI)
        c.setFont("Ar", 8)
        c.drawString(x + 2.5 * mm, yy, f"{q['order']}.")
        c.setFillColor(LACIVERT)
        c.setFont("ArB", 9)
        c.drawString(x + 12 * mm, yy, q["answer"])

    # Kendi netini hesapla — anahtarın altındaki boşluğu dolduran ve gerçekten
    # işe yarayan kısım: aday burada durup kendi tablosunu doldurur.
    ty = y0 - satir * hy - 9 * mm
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 11)
    c.drawString(KENAR_SOL, ty, "NETİNİ HESAPLA")
    ty -= 8 * mm
    alanlar = [("DOĞRU", 26 * mm), ("YANLIŞ", 26 * mm), ("BOŞ", 26 * mm), ("NET", 34 * mm)]
    x = KENAR_SOL
    for etiket, gen in alanlar:
        c.setFillColor(HexColor("#F4F6FA"))
        c.setStrokeColor(ACIK_GRI)
        c.setLineWidth(0.8)
        c.rect(x, ty - 13 * mm, gen, 13 * mm, stroke=1, fill=1)
        c.setFillColor(GRI)
        c.setFont("Ar", 6.6)
        c.drawString(x + 3 * mm, ty - 4.6 * mm, etiket)
        x += gen + 4 * mm
    c.setFillColor(black)
    c.setFont("Ar", 8.4)
    c.drawString(x + 2 * mm, ty - 8 * mm, "Net = Doğru − (Yanlış / 4)")

    # Ders bazlı kendi kendini değerlendirme çizelgesi.
    ty -= 20 * mm
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 11)
    c.drawString(KENAR_SOL, ty, "DERS BAZLI DÖKÜM")
    c.setFillColor(GRI)
    c.setFont("Ar", 7.6)
    c.drawString(KENAR_SOL + 42 * mm, ty,
                 "— hangi dersten kaç net yaptığını yaz; çalışma sıranı bu tablo belirler")
    ty -= 7 * mm
    dagilim = {}
    for q in qs:
        dagilim[q["course"]] = dagilim.get(q["course"], 0) + 1
    genislik = SAYFA_G - KENAR_SOL - KENAR_SAG
    c.setFillColor(HexColor("#F4F6FA"))
    c.rect(KENAR_SOL, ty - 5.6 * mm, genislik, 5.6 * mm, stroke=0, fill=1)
    c.setFillColor(GRI)
    c.setFont("ArB", 7)
    for etiket, dx in [("DERS", 3), ("SORU", 96), ("DOĞRU", 116), ("YANLIŞ", 138), ("NET", 162)]:
        c.drawString(KENAR_SOL + dx * mm, ty - 3.9 * mm, etiket)
    ty -= 5.6 * mm
    for ders, adet in sorted(dagilim.items(), key=lambda kv: (-kv[1], kv[0])):
        c.setFillColor(black)
        c.setFont("Ar", 8.2)
        c.drawString(KENAR_SOL + 3 * mm, ty - 5 * mm, ders)
        c.setFont("ArB", 8.2)
        c.setFillColor(LACIVERT)
        c.drawString(KENAR_SOL + 96 * mm, ty - 5 * mm, str(adet))
        c.setStrokeColor(HexColor("#EDF0F5"))
        c.setLineWidth(0.6)
        c.line(KENAR_SOL, ty - 6.2 * mm, KENAR_SOL + genislik, ty - 6.2 * mm)
        ty -= 6.2 * mm

    c.setFillColor(GRI)
    c.setFont("ArI", 8)
    c.drawString(KENAR_SOL, ty - 6 * mm,
                 f"Bu dökümü elle tutmak zorunda değilsin: aynı denemeyi {SITE} üzerinden "
                 "çözersen konu bazlı kaybını otomatik çıkarır.")
    c.showPage()
    return sayfa_no + 1


# ── Tanıtım sayfası ──────────────────────────────────────────────────────
OZELLIKLER = [
    ("Soru bazlı çözüm", "Her yanlışının altında editör açıklaması ve dayandığı kanun maddesi."),
    ("Konu bazlı kayıp analizi", "Netini nerede kaybettiğini konu konu görürsün — çalışma sıranı o belirler."),
    ("Canlı deneme ve sıralama", "Randevulu denemelerde binlerce adayla aynı anda yarış, sıranı gör."),
    ("Yanlış tekrar kuyruğu", "Yanlışların otomatik birikir; unutmadan doğru zamanda önüne gelir."),
    ("Çıkmış sorular", "Gerçek sınavlardan derlenmiş, kaynağı kayıtlı soru bankası."),
    ("Kişisel koç", "Bugün ne çalışacağını sana söyler; hedefini ve serini takip eder."),
]


def tanitim(c):
    g, y = SAYFA_G, SAYFA_Y
    c.setFillColor(LACIVERT)
    c.rect(0, 0, g, y, stroke=0, fill=1)

    logo = os.path.join(GORSEL, "logo2.png")
    # Koyu zeminde lacivert logo görünmez: beyaz bir levha üstüne bas.
    c.setFillColor(white)
    c.roundRect(KENAR_SOL, y - 36 * mm, 60 * mm, 20 * mm, 3 * mm, stroke=0, fill=1)
    if os.path.exists(logo):
        c.drawImage(logo, KENAR_SOL + 6 * mm, y - 32 * mm, width=48 * mm, height=14.1 * mm,
                    mask="auto")

    c.setFillColor(white)
    c.setFont("ArB", 25)
    c.drawString(KENAR_SOL, y - 55 * mm, "Denemeyi çözdün.")
    c.setFillColor(SARI)
    c.drawString(KENAR_SOL, y - 68 * mm, "Şimdi netini yükselt.")
    c.setFillColor(Color(1, 1, 1, 0.82))
    c.setFont("Ar", 10.5)
    stil = ParagraphStyle("t", fontName="Ar", fontSize=10.5, leading=15,
                          textColor=Color(1, 1, 1, 0.82))
    p = Paragraph(
        "Bu kitapçıktaki soruların tamamı Paemisyon soru bankasından derlendi. "
        "Aynı denemeyi uygulamada çözersen netini anında görür, yanlışlarının "
        "çözümüne dokunur ve konu bazlı kaybını takip edersin.", stil)
    _, h = p.wrap(g - KENAR_SOL - KENAR_SAG - 40 * mm, 10_000)
    p.drawOn(c, KENAR_SOL, y - 78 * mm - h)

    yy = y - 100 * mm
    for ad, aciklama in OZELLIKLER:
        c.setFillColor(SARI)
        c.circle(KENAR_SOL + 1.6 * mm, yy + 1.4 * mm, 1.6 * mm, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("ArB", 9.6)
        c.drawString(KENAR_SOL + 7 * mm, yy, ad)
        c.setFillColor(Color(1, 1, 1, 0.7))
        c.setFont("Ar", 8.8)
        c.drawString(KENAR_SOL + 7 * mm, yy - 5 * mm, aciklama)
        yy -= 14 * mm

    # Üç adım şeridi — özellik listesiyle alt şerit arasındaki boşluğu dolduran
    # ve okuru eyleme bağlayan kısım.
    ay = 70 * mm
    c.setFillColor(Color(1, 1, 1, 0.10))
    c.roundRect(KENAR_SOL, ay - 4 * mm, g - KENAR_SOL - KENAR_SAG, 30 * mm, 3 * mm,
                stroke=0, fill=1)
    c.setFillColor(Color(1, 1, 1, 0.55))
    c.setFont("ArB", 7.6)
    c.drawString(KENAR_SOL + 7 * mm, ay + 20 * mm, "ÜÇ ADIMDA BAŞLA")
    adimlar = [
        # Metinler kısa: uzun açıklama yan sütuna taşıyordu.
        ("1", "Hesap aç", "Google/Apple ile 30 saniye."),
        ("2", "Denemeni çöz", "Aynı sorular, süreli ve sıralı."),
        ("3", "Netini yükselt", "Koç ne çalışacağını söyler."),
    ]
    kg = (g - KENAR_SOL - KENAR_SAG - 14 * mm) / 3
    for i, (no, bas, alt) in enumerate(adimlar):
        x = KENAR_SOL + 7 * mm + i * kg
        c.setFillColor(SARI)
        c.circle(x + 2.4 * mm, ay + 12.4 * mm, 2.9 * mm, stroke=0, fill=1)
        c.setFillColor(LACIVERT)
        c.setFont("ArB", 8)
        c.drawCentredString(x + 2.4 * mm, ay + 11.2 * mm, no)
        c.setFillColor(white)
        c.setFont("ArB", 9.4)
        c.drawString(x + 7.5 * mm, ay + 11.2 * mm, bas)
        c.setFillColor(Color(1, 1, 1, 0.68))
        c.setFont("Ar", 8)
        c.drawString(x + 7.5 * mm, ay + 5.6 * mm, alt)

    # Alt eylem şeridi
    c.setFillColor(SARI)
    c.rect(0, 0, g, 40 * mm, stroke=0, fill=1)
    c.setFillColor(LACIVERT)
    c.setFont("ArB", 15)
    c.drawString(KENAR_SOL, 26 * mm, f"{SITE} · ücretsiz başla")
    c.setFont("Ar", 9)
    c.drawString(KENAR_SOL, 19 * mm, "Web'de hesap aç, uygulamada aynı hesapla devam et.")
    for i, (ad, gen) in enumerate([("appStore.png", 26 * mm), ("playStore.png", 30 * mm)]):
        yol = os.path.join(GORSEL, ad)
        if os.path.exists(yol):
            c.drawImage(yol, KENAR_SOL + i * 34 * mm, 7 * mm,
                        width=gen, height=gen * 34 / (96 if i == 0 else 114), mask="auto")
    qr = qr_gorseli(f"https://{SITE}", "/tmp/_qr2.png")
    c.drawImage(qr, g - KENAR_SAG - 28 * mm, 6 * mm, width=28 * mm, height=28 * mm)
    c.showPage()


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return
    veri = json.load(open(sys.argv[1], encoding="utf-8"))
    cikti = sys.argv[2]
    kitapcik = sys.argv[sys.argv.index("--kitapcik") + 1] if "--kitapcik" in sys.argv else "A"

    fontlari_kur()
    c = pdfcanvas.Canvas(cikti, pagesize=A4)
    c.setTitle(veri["title"])
    c.setAuthor("Paemisyon")
    c.setSubject("PAEM deneme sınavı kitapçığı")
    c.setCreator(f"Paemisyon · {SITE}")

    kapak(c, veri, kitapcik)
    son = sorular(c, veri, kitapcik, 1)
    cevap_anahtari(c, veri, kitapcik, son)
    tanitim(c)
    c.save()
    print(f"yazıldı: {cikti}")


if __name__ == "__main__":
    main()
