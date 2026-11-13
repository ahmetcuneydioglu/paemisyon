import { zamanlanmisGorevlerAcik } from './zamanlayici';

describe('zamanlanmisGorevlerAcik', () => {
  it('yerelde (RAILWAY yok) kapalı, Railway’de açık', () => {
    expect(zamanlanmisGorevlerAcik({})).toBe(false);
    expect(zamanlanmisGorevlerAcik({ RAILWAY_ENVIRONMENT_NAME: 'production' })).toBe(true);
    expect(zamanlanmisGorevlerAcik({ RAILWAY_PROJECT_ID: 'x' })).toBe(true);
  });
  it('CRON_ENABLED her şeyi ezer', () => {
    expect(zamanlanmisGorevlerAcik({ CRON_ENABLED: '1' })).toBe(true);
    expect(
      zamanlanmisGorevlerAcik({ CRON_ENABLED: '0', RAILWAY_ENVIRONMENT_NAME: 'production' }),
    ).toBe(false);
  });
});
