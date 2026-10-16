import { maddeNoAyristir } from './madde-no';

describe('maddeNoAyristir (Doc 49 S1-B)', () => {
  it('tek madde olduğu gibi', () => {
    expect(maddeNoAyristir('16')).toEqual({
      tur: 'tek',
      primary: '16',
      related: [],
      fikraDustu: false,
    });
    expect(maddeNoAyristir(' Ek 1 ')).toMatchObject({ tur: 'tek', primary: 'Ek 1' });
    expect(maddeNoAyristir('Geçici 2')).toMatchObject({ primary: 'Geçici 2' });
  });
  it('harfli ek maddenin kendisidir, fıkra sayılmaz', () => {
    expect(maddeNoAyristir('4/A')).toMatchObject({ tur: 'tek', primary: '4/A', fikraDustu: false });
  });
  it('sayısal fıkra eki düşer', () => {
    expect(maddeNoAyristir('219/1')).toMatchObject({
      tur: 'tek',
      primary: '219',
      fikraDustu: true,
    });
    expect(maddeNoAyristir('48/6')).toMatchObject({ primary: '48' });
  });
  it('liste: ilk primary, kalan related; boşluksuz virgül de olur', () => {
    expect(maddeNoAyristir('43, 44, 81')).toEqual({
      tur: 'liste',
      primary: '43',
      related: ['44', '81'],
      fikraDustu: false,
    });
    expect(maddeNoAyristir('8,12,14')).toMatchObject({ primary: '8', related: ['12', '14'] });
    expect(maddeNoAyristir('159, 146, 74, 94')).toMatchObject({ related: ['146', '74', '94'] });
  });
  it('listede tekrar ve fıkra tekilleşir', () => {
    expect(maddeNoAyristir('43, 43/2, 44')).toMatchObject({
      primary: '43',
      related: ['44'],
      fikraDustu: true,
    });
  });
  it('aralık bağlanmaz', () => {
    expect(maddeNoAyristir('45-49')).toEqual({
      tur: 'aralik',
      primary: null,
      related: [],
      fikraDustu: false,
    });
    expect(maddeNoAyristir('45 – 49')).toMatchObject({ tur: 'aralik' });
  });
  it('boş/null', () => {
    expect(maddeNoAyristir(null)).toMatchObject({ tur: 'bos', primary: null });
    expect(maddeNoAyristir('  ')).toMatchObject({ tur: 'bos' });
    expect(maddeNoAyristir(',')).toMatchObject({ tur: 'bos' });
  });
});
