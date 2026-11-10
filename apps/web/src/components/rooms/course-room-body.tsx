"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Lock,
  Play,
  RotateCcw,
  Scale,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { CourseRoom, RoomTopic } from "@/lib/public-api";
import { hasFlashcards } from "@/lib/kartlar";
import { bandBarTone, bandTextClass } from "@/lib/rooms";
import { cn } from "@/lib/cn";
import { ActionTile } from "@/components/ui/action-tile";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { ToolRow } from "@/components/rooms/tool-row";
import { FlashcardEntry } from "@/components/kartlar/flashcard-entry";

type Konu = Omit<RoomTopic, "children">;

const q = (o: Record<string, string | number>) =>
  "/seans?" +
  new URLSearchParams(
    Object.entries(o).map(([k, v]) => [k, String(v)]),
  ).toString();

/**
 * Konunun okunacak içeriği: ünite özeti YA DA konu anlatımı dersi (Doc 57). İkisi ayrı yayınlanır;
 * yalnız üniteye bakmak, özeti henüz yayınlanmamış derste dersleri erişilmez bırakıyordu.
 */
const dersSayisi = (t: Konu) => t.lessons?.count ?? 0;
const okunur = (t: Konu) => t.units.count > 0 || dersSayisi(t) > 0;
/** "6 ders · 4 ünite · 3 okundu" — yalnız var olanlar yazılır. */
const okumaKunyesi = (t: Konu) => {
  const okundu = t.units.read + (t.lessons?.read ?? 0);
  return [
    dersSayisi(t) > 0 ? `${dersSayisi(t)} ders` : null,
    t.units.count > 0 ? `${t.units.count} ünite` : null,
    okundu > 0 ? `${okundu} okundu` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

/** Yalnız tek ünite varsa (ders yoksa) özet doğrudan; aksi hâlde konu sayfası dersleri ve üniteleri listeler. */
const okuHref = (t: Konu) =>
  dersSayisi(t) === 0 && t.units.count === 1 && t.units.firstSlug
    ? `/ozet/${t.units.firstSlug}`
    : `/kutuphane/konu/${t.id}`;

/** İlk harf büyük (tr-TR): "madde metni · 12 kart" → "Madde metni · 12 kart". */
const basHarf = (s: string) => s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);

/**
 * Ders odası gövdesi (Doc 49/17; Expo ders odası ile aynı yapı): 2×2 eylem → konular. Konuya
 * tıklamak dört eylemi konuya daraltan diyaloğu açar; "Konu oku" ünite özetleri + mevzuat metni
 * + bilgi kartları (Doc 56 karar B: üçüncü bölüm; sunucu sayım vermezse bölüm yok).
 */
export function CourseRoomBody({ room: d }: { room: CourseRoom }) {
  const [konu, setKonu] = useState<Konu | null>(null);
  const [okuma, setOkuma] = useState(false);
  const c = d.course;
  const tumKonular = d.topics.flatMap((t) => [t, ...t.children]);
  const ozetli = tumKonular.filter(okunur);
  const legs = d.tools.legislation;
  const kartlar = hasFlashcards(d.tools.flashcards) ? d.tools.flashcards : null;
  const dersToplam = d.tools.lessonCount ?? 0;
  const okunacak =
    d.tools.summaryUnitCount > 0 || dersToplam > 0 || legs.length > 0 || kartlar != null;
  const okuAlt = [
    dersToplam > 0 ? `${dersToplam} ders` : null,
    d.tools.summaryUnitCount > 0 ? `${d.tools.summaryUnitCount} ünite özeti` : null,
    legs.length > 0 ? "madde metni" : null,
    kartlar ? `${kartlar.count || kartlar.locked} kart` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <ActionTile
          icon={Play}
          variant="primary"
          title="Soru çöz"
          subtitle="10 soru · bu dersten"
          href={q({
            courseId: c.id,
            count: 10,
            source: "course_room",
            scope: c.name,
          })}
        />
        <ActionTile
          icon={BookOpen}
          title="Konu oku"
          subtitle={okuAlt.length > 0 ? basHarf(okuAlt.join(" · ")) : "Henüz okunacak metin yok"}
          onClick={okunacak ? () => setOkuma(true) : null}
        />
        <ActionTile
          icon={RotateCcw}
          title="Yanlışlarım"
          subtitle={
            d.tools.wrongCount > 0
              ? `${d.tools.wrongCount} soru bekliyor`
              : "Açık yanlış yok"
          }
          href={
            d.tools.wrongCount > 0
              ? q({
                  mode: "review",
                  courseId: c.id,
                  count: Math.min(20, d.tools.wrongCount),
                  source: "course_room",
                  scope: `${c.name} · yanlışlar`,
                })
              : null
          }
        />
        <ActionTile
          icon={Star}
          title="Favorilerim"
          subtitle={
            d.tools.favoriteCount > 0
              ? `${d.tools.favoriteCount} soru`
              : "Henüz favori yok"
          }
          href={
            d.tools.favoriteCount > 0
              ? q({
                  mode: "favorites",
                  courseId: c.id,
                  count: Math.min(20, d.tools.favoriteCount),
                  source: "course_room",
                  scope: `${c.name} · favoriler`,
                })
              : null
          }
        />
      </div>

      <section className="flex flex-col gap-2" aria-label="Konular">
        <SectionHeader title="Konular" />
        {d.topics.length === 0 ? (
          <p className="type-body-sm text-ink-soft">
            Bu dersin konuları hazırlanıyor.
          </p>
        ) : (
          <ul>
            {d.topics.map((t, i) => (
              <li key={t.id}>
                <KonuSatiri
                  topic={t}
                  divider={i < d.topics.length - 1 || t.children.length > 0}
                  onOpen={setKonu}
                />
                {t.children.map((ch, j) => (
                  <div key={ch.id} className="pl-5">
                    <KonuSatiri
                      topic={ch}
                      divider={
                        j < t.children.length - 1 || i < d.topics.length - 1
                      }
                      onOpen={setKonu}
                    />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog
        open={konu != null}
        onClose={() => setKonu(null)}
        title={konu?.name ?? ""}
        size="sm"
      >
        {konu ? (
          <div className="flex flex-col gap-4">
            <p className="type-body-sm text-ink-soft">
              {[
                c.name,
                konu.accuracyPct != null ? `%${konu.accuracyPct} doğru` : null,
                konu.solved > 0 ? `${konu.solved} soru` : "henüz çözülmedi",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <ButtonLink
              href={q({
                topicId: konu.id,
                count: 10,
                source: "topic_room",
                scope: konu.name,
              })}
            >
              Soru çöz · bu konudan 10 soru
            </ButtonLink>
            <div>
              <ToolRow
                icon={BookOpen}
                title="Konu oku"
                subtitle={okunur(konu) ? okumaKunyesi(konu) : "Bu konuda henüz okunacak içerik yok"}
                href={okunur(konu) ? okuHref(konu) : null}
              />
              <ToolRow
                icon={RotateCcw}
                title="Yanlışlarım"
                subtitle={
                  konu.wrongCount > 0
                    ? `${konu.wrongCount} soru`
                    : "Bu konuda açık yanlış yok"
                }
                href={
                  konu.wrongCount > 0
                    ? q({
                        mode: "review",
                        topicId: konu.id,
                        count: Math.min(20, konu.wrongCount),
                        source: "topic_room",
                        scope: `${konu.name} · yanlışlar`,
                      })
                    : null
                }
              />
              <ToolRow
                icon={Star}
                title="Favorilerim"
                subtitle={
                  konu.favoriteCount > 0
                    ? `${konu.favoriteCount} soru`
                    : "Bu konuda favori yok"
                }
                href={
                  konu.favoriteCount > 0
                    ? q({
                        mode: "favorites",
                        topicId: konu.id,
                        count: Math.min(20, konu.favoriteCount),
                        source: "topic_room",
                        scope: `${konu.name} · favoriler`,
                      })
                    : null
                }
                divider={hasFlashcards(konu.flashcards)}
              />
              {hasFlashcards(konu.flashcards) ? (
                <FlashcardEntry
                  counts={konu.flashcards}
                  scope={{ topicId: konu.id }}
                  label={konu.name}
                  source="topic_room"
                />
              ) : null}
            </div>
            <Link
              href={`/kutuphane/konu/${konu.id}`}
              className="type-body-sm text-accent-ink hover:underline"
            >
              Konu sayfasını aç
            </Link>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={okuma}
        onClose={() => setOkuma(false)}
        title="Konu oku"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {ozetli.length > 0 ? (
            <div>
              <p className="type-label mb-1 text-ink-subtle">Konu anlatımı ve özetler</p>
              {ozetli.map((t, i) => (
                <ToolRow
                  key={t.id}
                  icon={BookOpen}
                  title={t.name}
                  subtitle={okumaKunyesi(t)}
                  href={okuHref(t)}
                  divider={i < ozetli.length - 1}
                />
              ))}
            </div>
          ) : null}
          {legs.length > 0 ? (
            <div>
              <p className="type-label mb-1 text-ink-subtle">Mevzuat metni</p>
              {legs.map((l, i) => (
                <ToolRow
                  key={l.slug}
                  icon={Scale}
                  title={l.name}
                  subtitle={`${l.articleCount} madde`}
                  href={`/kanun/${l.slug}`}
                  divider={i < legs.length - 1}
                />
              ))}
            </div>
          ) : null}
          {kartlar ? (
            <div>
              <p className="type-label mb-1 text-ink-subtle">Bilgi kartları</p>
              <FlashcardEntry
                counts={kartlar}
                scope={{ courseId: c.id }}
                label={c.name}
                source="course_room"
              />
            </div>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}

function KonuSatiri({
  topic,
  divider,
  onOpen,
}: {
  topic: Konu;
  divider: boolean;
  onOpen: (t: Konu) => void;
}) {
  const yeni = topic.band === "new";
  return (
    // div[role=button]: içinde blok öğeler (çubuk) var; <button> yalnız satır içi içerik alır.
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(topic)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(topic);
        }
      }}
      aria-haspopup="dialog"
      aria-label={`${topic.name}${topic.accuracyPct == null ? "" : `, yüzde ${topic.accuracyPct} doğru`}, ${topic.note}`}
      className={cn(
        "tk-interactive flex w-full cursor-pointer flex-col gap-2 py-3 text-left hover:opacity-80",
        divider && "border-b border-line",
      )}
    >
      <span className="flex w-full items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "type-subhead",
                yeni ? "text-ink-soft" : "text-ink",
              )}
            >
              {topic.name}
            </span>
            {topic.isPremium ? (
              <Lock
                size={14}
                className="text-ink-subtle"
                aria-label="premium konu"
              />
            ) : null}
            {topic.inPlanThisWeek ? (
              <Badge tone="accent">Planında</Badge>
            ) : null}
          </span>
          <span className="type-body-sm text-ink-subtle">{topic.note}</span>
        </span>
        {!yeni ? (
          <span
            className={cn(
              "type-subhead tabular shrink-0",
              bandTextClass(topic.band),
            )}
          >
            %{topic.accuracyPct}
          </span>
        ) : null}
        <ChevronRight
          size={18}
          className="shrink-0 text-ink-subtle"
          aria-hidden
        />
      </span>
      {!yeni ? (
        <ProgressBar
          value={(topic.accuracyPct ?? 0) / 100}
          tone={bandBarTone(topic.band)}
          height={2}
          label={`${topic.name} doğruluk`}
        />
      ) : null}
    </div>
  );
}
