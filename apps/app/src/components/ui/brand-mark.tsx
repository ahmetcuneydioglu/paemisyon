import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Marka işareti: Nişangâh P × Nöbet (brand/splash-glyph-*.svg; Figma "Yayın Öncesi — Açılış",
 * bileşen 139:7). Splash ile aynı çizim, temadan renk alır: P = ink, yıldız = accent, göz diski
 * onAccent (açık temada yıldızı krem zeminden ayırır). Sıkı kırpılmış görünüm kutusu: `size`
 * işaretin yüksekliğidir, genişlik ≈ 0,88 × size.
 */
export function BrandMark({ size = 28, accessibilityLabel }: { size?: number; accessibilityLabel?: string }) {
  const { colors } = useTheme();
  // 1024 ızgarasındaki işaretin sınırları: x 252.8–771.25, y 218.55–805.6.
  const vb = { x: 252.8, y: 218.55, w: 518.45, h: 587.05 };
  return (
    <Svg
      width={(size * vb.w) / vb.h}
      height={size}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? "yes" : "no-hide-descendants"}
    >
      <Circle cx={549.4} cy={440.4} r={112} fill={colors.onAccent} />
      <Rect x={252.8} y={240.6} width={119.5} height={565} rx={59.7} fill={colors.ink} />
      <Path
        d="M549.4 218.55C671.924 218.55 771.25 317.875 771.25 440.4C771.25 562.924 671.924 662.25 549.4 662.25C426.875 662.25 327.55 562.924 327.55 440.4C327.55 317.876 426.876 218.55 549.4 218.55ZM549.4 338.05C492.874 338.05 447.05 383.874 447.05 440.4C447.05 496.926 492.873 542.75 549.4 542.75C605.926 542.75 651.75 496.926 651.75 440.4C651.75 383.873 605.926 338.05 549.4 338.05Z"
        fill={colors.ink}
      />
      <Path
        d="M542.052 379.462C544.829 373.014 553.971 373.014 556.748 379.462L569.963 410.149C571.121 412.838 573.656 414.68 576.572 414.951L609.84 418.036C616.83 418.684 619.655 427.379 614.381 432.012L589.28 454.063C587.08 455.996 586.112 458.976 586.756 461.832L594.102 494.426C595.645 501.275 588.249 506.648 582.213 503.064L553.484 486.005C550.967 484.51 547.833 484.51 545.315 486.005L516.587 503.064C510.551 506.648 503.155 501.275 504.698 494.426L512.044 461.832C512.688 458.976 511.72 455.996 509.52 454.063L484.419 432.012C479.144 427.379 481.97 418.684 488.96 418.036L522.228 414.951C525.144 414.68 527.679 412.838 528.837 410.149L542.052 379.462Z"
        fill={colors.accent}
      />
    </Svg>
  );
}
