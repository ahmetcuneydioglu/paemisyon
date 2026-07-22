"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { config } from "@/lib/config";

/** Sidebar'daki görünür tetik bu olayı yayınlar; palet dinler. */
export const CMDK_EVENT = "paemisyon:cmdk";

interface Item {
  group: "Eylemler" | "Sayfalar" | "Dersler" | "Kanunlar";
  label: string;
  hint?: string;
  href: string;
}

const STATIC_ITEMS: Item[] = [
  {
    group: "Eylemler",
    label: "Bugün Çalış — koç seansı başlat",
    href: "/seans",
  },
  { group: "Eylemler", label: "Günün sorusunu çöz", href: "/gunun-sorusu" },
  { group: "Sayfalar", label: "Bugün", href: "/bugun" },
  { group: "Sayfalar", label: "Kütüphane", href: "/kutuphane" },
  { group: "Sayfalar", label: "Mevzuat — Madde Atlası", href: "/kanunlar" },
  { group: "Sayfalar", label: "Denemeler", href: "/denemeler" },
  { group: "Sayfalar", label: "Performans", href: "/performans" },
  {
    group: "Sayfalar",
    label: "Konu haritası",
    href: "/performans/konu-haritasi",
  },
  { group: "Sayfalar", label: "Liderlik Tablosu — sıralama", href: "/liderlik" },
  { group: "Sayfalar", label: "Premium", href: "/premium" },
  { group: "Sayfalar", label: "Profil", href: "/profil" },
  {
    group: "Sayfalar",
    label: "Profil — denemelerim",
    href: "/profil/denemelerim",
  },
  { group: "Sayfalar", label: "Profil — ayarlar", href: "/profil/ayarlar" },
];

/** TR duyarlı arama anahtarı. */
function norm(s: string): string {
  return s.toLocaleLowerCase("tr-TR").normalize("NFC");
}

/**
 * ⌘K Komut Paleti (Doc 27 §2.1, wireframe 02 not 1): "koç ışınlamasının
 * kullanıcı elindeki karşılığı". Kanun, ders, sayfa ve eylem araması; ↑↓ + ⏎.
 * L3 odak ekranlarında YOK (kabuk dışı) — dikkat korunur.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [dynamic, setDynamic] = useState<Item[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);

  // Açılış: ⌘K / Ctrl+K + sidebar tetiği.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(CMDK_EVENT, onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(CMDK_EVENT, onEvent);
    };
  }, []);

  // İlk açılışta içerik indeksi: kanunlar (public) + dersler (girişli katalog).
  useEffect(() => {
    if (!open || dynamic !== null || loadingRef.current) return;
    loadingRef.current = true;
    void (async () => {
      const items: Item[] = [];
      try {
        const res = await fetch(`${config.apiBaseUrl}/public/laws`);
        const json = (await res.json()) as {
          data?: { slug: string; name: string; questionCount: number }[];
        };
        for (const l of json.data ?? []) {
          items.push({
            group: "Kanunlar",
            label: l.name,
            hint: l.questionCount > 0 ? `${l.questionCount} soru` : undefined,
            href: `/kanun/${l.slug}`,
          });
        }
      } catch {
        /* kanunlar yüklenemedi — statik indeksle devam */
      }
      try {
        const modules =
          await apiClient<{ id: string; name: string }[]>("/catalog/modules");
        const courseLists = await Promise.all(
          modules.map((m) =>
            apiClient<{ id: string; name: string }[]>(
              `/catalog/modules/${m.id}/courses`,
            )
              .then((cs) => cs.map((c) => ({ ...c, moduleName: m.name })))
              .catch(() => []),
          ),
        );
        const seen = new Set<string>();
        for (const c of courseLists.flat()) {
          if (seen.has(c.id)) continue;
          seen.add(c.id);
          items.push({
            group: "Dersler",
            label: c.name,
            hint: c.moduleName,
            href: `/kutuphane/ders/${c.id}`,
          });
        }
      } catch {
        /* girişsiz/edge: dersler atlanır */
      }
      setDynamic(items);
      loadingRef.current = false;
    })();
  }, [open, dynamic]);

  // Odak + sıfırlama.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  const results = useMemo(() => {
    const all = [...STATIC_ITEMS, ...(dynamic ?? [])];
    const q = norm(query).trim();
    if (!q) return all.slice(0, 9);
    const tokens = q.split(/\s+/);
    return all
      .filter((i) => {
        const hay = norm(i.label + " " + (i.hint ?? ""));
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 9);
  }, [query, dynamic]);

  const go = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      close();
      router.push(item.href);
    },
    [router, close],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Komut paleti"
      className="fixed inset-0 z-50 bg-ink/40 p-4 pt-[12vh]"
      onClick={close}
    >
      <div
        className="mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(results.length - 1, c + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(0, c - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[cursor]);
            }
          }}
          placeholder="Ara: kanun, ders, sayfa, eylem…  (örn. pvsk)"
          aria-label="Ara"
          className="w-full border-b border-line bg-transparent px-4 py-3.5 text-[15px] text-ink outline-none placeholder:text-ink-soft"
        />
        <ul
          role="listbox"
          aria-label="Sonuçlar"
          className="max-h-80 overflow-y-auto p-1.5"
        >
          {results.map((r, i) => (
            <li
              key={r.href + r.label}
              role="option"
              aria-selected={i === cursor}
            >
              <button
                type="button"
                onClick={() => go(r)}
                onMouseEnter={() => setCursor(i)}
                className={[
                  "flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-left text-[14px]",
                  i === cursor ? "bg-brand/10 text-brand" : "text-ink",
                ].join(" ")}
              >
                <span className="tk-caption w-16 shrink-0">{r.group}</span>
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                {r.hint && (
                  <span className="tk-caption shrink-0">{r.hint}</span>
                )}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[14px] text-ink-soft">
              Sonuç yok — kanun adı, ders veya sayfa adı dene.
            </li>
          )}
        </ul>
        <p className="tk-caption border-t border-line px-4 py-2">
          ↑↓ gez · ⏎ git · Esc kapat
        </p>
      </div>
    </div>
  );
}
