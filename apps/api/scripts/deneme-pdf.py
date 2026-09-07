#!/usr/bin/env python3
"""
DENEME KİTAPÇIĞI PDF ÜRETİCİSİ — sınav yayıncılığı kalitesinde.

TASARIM SİSTEMİ (tek kaynak: aşağıdaki DS sınıfı)

  Izgara      A4 · dış kenar 17 mm · üst 20 mm · alt 17 mm
              iki sütun, sütun arası 11 mm → sütun genişliği 82,5 mm
              82,5 mm'de 10 pt Arial ≈ 47 karakter/satır. İki sütunlu sınav
              kitapçığının doğal ölçüsü; tek sütun A4'te 90+ karaktere çıkar
              ve göz satır başını kaybeder.

  Tipografi   soru kökü      10 pt regular / 13,5 pt satır
              seçenekler      9,5 pt regular / 12,4 pt satır
              soru numarası  10 pt bold, asılı (metin bloğunun dışında)
              üst bilgi       8 pt · alt bilgi 7,5 pt
              Kalın yazı YALNIZ numarada ve başlıklarda. Kökün tamamını bold
              yapmak hiyerarşiyi yok eder ve sayfayı gürültüye çevirir.

  Boşluk      ölçek (mm): 1,5 · 3 · 4,5 · 6 · 9 · 12
              kök → ilk şık 3 · şıklar arası 1,8 · sorular arası 9

  Renk        Soru sayfaları: siyah metin, çok açık gri çizgi, ince lacivert
              vurgu. SARI YOK — iç sayfalar reklam broşürü değildir.
              Sarı yalnız kapakta ve arka kapakta.

  Kural       Soru bloğu ATOMİKTİR: kök ve şıkları asla ayrılmaz, sütun/sayfa
              sonunda bölünmez. Dul/yetim satır oluşmaz.

Kullanım:
    npx tsx scripts/deneme-pdf-veri.ts <examId> > /tmp/deneme.json
    python3 scripts/deneme-pdf.py /tmp/deneme.json cikti.pdf [--kitapcik A]
"""
import json
import os
import sys
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.platypus import Paragraph

KOK_DIZIN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GORSEL = os.path.join(KOK_DIZIN, "..", "web", "public", "img")
FONT_DIZIN = "/System/Library/Fonts/Supplemental"
SITE = "paemisyon.com"


class DS:
    """Tasarım sistemi — bütün ölçüler tek yerden."""

    SAYFA_G, SAYFA_Y = A4
    SOL = SAG = 17 * mm
    UST = 20 * mm
    ALT = 17 * mm
    SUTUN_ARA = 11 * mm
    SUTUN_G = (SAYFA_G - SOL - SAG - SUTUN_ARA) / 2

    BAS_ALAN = 10 * mm   # üst çizgi ile ilk satır arası
    DIP_ALAN = 8 * mm    # son satır ile alt bilgi arası

    KOK_PT, KOK_SATIR = 10, 13.5
    SIK_PT, SIK_SATIR = 9.5, 12.4
    BASLIK_PT = 8
    DIPNOT_PT = 7.5

    XS, SM, MD, LG, XL, XXL = 1.5 * mm, 3 * mm, 4.5 * mm, 6 * mm, 9 * mm, 12 * mm

    METIN = HexColor("#111418")
    IKINCIL = HexColor("#5B6572")
    CIZGI = HexColor("#DCE0E6")
    CIZGI_ACIK = HexColor("#EDEFF3")
    ZEMIN = HexColor("#F7F8FA")
    LACIVERT = HexColor("#173F72")
    SARI = HexColor("#FFCB08")

    ASKI = 7.5 * mm  # numara/şık harfi metin bloğunun dışında kalır


def fontlari_kur():
    pdfmetrics.registerFont(TTFont("Ar", f"{FONT_DIZIN}/Arial.ttf"))
    pdfmetrics.registerFont(TTFont("ArB", f"{FONT_DIZIN}/Arial Bold.ttf"))
    pdfmetrics.registerFont(TTFont("ArI", f"{FONT_DIZIN}/Arial Italic.ttf"))
    pdfmetrics.registerFontFamily("Ar", normal="Ar", bold="ArB", italic="ArI")


