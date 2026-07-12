import * as iconv from 'iconv-lite';
import { decodeText, mapRows, normalizeHeader, parseCsv, parseImportFile } from './import-parser';

const HEADER = 'soru;A;B;C;D;E;dogru;aciklama;zorluk';

function csv(...lines: string[]): Buffer {
  return Buffer.from([HEADER, ...lines].join('\n'), 'utf8');
}

describe('normalizeHeader', () => {
  it('Türkçe karakter ve büyük/küçük harfi normalize eder', () => {
    expect(normalizeHeader(' DOĞRU ')).toBe('dogru');
    expect(normalizeHeader('Açıklama')).toBe('aciklama');
    expect(normalizeHeader('SORU')).toBe('soru');
  });
});

describe('decodeText', () => {
  it('UTF-8 BOM temizlenir', () => {
    const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('soru', 'utf8')]);
    expect(decodeText(buf)).toBe('soru');
  });

  it('Windows-1254 (TR Excel) düşer ve Türkçe karakterler doğru çözülür', () => {
    const buf = iconv.encode('şığüöç DOĞRU', 'windows-1254');
    expect(decodeText(buf)).toBe('şığüöç DOĞRU');
  });
});

describe('parseCsv ayraç', () => {
  it('noktalı virgül (TR Excel) ve virgül ikisi de çalışır', () => {
    expect(parseCsv(Buffer.from('a;b;c'))[0]).toEqual(['a', 'b', 'c']);
    expect(parseCsv(Buffer.from('a,b,c'))[0]).toEqual(['a', 'b', 'c']);
  });
});

describe('mapRows doğrulama', () => {
  it('geçerli satırı ayrıştırır: doğru şık işaretli, zorluk eşlenmiş', () => {
    const r = mapRows(parseCsv(csv('TBMM üye tam sayısı kaçtır?;550;600;500;450;;B;2017 değişikliği;kolay')));
    expect(r.errors).toEqual([]);
    expect(r.valid).toHaveLength(1);
    const q = r.valid[0];
    expect(q.stem).toContain('TBMM');
    expect(q.options).toHaveLength(4);
    expect(q.options.find((o) => o.isCorrect)?.label).toBe('B');
    expect(q.difficulty).toBe('easy');
    expect(q.explanation).toBe('2017 değişikliği');
  });

  it('5 şık (E dolu) desteklenir', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;1;2;3;4;5;E;;zor')));
    expect(r.valid[0].options).toHaveLength(5);
    expect(r.valid[0].options.find((o) => o.isCorrect)?.label).toBe('E');
    expect(r.valid[0].difficulty).toBe('hard');
  });

  it('zorluk boşsa orta varsayılır', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;evet;hayır;;;;A;;')));
    expect(r.valid[0].difficulty).toBe('medium');
  });

  it("dogru harfi dolu şıklardan biri değilse hata", () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;evet;hayır;;;;C;;')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain("dogru");
  });

  it('tek şık hata; boş satır sessizce atlanır', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;tek;;;;;A;;', ';;;;;;;;')));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toContain('En az 2');
  });

  it('atlamalı şık (A,B boş D dolu) hata', () => {
    const r = mapRows(parseCsv(csv('Soru metni burada?;;;dolu;dolu;;C;;')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain('sıralı');
  });

  it('başlık yoksa net hata', () => {
    const r = mapRows(parseCsv(Buffer.from('bambaşka;bir;dosya\nx;y;z')));
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].message).toContain('Başlık satırı bulunamadı');
  });

  it('kısa soru kökü hata; satır numarası insan-dostu', () => {
    const r = mapRows(parseCsv(csv('ab;1;2;;;;A;;')));
    expect(r.errors[0]).toEqual({ rowNo: 2, message: expect.stringContaining('kısa') });
  });
});

describe('parseImportFile', () => {
  it('csv uzantısıyla uçtan uca çalışır', async () => {
    const r = await parseImportFile(csv('Geçerli bir soru mu?;evet;hayır;;;;A;;orta'), 'sorular.csv');
    expect(r.valid).toHaveLength(1);
    expect(r.totalRows).toBe(1);
  });
});
