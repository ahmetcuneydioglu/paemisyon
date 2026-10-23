import QRCode from "qrcode";

/**
 * Soru paylaşım kartı — web (F10-P adım 3, Doc 49/15 §5). Expo `features/quiz/share.ts` ile
 * aynı veri sözleşmesi ve aynı Figma kartı (49:2233 / 49:2290, 1080×1350). Kart ekran
 * görüntüsü değil, veriden Canvas'a çizilir: temadan bağımsızdır (renkler `.theme-light`
 * kapsamından okunur), kullanıcının işaretlediği şık ve kaynak etiketi karta girmez;
 * cevaplı mod cevabı turun geri bildiriminden alır, sunucuya yeni istek yok.
 */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;
/** Figma 360×450 mantıksal ölçüde çizildi; bütün ölçüler bu çarpanla büyür. */
const S = 3;

export type ShareMode = "question" | "answer";

export interface ShareCardData {
  questionId: string;
  difficultyLabel: string | null;
  /** "PVSK · md. 4/A" — madde bağı; kaynak etiketi DEĞİL. */
  articleLabel: string | null;
  stem: string;
  options: { label: string; text: string }[];
  answer: {
    correctLabel: string | null;
    explanation: string | null;
    basis: string | null;
  } | null;
  url: string;
}

export interface ShareSource {
  questionId: string;
  stem: string;
  options: { id: string; label: string; text: string }[];
  difficulty?: "easy" | "medium" | "hard";
  relatedArticleRef?: { label: string } | null;
}
export interface ShareFeedback {
  correctOptionId: string | null;
  explanation: string | null;
  legalReference: string | null;
}

const DIFFICULTY = { easy: "Kolay", medium: "Orta", hard: "Zor" } as const;

export const questionShareUrl = (questionId: string) =>
  `https://paemisyon.com/s/${questionId}`;

/** Açıklamanın ilk cümlesi; kart için yeter, tamamı uygulamada. */
export function firstSentence(text: string | null | undefined): string | null {
  const plain = (text ?? "").replace(/\s+/g, " ").trim();
  if (!plain) return null;
  const m = /^.*?[.!?](\s|$)/.exec(plain);
  const s = (m ? m[0] : plain).trim();
  return s.length > 220 ? `${s.slice(0, 217).trimEnd()}…` : s;
}

/** "PVSK md. 4/A" → "PVSK · md. 4/A" (hap biçimi). */
export function hapEtiketi(label: string | null | undefined): string | null {
  if (!label) return null;
  return label.replace(/\s+md\.\s+/, " · md. ");
}

export function buildShareCardData(
  q: ShareSource,
  fb: ShareFeedback | null,
  mode: ShareMode,
): ShareCardData {
  const correct = fb?.correctOptionId
    ? q.options.find((o) => o.id === fb.correctOptionId)
    : null;
  return {
    questionId: q.questionId,
    difficultyLabel: q.difficulty ? DIFFICULTY[q.difficulty] : null,
    articleLabel: hapEtiketi(q.relatedArticleRef?.label),
    stem: q.stem,
    options: q.options.map((o) => ({ label: o.label, text: o.text })),
    answer:
      mode === "answer" && fb
        ? {
            correctLabel: correct?.label ?? null,
            explanation: firstSentence(fb.explanation),
            basis: fb.legalReference ?? q.relatedArticleRef?.label ?? null,
          }
        : null,
    url: questionShareUrl(q.questionId),
  };
}

export const shareMessage = (url: string) =>
  `Bu soruyu sen de çöz: ${url}\nPaemisyon · polis amirliği sınavına hazırlık`;

/* ------------------------------------------------------------------ Çizim */

type Palette = Record<
  | "panel"
  | "panelInk"
  | "panelSoft"
  | "paper"
  | "surface"
  | "surfaceAlt"
  | "line"
  | "ink"
  | "inkSoft"
  | "accent"
  | "accentSoft"
  | "accentInk"
  | "success"
  | "successSoft"
  | "successInk",
  string
>;

/**
 * Renkler ve yazı aileleri CSS'ten okunur: açık şema `.theme-light` alt ağacından (kart
 * sayfanın temasına bakmaz), aileler `--font-lora` / `--font-inter` (next/font).
 */
