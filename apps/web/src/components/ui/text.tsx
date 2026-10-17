import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Expo `AppText variant` ile aynı sekiz rol (Doc 49/05). */
export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "subhead"
  | "body"
  | "bodySm"
  | "label"
  | "stat";
export type TextTone =
  | "ink"
  | "soft"
  | "subtle"
  | "accent"
  | "accentInk"
  | "success"
  | "warning"
  | "danger"
  | "onAccent";

const variantClass: Record<TextVariant, string> = {
  display: "type-display",
  title: "type-title",
  heading: "type-heading",
  subhead: "type-subhead",
  body: "type-body",
  bodySm: "type-body-sm",
  label: "type-label",
  stat: "type-stat",
};
const toneClass: Record<TextTone, string> = {
  ink: "text-ink",
  soft: "text-ink-soft",
  subtle: "text-ink-subtle",
  accent: "text-accent",
  accentInk: "text-accent-ink",
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-danger-ink",
  onAccent: "text-on-accent",
};
const defaultTag: Record<TextVariant, ElementType> = {
  display: "h1",
  title: "h1",
  heading: "h2",
  subhead: "p",
  body: "p",
  bodySm: "p",
  label: "span",
  stat: "span",
};

type OwnProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
  children?: ReactNode;
};

/**
 * Tipografi bileşeni: rol (`variant`) + ton. Rolün yazı tipi/ölçüsü `type-*`
 * utility'lerinden (token), rengi tondan gelir. `warning`/`subtle` küçük metinde
 * `*Ink` türevine eşlenir (token kuralı). Sunucu bileşeni.
 */
export function Text<T extends ElementType = "p">({
  as,
  variant = "body",
  tone = "ink",
  className,
  children,
  ...rest
}: OwnProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof OwnProps<T>>) {
  const Tag = (as ?? defaultTag[variant]) as ElementType;
  return (
    <Tag
      className={cn(variantClass[variant], toneClass[tone], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
