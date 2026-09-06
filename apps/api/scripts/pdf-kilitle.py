#!/usr/bin/env python3
"""
PDF'i KOPYALAMAYA KARŞI KİLİTLER (izinleri kısıtlar + sahip parolası).

  python3 scripts/pdf-kilitle.py girdi.pdf cikti.pdf [sahip-parolasi]

Açık konuşmak gerekir: PDF izinleri bir ŞİFRELEME DEĞİL, bir bayraktır.
Adobe Reader, Preview, Chrome gibi yaygın okuyucular buna uyar — metin
seçilemez, kopyalanamaz, düzenlenemez. Ama izinleri sıyıran araçlar vardır ve
belge açılabildiği sürece ekran görüntüsü her zaman mümkündür. Gerçekten
kopyalanamaz metin isteniyorsa sayfaların görüntüye çevrilmesi gerekir
(--goruntu) — bu, metin seçimini tamamen bitirir ama dosyayı büyütür ve
erişilebilirliği (ekran okuyucu, arama) yok eder.
"""
import subprocess
import sys
from pypdf import PdfReader, PdfWriter


def kilitle(girdi: str, cikti: str, sahip: str, goruntu: bool = False):
    kaynak = girdi
    if goruntu:
        # Sayfaları 200 dpi görüntüye çevirip yeniden PDF yap — metin katmanı
        # tamamen gider. poppler (pdftoppm) + img2pdf gerekir.
        # 150 dpi / kalite 82: ekranda ve baskıda net, dosya paylaşılabilir
        # boyutta kalır (200 dpi 8 MB'a çıkıyordu).
        subprocess.run(["pdftoppm", "-r", "150", "-jpeg", "-jpegopt", "quality=82",
                        girdi, "/tmp/_sayfa"], check=True)
        import glob
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as _c
        sayfalar = sorted(glob.glob("/tmp/_sayfa-*.jpg"))
        cv = _c.Canvas("/tmp/_goruntu.pdf", pagesize=A4)
        for j in sayfalar:
            cv.drawImage(j, 0, 0, width=A4[0], height=A4[1])
            cv.showPage()
        cv.save()
        kaynak = "/tmp/_goruntu.pdf"

    r = PdfReader(kaynak)
    w = PdfWriter()
    for p in r.pages:
        w.add_page(p)
    w.add_metadata({"/Producer": "Paemisyon", "/Creator": "Paemisyon · paemisyon.com"})
    # Kullanıcı parolası BOŞ: herkes açabilsin, kimse kopyalayamasın.
    w.encrypt(
        user_password="",
        owner_password=sahip,
        permissions_flag=(1 << 2),  # yalnız yazdırma serbest (düşük çözünürlük dahil)
    )
    with open(cikti, "wb") as f:
        w.write(f)
    print(f"kilitlendi: {cikti}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
    else:
        kilitle(sys.argv[1], sys.argv[2],
                sys.argv[3] if len(sys.argv) > 3 else "paemisyon-2026",
                "--goruntu" in sys.argv)
