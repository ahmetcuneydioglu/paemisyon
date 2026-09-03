import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/validation/eposta.dart';

void main() {
  group('epostaDenetle — geçerli adresler', () {
    // Bu liste kuralın GEVŞEK kalmasını korur: buradan biri düşerse gerçek bir
    // kullanıcı kapıda kalıyor demektir.
    for (final e in const [
      'adin@gmail.com',
      'ahmet+deneme@gmail.com', // artı adresleme
      'a.b-c_d@hotmail.com',
      'kullanici@sirket.com.tr',
      'biri@marka.istanbul', // uzun uzantı
      'üye@köşe.com', // IDN
      'abc123@privaterelay.appleid.com', // Apple ile giriş — asla engellenmemeli
      'takma@passinbox.com', // meşru takma-adres servisi
    ]) {
      test('geçer: $e', () {
        expect(epostaDenetle(e).durum, EpostaDurumu.gecerli);
      });
    }
  });

  group('epostaDenetle — biçim', () {
    for (final e in const ['', '   ', 'adin', 'adin@', '@gmail.com', 'a b@gmail.com', 'adin@gmail']) {
      test('reddeder: "$e"', () {
        expect(epostaDenetle(e).durum, EpostaDurumu.gecersiz);
      });
    }
  });

  group('epostaDenetle — posta alamayacağı kesin alanlar', () {
    for (final e in const [
      'biri@paemisyon.test',
      'biri@sunucu.local',
      'biri@makine.localhost',
      'biri@example.com',
    ]) {
      test('reddeder: $e', () {
        expect(epostaDenetle(e).durum, EpostaDurumu.gecersiz);
      });
    }
  });

  group('epostaDenetle — yazım hatası önerisi', () {
    const ornekler = {
      'adin@gmial.com': 'adin@gmail.com', // harf takası
      'adin@gmai.com': 'adin@gmail.com', // eksik harf
      'adin@hotmial.com': 'adin@hotmail.com',
      'adin@outlok.com': 'adin@outlook.com',
      'adin@icloud.co': 'adin@icloud.com',
    };
    ornekler.forEach((girdi, beklenen) {
      test('$girdi → $beklenen önerir', () {
        final s = epostaDenetle(girdi);
        expect(s.durum, EpostaDurumu.oneri);
        expect(s.oneri, beklenen);
      });
    });

    test('adresin kullanıcı kısmını korur', () {
      expect(epostaDenetle('ahmet+etiket@gmial.com').oneri,
          'ahmet+etiket@gmail.com');
    });

    test('tanımadığı kurumsal alan adına karışmaz', () {
      expect(epostaDenetle('memur@egm.gov.tr').durum, EpostaDurumu.gecerli);
      expect(epostaDenetle('biri@sirketim.com').durum, EpostaDurumu.gecerli);
    });

    test('kısa alan adlarında cömert davranmaz', () {
      // "mail.com" gerçek bir sağlayıcı; "gmail.com"a 1 harf uzak diye
      // düzeltilmeye kalkılmamalı.
      expect(alanOnerisi('mail.com'), isNull);
    });
  });

  group('duzenlemeUzakligi', () {
    test('bitişik harf takasını tek işlem sayar', () {
      expect(duzenlemeUzakligi('gmial', 'gmail'), 1);
    });
    test('aynı metinde sıfırdır', () {
      expect(duzenlemeUzakligi('gmail.com', 'gmail.com'), 0);
    });
  });

  group('alanAdi', () {
    test('son @ işaretinden sonrasını küçük harfle verir', () {
      expect(alanAdi('Ahmet@GMAIL.com'), 'gmail.com');
    });
  });
}
