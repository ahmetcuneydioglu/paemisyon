import {
  Archive,
  BarChart3,
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  Crown,
  LogOut,
  Scale,
  Search,
  Sun,
  Trophy,
  UserRound,
  type LucideProps,
} from "lucide-react";
import type { NavigationIconName } from "./navigation";

type UtilityIconName = "search" | "premium" | "help" | "logout";

/* Expo sekme çubuğuyla aynı set (lucide, Doc 49/11 karar 4). */
const icons = {
  today: Sun,
  library: BookOpen,
  mevzuat: Scale,
  exam: ClipboardCheck,
  archive: Archive,
  leaderboard: Trophy,
  performance: BarChart3,
  profile: UserRound,
  search: Search,
  premium: Crown,
  help: CircleHelp,
  logout: LogOut,
} as const;

export function NavigationIcon({
  name,
  strokeWidth = 1.75,
  ...props
}: { name: NavigationIconName | UtilityIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon strokeWidth={strokeWidth} aria-hidden {...props} />;
}
