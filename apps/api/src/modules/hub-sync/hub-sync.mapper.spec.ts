import { readFileSync } from 'fs';
import { join } from 'path';
import {
  articleNoFor,
  mapDifficulty,
  mapQuestion,
  mapSourceLabel,
  type ExistingQuestion,
  type ResolvedLink,
} from './hub-sync.mapper';
import type { HubQuestionPayload } from './hub-sync.types';
import { richTextToPlain } from './rich-text';
import { hubOptionId } from './uuid-v5';

/** Kayıtlı yük örnekleri: yerel merkezden 2 Kas 2026'da alındı (Doc 55 F1). */
const fixture = (name: string): HubQuestionPayload =>
  (JSON.parse(readFileSync(join(__dirname, '__fixtures__', `${name}.json`), 'utf8')) as { payload: HubQuestionPayload }).payload;

const now = new Date('2026-11-02T12:00:00Z');

function existingFrom(payload: HubQuestionPayload, over: Partial<ExistingQuestion> = {}): ExistingQuestion {
  // PAEMİSYON'daki mevcut soru = yükle AYNI içerik (S2 kökeni).
  const options = [...payload.options]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((o, i) => ({ label: o.key, text: richTextToPlain(o.content), isCorrect: o.is_correct, sortOrder: i }));
  return {
    id: payload.question.local_id ?? '11111111-1111-4111-8111-111111111111',
    topicId: 'topic-paem',
    articleNo: null,
    deletedAt: null,
    hubQuestionId: null,
    hubCode: null,
    maxVersionNo: 1,
    hubVersionIds: [],
    current: {
      id: 'ver-1',
      versionNo: 1,
      status: 'published',
      stem: richTextToPlain(payload.version.stem),
      explanation: richTextToPlain(payload.version.detailed_solution) || null,
      difficulty: 'medium',
      sourceLabel: 'JSPS soru bankası',
      hubVersionId: null,
      options,
    },
    ...over,
  };
}

const link = (over: Partial<ResolvedLink> = {}): ResolvedLink => ({
  role: 'required',
  articleKey: '167',
  legislationId: 'leg-paem',
  legislationTopicId: 'topic-paem',
  legislationName: 'TCK',
  lawArticleId: 'art-167',
  ...over,
});

