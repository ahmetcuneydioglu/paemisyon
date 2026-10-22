"use client";

import { Bookmark, Flame, Library, Search, Settings } from "lucide-react";
import { useState } from "react";
import {
  ActionBar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Chip,
  DataTable,
  Dialog,
  EmptyState,
  IconButton,
  KeyHint,
  ListRow,
  Notice,
  Popover,
  ProgressBar,
  QuestionOption,
  QuestionStem,
  SectionHeader,
  SegmentBar,
  Skeleton,
  StatTile,
  Text,
  TextField,
  WeekDots,
  type TextTone,
  type TextVariant,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FeedbackPanel,
  QuestionMetaRow,
  ResultPanel,
  SessionProgress,
  SessionTitleBlock,
  ToolRow,
  type ToolAction,
} from "@/components/session/seans-kit";

const seansAraclari: ToolAction[] = [
  { key: "favorite", label: "Favoride", active: true, onClick: () => {} },
  { key: "coach", label: "Koça sor", onClick: () => {} },
  { key: "report", label: "Hata bildir", onClick: () => {} },
];

function Bolum({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <Text variant="heading">{title}</Text>
        {note ? (
          <Text variant="bodySm" tone="soft">
            {note}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
        {children}
      </div>
    </section>
  );
}

const VARIANTS: TextVariant[] = [
  "display",
  "title",
  "heading",
  "subhead",
  "body",
  "bodySm",
  "label",
  "stat",
];
const TONES: TextTone[] = [
  "ink",
  "soft",
  "subtle",
  "accent",
  "accentInk",
  "success",
  "warning",
  "danger",
];

export function Galeri() {
  const [secili, setSecili] = useState<string | null>(null);
  const [chip, setChip] = useState("Koç seçsin");
  const [dialog, setDialog] = useState(false);
  const [metin, setMetin] = useState("");
  const satirlar = [
    { konu: "CMK", dogruluk: 72, soru: 148, trend: "+4" },
    { konu: "TCK", dogruluk: 58, soru: 96, trend: "−2" },
    { konu: "PVSK", dogruluk: 41, soru: 61, trend: "+1" },
  ];
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Text variant="label" tone="subtle">
            Doc 49/11 · W-B
          </Text>
          <Text variant="title">Tasarım kiti v3 — Nöbet</Text>
          <Text variant="bodySm" tone="soft">
            Expo kitiyle aynı adlar ve varyantlar. Renk/ölçü yalnız token.
          </Text>
        </div>
        <ThemeToggle />
      </header>

      <Bolum
        title="Text"
        note="8 rol × tonlar. Küçük metinde warning/subtle yerine *Ink türevi."
      >
        <div className="flex flex-col gap-2">
          {VARIANTS.map((v) => (
            <div key={v} className="flex items-baseline gap-4">
              <code className="w-20 shrink-0 type-label text-ink-subtle">
                {v}
              </code>
              <Text variant={v} as="span">
                Nöbet başlıyor — 24 soru, 18 dakika
              </Text>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {TONES.map((t) => (
            <Text key={t} variant="subhead" tone={t} as="span">
              {t}
            </Text>
          ))}
        </div>
      </Bolum>

      <Bolum
        title="Button · IconButton"
        note="primary / secondary / ghost / destructive; sm 36 · md 44 · lg 48; loading."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Bugün çalış</Button>
          <Button variant="secondary">Seçili mevzuat</Button>
          <Button variant="ghost">Vazgeç</Button>
          <Button variant="destructive">Hesabı sil</Button>
          <Button loading>Kaydediliyor</Button>
          <Button disabled>Pasif</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Küçük</Button>
          <Button size="md">Orta</Button>
          <Button size="lg">Büyük</Button>
          <Button leadingIcon={<Flame size={18} aria-hidden />}>
            Seriyi koru
          </Button>
          <IconButton icon={Search} label="Ara" />
          <IconButton icon={Settings} label="Ayarlar" variant="ghost" />
          <IconButton icon={Bookmark} label="Favorile" variant="primary" />
        </div>
      </Bolum>

      <Bolum title="Card · Badge · Chip · Notice">
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <Text variant="subhead">surface</Text>
            <Text variant="bodySm" tone="soft">
              Varsayılan kart.
            </Text>
          </Card>
          <Card tone="alt">
            <Text variant="subhead">alt</Text>
            <Text variant="bodySm" tone="soft">
              İkincil kutu.
            </Text>
          </Card>
          <Card tone="accent">
            <Text variant="subhead" tone="accentInk">
              accent
            </Text>
            <Text variant="bodySm" tone="accentInk">
              Görev vurgusu.
            </Text>
          </Card>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>neutral</Badge>
          <Badge tone="accent">zayıf konu</Badge>
          <Badge tone="success">tamamlandı</Badge>
          <Badge tone="warning">dikkat</Badge>
          <Badge tone="danger">yanlış</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Koç seçsin", "Ders", "Konu", "Kanun / Madde", "Yanlışlarım"].map(
            (l) => (
              <Chip
                key={l}
                label={l}
                selected={chip === l}
                onClick={() => setChip(l)}
              />
            ),
          )}
          <Chip label="Pasif" disabled />
          <Chip label="İkonlu" icon={Library} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Notice title="Bilgi">
            Koç bugün CMK ağırlıklı bir tur öneriyor.
          </Notice>
          <Notice tone="success" title="Tamamlandı">
            Günlük hedefin doldu, seri korundu.
          </Notice>
          <Notice tone="warning" title="Seri riskte">
            Bugün henüz soru çözmedin.
          </Notice>
          <Notice
            tone="error"
            title="Bağlantı yok"
            action={
              <Button size="sm" variant="secondary">
                Yeniden dene
              </Button>
            }
          >
            Cevapların cihazda bekliyor.
          </Notice>
        </div>
      </Bolum>

      <Bolum title="Progress · SegmentBar · WeekDots · StatTile">
        <ProgressBar value={0.4} label="Günlük hedef" />
        <ProgressBar value={0.8} tone="success" height={8} />
        <SegmentBar total={12} done={3} />
        <WeekDots
          days={["done", "done", "empty", "done", "today", "empty", "empty"]}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Bugün" value={12} unit="soru" progress={0.6} />
          <StatTile
            label="Doğruluk"
            value="%68"
            hint="Son 7 gün"
            tone="success"
          />
          <StatTile label="Seri" value={9} unit="gün" emphasis />
          <StatTile label="Deneme neti" value={null} hint="Henüz deneme yok" />
        </div>
      </Bolum>

      <Bolum title="ListRow · SectionHeader · Breadcrumb · KeyHint">
        <Breadcrumb
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: "Mevzuat", href: "/kutuphane" },
            { label: "PVSK" },
          ]}
        />
        <SectionHeader
          title="Son çalışılanlar"
          action={{ label: "Tümü", href: "/kutuphane" }}
        />
        <div>
          <ListRow
            title="Ceza Muhakemesi Kanunu"
            subtitle="349 madde · 148 soru"
            leading={<Library size={20} aria-hidden />}
            trailing={<Badge tone="accent">%72</Badge>}
            href="/kutuphane"
          />
          <ListRow
            title="Türk Ceza Kanunu"
            subtitle="Son çalışma: dün"
            onClick={() => setSecili("tck")}
            trailing={
              <Text variant="bodySm" tone="soft" as="span">
                96
              </Text>
            }
          />
          <ListRow
            title="Statik satır"
            subtitle="Bağlantısız"
            divider={false}
          />
        </div>
        <div className="flex items-center gap-2">
          <Text variant="bodySm" tone="soft" as="span">
            Komut paleti
          </Text>
          <KeyHint keys="⌘K" />
          <KeyHint keys="Enter" />
        </div>
      </Bolum>

      <Bolum
        title="QuestionStem · QuestionOption"
        note="Altı durum; ikon renge eşlik eder; klavye ipucu masaüstünde."
      >
        <QuestionStem
          index={3}
          total={12}
          topic="CMK"
          stem="5271 sayılı Kanun'a göre, tutuklama kararına karşı başvurulabilecek kanun yolu aşağıdakilerden hangisidir?"
        />
        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Şıklar"
        >
          <QuestionOption
            label="A"
            text="İtiraz"
            state={secili === "A" ? "selected" : "default"}
            keyHint="1"
            onSelect={() => setSecili("A")}
          />
          <QuestionOption
            label="B"
            text="Temyiz"
            state={secili === "B" ? "selected" : "default"}
            keyHint="2"
            onSelect={() => setSecili("B")}
          />
          <QuestionOption label="C" text="İstinaf" state="correct" />
          <QuestionOption label="D" text="Karar düzeltme" state="incorrect" />
          <QuestionOption
            label="E"
            text="Yargılamanın yenilenmesi"
            state="missed"
          />
          <QuestionOption label="F" text="Pasif şık" state="disabled" />
        </div>
      </Bolum>

      <Bolum
        title="Seans kiti (Doc 49/15)"
        note="Başlık bloğu, dilimler, meta satırı, geri bildirim paneli (panel iki temada koyu), sonuç paneli."
      >
        <SessionTitleBlock
          title="Anayasa Hukuku"
          index={3}
          total={10}
          correct={2}
          wrong={0}
          slices={[
            "correct",
            "correct",
            "current",
            "future",
            "future",
            "future",
            "future",
            "future",
            "future",
            "future",
          ]}
        />
        <QuestionMetaRow
          difficulty="hard"
          article={{ label: "PVSK md. 4/A", onClick: () => {} }}
        />
        <Text variant="label" tone="subtle">
          Deneme dilimleri (40 soru → 20 dilim; doğruluk sızmaz)
        </Text>
        <SessionProgress
          slices={Array.from({ length: 40 }, (_, i) =>
            i < 11
              ? "answered"
              : i === 11
                ? "current"
                : i === 20
                  ? "flagged"
                  : "future",
          )}
        />
        <FeedbackPanel
          isCorrect
          seconds={12}
          explanation="Durdurma için makul bir sebep gerekir. Bu sebep, polisin tecrübesi ve içinde bulunduğu durumdan edindiği izlenime dayanır."
          legalReference="2559 sayılı PVSK md. 4/A"
          articleLabel="Maddeyi oku"
          onReadArticle={() => {}}
          tools={seansAraclari}
        />
        <FeedbackPanel
          isCorrect={false}
          correctLabel="C"
          seconds={12}
          explanation="Keyfî ve süreklilik arz eden durdurma yapılamaz."
          coach={{
            status: "done",
            text: "B şıkkı 'kesin delil' aradığı için yanlış; madde makul sebeple yetinir.",
            remainingToday: 2,
          }}
          tools={seansAraclari}
        />
        <FeedbackPanel isCorrect tools={seansAraclari} />
        <ResultPanel
          correct={8}
          total={10}
          pct={80}
          durationLabel="4 dk 12 sn"
        />
        <ToolRow actions={seansAraclari} onPanel={false} />
      </Bolum>

      <Bolum
        title="DataTable"
        note="Web'e özgü: yüksek yoğunluk, sayısal kolon sağa ve tabular."
      >
        <DataTable
          caption="Konu haritası"
          rows={satirlar}
          rowKey={(r) => r.konu}
          columns={[
            {
              key: "konu",
              header: "Konu",
              cell: (r) => (
                <Text variant="subhead" as="span">
                  {r.konu}
                </Text>
              ),
            },
            {
              key: "dogruluk",
              header: "Doğruluk",
              align: "right",
              cell: (r) => `%${r.dogruluk}`,
            },
            {
              key: "soru",
              header: "Soru",
              align: "right",
              hideBelowMd: true,
              cell: (r) => r.soru,
            },
            {
              key: "trend",
              header: "Trend",
              align: "right",
              cell: (r) => (
                <Badge tone={r.trend.startsWith("+") ? "success" : "danger"}>
                  {r.trend}
                </Badge>
              ),
            },
            {
              key: "eylem",
              header: "",
              align: "right",
              cell: () => (
                <Button size="sm" variant="secondary">
                  Kapatma seansı
                </Button>
              ),
            },
          ]}
        />
      </Bolum>

      <Bolum title="TextField · Dialog · Popover · EmptyState · Skeleton · ActionBar">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="E-posta"
            placeholder="ad@ornek.com"
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            hint="Giriş bağlantısı buraya gelir."
          />
          <TextField
            label="Şifre"
            type="password"
            error="En az 8 karakter."
            trailing={
              <Button size="sm" variant="ghost">
                Göster
              </Button>
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Diyalog aç
          </Button>
          <Popover
            trigger={({ open, toggle, id }) => (
              <Button
                variant="secondary"
                aria-expanded={open}
                aria-controls={id}
                onClick={toggle}
              >
                Odak: Koç seçiyor ▾
              </Button>
            )}
          >
            {(close) => (
              <div className="flex flex-col">
                {[
                  "Koç seçsin",
                  "Ders",
                  "Konu",
                  "Kanun / Madde",
                  "Yanlışlarım",
                ].map((l) => (
                  <ListRow
                    key={l}
                    title={l}
                    divider={false}
                    chevron={false}
                    onClick={() => {
                      setChip(l);
                      close();
                    }}
                  />
                ))}
              </div>
            )}
          </Popover>
        </div>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Turdan çık?"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDialog(false)}>
                Devam et
              </Button>
              <Button variant="destructive" onClick={() => setDialog(false)}>
                Çık
              </Button>
            </div>
          }
        >
          <Text variant="body" tone="soft">
            Cevapların kaydedildi; tura sonra kaldığın yerden dönebilirsin.
          </Text>
        </Dialog>
        <EmptyState
          icon={Bookmark}
          title="Henüz favori yok"
          body="Bir soruyu favorilediğinde burada birikir."
          action={<Button variant="secondary">Alıştırmaya git</Button>}
        />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24" radius="card" />
        </div>
        <ActionBar
          sticky={false}
          primary={<Button className="w-full md:w-auto">Bugün çalış</Button>}
          secondary={<Button variant="ghost">Odak değiştir</Button>}
        />
      </Bolum>
    </div>
  );
}
