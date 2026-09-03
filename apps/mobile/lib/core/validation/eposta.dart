/// Kayıt öncesi e-posta denetimi — web'deki `apps/web/src/lib/eposta.ts`
/// modülünün Dart karşılığı. İkisi AYNI kuralları uygular; birini değiştiren
/// diğerini de değiştirmeli (aynı hesap havuzu, aynı Supabase projesi).
///
/// Neden var: kayıt akışı adresi denetlemeden Supabase'e veriyor, Supabase de
/// yazılan her adrese doğrulama maili atıyor. Yanlış yazılan adres geri dönüyor;
/// Supabase 3 Eylül 2026'da yüksek bounce oranı uyarısı gönderdi. Kullanıcı
/// tarafı da kötü: "mail gelmedi" diye bekliyor, oysa adres yanlış.
///
/// Tasarım ilkesi: GEVŞEK ol. Amaç kapıda kimseyi bırakmak değil, teslim
/// edilemeyeceği KESİN olanı durdurmak.
///
/// Web'de bir dördüncü katman daha var: alan adının posta sunucusu var mı diye
/// DNS/MX sorgusu. Mobilde YOK — Dart'ta DNS sorgusu ek paket ister ve kayıt
/// yoluna ağ turu ekler. Bu katman sunucuda yaşıyor; mobil için ileride API'ye
/// küçük bir denetim ucu açılabilir.
library;

/// Alan adı etiketi: harf/rakamla başlar ve biter, arada tire olabilir.
const _etiket = r'[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?';

/// Uzantı: en az 2 harf (".istanbul" geçer) ya da punycode (xn--…).
const _uzanti = r'(?:xn--[a-z0-9-]{2,}|\p{L}{2,})';

final RegExp _bicim = RegExp(
  '^[^\\s@,;:<>()\\[\\]\\\\"]{1,64}@(?:$_etiket\\.)+$_uzanti\$',
  caseSensitive: false,
  unicode: true,
);

/// Posta alamayacağı KESİN olan alan adları (RFC 2606/6761 ile ayrılmış).
/// Dünyada hiçbir sunucu bu uzantılarda çalışamaz.
const _ayrilmisUzantilar = <String>{
  'test',
  'example',
  'invalid',
  'localhost',
  'local',
  'internal',
  'home',
  'lan',
};
const _ayrilmisAlanlar = <String>{'example.com', 'example.net', 'example.org'};

/// Bilinen GERÇEK sağlayıcılar. İki işi var:
///  1) yazım hatası önerisinin hedefleri,
///  2) "bunlar zaten doğru" listesi — listedeki alan adı asla düzeltilmeye
///     çalışılmaz. Bu şart: "mail.com" gerçek bir sağlayıcıdır ve "gmail.com"a
///     bir harf uzaktır; liste olmasa kullanıcıya yanlışlıkla sorardık.
const _yayginAlanlar = <String>[
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'yahoo.com',
  'live.com',
  'msn.com',
  'me.com',
  'yandex.com',
  'protonmail.com',
  'proton.me',
  'windowslive.com',
  'hotmail.com.tr',
  'yahoo.com.tr',
  'mynet.com',
  'superonline.com',
  'ttmail.com',
  'gmail.com.tr',
  'outlook.com.tr',
  // Aşağıdakiler öneri hedefi olmaktan çok "doğru kabul et" içindir.
  'mail.com',
  'gmx.com',
  'gmx.net',
  'aol.com',
  'zoho.com',
  'fastmail.com',
  'tuta.com',
  'tutanota.com',
  'mail.ru',
  'yandex.com.tr',
  'yandex.ru',
  'turk.net',
  'ttnet.net.tr',
  'e-kolay.net',
  'passinbox.com',
  'privaterelay.appleid.com',
];

enum EpostaDurumu { gecerli, gecersiz, oneri }

class EpostaSonuc {
  const EpostaSonuc(this.durum, {this.mesaj, this.oneri});

  final EpostaDurumu durum;

  /// Kullanıcıya gösterilecek metin (gecersiz ve oneri durumlarında dolu).
  final String? mesaj;

  /// Düzeltilmiş tam adres (yalnız oneri durumunda dolu).
  final String? oneri;
}

String alanAdi(String eposta) =>
    eposta.substring(eposta.lastIndexOf('@') + 1).toLowerCase();

/// Damerau-Levenshtein (yer değiştirme dahil): "gmial" → "gmail" tek işlemdir,
/// düz Levenshtein'da iki. Yazım hatalarının çoğu bitişik harf takasıdır.
int duzenlemeUzakligi(String a, String b) {
  final m = a.length;
  final n = b.length;
  final d = List.generate(m + 1, (i) => List<int>.filled(n + 1, 0));
  for (var i = 0; i <= m; i++) {
    d[i][0] = i;
  }
  for (var j = 0; j <= n; j++) {
    d[0][j] = j;
  }
  for (var i = 1; i <= m; i++) {
    for (var j = 1; j <= n; j++) {
      final bedel = a[i - 1] == b[j - 1] ? 0 : 1;
      var en = d[i - 1][j] + 1;
      if (d[i][j - 1] + 1 < en) en = d[i][j - 1] + 1;
      if (d[i - 1][j - 1] + bedel < en) en = d[i - 1][j - 1] + bedel;
      if (i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1]) {
        if (d[i - 2][j - 2] + 1 < en) en = d[i - 2][j - 2] + 1;
      }
      d[i][j] = en;
    }
  }
  return d[m][n];
}

/// Yaygın bir sağlayıcıya çok yakın ama birebir eşit değilse onu önerir.
String? alanOnerisi(String alan) {
  if (_yayginAlanlar.contains(alan)) return null;
  String? enIyi;
  var enKisa = 99;
  for (final aday in _yayginAlanlar) {
    // Kısa alan adlarında 2 uzaklık fazla cömert: gerçek adresleri
    // düzeltmeye kalkardı.
    final sinir = aday.length <= 9 ? 1 : 2;
    final u = duzenlemeUzakligi(alan, aday);
    if (u > 0 && u <= sinir && u < enKisa) {
      enKisa = u;
      enIyi = aday;
    }
  }
  return enIyi;
}

/// Biçim + teslim edilemez alan + yazım hatası önerisi.
EpostaSonuc epostaDenetle(String ham) {
  final eposta = ham.trim();
  if (eposta.isEmpty) {
    return const EpostaSonuc(EpostaDurumu.gecersiz,
        mesaj: 'E-posta adresi zorunludur.');
  }
  if (!_bicim.hasMatch(eposta)) {
    return const EpostaSonuc(EpostaDurumu.gecersiz,
        mesaj: 'E-posta adresi geçerli görünmüyor. Örnek: adin@gmail.com');
  }

  final alan = alanAdi(eposta);
  final uzanti = alan.substring(alan.lastIndexOf('.') + 1);
  if (_ayrilmisUzantilar.contains(uzanti) || _ayrilmisAlanlar.contains(alan)) {
    return EpostaSonuc(EpostaDurumu.gecersiz,
        mesaj: '"$alan" adresine e-posta ulaşamaz. '
            'Kullandığın gerçek adresi yaz.');
  }

  final oneri = alanOnerisi(alan);
  if (oneri != null) {
    final kullanici = eposta.substring(0, eposta.lastIndexOf('@'));
    return EpostaSonuc(
      EpostaDurumu.oneri,
      mesaj: '"$alan" yazdın. "$oneri" mi demek istedin?',
      oneri: '$kullanici@$oneri',
    );
  }
  return const EpostaSonuc(EpostaDurumu.gecerli);
}
