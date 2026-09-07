import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/features/quiz/domain/quiz_models.dart';

/// Arşiv sınavında yarım oturumu sürdürme sözleşmesi (Doc 36, 7 Eyl 2026).
///
/// Her girişte yeni oturum açmak 100 soruluk bir sette acımasızdı: bir
/// kullanıcı altı dakikada yedi oturum açıp her seferinde sıfırdan başladı.
/// Cevaplar zaten sunucudaydı; eksik olan geri dönüş yoluydu.

Map<String, dynamic> _yanit({
  bool resumed = false,
  int? remaining,
  int planned = 7500,
  String? expired,
  List<String> cevaplanan = const [],
}) =>
    {
      'sessionId': 's1',
      'mode': 'exam',
      'plannedDurationSeconds': planned,
      if (remaining != null) 'remainingSeconds': remaining,
      'resumed': resumed,
      'expiredAttemptId': expired,
      'givenAnswers': [
        for (final q in cevaplanan)
          {'questionId': q, 'selectedOptionId': 'o1', 'isCorrect': true},
      ],
      'questions': [
        for (final q in ['q1', 'q2', 'q3'])
          {
            'questionId': q,
            'versionId': 'v_$q',
            'stem': '$q kökü',
            'options': [
              {'id': 'o1', 'label': 'A', 'text': 'A şıkkı'},
            ],
          },
      ],
    };

void main() {
  test('taze oturum: sayaç planlanan süreden başlar', () {
    final s = StartedSession.fromJson(_yanit(remaining: 7500));
    expect(s.resumed, isFalse);
    expect(s.sayacSaniye, 7500);
    expect(s.answeredQuestionIds, isEmpty);
  });

  test('sürdürülen oturum: sayaç KALAN süreden başlar', () {
    // Çıkıp girmek ek süre kazandırmamalı; yoksa "sınav gibi çöz" bir ölçüm
    // olmaktan çıkar. Acele etmeden çalışmanın yeri süresiz Çalışma modudur.
    final s = StartedSession.fromJson(
      _yanit(resumed: true, remaining: 900, cevaplanan: ['q1', 'q2']),
    );
    expect(s.resumed, isTrue);
    expect(s.sayacSaniye, 900);
    expect(s.plannedDurationSeconds, 7500);
    expect(s.answeredQuestionIds, {'q1', 'q2'});
  });

  test('sürdürülen oturumda ilk cevapsız sorudan devam edilir', () {
    final s = StartedSession.fromJson(
      _yanit(resumed: true, remaining: 900, cevaplanan: ['q1', 'q2']),
    );
    final i =
        s.questions.indexWhere((q) => !s.answeredQuestionIds.contains(q.questionId));
    expect(i, 2);
  });

  test('hepsi cevaplıysa index -1 — ekran doğrudan bitirir', () {
    final s = StartedSession.fromJson(
      _yanit(resumed: true, remaining: 60, cevaplanan: ['q1', 'q2', 'q3']),
    );
    expect(
      s.questions.indexWhere((q) => !s.answeredQuestionIds.contains(q.questionId)),
      -1,
    );
  });

  test('süresi dolan önceki deneme bildirilir', () {
    // Sessizce yeni oturum açmak "50 soru çözmüştüm, sıfırlandı" izlenimi
    // bırakırdı — kullanıcı kapatılan denemesinin kaydedildiğini bilmeli.
    final s = StartedSession.fromJson(_yanit(expired: 'eski-1', remaining: 7500));
    expect(s.expiredAttemptId, 'eski-1');
    expect(s.resumed, isFalse);
  });

  test('eski sunucu alanları göndermezse planlanan süreye düşer', () {
    final j = _yanit()..remove('remainingSeconds');
    final s = StartedSession.fromJson(j);
    expect(s.remainingSeconds, isNull);
    expect(s.sayacSaniye, 7500);
    expect(s.resumed, isFalse);
  });

  test('süresiz turda sayaç yok', () {
    final j = _yanit()
      ..remove('remainingSeconds')
      ..['plannedDurationSeconds'] = null;
    expect(StartedSession.fromJson(j).sayacSaniye, isNull);
  });

  test('devam eden tur özeti kalan süreyi taşır', () {
    final a = ActiveSession.fromJson(const {
      'sessionId': 's1',
      'mode': 'exam',
      'totalQuestions': 100,
      'answeredCount': 52,
      'scopeName': '2025 PAEM 9',
      'remainingSeconds': 1800,
      'resumable': true,
    });
    expect(a.remainingSeconds, 1800);
    expect(a.scopeName, '2025 PAEM 9');
    expect(a.answeredCount, 52);
  });
}