describe('mapQuestion (Doc 55 §3 eşleme kuralları)', () => {
  it('mevcut soruya ilk yük, içerik aynı → sürüm açılmaz, yalnız kimlikler (link-existing)', () => {
    const payload = fixture('question-local-required');
    const plan = mapQuestion({ payload, existing: existingFrom(payload), topicId: null, links: [link()], now });
    expect(plan.kind).toBe('link-existing');
    if (plan.kind !== 'link-existing') return;
    expect(plan.hubQuestionId).toBe(payload.question.id);
    expect(plan.hubVersionId).toBe(payload.version.id);
    expect(plan.hubCode).toBe('SM-000128');
    expect(plan.articles).toEqual([{ lawArticleId: 'art-167', relation: 'primary' }]);
    expect(plan.articleNo).toBe('167'); // zorunlu bağ sorunun konusunun kanunu → atlas etiketi
  });

  it('içerik farklı (merkezde düzeltme) → versionNo+1 yeni sürüm, id = merkez sürüm id, seçenek id = v5', () => {
    const payload = fixture('question-local-nolinks');
    const existing = existingFrom(payload);
    existing.current!.options[0].text = 'ESKİ ŞIK METNİ';
    const plan = mapQuestion({ payload, existing, topicId: null, links: [], now });
    expect(plan.kind).toBe('new-version');
    if (plan.kind !== 'new-version') return;
    expect(plan.version.id).toBe(payload.version.id);
    expect(plan.version.versionNo).toBe(2);
    expect(plan.topicId).toBe('topic-paem'); // mevcut sorunun konusu değişmez
    expect(plan.archivePreviousVersionId).toBe('ver-1');
    expect(plan.options.map((o) => o.label)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(plan.options[0].id).toBe(hubOptionId(payload.version.id, 'A'));
    expect(plan.version.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(plan.version.sourceLabel).toBe('JSPS soru bankası');
  });

  it('yalnız açıklama farklı da yeni sürümdür (açıklama karşılaştırmaya girer)', () => {
    const payload = fixture('question-local-required');
    const existing = existingFrom(payload);
    existing.current!.explanation = 'Eski açıklama';
    const plan = mapQuestion({ payload, existing, topicId: null, links: [], now });
    expect(plan.kind).toBe('new-version');
  });

  it('merkezde doğrulanmış AI sorusu (local_id yok) → yeni soru, doğrudan yayımlı, ayırt edici kaynak', () => {
    const payload = fixture('question-ai-new');
    const plan = mapQuestion({ payload, existing: null, topicId: 'topic-paem', links: [link({ articleKey: '14', lawArticleId: 'art-14' })], now });
    expect(plan.kind).toBe('create');
    if (plan.kind !== 'create') return;
    expect(plan.questionId).toBeNull();
    expect(plan.version.versionNo).toBe(1);
    expect(plan.version.sourceLabel).toBe('Soru Merkezi mevzuat türetimi');
    expect(plan.legalReferences).toEqual(['TCK md. 14']);
    expect(plan.articleNo).toBe('14');
    expect(plan.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it('yeni soru, konu eşlemesi yok → atlanır (unmapped) ve merkeze hata ile ack', () => {
    const payload = fixture('question-ai-new');
    const plan = mapQuestion({ payload, existing: null, topicId: null, links: [], now });
    expect(plan).toMatchObject({ kind: 'skip', reason: 'no-topic' });
  });

  it('idempotent: güncel sürüm zaten bu merkez sürümüyse hiçbir şey yapılmaz; eski sürüm geri yazılmaz', () => {
    const payload = fixture('question-local-required');
    const current = existingFrom(payload, { hubVersionIds: [payload.version.id] });
    current.current!.hubVersionId = payload.version.id;
    expect(mapQuestion({ payload, existing: current, topicId: null, links: [], now })).toMatchObject({ kind: 'skip', reason: 'already-current' });
    const newer = existingFrom(payload, { hubVersionIds: [payload.version.id, 'newer'] });
    newer.current!.hubVersionId = 'newer';
    expect(mapQuestion({ payload, existing: newer, topicId: null, links: [], now })).toMatchObject({ kind: 'skip', reason: 'stale' });
  });

  it('supporting bağ related, required primary; atıf metni kısa ad + PAEMİSYON madde biçimi', () => {
    const payload = fixture('question-human-supporting');
    const links = [
      link({ role: 'supporting', articleKey: '147', lawArticleId: 'art-147', legislationName: 'CMK', legislationTopicId: 'topic-cmk' }),
      link({ role: 'required', articleKey: '148', lawArticleId: 'art-148', legislationName: 'CMK', legislationTopicId: 'topic-cmk' }),
    ];
    const existing = existingFrom(payload, { topicId: 'topic-paem', articleNo: '99' });
    existing.current!.stem = 'farklı kök';
    const plan = mapQuestion({ payload, existing, topicId: null, links, now });
    expect(plan.kind).toBe('new-version');
    if (plan.kind !== 'new-version') return;
    expect(plan.articles).toEqual([
      { lawArticleId: 'art-147', relation: 'related' },
      { lawArticleId: 'art-148', relation: 'primary' },
    ]);
    expect(plan.legalReferences).toEqual(['CMK md. 147', 'CMK md. 148']);
    // Zorunlu bağın kanunu sorunun konusu değil → atlas etiketi korunur.
    expect(plan.articleNo).toBe('99');
  });

  it('iptal işaretli soru: mevcutsa yalnız bağlanır, yeniyse havuza alınmaz', () => {
    const payload = { ...fixture('question-ai-new'), question: { ...fixture('question-ai-new').question, cancelled: true } };
    expect(mapQuestion({ payload, existing: null, topicId: 'topic-paem', links: [], now })).toMatchObject({ kind: 'skip', reason: 'cancelled-new' });
  });

  it('silinmiş (geri çekilmiş) soruya yeniden upsert → canlandırılır', () => {
    const payload = fixture('question-local-required');
    const plan = mapQuestion({ payload, existing: existingFrom(payload, { deletedAt: new Date() }), topicId: null, links: [], now });
    expect(plan).toMatchObject({ kind: 'link-existing', revive: true });
  });
});

describe('küçük eşlemeler', () => {
  it('zorluk 1–2 easy, 3 medium, 4–5 hard', () => {
    expect([1, 2, 3, 4, 5].map(mapDifficulty)).toEqual(['easy', 'easy', 'medium', 'hard', 'hard']);
  });
  it('kaynaksız merkez kaynağı etiket üretmez; merkez AI kaynağı korunur', () => {
    expect(mapSourceLabel('Kaynak belirtilmemiş (PAEMİSYON)')).toBeNull();
    expect(mapSourceLabel('Soru Merkezi mevzuat türetimi')).toBe('Soru Merkezi mevzuat türetimi');
    expect(mapSourceLabel(null)).toBeNull();
  });
  it('articleNo yalnız konunun kanunundaki zorunlu bağdan yazılır', () => {
    expect(articleNoFor([link({ articleKey: 'ek 7' })], 'topic-paem', null)).toBe('Ek 7');
    expect(articleNoFor([link({ legislationTopicId: 'baska' })], 'topic-paem', '5')).toBe('5');
    expect(articleNoFor([], 'topic-paem', null)).toBeNull();
  });
});
