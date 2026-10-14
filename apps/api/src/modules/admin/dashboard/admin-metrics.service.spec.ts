import type { Prisma } from '@prisma/client';
import { GUN_KAYMASI_MS, gunAnahtari } from '../../../common/gun';
import { YARIM_TUR_MODLARI } from '../../quiz/yarim-tur';
import { AdminMetricsService } from './admin-metrics.service';

/**
 * Anasayfa metrikleri (Doc 48 Faz 5). Sorgular salt okuma; burada pencere
 * hesabı, uygulama günü tanımıyla tutarlılık ve sonuç eşlemesi kilitlenir.
 */

const SABAH = new Date('2026-10-14T03:40:00Z'); // TR 06.40 — 14 Ekim uygulama günü
const GECE = new Date('2026-10-14T00:30:00Z'); // TR 03.30 — hâlâ 13 Ekim

type YarimSatir = { open: number; users_with_multiple: number; oldest: Date | null };

function kur(yarim: YarimSatir[] = [{ open: 0, users_with_multiple: 0, oldest: null }]) {
  const prisma = {
    $queryRaw: jest.fn(async (q: Prisma.Sql) => {
      if (q.sql.includes('WITH tur')) return yarim;
      if (q.sql.includes('starts_with')) return [{ scope: 'topic', started: 3, completed: 2 }];
      return [
        { day: '2026-10-14', source: 'home_task', started: 5, completed: 4, abandoned: 0, inProgress: 1 },
      ];
    }),
    dailyFocus: { groupBy: jest.fn(async () => [{ kind: 'topic', _count: { _all: 2 } }]) },
    user: { count: jest.fn(async () => 3) },
  };
  const settings = { mobilAnasayfaV2: jest.fn(async () => false) };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { servis: new AdminMetricsService(prisma as any, settings as any), prisma };
}

/** Metninde [parca] geçen sorgu. */
function sorgu(prisma: ReturnType<typeof kur>['prisma'], parca: string): Prisma.Sql {
  const cagri = prisma.$queryRaw.mock.calls.find(([q]) => q.sql.includes(parca));
  if (!cagri) throw new Error(`"${parca}" içeren sorgu yok`);
  return cagri[0];
}

const MODLAR = `qs.mode IN (${YARIM_TUR_MODLARI.map((m) => `'${m}'`).join(', ')})`;

describe('AdminMetricsService.homeV2', () => {
  it('pencere = bugün dahil son N uygulama günü, başı TR 04.00', async () => {
    const { servis, prisma } = kur();
    const m = await servis.homeV2(14, SABAH);
    expect(m.days).toBe(14);
    expect(m.from).toBe('2026-10-01');
    expect(sorgu(prisma, 'GROUP BY 1, 2').values).toContainEqual(new Date('2026-10-01T01:00:00Z'));
  });

  it('TR 04.00 öncesi bir önceki uygulama gününe sayılır', async () => {
    const { servis } = kur();
    expect((await servis.homeV2(1, GECE)).from).toBe('2026-10-13');
  });

  it('gün sayısı 1–60 aralığına kırpılır', async () => {
    const { servis } = kur();
    expect((await servis.homeV2(0, SABAH)).days).toBe(1);
    expect((await servis.homeV2(500, SABAH)).days).toBe(60);
    expect((await servis.homeV2(Number.NaN, SABAH)).days).toBe(14);
  });

  it('günlük satırlar uygulama gününe göre gruplanır — gun.ts ile aynı sınır', async () => {
    // SQL'deki "1 hour" GUN_KAYMASI_MS'in kendisidir; sınır değişirse ikisi
    // birlikte değişmeli.
    expect(GUN_KAYMASI_MS).toBe(3_600_000);
    const { servis, prisma } = kur();
    const m = await servis.homeV2(14, SABAH);
    const s = sorgu(prisma, 'GROUP BY 1, 2').sql;
    expect(s).toContain("(qs.started_at - interval '1 hour')::date");
    expect(s).toContain(MODLAR);
    expect(m.daily).toHaveLength(1);
  });

  it('kapsam yalnız ana sayfa turlarından, odak türü anahtarlarıyla', async () => {
    const { servis, prisma } = kur();
    const m = await servis.homeV2(14, SABAH);
    const s = sorgu(prisma, 'starts_with').sql;
    expect(s).toContain("starts_with(qs.source, 'home_')");
    for (const k of ['coach', 'course', 'topic', 'wrongs']) expect(s).toContain(`'${k}'`);
    expect(m.homeScope).toEqual([{ scope: 'topic', started: 3, completed: 2 }]);
  });

  it('bugünün odakları uygulama günü anahtarıyla okunur', async () => {
    const { servis, prisma } = kur();
    const m = await servis.homeV2(14, GECE);
    expect(prisma.dailyFocus.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { day: gunAnahtari(GECE) } }),
    );
    expect(gunAnahtari(GECE)).toEqual(new Date('2026-10-13T00:00:00Z'));
    expect(m.focusToday).toEqual([{ kind: 'topic', users: 2 }]);
  });

  it('yarım tur: cron ile aynı filtre, en eski turun yaşı tam gün', async () => {
    const { servis, prisma } = kur([
      { open: 4, users_with_multiple: 1, oldest: new Date('2026-10-10T15:00:00Z') },
    ]);
    const m = await servis.homeV2(14, SABAH);
    const s = sorgu(prisma, 'WITH tur').sql;
    expect(s).toContain("qs.status = 'in_progress'");
    expect(s).toContain(MODLAR);
    expect(m.halfTours).toEqual({ open: 4, usersWithMultiple: 1, oldestActivityDays: 3 });
  });

  it('açık tur yoksa yaş boş', async () => {
    const { servis } = kur();
    const m = await servis.homeV2(14, SABAH);
    expect(m.halfTours).toEqual({ open: 0, usersWithMultiple: 0, oldestActivityDays: null });
  });

  it('kohort: bayrak ve silinmemiş admin+beta kullanıcıları (homeV2Acik ile aynı roller)', async () => {
    const { servis, prisma } = kur();
    const m = await servis.homeV2(14, SABAH);
    expect(m.cohort).toEqual({ flagOn: false, betaOrAdminUsers: 3 });
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { deletedAt: null, roles: { some: { role: { key: { in: ['admin', 'beta'] } } } } },
    });
  });
});
