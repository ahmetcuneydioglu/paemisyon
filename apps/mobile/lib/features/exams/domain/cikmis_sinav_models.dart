// Çıkmış sınav domain modelleri (Doc 36) — /public/cikmis-sinavlar ve
// /cikmis-sinavlar/:slug uçlarının karşılığı.
//
// İki tür KARIŞTIRILMAZ ve bu ayrım ekranda rozetle görünür:
//   resmi  — kurumun yayımladığı gerçek kitapçık; sorular bankadadır.
//   analiz — sınav yayımlanmadı; elde yalnız aday hatırlatmasından çıkarılmış
//            konu dağılımı var, SORU YOKTUR. "Çıkmış soru" güveni bu ayrımın
//            üstünde duruyor; sunumda gizlenmez.

enum CikmisSinavTuru { resmi, analiz }

CikmisSinavTuru _turFrom(String? s) =>
    s == 'resmi' ? CikmisSinavTuru.resmi : CikmisSinavTuru.analiz;

class DersDagilimi {
  final String ders;
  final int adet;
  const DersDagilimi({required this.ders, required this.adet});

  factory DersDagilimi.fromJson(Map<String, dynamic> j) => DersDagilimi(
        ders: j['ders'] as String? ?? '',
        adet: (j['adet'] as num?)?.toInt() ?? 0,
      );
}

/// Vitrin kaydı — liste ekranının çizdiği her şey burada.
class CikmisSinavOzet {
  final String slug;
  final String ad;
  final String kurum;
  final int? donem;

  /// Sınav tarihi (yalnız gün hassasiyeti; sunucu "2025-04-19" döner).
  final DateTime? tarih;
  final CikmisSinavTuru tur;
  final String? ozet;
  final int? soruSayisi;

  /// Deneme motorundaki karşılığı. `null` ise "sınav gibi çöz" YOKTUR —
  /// düğme hiç çizilmez, ölü düğme kullanıcıyı hataya sürükler.
  final String? examId;

  /// Dönem Premium'a özel mi. Public SEO sayfası bundan ETKİLENMEZ — orası
  /// huninin girişi, paywall'a alınmaz.
  final bool isPremium;
  final List<DersDagilimi> dersDagilimi;

  const CikmisSinavOzet({
    required this.slug,
    required this.ad,
    required this.kurum,
    this.donem,
    this.tarih,
    required this.tur,
    this.ozet,
    this.soruSayisi,
    this.examId,
    this.isPremium = false,
    this.dersDagilimi = const [],
  });

  bool get cozulebilir => tur == CikmisSinavTuru.resmi && examId != null;

  /// Liste ve başlıkta kullanılan kısa ad: "PAEM 9 · 2025".
  String get kisaAd {
    final yil = tarih?.year;
    final donemli = donem != null ? 'PAEM $donem' : ad;
    return yil != null ? '$donemli · $yil' : donemli;
  }

  factory CikmisSinavOzet.fromJson(Map<String, dynamic> j) => CikmisSinavOzet(
        slug: j['slug'] as String,
        ad: j['ad'] as String? ?? '',
        kurum: j['kurum'] as String? ?? '',
        donem: (j['donem'] as num?)?.toInt(),
        tarih: j['tarih'] != null ? DateTime.tryParse(j['tarih'] as String) : null,
        tur: _turFrom(j['tur'] as String?),
        ozet: j['ozet'] as String?,
        soruSayisi: (j['soruSayisi'] as num?)?.toInt(),
        examId: j['examId'] as String?,
        isPremium: j['isPremium'] as bool? ?? false,
        dersDagilimi: ((j['dersDagilimi'] as List<dynamic>?) ?? const [])
            .map((e) => DersDagilimi.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class CikmisSik {
  final String harf;
  final String metin;
  final bool dogru;
  const CikmisSik({required this.harf, required this.metin, required this.dogru});

  factory CikmisSik.fromJson(Map<String, dynamic> j) => CikmisSik(
        harf: j['harf'] as String? ?? '',
        metin: j['metin'] as String? ?? '',
        dogru: j['dogru'] as bool? ?? false,
      );
}

class CikmisDayanak {
  final String baslik;
  final String? url;
  const CikmisDayanak({required this.baslik, this.url});

  factory CikmisDayanak.fromJson(Map<String, dynamic> j) => CikmisDayanak(
        baslik: j['baslik'] as String? ?? '',
        url: j['url'] as String?,
      );
}

class CikmisSoru {
  final int sira;

  /// Sınavda iptal edilmiş soru. Bankada durur ve okunur ama PUANLANMAZ;
  /// çalışma modunda rozetle işaretlenir, doğru sayısına katılmaz.
  final bool iptal;
  final String ders;
  final String konu;
  final String kok;
  final String? gorselUrl;
  final List<CikmisSik> siklar;
  final String? aciklama;
  final List<CikmisDayanak> dayanak;

  const CikmisSoru({
    required this.sira,
    required this.iptal,
    required this.ders,
    required this.konu,
    required this.kok,
    this.gorselUrl,
    required this.siklar,
    this.aciklama,
    this.dayanak = const [],
  });

  String? get dogruHarf {
    for (final s in siklar) {
      if (s.dogru) return s.harf;
    }
    return null;
  }

  factory CikmisSoru.fromJson(Map<String, dynamic> j) => CikmisSoru(
        sira: (j['sira'] as num?)?.toInt() ?? 0,
        iptal: j['iptal'] as bool? ?? false,
        ders: j['ders'] as String? ?? '',
        konu: j['konu'] as String? ?? '',
        kok: j['kok'] as String? ?? '',
        gorselUrl: j['gorselUrl'] as String?,
        siklar: ((j['siklar'] as List<dynamic>?) ?? const [])
            .map((e) => CikmisSik.fromJson(e as Map<String, dynamic>))
            .toList(),
        aciklama: j['aciklama'] as String?,
        dayanak: ((j['dayanak'] as List<dynamic>?) ?? const [])
            .map((e) => CikmisDayanak.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

/// Dönemin tamamı — girişli kullanıcı bütün soruları açıklamalarıyla görür.
class CikmisSinavDetay {
  final CikmisSinavOzet ozet;
  final List<CikmisSoru> sorular;

  /// Sürümü yayına alınmadığı için gösterilmeyen soru sayısı. Sıfırdan
  /// büyükse ekranda açıkça söylenir — eksiği sessizce yutmak, adayın
  /// "100 soru" beklerken 97 görmesi demek.
  final int kapaliSoru;
  final int iptalSayisi;

  const CikmisSinavDetay({
    required this.ozet,
    required this.sorular,
    this.kapaliSoru = 0,
    this.iptalSayisi = 0,
  });

  factory CikmisSinavDetay.fromJson(Map<String, dynamic> j) => CikmisSinavDetay(
        ozet: CikmisSinavOzet.fromJson(j),
        sorular: ((j['sorular'] as List<dynamic>?) ?? const [])
            .map((e) => CikmisSoru.fromJson(e as Map<String, dynamic>))
            .toList(),
        kapaliSoru: (j['kapaliSoru'] as num?)?.toInt() ?? 0,
        iptalSayisi: (j['iptalSayisi'] as num?)?.toInt() ?? 0,
      );
}
