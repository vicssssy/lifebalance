import type { SVGProps } from "react";
import type { LifeArea } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * Curated LifeBalance life-area collection.
 *
 * The selection was researched and retrieved through IconStack's public
 * search/SVG API (https://iconstack.io/api). Tabler Icons and Lucide both use
 * a commercial-use-compatible permissive license (MIT and ISC respectively).
 * Their required notices live in THIRD_PARTY_NOTICES.md. The sole original
 * glyph is the line-based lotus: IconStack's only literal lotus is a filled
 * Phosphor symbol, which would break the collection's outline visual system.
 *
 * Every borrowed path is normalized here to the same 24px canvas, rounded cap
 * and join, and 1.75px stroke so the collection remains one visual family.
 */

type LifeAreaIconId = LifeArea["id"];

type GlyphProps = Pick<SVGProps<SVGSVGElement>, "className" | "strokeWidth">;

type LifeAreaIconSource = {
  library: "Tabler Icons" | "Lucide Icons" | "LifeBalance original";
  license: "MIT" | "ISC" | "Original";
  iconstackUrls: readonly string[];
};

function IconCanvas({ children, className, strokeWidth = 1.75 }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
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

/** Lucide Gem — selected through IconStack for a refined faceted diamond. */
function DiamondIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
      <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0L2.386 10.182A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
      <path d="M2 9h20" />
    </IconCanvas>
  );
}

/** Tabler Yoga — selected through IconStack for a calm, balanced pose. */
function YogaIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M12 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2" />
      <path d="M4 20h4l1.5-3" />
      <path d="m17 20-1-5h-5l1-7" />
      <path d="m4 10 4-1 4-1 4 1.5 4 1.5" />
    </IconCanvas>
  );
}

/** Original line lotus; see the collection note above for the source decision. */
function LotusIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M12 19.1c-3-2.4-3-6.8 0-10 3 3.2 3 7.6 0 10Z" />
      <path d="M12 18.6c-4.4.3-7-2.5-7.1-6.3 3.5 0 6.1 2.1 7.1 6.3Z" />
      <path d="M12 18.6c4.4.3 7-2.5 7.1-6.3-3.5 0-6.1 2.1-7.1 6.3Z" />
      <path d="M7.1 19.5h9.8" />
    </IconCanvas>
  );
}

/** Tabler Hearts — two connected hearts, not a generic single heart. */
function IntertwinedHeartsIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m14.017 18-2.017 2-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 0 1 8.153 5.784" />
      <path d="m15.99 20 4.197-4.223a2.81 2.81 0 0 0 0-3.948 2.747 2.747 0 0 0-3.91-.007l-.28.282-.279-.283a2.747 2.747 0 0 0-3.91-.007 2.81 2.81 0 0 0-.007 3.948l4.182 4.238z" />
    </IconCanvas>
  );
}

/** Tabler Heart Handshake — an abstract, caring family connection. */
function FamilyIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m19.5 12.572-7.5 7.428-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 1 1 7.5 6.572" />
      <path d="m12 6-3.293 3.293a1 1 0 0 0 0 1.414l.543.543c.69.69 1.81.69 2.5 0l1-1a3.182 3.182 0 0 1 4.5 0l2.25 2.25" />
      <path d="m12.5 15.5 2 2M15 13l2 2" />
    </IconCanvas>
  );
}

/** Lucide Handshake — two connecting hands for friendship and support. */
function ReachingHandsIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
      <path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" />
    </IconCanvas>
  );
}

/** Tabler Mountain, with a small original destination star at the summit. */
function PeakIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M3 20h18L14.079 5.388a2.3 2.3 0 0 0-4.158 0L3 20z" />
      <path d="m7.5 11 2 2.5 2.5-2.5 2 3 2.5-2" />
      <path d="m18 3.6.45 1.25 1.25.45-1.25.45L18 7l-.45-1.25-1.25-.45 1.25-.45L18 3.6Z" />
    </IconCanvas>
  );
}

