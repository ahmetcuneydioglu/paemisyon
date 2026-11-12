import {
  initialDisplayName,
  isPlaceholderName,
  isRelayEmail,
  nameFor,
  nameFromMetadata,
  publicName,
} from './kisi-adi';

describe('kisi-adi', () => {
  describe('nameFromMetadata', () => {
    it('display_name → full_name → name sırasıyla okur', () => {
      expect(nameFromMetadata({ display_name: 'Paem Test', full_name: 'X Y' })).toBe('Paem Test');
      expect(nameFromMetadata({ full_name: 'Ahmet Yılmaz', name: 'A' })).toBe('Ahmet Yılmaz');
      expect(nameFromMetadata({ name: 'Ayşe Demir' })).toBe('Ayşe Demir');
    });
    it('boş, tek harf ve metin olmayan değerleri atlar; boşlukları sadeleştirir', () => {
      expect(nameFromMetadata({ display_name: ' ', full_name: 'A', name: 42 })).toBeNull();
      expect(nameFromMetadata({ full_name: '  Ahmet   Can  ' })).toBe('Ahmet Can');
      expect(nameFromMetadata(null)).toBeNull();
    });
  });

  describe('initialDisplayName', () => {
    it('metadata adı yoksa e-posta önekine, Apple gizli adresinde "Aday"a düşer', () => {
      expect(initialDisplayName({}, 'aday@example.com')).toBe('aday');
      expect(initialDisplayName({}, 'x7kd9f2q@privaterelay.appleid.com')).toBe('Aday');
      expect(initialDisplayName({ full_name: 'Ali Veli' }, 'x7@privaterelay.appleid.com')).toBe(
        'Ali Veli',
      );
    });
  });

  describe('isPlaceholderName', () => {
    it('yalnız e-postadan türemiş ya da boş/anonim adı yer tutucu sayar', () => {
      expect(isPlaceholderName('canahmettt', 'canahmettt@gmail.com')).toBe(true);
      expect(isPlaceholderName('Aday', 'x@privaterelay.appleid.com')).toBe(true);
      expect(isPlaceholderName('', 'a@b.com')).toBe(true);
      // Kullanıcının kendi verdiği ada dokunulmaz.
      expect(isPlaceholderName('Ahmet', 'canahmettt@gmail.com')).toBe(false);
    });
  });

  it('isRelayEmail büyük/küçük harfe duyarsız', () => {
    expect(isRelayEmail('A@PrivateRelay.AppleID.com')).toBe(true);
    expect(isRelayEmail('a@gmail.com')).toBe(false);
  });

  describe('publicName / nameFor', () => {
    it('başkalarına "Ad S." gösterir, kişinin kendisine tam adı', () => {
      expect(publicName('Ahmet Can Demir')).toBe('Ahmet D.');
      expect(publicName('ilker şahin')).toBe('ilker Ş.');
      expect(publicName('Mehmet')).toBe('Mehmet');
      expect(publicName('  ')).toBe('Aday');
      expect(publicName(publicName('Ahmet Demir'))).toBe('Ahmet D.');
      expect(nameFor('Ahmet Demir', true)).toBe('Ahmet Demir');
      expect(nameFor('Ahmet Demir', false)).toBe('Ahmet D.');
    });
  });
});
