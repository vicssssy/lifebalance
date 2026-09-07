import type { SVGProps } from "react";
import type { LifeArea } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * Original LifeBalance life-area icon collection.
 *
 * These twelve SVG glyphs are authored in this codebase; no third-party SVG
 * assets are copied or bundled here. The app's general-purpose icon library is
 * Phosphor Icons Regular, which was inspected before this collection was made:
 * it is MIT licensed and permits commercial use. We intentionally use original
 * paths below because several approved Life Area metaphors are not represented
 * precisely enough by one consistent icon-library family.
 * License reference: https://github.com/phosphor-icons/core/blob/main/LICENSE
 */

type LifeAreaIconId = LifeArea["id"];

type GlyphProps = Pick<SVGProps<SVGSVGElement>, "className" | "strokeWidth">;

function IconCanvas({ children, className, strokeWidth = 1.75 }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function DiamondIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m5.5 12 4.7-5.5h11.6l4.7 5.5L16 25.8 5.5 12Z" />
      <path d="M5.5 12h21M10.2 6.5 16 25.8l5.8-19.3" />
    </IconCanvas>
  );
}

function YogaIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <circle cx="16" cy="6.8" r="2.4" />
      <path d="M16 9.5v5.7M16 12.2c-3.8-.4-6.1.9-7.8 3.6M16 12.2c3.8-.4 6.1.9 7.8 3.6" />
      <path d="M16 15.2c-3.7.1-6.7 2.4-7.8 6.1 3.2.4 5.5-.9 7.8-3.2" />
      <path d="M16 15.2c3.7.1 6.7 2.4 7.8 6.1-3.2.4-5.5-.9-7.8-3.2" />
      <path d="M9 22.5c2.1 2.5 11.9 2.5 14 0" />
    </IconCanvas>
  );
}

function LotusIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M16 25c-4-3.2-4-9.1 0-13.3 4 4.2 4 10.1 0 13.3Z" />
      <path d="M16 24.3c-5.9.4-9.4-3.3-9.5-8.4 4.7 0 8.1 2.8 9.5 8.4Z" />
      <path d="M16 24.3c5.9.4 9.4-3.3 9.5-8.4-4.7 0-8.1 2.8-9.5 8.4Z" />
      <path d="M9.5 25.4h13" />
    </IconCanvas>
  );
}

function IntertwinedHeartsIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M15.8 24.8S7.2 19.5 7.2 13.6c0-2.8 3.5-4.4 5.8-2.1l3 2.9" />
      <path d="M16.2 24.8s8.6-5.3 8.6-11.2c0-2.8-3.5-4.4-5.8-2.1l-3 2.9" />
      <path d="m13 10.7 3 3 3-3" />
    </IconCanvas>
  );
}

function FamilyIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <circle cx="16" cy="9" r="2.5" />
      <circle cx="9.3" cy="12.2" r="2" />
      <circle cx="22.7" cy="12.2" r="2" />
      <path d="M11.5 24.8c.3-4.9 2-8 4.5-8s4.2 3.1 4.5 8" />
      <path d="M5.6 24.8c.4-3.7 1.7-6.1 3.7-6.1 1.2 0 2.2.8 3 2.3M26.4 24.8c-.4-3.7-1.7-6.1-3.7-6.1-1.2 0-2.2.8-3 2.3" />
      <path d="M8.3 21.8c2.1 1.8 4.7 2.7 7.7 2.7s5.6-.9 7.7-2.7" />
    </IconCanvas>
  );
}

function ReachingHandsIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M4.8 23.8c2.7-.6 4.8-2.8 6.3-5.5l1.9-3.3c.7-1.1 2.3-.4 1.8.8l-1.2 2.9" />
      <path d="m11.6 19 3.1-2.5c1.1-.9 2.6.5 1.6 1.6l-2.1 2.3c-1.8 2-4.3 3.6-7.1 4.1" />
      <path d="M27.2 23.8c-2.7-.6-4.8-2.8-6.3-5.5L19 15c-.7-1.1-2.3-.4-1.8.8l1.2 2.9" />
      <path d="m20.4 19-3.1-2.5c-1.1-.9-2.6.5-1.6 1.6l2.1 2.3c1.8 2 4.3 3.6 7.1 4.1" />
    </IconCanvas>
  );
}

function PeakIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m5.5 25 8.1-12.2 4.2 6.2 2.3-3.6L26.5 25H5.5Z" />
      <path d="m13.6 12.8 1.8 2.8 1.5-2.2" />
      <path d="m21.8 6.3.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z" />
    </IconCanvas>
  );
}

function CoinSproutIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <circle cx="10.2" cy="18.5" r="5.3" />
      <path d="M8.2 18.5h4M10.2 16.5v4" />
      <path d="M19.2 25.2V14.4" />
      <path d="M19.2 18.4c-3.7-.2-5.7-2.2-5.8-5.5 3.3.1 5.3 2.1 5.8 5.5Z" />
      <path d="M19.2 15.9c2.5-3.2 5.1-3.6 7.2-2.7-.4 3.1-2.6 4.8-7.2 4.8" />
      <path d="M15.8 25.2h7" />
    </IconCanvas>
  );
}

function PalmSparkIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M7.3 24.8v-5.5c0-1.2 1.7-1.3 1.8-.1v1.5" />
      <path d="M9.1 20.7v-5.4c0-1.2 1.8-1.2 1.8 0v4.1" />
      <path d="M10.9 19.4v-5.7c0-1.2 1.8-1.2 1.8 0v5.3" />
      <path d="M12.7 19.3v-4.1c0-1.2 1.8-1.2 1.8 0v5.1c1.5-1.8 3.2-2.4 4.1-1.4 1.2 1.2-.3 3.4-1.6 4.8-1.4 1.5-3.5 2.3-6.1 2.3H9.4" />
      <path d="m23.3 6 .7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
    </IconCanvas>
  );
}

function BookSparkIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M5.8 9.8c4.1-.9 7.4.2 10.2 2.5v13c-2.8-2.3-6.1-3.4-10.2-2.5v-13Z" />
      <path d="M26.2 9.8c-4.1-.9-7.4.2-10.2 2.5v13c2.8-2.3 6.1-3.4 10.2-2.5v-13Z" />
      <path d="m23 4.5.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
    </IconCanvas>
  );
}

function CompassStarIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <circle cx="16" cy="16" r="10.6" />
      <path d="m16 8.2 1.8 6 6 1.8-6 1.8-1.8 6-1.8-6-6-1.8 6-1.8 1.8-6Z" />
      <circle cx="16" cy="16" r="1" />
    </IconCanvas>
  );
}

function SunWaveIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M10.3 18a5.7 5.7 0 1 1 11.4 0" />
      <path d="M16 6.4v2M7.8 9.8l1.4 1.4M24.2 9.8l-1.4 1.4" />
      <path d="M5.5 21.2c2.5-2.4 5.1-2.4 7.6 0s5.1 2.4 7.6 0 5.1-2.4 6.6-.8" />
      <path d="M5.5 25c2.5-2.4 5.1-2.4 7.6 0s5.1 2.4 7.6 0 5.1-2.4 6.6-.8" />
    </IconCanvas>
  );
}

type LifeAreaIconComponent = (props: GlyphProps) => React.JSX.Element;

/** Central presentation mapping: persisted LifeArea data + one owned icon component. */
// eslint-disable-next-line react-refresh/only-export-components
export const LIFE_AREA_ICON_CONFIG: Record<string, { Icon: LifeAreaIconComponent }> = {
  personal_growth: { Icon: DiamondIcon },
  body_health: { Icon: YogaIcon },
  inner_state: { Icon: LotusIcon },
  love: { Icon: IntertwinedHeartsIcon },
  family: { Icon: FamilyIcon },
  friends: { Icon: ReachingHandsIcon },
  career: { Icon: PeakIcon },
  money: { Icon: CoinSproutIcon },
  creativity: { Icon: PalmSparkIcon },
  learning: { Icon: BookSparkIcon },
  meaning: { Icon: CompassStarIcon },
  lifestyle: { Icon: SunWaveIcon },
};

// eslint-disable-next-line react-refresh/only-export-components
export function getLifeAreaPresentation(area: LifeArea) {
  return {
    ...area,
    Icon: LIFE_AREA_ICON_CONFIG[area.id]?.Icon ?? CompassStarIcon,
  };
}

export function LifeAreaIcon({
  id,
  className,
  strokeWidth,
}: {
  id: LifeAreaIconId;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = LIFE_AREA_ICON_CONFIG[id]?.Icon ?? CompassStarIcon;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

export function LifeAreaIconFrame({ area, className }: { area: LifeArea; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-primary/16 bg-secondary/80 text-primary shadow-low",
        className,
      )}
      aria-hidden="true"
    >
      <LifeAreaIcon id={area.id} className="size-6" />
    </span>
  );
}