/** Curated composite: Tabler's coin geometry with a small growing sprout. */
function CoinSproutIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <ellipse cx="14.5" cy="17" rx="5.5" ry="2.1" />
      <path d="M9 17v3.1c0 1.2 2.45 2.1 5.5 2.1s5.5-.9 5.5-2.1V17" />
      <path d="M7.1 16.2V9.1" />
      <path d="M7.1 12.7c-2.4-.2-3.8-1.5-4.1-3.6 2.2 0 3.6 1.2 4.1 3.6Z" />
      <path d="M7.1 10.9c1.8-2 3.8-2.2 5.2-1.4-.3 2.2-1.9 3.4-5.2 3.4" />
    </IconCanvas>
  );
}

/** Lucide Hand, paired with a small original inspiration spark. */
function PalmSparkIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2" />
      <path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      <path d="m4 3.1.38 1.02 1.02.38-1.02.38L4 5.9l-.38-1.02-1.02-.38 1.02-.38L4 3.1Z" />
    </IconCanvas>
  );
}

/** Lucide Book Open — an elegant, legible learning metaphor at mobile size. */
function BookSparkIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </IconCanvas>
  );
}

/** Tabler Compass — universal direction without religious symbolism. */
function CompassStarIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="m8 16 2-6 6-2-2 6-6 2" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </IconCanvas>
  );
}

/** Tabler Sunrise — a warm horizon icon, not a vacation/palm-tree symbol. */
function SunWaveIcon(props: GlyphProps) {
  return (
    <IconCanvas {...props}>
      <path d="M3 17h1m16 0h1m-15.4-6.4.7.7m12.1-.7-.7.7m-9.7 5.7a4 4 0 0 1 8 0" />
      <path d="m12 9V3m0 0 3 3m-3-3L9 6M3 21h18" />
    </IconCanvas>
  );
}

type LifeAreaIconComponent = (props: GlyphProps) => React.JSX.Element;

type LifeAreaIconConfig = {
  Icon: LifeAreaIconComponent;
  sources: readonly LifeAreaIconSource[];
};

const tabler = (icon: string): LifeAreaIconSource => ({
  library: "Tabler Icons",
  license: "MIT",
  iconstackUrls: [`https://iconstack.io/icon/tabler/${icon}`],
});

const lucide = (icon: string): LifeAreaIconSource => ({
  library: "Lucide Icons",
  license: "ISC",
  iconstackUrls: [`https://iconstack.io/icon/lucide/${icon}`],
});

const original = (reason: string): LifeAreaIconSource => ({
  library: "LifeBalance original",
  license: "Original",
  iconstackUrls: [reason],
});

/** Canonical icon ownership for every persisted Life Area id. */
// eslint-disable-next-line react-refresh/only-export-components
export const LIFE_AREA_ICON_CONFIG: Record<LifeAreaIconId, LifeAreaIconConfig> = {
  personal_growth: { Icon: DiamondIcon, sources: [lucide("gem")] },
  body_health: { Icon: YogaIcon, sources: [tabler("yoga")] },
  inner_state: {
    Icon: LotusIcon,
    sources: [original("No outline lotus candidate in IconStack's indexed libraries")],
  },
  love: { Icon: IntertwinedHeartsIcon, sources: [tabler("hearts")] },
  family: { Icon: FamilyIcon, sources: [tabler("heart-handshake")] },
  friends: { Icon: ReachingHandsIcon, sources: [lucide("handshake")] },
  career: { Icon: PeakIcon, sources: [tabler("mountain")] },
  money: {
    Icon: CoinSproutIcon,
    sources: [tabler("coins"), original("Original sprout composition")],
  },
  creativity: {
    Icon: PalmSparkIcon,
    sources: [lucide("hand"), original("Original inspiration spark")],
  },
  learning: { Icon: BookSparkIcon, sources: [lucide("book-open")] },
  meaning: { Icon: CompassStarIcon, sources: [tabler("compass")] },
  lifestyle: { Icon: SunWaveIcon, sources: [tabler("sunrise")] },
};

// eslint-disable-next-line react-refresh/only-export-components
export function getLifeAreaPresentation(area: LifeArea) {
  return {
    ...area,
    Icon: LIFE_AREA_ICON_CONFIG[area.id].Icon,
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
  const Icon = LIFE_AREA_ICON_CONFIG[id].Icon;
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
