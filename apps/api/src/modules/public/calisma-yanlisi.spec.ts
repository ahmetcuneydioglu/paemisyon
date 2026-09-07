import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CikmisSinavService } from './cikmis-sinav.service';

/**
 * Çalışma modu yanlış defteri ve dönem premium kapısı (Doc 36, 7 Eyl 2026).
 *
 * Çalışma modu sunucuda oturum açmaz; değerlendirme istemcide olur. Yanlışın
 * deftere yazılması bu yüzden ayrı bir uç ve doğruluğu SUNUCU belirler —
 * istemcinin "yanlıştı" demesine güvenilmez.
 */

/** Prisma taklidi — yalnız bu iki akışın dokunduğu yüzey. */
function prismaMock(opts: {
  bag?: {
    questionId: string;
    cancelled: boolean;
    versiyonDurumu: string | null;
    siklar: { label: string; isCorrect: boolean }[];
  } | null;
  donem?: { isPremium: boolean } | null;
}) {
  const yazilanlar: unknown[][] = [];
  return {
    yazilanlar,
    pastExamQuestion: {
      findFirst: async () =>
        opts.bag
          ? {
              questionId: opts.bag.questionId,
              cancelled: opts.bag.cancelled,
              question: {
                currentVersion: opts.bag.versiyonDurumu
                  ? { status: opts.bag.versiyonDurumu, options: opts.bag.siklar }
                  : null,
              },
            }
          : null,
    },
    pastExam: {
      findFirst: async () => opts.donem ?? null,
    },
    $executeRaw: async (...args: unknown[]) => {
      yazilanlar.push(args);
      return 1;
    },
  };
}

const sik = (label: string, isCorrect = false) => ({ label, isCorrect });

function servis(mock: ReturnType<typeof prismaMock>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new CikmisSinavService(mock as any);
}

describe('calismaYanlisi', () => {
  const dogruB = {
    questionId: 'q1',
    cancelled: false,
    versiyonDurumu: 'published',
    siklar: [sik('A'), sik('B', true), sik('C')],
  };

  it('yanlış şık deftere yazılır', async () => {
    const m = prismaMock({ bag: dogruB });
    const r = await servis(m).calismaYanlisi('u1', 'paem-9-2025', {
      sira: 9,
      harf: 'A',
    });
    expect(r.kaydedildi).toBe(true);
    expect(m.yazilanlar).toHaveLength(1);
  });

  it('doğru şıkta defter dolmaz', async () => {
    const m = prismaMock({ bag: dogruB });
    const r = await servis(m).calismaYanlisi('u1', 'paem-9-2025', {
      sira: 9,
      harf: 'B',
    });
    expect(r.kaydedildi).toBe(false);
    expect(m.yazilanlar).toHaveLength(0);
  });

  it('harf büyük/küçük farkı önemsiz', async () => {
    const m = prismaMock({ bag: dogruB });
    expect(
      (await servis(m).calismaYanlisi('u1', 'paem-9-2025', { sira: 9, harf: 'b' }))
        .kaydedildi,
    ).toBe(false);
  });

  it('iptal edilen soru deftere yazılmaz', async () => {
    // Sınavda puanlanmadı; adayın defterine "yanlış" diye düşmesi haksız olur.
    const m = prismaMock({ bag: { ...dogruB, cancelled: true } });
    const r = await servis(m).calismaYanlisi('u1', 'paem-9-2025', {
      sira: 9,
      harf: 'A',
    });
    expect(r.kaydedildi).toBe(false);
    expect(m.yazilanlar).toHaveLength(0);
  });

  it('sınavda olmayan soru reddedilir', async () => {
    await expect(
      servis(prismaMock({ bag: null })).calismaYanlisi('u1', 'paem-9-2025', {
        sira: 999,
        harf: 'A',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('yayına alınmamış soru reddedilir', async () => {
    await expect(
      servis(
        prismaMock({ bag: { ...dogruB, versiyonDurumu: 'in_review' } }),
      ).calismaYanlisi('u1', 'paem-9-2025', { sira: 9, harf: 'A' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('soruda olmayan şık reddedilir', async () => {
    await expect(
      servis(prismaMock({ bag: dogruB })).calismaYanlisi('u1', 'paem-9-2025', {
        sira: 9,
        harf: 'E',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('detailFull premium kapısı', () => {
  it('premium dönem, ücretsiz kullanıcıya kapalı', async () => {
    await expect(
      servis(prismaMock({ donem: { isPremium: true } })).detailFull(
        'paem-8-2024',
        { isPremium: false },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('yayında olmayan dönem 404', async () => {
    await expect(
      servis(prismaMock({ donem: null })).detailFull('yok', { isPremium: true }),
    ).rejects.toThrow(NotFoundException);
  });
});
