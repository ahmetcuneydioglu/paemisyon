import {
  suggestTopic,
  suggestTopicForRow,
  suggestTopicFromSection,
  type TopicKeywordEntry,
} from './import-parser';

/** Gerçek Zabıt Kâtibi kitapçığındaki mevzuatlardan temsili konu seti. */
const TOPICS: TopicKeywordEntry[] = [
  { id: 't-anayasa', name: 'T.C. Anayasası', matchKeywords: ['T.C. Anayasası', 'Anayasa'] },
  { id: 't-657', name: '657 Devlet Memurları Kanunu', matchKeywords: ['657 sayılı', 'Devlet Memurları Kanunu'] },
  { id: 't-iyuk', name: '2577 İdari Yargılama Usulü Kanunu', matchKeywords: ['2577 sayılı', 'İdari Yargılama Usulü'] },
  { id: 't-harclar', name: '492 Harçlar Kanunu', matchKeywords: ['492 sayılı', 'Harçlar Kanunu'] },
  { id: 't-tebligat', name: '7201 Tebligat Kanunu', matchKeywords: ['7201 sayılı', 'Tebligat Kanunu'] },
];

describe('suggestTopic (Doc 20 keyword sınıflandırma)', () => {
  it('kök başındaki "T.C. Anayasası" → Anayasa konusu', () => {
    const s = suggestTopic(
      "T.C. Anayasası'nda, aşağıdakilerden hangisi değiştirilemeyecek hükümler arasında sayılmamıştır?",
      TOPICS,
    );
    expect(s?.id).toBe('t-anayasa');
  });

  it('kanun numarası → doğru mevzuat (657)', () => {
    const s = suggestTopic("657 sayılı Kanun'a göre memurun ödevleri arasında…", TOPICS);
    expect(s?.id).toBe('t-657');
    expect(s?.matchedKeyword).toBe('657 sayılı');
  });

  it('kanun adı kökün SONUNDA geçse de yakalanır (boşluk doldurmalı soru)', () => {
    const s = suggestTopic(
      'Yukarıdaki boşluğa aşağıdakilerden hangisi gelmelidir? Bu düzenleme 492 sayılı Harçlar Kanunu’na göredir.',
      TOPICS,
    );
    expect(s?.id).toBe('t-harclar');
  });

  it('TR-duyarlı: büyük/küçük harf farkı eşleşmeyi bozmaz (İYUK)', () => {
    const s = suggestTopic('2577 SAYILI İDARİ YARGILAMA USULÜ KANUNU’na göre…', TOPICS);
    expect(s?.id).toBe('t-iyuk');
  });

  it('anahtar kelimesiz soru (Türkçe/etik) → null', () => {
    expect(
      suggestTopic('Aşağıdaki cümlelerin hangisinde yazım yanlışı vardır?', TOPICS),
    ).toBeNull();
  });

  it('birden çok eşleşmede EN UZUN keyword kazanır (en özgül konu)', () => {
    const topics: TopicKeywordEntry[] = [
      { id: 'genel', name: 'Genel', matchKeywords: ['Kanun'] },
      { id: 'ozgul', name: '657', matchKeywords: ['657 sayılı Kanun'] },
    ];
    const s = suggestTopic("657 sayılı Kanun'a göre…", topics);
    expect(s?.id).toBe('ozgul');
  });

  it('boş keyword listesi olan konu eşleşmeye katılmaz', () => {
    const topics: TopicKeywordEntry[] = [{ id: 'x', name: 'X', matchKeywords: [] }];
    expect(suggestTopic('herhangi bir metin', topics)).toBeNull();
  });

  it('5271 sayılı Ceza Muhakemesi Kanunu → DB adı C.M.K olsa da eşleşir', () => {
    const topics: TopicKeywordEntry[] = [{
      id: 'cmk',
      name: 'C.M.K',
      courseName: 'Ceza Muhakemesi Hukuku',
      matchKeywords: ['5271 sayılı', 'Ceza Muhakemesi Kanunu', 'CMK'],
    }];
    const s = suggestTopic("5271 sayılı Ceza Muhakemesi Kanunu'na göre hâkimin reddi…", topics);
    expect(s?.id).toBe('cmk');
    expect(s?.matchedKeyword).toBe('Ceza Muhakemesi Kanunu');
  });

  it('C.M.K ve CMK noktalama farkını yok sayar', () => {
    const topics: TopicKeywordEntry[] = [{ id: 'cmk', name: 'C.M.K', matchKeywords: [] }];
    expect(suggestTopic('CMK kapsamında koruma tedbirleri…', topics)?.id).toBe('cmk');
  });

  it('keyword boşsa ders adı güvenli fallback olur', () => {
    const topics: TopicKeywordEntry[] = [{
      id: 'inkilap',
      name: 'İnkilap Tarihi',
      courseName: 'Atatürk İlkeleri ve İnkılap Tarihi',
      matchKeywords: [],
    }];
    expect(
      suggestTopic("Atatürk İlkeleri ve İnkılap Tarihi kapsamında aşağıdakilerden hangisi…", topics)?.id,
    ).toBe('inkilap');
  });

  it('İnkılap Tarihi ayırt edici olay anahtarından eşleşir', () => {
    const topics: TopicKeywordEntry[] = [{
      id: 'inkilap',
      name: 'Atatürk İlkeleri ve İnkılap Tarihi',
      matchKeywords: ['Erzurum Kongresi', 'Misak-ı Millî', 'Lozan Antlaşması'],
    }];
    expect(suggestTopic("Erzurum Kongresi'nde alınan kararlardan biri…", topics)?.id).toBe('inkilap');
  });
});

