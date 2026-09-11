import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IPTAL_EDILMEMIS } from './iptal-soru';
import { dailyQuestionPoolWhere } from './daily-select.logic';

const SRC = join(__dirname, '..');

/**
 * Sınavda iptal edilmiş soru hiçbir havuza girmez.
 *
 * Asıl kusur "bir sorgu yanlış yazıldı" değil, "yeni bir havuz sorgusu yazan
 * kişi bu kuralı bilmiyor" idi: iptal bayrağı Question'da değil, sınav bağında
 * (PastExamQuestion) duruyor ve havuz sorguları onu göremiyor. Bu yüzden test
 * TEK sorguyu değil, kuralı korur: soru havuzu kuran her dosyada
 * `currentVersionId: { not: null }` geçen her yer aynı sayıda
 * `...IPTAL_EDILMEMIS` taşımalı. Yeni bir havuz eklenip filtre unutulursa
 * burası kırmızıya döner.
 */
const KORUNAN: { dosya: string; muaf: number; neden: string }[] = [
  { dosya: 'modules/quiz/quiz.service.ts', muaf: 0, neden: '' },
  { dosya: 'modules/catalog/catalog.service.ts', muaf: 0, neden: '' },
  { dosya: 'modules/public/public.service.ts', muaf: 0, neden: '' },
  { dosya: 'common/daily-select.logic.ts', muaf: 0, neden: '' },
  {
    dosya: 'modules/admin/exams/admin-exams.service.ts',
    muaf: 1,
    neden:
      'setQuestions: admin soruları id vererek BİLEREK bağlar; oradaki süzgeç ' +
      '"yayınlanmamış ya da bulunamadı" hatasını yanıltıcı hâle getirirdi.',
  },
];

describe('IPTAL_EDILMEMIS', () => {
  it('sınav bağında iptal işaretli soruyu dışarıda bırakır', () => {
    expect(IPTAL_EDILMEMIS).toEqual({ pastExams: { none: { cancelled: true } } });
  });

  it('günün quizi havuzu iptal edilmiş soru sormaz', () => {
    expect(dailyQuestionPoolWhere()).toMatchObject(IPTAL_EDILMEMIS);
  });

  it.each(KORUNAN)('$dosya içindeki her havuz süzgeci iptali eler', ({ dosya, muaf }) => {
    const kod = readFileSync(join(SRC, dosya), 'utf8');
    const havuz = kod.match(/currentVersionId: \{ not: null \}/g)?.length ?? 0;
    const suzgec = kod.match(/\.\.\.IPTAL_EDILMEMIS/g)?.length ?? 0;
    expect(havuz).toBeGreaterThan(0);
    expect(suzgec).toBe(havuz - muaf);
  });
});
