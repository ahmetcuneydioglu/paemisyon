/**
 * Beş polis kanununda 4 şıklı kalan sorulara beşinci şık ekler.
 *
 * Beş şık kuralı (8 Eyl 2026) yeni sorular için zorunlu; bu 32 soru daha eski
 * içe aktarmalardan kalmış. Eklenen şıkların HEPSİ kanun metninden doğrulanmış
 * yanlış (ya da olumsuz köklü sorularda doğru) ifadelerdir; hiçbiri uydurma
 * değildir ve hiçbiri ikinci bir doğru cevap üretmez.
 *
 * `contentHash` yeniden hesaplanır — şık kümesi değiştiği için mükerrer
 * taraması aksi hâlde eski metne göre çalışır.
 *
 *   npx tsx apps/api/scripts/doc39-besinci-sik-ekle.ts        (kuru çalışma)
 *   APPLY=1 npx tsx apps/api/scripts/doc39-besinci-sik-ekle.ts
 */
import { PrismaClient } from '@prisma/client';
import { questionFingerprint } from '../src/modules/admin/questions/import-parser';

const APPLY = process.env.APPLY === '1';
const prisma = new PrismaClient();

/** versionId → eklenecek E şıkkı (hepsi çeldirici). */
const EK: Record<string, string> = {
  '3a270efd-3b7c-4303-9933-4536caaab068': 'Vatandaşlığın kaybı çocukları vatansız kılacak ise bu madde hükümleri uygulanmaz.',
  'b8441152-177d-4068-81e6-b7d360afcdff': 'On sekiz',
  '44957e36-3549-4c80-a34b-3dc13c2b7b73': 'Tüzük',
  '6e888b2a-3b44-4f8b-b5e3-6ba95bdc2aae': 'Kendisinin ve bakmakla yükümlü olduğu kimselerin geçimini sağlayacak gelire veya mesleğe sahip olmak',
  'ea6a42cd-a54e-467a-822e-d10e30829f40': 'Sekiz katından otuz katına',
  'e775ac13-e0f6-4199-9de5-c89ca9d86207': 'İçişleri Bakanı',
  'e00b99fd-d1fe-4a86-ae1f-5e08f83d7915': 'Haziran',
  '28e5b771-2a98-4d16-84f7-2b1146c73788': 'altı - üç',
  '565c5796-eade-4f81-9ac0-049f7bd5b78b': 'Emniyet Genel Müdürü',
  '1e38c29c-d77f-433d-bb6a-423e78785c08': 'Yanlış Yanlış Doğru',
  'e9a47488-7bc7-4462-be02-6883e03c2ae6': 'Rütbelere terfi ettirilecek personelin kurullarda görüşülmesi kıdem sırasına göre yapılır.',
  '00f7d599-0112-4eef-999d-1a14eb3fe5a2': 'kadro sayısına - liyakate',
  '72fe3b89-8a56-4f5c-a284-b6342a54c937': 'Bir yıldan iki yıla kadar',
  '41a744ae-e80d-46e8-9526-a25a38339ba5': 'Cumhurbaşkanı, Cumhurbaşkanı yardımcıları ve bakanların Devlet işleri hakkındaki toplantı ve konuşmaları',
  '316924a0-2193-4367-ad21-87cc682078a2': 'Belediye başkanına',
  'eb40dca3-ee8d-4482-a50a-f4686e2ffd88': 'on iki - altı',
  'b62cf6f8-ee0a-4d6d-8220-659d886e9796': 'üç - altı',
  '90c8f5b8-1125-42f1-a954-a69a31ce68cd': 'Yedi',
  'a279e6da-e013-43bb-94ca-9526cc66c3d1': 'Yetmiş iki',
  '630ad9e2-6a92-41d0-974a-10395f554ca7': 'Ticaret',
  '10be5b9f-106c-4846-970b-0cddee104a5e': 'Sınır dışı edilme',
  '80487f07-fde8-439e-870c-1a232dc0f820': 'Altı',
  '6d0902c1-e221-408f-b00a-10a70caacd7f': 'Millî Savunma - Dışişleri - Ulaştırma ve Altyapı',
  '3912f952-fe7c-40ff-98dd-df609581ebde': 'Görevin yerine getirilmesinde dil, ırk, cinsiyet, siyasi düşünce, felsefi inanç, din ve mezhep ayrımı yapmak',
  '26b821fa-7726-47ba-bc18-d967ab7adb0f': 'İtiraz süresi içinde idari yargıya başvurulması hâlinde itiraz hakkı düşer.',
  '2a6c6223-525d-471f-95cb-9e8c12d35e17': 'Disiplin amirleri tarafından verilen disiplin cezalarına karşı, cezanın tebliğinden itibaren on gün içinde itiraz edilebilir.',
  '199064e7-4c11-4ef9-adee-4d7dd8803ed3': 'Aylıktan kesme',
  '0bcad3ab-0873-471f-aa91-9a74a0e9366b': 'Personelin bulunduğu kademede ilerlemesinin altı, sekiz veya on iki ay süre ile durdurulmasıdır.',
  '118cdc4f-f718-4974-ac9b-e0ce8556d5c1': 'Sahil Güvenlik Komutanlığı teşkilatında görev yapan astsubaylara',
  'cf253342-e3b1-420c-ac04-7e2a30c7379b': 'İzinsiz veya kurumca kabul edilebilir özrü olmaksızın kesintisiz olarak dört gün görevine gelmemek',
  'dd7f8398-6734-4808-b3bc-a30ae4c8ad7f': 'Uzun süreli durdurma',
};

async function main() {
  const ids = Object.keys(EK);
  const surumler = await prisma.questionVersion.findMany({
    where: { id: { in: ids } },
    select: { id: true, stem: true, status: true,
      options: { select: { label: true, text: true }, orderBy: { sortOrder: 'asc' } } },
  });
  if (surumler.length !== ids.length) throw new Error(`${ids.length} bekleniyordu, ${surumler.length} bulundu`);

  const yaz: { id: string; metin: string; hash: string }[] = [];
  for (const s of surumler) {
    if (s.options.length !== 4) throw new Error(`${s.id}: ${s.options.length} şıklı, 4 bekleniyordu`);
    if (s.options.some((o) => o.label === 'E')) throw new Error(`${s.id}: zaten E şıkkı var`);
    const metin = EK[s.id];
    if (s.options.some((o) => o.text.trim().toLocaleLowerCase('tr') === metin.trim().toLocaleLowerCase('tr')))
      throw new Error(`${s.id}: eklenecek şık mevcut bir şıkla aynı`);
    yaz.push({ id: s.id, metin, hash: questionFingerprint(s.stem.trim(), [...s.options.map((o) => o.text.trim()), metin]) });
    console.log(`${s.id.slice(0, 8)} [${s.status}] + E) ${metin.slice(0, 78)}`);
  }
  console.log(`\nEKLENECEK: ${yaz.length}`);
  if (!APPLY) { console.log('(kuru çalışma — APPLY=1 ile yazılır)'); return; }
  await prisma.$transaction(async (tx) => {
    for (const y of yaz) {
      await tx.questionOption.create({
        data: { questionVersionId: y.id, label: 'E', text: y.metin, isCorrect: false, sortOrder: 4 },
      });
      await tx.questionVersion.update({ where: { id: y.id }, data: { contentHash: y.hash } });
    }
  }, { timeout: 120_000 });
  console.log(`✓ ${yaz.length} soruya beşinci şık eklendi`);
}
main().finally(() => prisma.$disconnect());