function paletteFromCss(): { colors: Palette; lora: string; inter: string } {
  const probe = document.createElement("div");
  probe.className = "theme-light";
  probe.style.display = "none";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const v = (name: string) => cs.getPropertyValue(name).trim();
  const colors: Palette = {
    panel: v("--color-panel"),
    panelInk: v("--color-panel-ink"),
    panelSoft: v("--color-panel-soft"),
    paper: v("--color-bg"),
    surface: v("--color-surface"),
    surfaceAlt: v("--color-surface-alt"),
    line: v("--color-line"),
    ink: v("--color-ink"),
    inkSoft: v("--color-ink-soft"),
    accent: v("--color-accent"),
    accentSoft: v("--color-accent-soft"),
    accentInk: v("--color-accent-ink"),
    success: v("--color-success"),
    successSoft: v("--color-success-soft"),
    successInk: v("--color-success-ink"),
  };
  const root = getComputedStyle(document.documentElement);
  const lora = root.getPropertyValue("--font-lora").trim() || "Lora, serif";
  const inter =
    root.getPropertyValue("--font-inter").trim() || "Inter, sans-serif";
  probe.remove();
  return { colors, lora, inter };
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth || !cur) cur = test;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1]!;
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1)
      last = last.slice(0, -1).trimEnd();
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Kartı tuvale çizer (1080×1350). Figma'dan sapmalar (Doc 49/15 §5f): "Doğru" etiketi
 * `successInk`; uzun soruda sıkışık mod; kök ≤5, şık ≤2 satır; içerik kağıt kartın
 * içinde kırpılır. Filigran ve mağaza satırı Expo kartıyla aynı (kullanıcı kararı).
 */