describe('suggestTopicFromSection (kitapçık bölüm planı)', () => {
  const topics: TopicKeywordEntry[] = [
    { id: 'idare', name: 'İdare Hukuku', courseName: 'İdare Hukuku', matchKeywords: [] },
    { id: 'genel', name: 'Genel Kültür', courseName: 'Genel Kültür ve Analitik Düşünme', matchKeywords: [] },
    { id: 'turkce', name: 'Türkçe / Dil Bilgisi', courseName: 'Genel Kültür ve Analitik Düşünme', matchKeywords: ['yazım'] },
    { id: 'cmk', name: 'C.M.K', courseName: 'Ceza Muhakemesi Hukuku', matchKeywords: ['5271'] },
    { id: 'polis-1', name: 'PVSK', courseName: 'Polis Mevzuatı', matchKeywords: ['2559'] },
    { id: 'polis-2', name: 'Disiplin', courseName: 'Polis Mevzuatı', matchKeywords: ['7068'] },
  ];

  it('İdare Hukuku bölümünü aynı adlı genel konuya atar', () => {
    expect(suggestTopicFromSection('İdare Hukuku', topics)?.id).toBe('idare');
  });

  it('Genel Kültür bölümünü geniş adlı ders içindeki aynı konuya atar', () => {
    expect(suggestTopicFromSection('Genel Kültür', topics)?.id).toBe('genel');
  });

  it('tek konulu dersi o konuya atar', () => {
    expect(suggestTopicFromSection('Ceza Muhakemesi Hukuku', topics)?.id).toBe('cmk');
  });

  it('çok konulu ve genel hedefi olmayan Polis Mevzuatında tahmin yapmaz', () => {
    expect(suggestTopicFromSection('Polis Mevzuatı', topics)).toBeNull();
  });
});

describe('suggestTopicForRow (bölüm sınırı + keyword inceltme)', () => {
  const topics: TopicKeywordEntry[] = [
    { id: 'genel', name: 'Genel Kültür', courseName: 'Genel Kültür ve Analitik Düşünme', matchKeywords: [] },
    { id: 'inkilap', name: 'Atatürk İlkeleri ve İnkılap Tarihi', courseName: 'Atatürk İlkeleri ve İnkılap Tarihi', matchKeywords: ['Atatürk'] },
    { id: 'anayasa-genel', name: 'Anayasa', courseName: 'Anayasa Hukuku', matchKeywords: [] },
    { id: 'anayasa-tc', name: 'T.C. Anayasası', courseName: 'Anayasa Hukuku', matchKeywords: ['T.C. Anayasası'] },
  ];

  it('başka ders keywordü bölüm planını ezemez', () => {
    const s = suggestTopicForRow("Atatürk'ün bu sözünde boş bırakılan yerlere…", 'Genel Kültür', topics);
    expect(s?.id).toBe('genel');
    expect(s?.matchedKeyword).toBe('Bölüm planı: Genel Kültür');
  });

  it('aynı ders içindeki özel keyword genel bölüm hedefini inceltir', () => {
    const s = suggestTopicForRow("T.C. Anayasası'na göre aşağıdakilerden hangisi…", 'Anayasa Hukuku', topics);
    expect(s?.id).toBe('anayasa-tc');
  });
});
