import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/cikmis_sinav_models.dart';

/// Çıkmış sınav API'si (Doc 36).
///
/// İki uç, iki katman:
///   `/public/cikmis-sinavlar`      — vitrin listesi (girişsiz de çalışır).
///   `/cikmis-sinavlar/:slug`       — GİRİŞLİ; dönemin TAMAMI, açıklamalarıyla.
///
/// Public detay ucu (dönem başına 10 soru) uygulamada KULLANILMAZ: o sınır
/// arama motoru ve dönüşüm içindi, hesabı olan kullanıcıya zaten verdiğimiz
/// şeyi saklamak olurdu.
///
/// "Sınav gibi çöz" burada değil: mevcut arşiv akışı (`/quiz` + archiveExamId)
/// tam olarak istediğimiz semantiği taşıyor — sabit set, süreli, resmî
/// sıralamaya girmez. Tek gereken dönemin `examId`'si.
class CikmisSinavRepository {
  final Dio _dio;
  const CikmisSinavRepository(this._dio);

  Future<List<CikmisSinavOzet>> list() async {
    return _guard(() async {
      final r =
          await _dio.get<Map<String, dynamic>>('/public/cikmis-sinavlar');
      final data = (r.data?['data'] as List<dynamic>?) ?? const [];
      return data
          .map((e) => CikmisSinavOzet.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  Future<CikmisSinavDetay> detail(String slug) async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/cikmis-sinavlar/$slug');
      return CikmisSinavDetay.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  /// Çalışma modunda verilen YANLIŞ cevabı defterine yazar (7 Eyl 2026).
  ///
  /// Kota harcamaz, puan/seri işlemez; doğruluğu SUNUCU belirler — istemcinin
  /// "yanlıştı" demesine güvenilmez. Ateşle-unut: başarısız olursa çalışma
  /// akışı kesilmez, yalnız o yanlış deftere düşmez.
  Future<void> calismaYanlisi({
    required String slug,
    required int sira,
    required String harf,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/cikmis-sinavlar/$slug/calisma-yanlisi',
        data: {'sira': sira, 'harf': harf},
      );
    } catch (_) {
      // Sessiz: defter beslemesi çalışmayı bloke etmemeli.
    }
  }

  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      final err = (e.response?.data is Map)
          ? (e.response?.data as Map)['error'] as Map?
          : null;
      throw ServerFailure(
        err?['message'] as String? ?? 'Çıkmış sınav yüklenemedi.',
      );
    }
  }
}

final cikmisSinavRepositoryProvider = Provider<CikmisSinavRepository>(
  (ref) => CikmisSinavRepository(ref.watch(dioProvider)),
);

/// Vitrin. `autoDispose` DEĞİL: dönem listesi seyrek değişir ve giriş kartının
/// alt satırını ("PAEM 9 ve 8 · 200 gerçek soru") her sekme dönüşünde yeniden
/// çekmek gereksiz istek üretirdi.
final cikmisSinavlarProvider = FutureProvider<List<CikmisSinavOzet>>(
  (ref) => ref.watch(cikmisSinavRepositoryProvider).list(),
);

final cikmisSinavDetayProvider =
    FutureProvider.autoDispose.family<CikmisSinavDetay, String>(
  (ref, slug) => ref.watch(cikmisSinavRepositoryProvider).detail(slug),
);
