import { NotFoundException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { IPTAL_EDILMEMIS } from '../../common/iptal-soru';
import { SORU_OZETI_SELECT, soruOzeti, type SoruOzeti } from '../quiz/soru-ozeti';

/**
 * Paylaşılan soru (F10-P, Doc 49/15 §5): `paemisyon.com/s/<id>` iniş sayfası ve
 * uygulama derin bağlantısı bunu okur. Girişsizdir. Üç şey korunur:
 * - anahtar, açıklama ve KAYNAK ETİKETİ hiç seçilmez (CLAUDE.md: etiket son
 *   kullanıcıya gösterilmez; cevaplı paylaşım kartı cevabı istemcide, cevaplanmış
 *   turun geri bildiriminden alır);
 * - yalnız yayımlı, silinmemiş ve sınavda iptal edilmemiş soru döner; aksi 404
 *   (var/yok bilgisi de sızmaz);
 * - madde bağı alıştırma kuralıyla döner (`practice`): paylaşım bir alıştırmadır.
 */
export interface PaylasilanSoru extends SoruOzeti {
  /** "Anayasa Hukuku" — iniş sayfası başlığı. */
  courseName: string;
  topicName: string;
}

export const PAYLASIM_SELECT = {
  currentVersion: { select: SORU_OZETI_SELECT },
  topic: { select: { name: true, course: { select: { name: true } } } },
} satisfies Prisma.QuestionSelect;

type Satir = Prisma.QuestionGetPayload<{ select: typeof PAYLASIM_SELECT }>;

export function paylasimWhere(id: string): Prisma.QuestionWhereInput {
  // Yayım durumu sürümdedir: güncel sürümü yayımlı olmayan soru paylaşılamaz.
  return { id, deletedAt: null, currentVersion: { status: 'published' }, ...IPTAL_EDILMEMIS };
}

export async function paylasilanSoru(
  prisma: Pick<PrismaClient, 'question'>,
  id: string,
): Promise<PaylasilanSoru> {
  const q = (await prisma.question.findFirst({
    where: paylasimWhere(id),
    select: PAYLASIM_SELECT,
  })) as Satir | null;
  if (!q?.currentVersion) throw new NotFoundException('Soru bulunamadı.');
  return {
    ...soruOzeti(q.currentVersion, 'practice'),
    courseName: q.topic.course.name,
    topicName: q.topic.name,
  };
}
