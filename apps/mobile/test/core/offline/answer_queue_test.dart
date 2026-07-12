import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/offline/answer_queue.dart';
import 'package:shared_preferences/shared_preferences.dart';

QueuedAnswer _mk({
  String session = 's1',
  String question = 'q1',
  String? option = 'o1',
  int at = 1000,
}) =>
    QueuedAnswer(
      sessionId: session,
      questionId: question,
      versionId: 'v1',
      selectedOptionId: option,
      timeSpentMs: 3000,
      createdAt: at,
    );

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('boş kuyruk', () async {
    final q = AnswerQueue();
    expect(await q.count(), 0);
    expect(await q.all(), isEmpty);
  });

  test('enqueue ekler ve kalıcıdır (JSON round-trip)', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk());
    expect(await q.count(), 1);

    // Yeni örnek (kalıcı depodan okuduğunu doğrula).
    final read = await AnswerQueue().all();
    expect(read.single.sessionId, 's1');
    expect(read.single.questionId, 'q1');
    expect(read.single.selectedOptionId, 'o1');
    expect(read.single.timeSpentMs, 3000);
  });

  test('aynı (oturum, soru) tekilleşir — son cevap kazanır', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk(option: 'o1', at: 1000));
    await q.enqueue(_mk(option: 'o2', at: 2000)); // aynı soru, farklı seçim
    expect(await q.count(), 1);
    expect((await q.all()).single.selectedOptionId, 'o2');
  });

  test('farklı soru ayrı kayıt', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk(question: 'q1'));
    await q.enqueue(_mk(question: 'q2'));
    expect(await q.count(), 2);
  });

  test('farklı oturum ayrı kayıt', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk(session: 's1'));
    await q.enqueue(_mk(session: 's2'));
    expect(await q.count(), 2);
  });

  test('replaceAll kuyruğu değiştirir', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk(question: 'q1'));
    await q.enqueue(_mk(question: 'q2'));
    await q.replaceAll([_mk(question: 'q3')]);
    final all = await q.all();
    expect(all.length, 1);
    expect(all.single.questionId, 'q3');
  });

  test('replaceAll([]) kuyruğu boşaltır', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk());
    await q.replaceAll([]);
    expect(await q.count(), 0);
  });

  test('boş seçim (boş bırakılan soru) korunur', () async {
    final q = AnswerQueue();
    await q.enqueue(_mk(option: null));
    expect((await q.all()).single.selectedOptionId, isNull);
  });
}
