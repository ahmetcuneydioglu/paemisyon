/**
 * Doc 56 §12 — Kartın referans haritası: mevzuat maddeleri YA DA kaynak pasajları.
 *
 * Doğrulayıcı (`validateCard`) yalnız "numara → metin" haritası ister; kart bir mevzuata bağlıysa harita
 * madde numarasıyla, kaynak metne bağlıysa pasaj numarasıyla kurulur. İçe aktarma, panel ve toplu yayın
 * aynı yardımcıyı kullanır: kural tek yerde. Pasaj metni yalnız buradan (doğrulama) ve panel ayrıntısından
 * okunur; kullanıcı uçları `source_*` tablolarını seçmez.
 */
import type { PrismaClient } from '@prisma/client';
import { loadArticleMap } from '../summaries/ozet-ice-aktar';
import type { ArticleText } from '../summaries/ozet-dogrulayici';

export type RefMap = Map<string, ArticleText & { id: string; title: string | null }>;

type PassageDb = Pick<PrismaClient, 'sourcePassage'>;
type RefDb = PassageDb & Parameters<typeof loadArticleMap>[0];

/** Kaynak metnin pasajları, pasaj numarasıyla (madde haritasıyla aynı biçim). */
export async function loadPassageMap(db: PassageDb, documentId: string): Promise<RefMap> {
  const rows = await db.sourcePassage.findMany({
    where: { documentId },
    select: { id: true, passageNo: true, heading: true, text: true },
  });
  const byNo: RefMap = new Map();
  for (const r of rows)
    byNo.set(r.passageNo, { articleNo: r.passageNo, text: r.text, id: r.id, title: r.heading });
  return byNo;
}

/** Kartın dayanağına göre harita: kaynak metin önce (mevzuatla birlikte dolmaz), yoksa mevzuat. */
export async function loadRefMap(
  db: RefDb,
  k: { legislationId?: string | null; sourceDocumentId?: string | null },
): Promise<RefMap> {
  if (k.sourceDocumentId) return loadPassageMap(db, k.sourceDocumentId);
  if (k.legislationId) return loadArticleMap(db, k.legislationId);
  return new Map();
}
