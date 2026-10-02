import {
  isApplePrivateRelay,
  isRoleAddress,
  parseLegacyUsers,
  planLegacyImport,
  summarizeSkips,
} from './contact-import.logic';

const DUMP = `
INSERT INTO \`users\` (\`id\`, \`firebase_id\`, \`name\`, \`email\`, \`mobile\`, \`type\`, \`profile\`, \`fcm_id\`, \`coins\`, \`refer_code\`, \`friends_code\`, \`ip_address\`, \`status\`, \`date_registered\`) VALUES
(1, 'fb1', 'Ayşe O\\'Neil', 'AYSE@Example.com', '', 'gmail', '', NULL, 0, NULL, NULL, '', 1, '2021-03-04 10:00:00'),
(2, 'fb2', 'Eski Ayşe', 'ayse@example.com', '', 'email', '', NULL, 0, NULL, NULL, '', 1, '2020-01-01 09:00:00'),
(3, 'fb3', 'Bilgi', 'info@example.com', '', 'email', '', NULL, 0, NULL, NULL, '', 1, '2022-05-05 09:00:00'),
(4, 'fb4', 'Apple', 'abc@privaterelay.appleid.com', '', 'apple', '', NULL, 0, NULL, NULL, '', 1, '2022-05-05 09:00:00'),
(5, 'fb5', 'Bozuk', 'bozuk-adres', '', 'email', '', NULL, 0, NULL, NULL, '', 1, '2022-05-05 09:00:00'),
(6, 'fb6', 'Canlı', 'canli@example.com', '', 'email', '', NULL, 0, NULL, NULL, '', 1, '2023-07-07 09:00:00'),
(7, 'fb7', '', 'yeni@example.com', '', 'email', '', NULL, 0, NULL, NULL, '', 1, '2023-12-31 23:59:59');
`;

describe('eski döküm ayrıştırma', () => {
  it('kaçışlı tırnak ve normalize e-posta', () => {
    const rows = parseLegacyUsers(DUMP);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({
      legacyId: '1',
      name: "Ayşe O'Neil",
      email: 'ayse@example.com',
    });
    expect(rows[0].registeredAt?.getUTCFullYear()).toBe(2021);
  });
});

describe('aktarım planı', () => {
  const plan = planLegacyImport(parseLegacyUsers(DUMP), new Set(['canli@example.com']));

  it('mükerrerde en son kayıt kazanır, adı korunur', () => {
    const ayse = plan.candidates.find((c) => c.email === 'ayse@example.com');
    expect(ayse).toMatchObject({ displayName: "Ayşe O'Neil", legacyYear: 2021, legacyId: '1' });
  });

  it('rol adresi, Apple gizli aktarma, bozuk biçim ve canlı kullanıcı elenir', () => {
    expect(summarizeSkips(plan.skipped)).toEqual({
      gecersiz_bicim: 1,
      rol_adresi: 1,
      apple_gizli_aktarma: 1,
      mukerrer: 1,
      canli_kullanici: 1,
    });
    expect(plan.candidates.map((c) => c.email).sort()).toEqual([
      'ayse@example.com',
      'yeni@example.com',
    ]);
  });

  it('boş ad null olur', () => {
    expect(plan.candidates.find((c) => c.email === 'yeni@example.com')?.displayName).toBeNull();
  });

  it('yardımcılar', () => {
    expect(isRoleAddress('destek@x.com')).toBe(true);
    expect(isRoleAddress('ahmet@x.com')).toBe(false);
    expect(isApplePrivateRelay('a@privaterelay.appleid.com')).toBe(true);
  });
});
