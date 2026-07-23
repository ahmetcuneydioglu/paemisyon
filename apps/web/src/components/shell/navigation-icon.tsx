import type { SVGProps } from "react";
import type { NavigationIconName } from "./navigation";

type UtilityIconName = "search" | "premium" | "help" | "logout";

export function NavigationIcon({
  name,
  ...props
}: { name: NavigationIconName | UtilityIconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

const iconPaths: Record<NavigationIconName | UtilityIconName, React.ReactNode> =
  {
    today: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </>
    ),
    library: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
      </>
    ),
    exam: (
      <>
        <path d="M9 5h6M9 3h6v4H9z" />
        <path d="M7 5H5v16h14V5h-2" />
        <path d="m8 13 2 2 5-5M8 18h8" />
      </>
    ),
    leaderboard: (
      <>
        <path d="M6 9H4.5A1.5 1.5 0 0 1 3 7.5V6h3M18 9h1.5A1.5 1.5 0 0 0 21 7.5V6h-3" />
        <path d="M6 4h12v5a6 6 0 0 1-12 0z" />
        <path d="M12 15v3M9 21h6M10 18h4" />
      </>
    ),
    performance: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    premium: (
      <>
        <path d="m3 7 4 4 5-7 5 7 4-4-2 12H5z" />
        <path d="M5 19h14" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.6 9a2.5 2.5 0 1 1 3.4 2.33c-.68.28-1 .67-1 1.67M12 17h.01" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />
      </>
    ),
  };
