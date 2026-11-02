import { HubPermanentError, HubTemporaryError } from './hub-sync.client';
import { HUB_REPORT_MAX_TRIES, HubReportForwarder } from './hub-report-forwarder';
import type { PrismaService } from '../../infra/prisma/prisma.service';

type Row = {
  id: string;
  message: string;
  questionId: string;
  hubForwardedAt: Date | null;
  hubForwardTries: number;
  question: { hubQuestionId: string | null; hubCode: string | null };
};

function makePrisma(rows: Row[], solveCount = 7) {
  const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> = [];
  const prisma = {
    questionReport: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        rows.find((r) => r.id === where.id) ?? null,
      update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
        updates.push(args);
        return args;
      },
      findMany: async () =>
        rows
          .filter(
            (r) =>
              !r.hubForwardedAt &&
              r.question.hubQuestionId &&
              r.hubForwardTries < HUB_REPORT_MAX_TRIES,
          )
          .map((r) => ({ id: r.id })),
      count: async () => 0,
    },
    quizAnswer: { count: async () => solveCount },
  } as unknown as PrismaService;
  return { prisma, updates };
}

const hubRow: Row = {
  id: 'r-1',
  message: '  Cevap anahtarı yanlış görünüyor.  ',
  questionId: 'q-1',
  hubForwardedAt: null,
  hubForwardTries: 0,
  question: { hubQuestionId: '11111111-1111-4111-8111-111111111111', hubCode: 'SM-000001' },
};

describe('HubReportForwarder (Doc 55 §5)', () => {
  it('merkez sorusu: dış kimlik = bildirim id, kişisel veri yok, çözüm sayısı toplam', async () => {
    const calls: unknown[] = [];
    const client = {
      report: async (b: unknown) => (
        calls.push(b),
        { status: 201, body: { reportId: 'm-1', created: true, flagged: false } }
      ),
    };
    const { prisma, updates } = makePrisma([hubRow], 42);
    const f = new HubReportForwarder(prisma, client as never, { enabled: true, cron: false });
    expect(await f.forward('r-1')).toEqual({ reportId: 'r-1', outcome: 'sent', flagged: false });
    expect(calls[0]).toEqual({
      external_report_id: 'r-1',
      question_id: hubRow.question.hubQuestionId,
      reason_code: 'user_report',
      description: 'Cevap anahtarı yanlış görünüyor.',
      solve_count: 42,
    });
    // Sözleşme alanları dışında hiçbir şey gitmez (kullanıcı kimliği, e-posta yok).
    expect(Object.keys(calls[0] as object).sort()).toEqual([
      'description',
      'external_report_id',
      'question_id',
      'reason_code',
      'solve_count',
    ]);
    expect(updates[0].data).toMatchObject({
      hubReportId: 'm-1',
      hubFlagged: false,
      hubForwardError: null,
    });
    expect(updates[0].data.hubForwardedAt).toBeInstanceOf(Date);
  });

  it('merkez aynı kimliği ikinci kez alırsa duplicate; satır yine iletildi sayılır', async () => {
    const client = {
      report: async () => ({
        status: 200,
        body: { reportId: 'm-1', created: false, flagged: true },
      }),
    };
    const { prisma, updates } = makePrisma([hubRow]);
    const f = new HubReportForwarder(prisma, client as never, { enabled: true, cron: false });
    expect((await f.forward('r-1')).outcome).toBe('duplicate');
    expect(updates[0].data).toMatchObject({ hubFlagged: true });
  });

  it('PAEMİSYON sorusu iletilmez; iletilmiş olan yeniden gitmez', async () => {
    const client = { report: jest.fn() };
    const { prisma } = makePrisma([
      { ...hubRow, id: 'r-yerel', question: { hubQuestionId: null, hubCode: null } },
      { ...hubRow, id: 'r-gitti', hubForwardedAt: new Date() },
    ]);
    const f = new HubReportForwarder(prisma, client as never, { enabled: true, cron: false });
    expect((await f.forward('r-yerel')).outcome).toBe('not-hub');
    expect((await f.forward('r-gitti')).outcome).toBe('already');
    expect((await f.forward('r-yok')).outcome).toBe('missing');
    expect(client.report).not.toHaveBeenCalled();
  });

  it('adaptör kapalıyken hiçbir şey yapmaz', async () => {
    const client = { report: jest.fn() };
    const { prisma } = makePrisma([hubRow]);
    expect(
      (
        await new HubReportForwarder(prisma, client as never, {
          enabled: false,
          cron: false,
        }).forward('r-1')
      ).outcome,
    ).toBe('inactive');
    expect(
      (await new HubReportForwarder(prisma, null, { enabled: true, cron: false }).forward('r-1'))
        .outcome,
    ).toBe('inactive');
    expect(client.report).not.toHaveBeenCalled();
  });

  it('geçici hata: deneme +1, hata satırda, fırlatmaz; kalıcı hata: deneme hakkı biter', async () => {
    const { prisma, updates } = makePrisma([hubRow]);
    const temp = {
      report: async () => {
        throw new HubTemporaryError('Merkeze ulaşılamadı');
      },
    };
    const r1 = await new HubReportForwarder(prisma, temp as never, {
      enabled: true,
      cron: false,
    }).forward('r-1');
    expect(r1.outcome).toBe('failed');
    expect(updates[0].data).toEqual({
      hubForwardError: 'Merkeze ulaşılamadı',
      hubForwardTries: { increment: 1 },
    });

    const perm = {
      report: async () => {
        throw new HubPermanentError('Merkez isteği reddetti (422)', 422);
      },
    };
    await new HubReportForwarder(prisma, perm as never, { enabled: true, cron: false }).forward(
      'r-1',
    );
    expect(updates[1].data).toEqual({
      hubForwardError: 'Merkez isteği reddetti (422)',
      hubForwardTries: HUB_REPORT_MAX_TRIES,
    });
  });

  it('forwardPending: yalnız bekleyen merkez bildirimleri, sayımlar', async () => {
    const client = {
      report: jest.fn(async () => ({
        status: 201,
        body: { reportId: 'm', created: true, flagged: false },
      })),
    };
    const { prisma } = makePrisma([
      hubRow,
      { ...hubRow, id: 'r-2' },
      { ...hubRow, id: 'r-yerel', question: { hubQuestionId: null, hubCode: null } },
      { ...hubRow, id: 'r-tukendi', hubForwardTries: HUB_REPORT_MAX_TRIES },
    ]);
    const f = new HubReportForwarder(prisma, client as never, { enabled: true, cron: false });
    expect(await f.forwardPending()).toEqual({ sent: 2, duplicate: 0, failed: 0, pending: 0 });
    expect(client.report).toHaveBeenCalledTimes(2);
  });
});
