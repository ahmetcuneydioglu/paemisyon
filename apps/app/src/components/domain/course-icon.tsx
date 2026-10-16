import { BookOpen, Building2, Crosshair, Flag, Gavel, HandHeart, Handshake, Landmark, Languages, Lightbulb, Newspaper, Scale, Shield } from "lucide-react-native";
import type { ComponentType } from "react";

type IconProps = { color: string; size?: number; strokeWidth?: number };

/**
 * Ders ikonu VERİDEN gelir (`courses.icon`, Lucide anahtarı; izinli liste API
 * `common/course-icons.ts`). Burada yalnız anahtar → bileşen eşlemesi; bilinmeyen ya da
 * boş anahtar açık kitap çizer. Ders rengi YOK (Doc 48 kararı): tek vurgu.
 */
const MAP: Record<string, ComponentType<IconProps>> = {
  lightbulb: Lightbulb,
  shield: Shield,
  scale: Scale,
  gavel: Gavel,
  landmark: Landmark,
  "building-2": Building2,
  flag: Flag,
  "hand-heart": HandHeart,
  handshake: Handshake,
  crosshair: Crosshair,
  newspaper: Newspaper,
  languages: Languages,
};

export function CourseIcon({ name, color, size = 22 }: { name: string | null | undefined; color: string; size?: number }) {
  const Icon = (name && MAP[name]) || BookOpen;
  return <Icon color={color} size={size} strokeWidth={1.75} />;
}