def stiller():
    return {
        # Sola dayalı (alignment=0), iki yana yaslı DEĞİL. 47 karakterlik
        # sütunda ReportLab hecelemediği için yaslama kelime aralarını açıyor
        # ve satırlarda "ırmak" oluşuyordu — kurumsal kitapçıkta en göze batan
        # kusur budur. Sağ kenarın tırtıklı olması buna yeğdir.
        "kok": ParagraphStyle(
            "kok", fontName="Ar", fontSize=DS.KOK_PT, leading=DS.KOK_SATIR,
            textColor=DS.METIN, alignment=0,
            leftIndent=DS.ASKI, firstLineIndent=-DS.ASKI,
        ),
        # Şıklar sola dayalı: kısa seçeneklerde iki yana yaslama kelimeleri
        # birbirinden koparıyor. Harf asılı, devam satırları hizalı.
        "sik": ParagraphStyle(
            "sik", fontName="Ar", fontSize=DS.SIK_PT, leading=DS.SIK_SATIR,
            textColor=DS.METIN, alignment=0,
            leftIndent=DS.ASKI + 6.5 * mm, firstLineIndent=-6.5 * mm,
        ),
    }


def kacis(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sinav_adi(baslik):
    """'Paem 10 Deneme Sınavı-1' → 'PAEM 10 DENEME SINAVI – 1'."""
    b = baslik.upper()
    for ayrac in ("SINAVI-", "SINAVI -", "SINAVI –"):
        if ayrac in b:
            return b.replace(ayrac, "SINAVI – ")
    return b


# ── Soru bloğu ───────────────────────────────────────────────────────────
def soru_parcalari(q, st):
    """(paragraf, altındaki boşluk) çiftleri. Blok atomiktir."""
    p = [(Paragraph(f'<font name="ArB">{q["order"]}.</font>&nbsp;&nbsp;{kacis(q["stem"])}',
                    st["kok"]), DS.SM)]
    for o in q["options"]:
        p.append((Paragraph(f'{kacis(o["label"])})&nbsp;&nbsp;{kacis(o["text"])}', st["sik"]),
                  1.8 * mm))
    return p


def blok_yuksekligi(parcalar, genislik):
    return sum(par.wrap(genislik, 10_000)[1] + bosluk for par, bosluk in parcalar)


# ── Sayfa çerçevesi ──────────────────────────────────────────────────────
def cerceve(c, ad, kitapcik, sayfa_no, sutun_cizgisi=True):
    ust_y = DS.SAYFA_Y - DS.UST
    c.setFont("Ar", DS.BASLIK_PT)
    c.setFillColor(DS.IKINCIL)
    c.drawString(DS.SOL, ust_y + 3.5 * mm, f"{ad}  |  {kitapcik} Kitapçığı")
    c.setStrokeColor(DS.LACIVERT)
    c.setLineWidth(0.9)
    c.line(DS.SOL, ust_y + 1.5 * mm, DS.SAYFA_G - DS.SAG, ust_y + 1.5 * mm)

    if sutun_cizgisi:
        c.setStrokeColor(DS.CIZGI_ACIK)
        c.setLineWidth(0.6)
        x = DS.SOL + DS.SUTUN_G + DS.SUTUN_ARA / 2
        c.line(x, DS.ALT + 4 * mm, x, ust_y - 2 * mm)

    c.setStrokeColor(DS.CIZGI_ACIK)
    c.setLineWidth(0.6)
    c.line(DS.SOL, DS.ALT + 1 * mm, DS.SAYFA_G - DS.SAG, DS.ALT + 1 * mm)
    # Marka izi: adı lacivert ve yarı kalın ki göz seçsin, kanallar gri ve
    # küçük ki sınav deneyimini bölmesin. Tek satır, her sayfada aynı yerde.
    c.setFont("ArB", DS.DIPNOT_PT)
    c.setFillColor(DS.LACIVERT)
    c.drawString(DS.SOL, DS.ALT - 3 * mm, SITE)
    genislik = c.stringWidth(SITE, "ArB", DS.DIPNOT_PT)
    c.setFont("Ar", DS.DIPNOT_PT - 0.5)
    c.setFillColor(DS.IKINCIL)
    c.drawString(DS.SOL + genislik + 2.5 * mm, DS.ALT - 3 * mm,
                 "· web · iOS · Android")
    c.setFont("Ar", DS.DIPNOT_PT)
    c.drawRightString(DS.SAYFA_G - DS.SAG, DS.ALT - 3 * mm, str(sayfa_no))


# ── Kapak ────────────────────────────────────────────────────────────────
ACIKLAMALAR = [
    "Bu kitapçıkta <b>{soru} soru</b> vardır. Sınav süresi <b>{sure} dakikadır</b>.",
    "Her sorunun beş seçeneği vardır; yalnızca <b>bir</b> seçenek doğrudur.",
    "Yanlış cevaplar doğru cevapları <b>etkilemez</b>; puanınız doğru cevap "
    "sayınızdır. Emin olmadığınız soruları boş bırakmak zorunda değilsiniz.",
    "Cevaplarınızı ayrı bir kâğıda soru numarasıyla eşleştirerek işaretleyiniz.",
    "Sınav süresince kaynak, hesap makinesi ve iletişim aracı kullanmayınız. Deneme, "
    "ancak gerçek sınav koşullarında çözüldüğünde puanınız hakkında bilgi verir.",
    "Süre bitiminde cevaplarınızı kitapçık sonundaki <b>cevap anahtarı</b> ile "
    "karşılaştırınız.",
]


def kapak(c, d, kitapcik):
    g, y = DS.SAYFA_G, DS.SAYFA_Y
    ad = sinav_adi(d["title"])

    # Üst kimlik satırı — ince ve kurumsal; büyük logo bloğu yok.
    logo = os.path.join(GORSEL, "logo2.png")
    if os.path.exists(logo):
        c.drawImage(logo, DS.SOL, y - 24 * mm, width=41 * mm, height=12 * mm, mask="auto")
    c.setFont("Ar", 8)
    c.setFillColor(DS.IKINCIL)
    c.drawRightString(g - DS.SAG, y - 16 * mm,
                      "Polis Amirleri Eğitimi Merkezi sınavına hazırlık")
    c.drawRightString(g - DS.SAG, y - 20.5 * mm, SITE)
    c.setStrokeColor(DS.LACIVERT)
    c.setLineWidth(1.1)
    c.line(DS.SOL, y - 29 * mm, g - DS.SAG, y - 29 * mm)

    # Başlık
    bas = y - 46 * mm
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 22)
    c.drawString(DS.SOL, bas, ad)
    c.setFillColor(DS.METIN)
    c.setFont("Ar", 11)
    c.drawString(DS.SOL, bas - 8 * mm, "İlk Derece Amirlik Eğitimi Yazılı Sınavı Denemesi")

    # Kitapçık türü
    kb = 24 * mm
    c.setStrokeColor(DS.LACIVERT)
    c.setLineWidth(1.1)
    c.setFillColor(white)
    c.rect(g - DS.SAG - kb, bas - 9 * mm, kb, kb, stroke=1, fill=1)
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 6.6)
    c.drawCentredString(g - DS.SAG - kb / 2, bas + 9.5 * mm, "KİTAPÇIK TÜRÜ")
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 22)
    c.drawCentredString(g - DS.SAG - kb / 2, bas - 2 * mm, kitapcik)

    # Künye şeridi
    ky = bas - 26 * mm
    c.setFillColor(DS.ZEMIN)
    c.setStrokeColor(DS.CIZGI)
    c.setLineWidth(0.7)
    c.rect(DS.SOL, ky - 16 * mm, g - DS.SOL - DS.SAG, 16 * mm, stroke=1, fill=1)
    kolon = (g - DS.SOL - DS.SAG) / 3
    for i, (etiket, deger) in enumerate(
        [("SORU SAYISI", str(d["questionCount"])),
         ("SÜRE", f"{d['durationMinutes']} dakika"),
         # PAEM'de yanlış doğruyu GÖTÜRMEZ (7 Eylül 2026 düzeltmesi).
         ("PUANLAMA", "Her doğru 1 puan")]
    ):
        x = DS.SOL + i * kolon + 6 * mm
        c.setFillColor(DS.IKINCIL)
        c.setFont("Ar", 6.8)
        c.drawString(x, ky - 6 * mm, etiket)
        c.setFillColor(DS.LACIVERT)
        c.setFont("ArB", 11.5)
        c.drawString(x, ky - 12.5 * mm, deger)
        if i:
            c.setStrokeColor(DS.CIZGI)
            c.line(DS.SOL + i * kolon, ky - 16 * mm, DS.SOL + i * kolon, ky)

    # Aday alanı
    ay = ky - 16 * mm - 14 * mm
    c.setFillColor(DS.METIN)
    c.setFont("ArB", 8.4)
    c.drawString(DS.SOL, ay, "ADAYIN")
    yy = ay - 9 * mm
    for etiket, uzunluk in [("ADI SOYADI", 104 * mm), ("T.C. KİMLİK NO", 58 * mm)]:
        c.setFillColor(DS.IKINCIL)
        c.setFont("Ar", 8.6)
        c.drawString(DS.SOL, yy, etiket)
        c.setStrokeColor(DS.CIZGI)
        c.setLineWidth(0.7)
        c.line(DS.SOL + 36 * mm, yy - 1.4 * mm, DS.SOL + 36 * mm + uzunluk, yy - 1.4 * mm)
        yy -= 10 * mm

    # Açıklamalar
    st = ParagraphStyle("ack", fontName="Ar", fontSize=9, leading=13, alignment=4,
                        textColor=DS.METIN, leftIndent=6.5 * mm, firstLineIndent=-6.5 * mm)
    paras = [Paragraph(f'<font name="ArB">{i+1}.</font>&nbsp;&nbsp;' +
                       a.format(soru=d["questionCount"], sure=d["durationMinutes"]), st)
             for i, a in enumerate(ACIKLAMALAR)]
    ic_g = g - DS.SOL - DS.SAG - 14 * mm
    yuk = sum(p.wrap(ic_g, 10_000)[1] + DS.SM for p in paras) + 15 * mm

    ky2 = yy - 1 * mm
    c.setFillColor(white)
    c.setStrokeColor(DS.CIZGI)
    c.setLineWidth(0.8)
    c.rect(DS.SOL, ky2 - yuk, g - DS.SOL - DS.SAG, yuk, stroke=1, fill=1)
    c.setFillColor(DS.LACIVERT)
    c.rect(DS.SOL, ky2 - 8.5 * mm, g - DS.SOL - DS.SAG, 8.5 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("ArB", 8.4)
    c.drawString(DS.SOL + 7 * mm, ky2 - 5.9 * mm, "SINAVLA İLGİLİ AÇIKLAMALAR")
    yy2 = ky2 - 8.5 * mm - 5.5 * mm
    for p in paras:
        _, h = p.wrap(ic_g, 10_000)
        p.drawOn(c, DS.SOL + 7 * mm, yy2 - h)
        yy2 -= h + DS.SM

    # Soru dağılımı
    dy = ky2 - yuk - 12 * mm
    c.setFillColor(DS.METIN)
    c.setFont("ArB", 8.4)
    c.drawString(DS.SOL, dy, "SORU DAĞILIMI")
    dy -= 6.5 * mm
    dagilim = {}
    for q in d["questions"]:
        dagilim[q["course"]] = dagilim.get(q["course"], 0) + 1
    sirali = sorted(dagilim.items(), key=lambda kv: (-kv[1], kv[0]))
    kol = (g - DS.SOL - DS.SAG) / 2
    for i, (ders, adet) in enumerate(sirali):
        x = DS.SOL + (i % 2) * kol
        sy = dy - (i // 2) * 6.4 * mm
        c.setFillColor(DS.METIN)
        c.setFont("Ar", 8.8)
        c.drawString(x, sy, ders)
        c.setFillColor(DS.LACIVERT)
        c.setFont("ArB", 8.8)
        c.drawRightString(x + kol - 8 * mm, sy, str(adet))
        c.setStrokeColor(DS.CIZGI_ACIK)
        c.setLineWidth(0.6)
        c.line(x, sy - 2.2 * mm, x + kol - 8 * mm, sy - 2.2 * mm)

    # Alt marka bandı — sınav alanına karışmaz; rozet/QR arka kapakta.
    # Izgaraya uyar: alt kenar boşluğunun (17 mm) ÜSTÜNDE kalır.
    bant_ust = DS.ALT + 22 * mm
    c.setStrokeColor(DS.CIZGI)
    c.setLineWidth(0.7)
    c.line(DS.SOL, bant_ust, g - DS.SAG, bant_ust)
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 8.2)
    c.drawString(DS.SOL, bant_ust - 6 * mm,
                 "Bu deneme Paemisyon soru bankasından hazırlanmıştır.")
    c.drawString(DS.SOL, bant_ust - 10.5 * mm, "Çözümler, konu bazlı analiz ve sıralama için")
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 9)
    c.drawString(DS.SOL + 63 * mm, bant_ust - 10.5 * mm, SITE)
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 7.6)
    c.drawString(DS.SOL, bant_ust - 16 * mm, "Web · iOS · Android — tek hesap, her cihazda")
    # Rozetler ve QR sağda: sınav alanına girmez, kapağın dibinde kalır.
    for i, (dosya, gen) in enumerate([("appStore.png", 23 * mm), ("playStore.png", 26 * mm)]):
        yol = os.path.join(GORSEL, dosya)
        if os.path.exists(yol):
            c.drawImage(yol, g - DS.SAG - 26 * mm - 58 * mm + i * 29 * mm, bant_ust - 15 * mm,
                        width=gen, height=gen * 34 / (96 if i == 0 else 114), mask="auto")
    kod = qr_uret(f"https://{SITE}/denemeler", "/tmp/_qr_kapak.png")
    c.drawImage(kod, g - DS.SAG - 21 * mm, bant_ust - 19 * mm, width=21 * mm, height=21 * mm)
    c.showPage()