export async function renderShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
): Promise<void> {
  const { colors: K, lora, inter } = paletteFromCss();
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas yok");
  const font = (weight: number, size: number, family: "display" | "body") =>
    `${weight} ${size * S}px ${family === "display" ? lora : inter}`;
  await Promise.all([
    document.fonts.load(font(500, 14, "display")),
    document.fonts.load(font(600, 14, "display")),
    document.fonts.load(font(400, 10, "body")),
    document.fonts.load(font(500, 10, "body")),
    document.fonts.load(font(600, 10, "body")),
  ]).catch(() => undefined);

  const dense =
    data.stem.length > 180 || data.options.some((o) => o.text.length > 70);
  const stemSize = dense ? 12.67 : 14.67;
  const stemLh = (dense ? 16.67 : 19.33) * S;
  const optSize = dense ? 8.67 : 10;
  const optLh = (dense ? 11.33 : 13) * S;
  const rowH = (dense ? 28 : 32) * S;

  // Zemin
  ctx.fillStyle = K.panel;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Üst şerit
  ctx.textBaseline = "middle";
  ctx.fillStyle = K.accent;
  ctx.font = font(600, 14, "display");
  ctx.textAlign = "left";
  ctx.fillText("paemisyon", 24 * S, 28 * S);
  ctx.fillStyle = K.panelSoft;
  ctx.font = font(500, 9, "body");
  ctx.textAlign = "right";
  ctx.fillText("paemisyon.com", (360 - 24) * S, 28 * S);
  ctx.textAlign = "left";

  // Kağıt kart
  const cardX = 24 * S;
  const cardY = 48 * S;
  const cardW = (360 - 48) * S;
  const cardH = (450 - 48 - 16 - 54 - 8) * S;
  roundRect(ctx, cardX, cardY, cardW, cardH, 10 * S);
  ctx.fillStyle = K.paper;
  ctx.fill();
  ctx.strokeStyle = K.line;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Filigran (%5 mürekkep, −18°)
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 10 * S);
  ctx.clip();
  ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = K.ink;
  ctx.font = font(600, 62, "display");
  ctx.textAlign = "center";
  ctx.fillText("paemisyon", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  // Kart içi — kırpma
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 10 * S);
  ctx.clip();
  const pad = 16 * S;
  let y = cardY + pad;
  const innerX = cardX + pad;
  const innerW = cardW - pad * 2;

  // Meta hapları
  const haplar: { text: string; bg: string; fg: string }[] = [];
  if (data.difficultyLabel)
    haplar.push({
      text: data.difficultyLabel.toLocaleUpperCase("tr-TR"),
      bg: K.surfaceAlt,
      fg: K.inkSoft,
    });
  if (data.articleLabel)
    haplar.push({ text: data.articleLabel, bg: K.accentSoft, fg: K.accentInk });
  if (haplar.length) {
    let hx = innerX;
    ctx.font = font(600, 8, "body");
    for (const h of haplar) {
      const tw = ctx.measureText(h.text).width + 12 * S;
      roundRect(ctx, hx, y, tw, 14 * S, 7 * S);
      ctx.fillStyle = h.bg;
      ctx.fill();
      ctx.fillStyle = h.fg;
      ctx.fillText(h.text, hx + 6 * S, y + 7 * S);
      hx += tw + 5 * S;
    }
    y += 14 * S + 8 * S;
  }

  // Kök
  ctx.font = font(500, stemSize, "display");
  ctx.fillStyle = K.ink;
  for (const line of wrap(ctx, data.stem, innerW, 5)) {
    ctx.fillText(line, innerX, y + stemLh / 2);
    y += stemLh;
  }
  y += 8 * S;

  // Şıklar
  for (let i = 0; i < data.options.length; i++) {
    const o = data.options[i]!;
    const correct =
      data.answer?.correctLabel != null && o.label === data.answer.correctLabel;
    ctx.font = font(400, optSize, "body");
    const textX = innerX + (correct ? 8 * S : 0) + 16 * S + 8 * S;
    const textW = innerW - (textX - innerX) - (correct ? 36 * S : 0);
    const lines = wrap(ctx, o.text, textW, 2);
    const h = Math.max(rowH, lines.length * optLh + 8 * S);
    if (correct) {
      ctx.fillStyle = K.successSoft;
      ctx.fillRect(innerX, y, innerW, h);
      ctx.fillStyle = K.success;
      ctx.fillRect(innerX, y, 2 * S, h);
    }
    const boxX = innerX + (correct ? 8 * S : 0);
    const boxY = y + h / 2 - 8 * S;
    roundRect(ctx, boxX, boxY, 16 * S, 16 * S, 3 * S);
    ctx.fillStyle = correct ? K.success : K.surfaceAlt;
    ctx.fill();
    if (correct) {
      ctx.strokeStyle = K.surface;
      ctx.lineWidth = 3 * S;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(boxX + 4 * S, boxY + 8.5 * S);
      ctx.lineTo(boxX + 7 * S, boxY + 11.5 * S);
      ctx.lineTo(boxX + 12.5 * S, boxY + 5 * S);
      ctx.stroke();
    } else {
      ctx.fillStyle = K.ink;
      ctx.font = font(600, 9, "body");
      ctx.textAlign = "center";
      ctx.fillText(o.label, boxX + 8 * S, boxY + 8 * S);
      ctx.textAlign = "left";
    }
    ctx.font = font(400, optSize, "body");
    ctx.fillStyle = K.ink;
    const ty = y + h / 2 - ((lines.length - 1) * optLh) / 2;
    lines.forEach((line, li) => ctx.fillText(line, textX, ty + li * optLh));
    if (correct) {
      ctx.font = font(600, 8.67, "body");
      ctx.fillStyle = K.successInk;
      ctx.textAlign = "right";
      ctx.fillText("Doğru", innerX + innerW - 8 * S, y + h / 2);
      ctx.textAlign = "left";
    }
    y += h;
    if (i < data.options.length - 1) {
      ctx.fillStyle = K.line;
      ctx.fillRect(innerX, y, innerW, 1);
    }
  }

  // Açıklama + dayanak
  if (data.answer?.explanation || data.answer?.basis) {
    y += 6 * S;
    ctx.fillStyle = K.line;
    ctx.fillRect(innerX, y, innerW, 1);
    y += 6 * S;
    if (data.answer.explanation) {
      ctx.font = font(400, 8.67, "body");
      ctx.fillStyle = K.inkSoft;
      for (const line of wrap(ctx, data.answer.explanation, innerW, 3)) {
        ctx.fillText(line, innerX, y + 6 * S);
        y += 12 * S;
      }
      y += 3 * S;
    }
    if (data.answer.basis) {
      ctx.font = font(600, 8.67, "body");
      ctx.fillStyle = K.accentInk;
      ctx.fillText(
        wrap(ctx, data.answer.basis, innerW, 1)[0]!,
        innerX,
        y + 6 * S,
      );
    }
  }
  ctx.restore();

  // Alt şerit
  const footY = (450 - 16 - 54) * S;
  ctx.fillStyle = K.panelInk;
  ctx.font = font(600, 12, "display");
  ctx.fillText("Bu soruyu sen de çöz", 24 * S, footY + 10 * S);
  ctx.fillStyle = K.panelSoft;
  ctx.font = font(400, 8.67, "body");
  ctx.fillText(
    "Kaynağa dayalı açıklama ve madde metniyle.",
    24 * S,
    footY + 26 * S,
  );
  ctx.fillStyle = K.panelInk;
  ctx.font = font(600, 8.67, "body");
  ctx.fillText(
    "App Store ve Google Play'de · paemisyon.com",
    24 * S,
    footY + 41 * S,
  );

  // QR (beyaz kutu, köşe 8, iç boşluk 5)
  const qx = (360 - 24 - 54) * S;
  roundRect(ctx, qx, footY, 54 * S, 54 * S, 8 * S);
  ctx.fillStyle = K.surface;
  ctx.fill();
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, data.url, {
    width: 44 * S,
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: K.panel, light: K.surface },
  });
  ctx.drawImage(qr, qx + 5 * S, footY + 5 * S, 44 * S, 44 * S);
}

/** PNG dosyası (paylaşım/indirme için). */
export function canvasToPng(canvas: HTMLCanvasElement, name: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("PNG üretilemedi"));
      resolve(new File([blob], name, { type: "image/png" }));
    }, "image/png");
  });
}

/** Tarayıcı dosya paylaşımını destekliyorsa (mobil Safari/Chrome) `true`. */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !("canShare" in navigator))
    return false;
  try {
    const f = new File([new Uint8Array(1)], "p.png", { type: "image/png" });
    return navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}