# ── Soru sayfaları ───────────────────────────────────────────────────────
def sorular(c, d, kitapcik, ilk_sayfa, st):
    ad = sinav_adi(d["title"])
    tepe = DS.SAYFA_Y - DS.UST - DS.BAS_ALAN
    dip = DS.ALT + DS.DIP_ALAN
    sayfa, sutun, y = ilk_sayfa, 0, tepe
    cerceve(c, ad, kitapcik, sayfa)

    for q in d["questions"]:
        parcalar = soru_parcalari(q, st)
        h = blok_yuksekligi(parcalar, DS.SUTUN_G)
        if y - h < dip:  # blok atomik — komple taşınır
            sutun += 1
            if sutun > 1:
                c.showPage()
                sayfa += 1
                cerceve(c, ad, kitapcik, sayfa)
                sutun = 0
            y = tepe
        x = DS.SOL + sutun * (DS.SUTUN_G + DS.SUTUN_ARA)
        for par, bosluk in parcalar:
            _, ph = par.wrap(DS.SUTUN_G, 10_000)
            y -= ph + bosluk
            par.drawOn(c, x, y)
        y -= DS.XL - 1.8 * mm  # sorular arası nefes (son şık boşluğu düşülür)
    c.showPage()
    return sayfa + 1


# ── Cevap anahtarı ───────────────────────────────────────────────────────
def cevap_anahtari(c, d, kitapcik, sayfa_no):
    """Yalnız anahtar tablosu — net/analiz bir sonraki sayfada.

    Tek sayfaya sığdırmayı denedik ve ders tablosu alt bilgiye taşıyordu;
    sıkıştırmak yerine ayırmak doğrusu: iki tablo da tarama kolaylığını
    boşluktan alıyor."""
    g = DS.SAYFA_G
    ad = sinav_adi(d["title"])
    cerceve(c, ad, kitapcik, sayfa_no, sutun_cizgisi=False)

    y = DS.SAYFA_Y - DS.UST - 6 * mm
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 14)
    c.drawString(DS.SOL, y, "CEVAP ANAHTARI")
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 8.6)
    c.drawString(DS.SOL, y - 6.5 * mm,
                 "Cevaplarınızı karşılaştırın; puanınızı ve ders bazlı dökümünüzü "
                 "bir sonraki sayfadaki tablolarla çıkarın.")

    qs = d["questions"]
    sut = 5
    satir = (len(qs) + sut - 1) // sut
    tg = (g - DS.SOL - DS.SAG) / sut
    ty = 8.6 * mm
    y0 = y - 18 * mm

    c.setFillColor(DS.ZEMIN)
    c.rect(DS.SOL, y0 - 7 * mm, g - DS.SOL - DS.SAG, 7 * mm, stroke=0, fill=1)
    c.setFillColor(DS.IKINCIL)
    c.setFont("ArB", 6.8)
    for k in range(sut):
        c.drawString(DS.SOL + k * tg + 5 * mm, y0 - 4.7 * mm, "SORU")
        c.drawString(DS.SOL + k * tg + 22 * mm, y0 - 4.7 * mm, "CEVAP")
    y0 -= 7 * mm

    for i, q in enumerate(qs):
        sr, k = i % satir, i // satir
        x = DS.SOL + k * tg
        yy = y0 - sr * ty
        c.setStrokeColor(DS.CIZGI_ACIK)
        c.setLineWidth(0.5)
        c.line(x, yy - ty + 2.6 * mm, x + tg - 7 * mm, yy - ty + 2.6 * mm)
        c.setFillColor(DS.IKINCIL)
        c.setFont("Ar", 8.8)
        c.drawString(x + 5 * mm, yy - 5.2 * mm, str(q["order"]))
        c.setFillColor(DS.METIN)
        c.setFont("ArB", 9.6)
        c.drawString(x + 22 * mm, yy - 5.2 * mm, q["answer"])
    c.showPage()
    return sayfa_no + 1


def analiz_sayfasi(c, d, kitapcik, sayfa_no):
    """Net hesabı + ders bazlı döküm — doldurulabilir hücrelerle."""
    g = DS.SAYFA_G
    ad = sinav_adi(d["title"])
    cerceve(c, ad, kitapcik, sayfa_no, sutun_cizgisi=False)

    y = DS.SAYFA_Y - DS.UST - 6 * mm
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 14)
    c.drawString(DS.SOL, y, "PUANINIZI HESAPLAYIN")
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 8.6)
    c.drawString(DS.SOL, y - 6.5 * mm,
                 "Önce toplam doğrunuzu, sonra hangi dersten kaç doğru yaptığınızı yazın.")

    ny = y - 18 * mm
    x = DS.SOL
    for etiket, gen in [("DOĞRU", 34 * mm), ("YANLIŞ", 34 * mm),
                        ("BOŞ", 34 * mm), ("PUAN", 42 * mm)]:
        c.setFillColor(white)
        c.setStrokeColor(DS.CIZGI)
        c.setLineWidth(0.8)
        c.rect(x, ny - 16 * mm, gen, 16 * mm, stroke=1, fill=1)
        c.setFillColor(DS.IKINCIL)
        c.setFont("Ar", 7)
        c.drawString(x + 4 * mm, ny - 5.4 * mm, etiket)
        x += gen + 5 * mm
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 9)
    c.drawString(DS.SOL, ny - 22 * mm,
                 "Puanınız doğru cevap sayınızdır — yanlışlar doğruları götürmez.")

    # Ders bazlı döküm — doldurulabilir hücreler
    dy = ny - 38 * mm
    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 14)
    c.drawString(DS.SOL, dy, "DERS BAZLI DÖKÜM")
    c.setFillColor(DS.IKINCIL)
    c.setFont("Ar", 8.6)
    c.drawString(DS.SOL, dy - 6.5 * mm,
                 "En çok yanlışı hangi derste yaptıysanız çalışmaya oradan başlayın.")
    dy -= 16 * mm

    genislik = g - DS.SOL - DS.SAG
    kolonlar = [("DERS", DS.SOL + 4 * mm), ("SORU", DS.SOL + 96 * mm),
                ("DOĞRU", DS.SOL + 118 * mm), ("YANLIŞ", DS.SOL + 143 * mm),
                ("BOŞ", DS.SOL + 168 * mm)]
    ayrac_x = [DS.SOL + 92 * mm, DS.SOL + 114 * mm, DS.SOL + 139 * mm, DS.SOL + 164 * mm]

    c.setFillColor(DS.ZEMIN)
    c.rect(DS.SOL, dy - 7 * mm, genislik, 7 * mm, stroke=0, fill=1)
    c.setFillColor(DS.IKINCIL)
    c.setFont("ArB", 6.8)
    for etiket, x in kolonlar:
        c.drawString(x, dy - 4.7 * mm, etiket)
    dy -= 7 * mm

    dagilim = {}
    for q in d["questions"]:
        dagilim[q["course"]] = dagilim.get(q["course"], 0) + 1
    sirali = sorted(dagilim.items(), key=lambda kv: (-kv[1], kv[0]))
    satir_y = 10 * mm
    ust_sinir = dy
    for ders, adet in sirali:
        c.setFillColor(DS.METIN)
        c.setFont("Ar", 9.2)
        c.drawString(DS.SOL + 4 * mm, dy - 6.4 * mm, ders)
        c.setFillColor(DS.IKINCIL)
        c.drawString(DS.SOL + 96 * mm, dy - 6.4 * mm, str(adet))
        c.setStrokeColor(DS.CIZGI_ACIK)
        c.setLineWidth(0.5)
        c.line(DS.SOL, dy - satir_y, DS.SOL + genislik, dy - satir_y)
        dy -= satir_y
    # TOPLAM satırı
    c.setFillColor(DS.ZEMIN)
    c.rect(DS.SOL, dy - satir_y, genislik, satir_y, stroke=0, fill=1)
    c.setFillColor(DS.METIN)
    c.setFont("ArB", 9.2)
    c.drawString(DS.SOL + 4 * mm, dy - 6.4 * mm, "TOPLAM")
    c.drawString(DS.SOL + 96 * mm, dy - 6.4 * mm, str(len(d["questions"])))
    dy -= satir_y

    # Dikey ayraçlar: hücreler elle doldurulabilsin.
    c.setStrokeColor(DS.CIZGI_ACIK)
    c.setLineWidth(0.5)
    for x in ayrac_x:
        c.line(x, dy, x, ust_sinir)
    c.setStrokeColor(DS.CIZGI)
    c.setLineWidth(0.7)
    c.rect(DS.SOL, dy, genislik, ust_sinir - dy, stroke=1, fill=0)

    c.setFillColor(DS.IKINCIL)
    c.setFont("ArI", 8.6)
    c.drawString(DS.SOL, dy - 10 * mm,
                 f"Bu dökümü elle tutmak zorunda değilsiniz: aynı denemeyi {SITE} "
                 "üzerinden çözerseniz konu bazlı kaybınız otomatik çıkar.")
    c.showPage()
    return sayfa_no + 1


# ── Arka kapak ───────────────────────────────────────────────────────────
OZELLIKLER = [
    ("Soru bazlı çözüm", "Her yanlışın altında editör açıklaması ve dayandığı kanun maddesi."),
    ("Konu bazlı kayıp analizi", "Puanınızı nerede kaybettiğinizi konu konu görürsünüz."),
    ("Canlı deneme ve sıralama", "Randevulu denemelerde aynı anda yarışın, sıranızı görün."),
    ("Yanlış tekrar kuyruğu", "Yanlışlarınız birikir; unutmadan doğru zamanda önünüze gelir."),
    ("Çıkmış sorular", "Gerçek sınavlardan derlenmiş, kaynağı kayıtlı soru bankası."),
    ("Kişisel koç", "Bugün ne çalışacağınızı söyler; hedefinizi ve serinizi takip eder."),
]


def qr_uret(veri, yol):
    import qrcode
    k = qrcode.QRCode(border=1, box_size=10,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    k.add_data(veri)
    k.make(fit=True)
    k.make_image(fill_color="#173F72", back_color="white").save(yol)
    return yol


def arka_kapak(c):
    g, y = DS.SAYFA_G, DS.SAYFA_Y
    logo = os.path.join(GORSEL, "logo2.png")
    if os.path.exists(logo):
        c.drawImage(logo, DS.SOL, y - 26 * mm, width=44 * mm, height=12.9 * mm, mask="auto")
    c.setStrokeColor(DS.LACIVERT)
    c.setLineWidth(1.1)
    c.line(DS.SOL, y - 32 * mm, g - DS.SAG, y - 32 * mm)

    c.setFillColor(DS.LACIVERT)
    c.setFont("ArB", 20)
    c.drawString(DS.SOL, y - 48 * mm, "Denemeyi çözdünüz.")
    c.setFillColor(DS.METIN)
    c.drawString(DS.SOL, y - 59 * mm, "Şimdi puanınızı yükseltin.")

    st = ParagraphStyle("t", fontName="Ar", fontSize=10, leading=14.5,
                        textColor=DS.IKINCIL, alignment=0)
    p = Paragraph(
        "Bu kitapçıktaki soruların tamamı Paemisyon soru bankasından derlenmiştir. "
        "Aynı denemeyi çevrim içi çözerseniz puanınız anında hesaplanır, her yanlışın "
        "çözümüne ulaşır ve konu bazlı kaybınızı takip edersiniz.", st)
    _, h = p.wrap(g - DS.SOL - DS.SAG - 46 * mm, 10_000)
    p.drawOn(c, DS.SOL, y - 66 * mm - h)

    yy = y - 100 * mm
    for ad, aciklama in OZELLIKLER:
        c.setFillColor(DS.LACIVERT)
        c.rect(DS.SOL, yy - 0.2 * mm, 2.2 * mm, 2.2 * mm, stroke=0, fill=1)
        c.setFillColor(DS.METIN)
        c.setFont("ArB", 9.6)
        c.drawString(DS.SOL + 6.5 * mm, yy, ad)
        c.setFillColor(DS.IKINCIL)
        c.setFont("Ar", 9)
        c.drawString(DS.SOL + 6.5 * mm, yy - 5.4 * mm, aciklama)
        yy -= 20 * mm

    bant = 52 * mm
    c.setFillColor(DS.LACIVERT)
    c.rect(0, 0, g, bant, stroke=0, fill=1)
    c.setFillColor(DS.SARI)
    c.rect(0, bant - 2 * mm, g, 2 * mm, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("ArB", 15)
    c.drawString(DS.SOL, bant - 15 * mm, SITE)
    c.setFillColor(Color(1, 1, 1, 0.78))
    c.setFont("Ar", 9.2)
    c.drawString(DS.SOL, bant - 21.5 * mm, "Ücretsiz hesap açın; web'de ve mobil uygulamada")
    c.drawString(DS.SOL, bant - 26.5 * mm, "aynı hesapla kaldığınız yerden devam edin.")
    for i, (dosya, gen) in enumerate([("appStore.png", 27 * mm), ("playStore.png", 31 * mm)]):
        yol = os.path.join(GORSEL, dosya)
        if os.path.exists(yol):
            c.drawImage(yol, DS.SOL + i * 34 * mm, 9 * mm,
                        width=gen, height=gen * 34 / (96 if i == 0 else 114), mask="auto")
    kod = qr_uret(f"https://{SITE}", "/tmp/_qr_arka.png")
    c.setFillColor(white)
    c.roundRect(g - DS.SAG - 32 * mm, 10 * mm, 32 * mm, 32 * mm, 2 * mm, stroke=0, fill=1)
    c.drawImage(kod, g - DS.SAG - 30 * mm, 12 * mm, width=28 * mm, height=28 * mm)
    c.showPage()


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return
    d = json.load(open(sys.argv[1], encoding="utf-8"))
    cikti = sys.argv[2]
    kitapcik = sys.argv[sys.argv.index("--kitapcik") + 1] if "--kitapcik" in sys.argv else "A"

    fontlari_kur()
    st = stiller()
    c = pdfcanvas.Canvas(cikti, pagesize=A4)
    c.setTitle(sinav_adi(d["title"]))
    c.setAuthor("Paemisyon")
    c.setSubject("PAEM deneme sınavı kitapçığı")
    c.setCreator(f"Paemisyon · {SITE}")

    kapak(c, d, kitapcik)
    son = sorular(c, d, kitapcik, 1, st)
    son = cevap_anahtari(c, d, kitapcik, son)
    analiz_sayfasi(c, d, kitapcik, son)
    arka_kapak(c)
    c.save()
    print(f"yazıldı: {cikti}")


if __name__ == "__main__":
    main()
