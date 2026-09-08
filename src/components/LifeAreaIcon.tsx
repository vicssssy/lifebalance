import {
  BookOpen,
  Coins,
  CompassRose,
  Diamond,
  FlowerLotus,
  HandPalm,
  Handshake,
  Heart,
  Mountains,
  PersonSimpleTaiChi,
  Plant,
  Sparkle,
  StarFour,
  SunHorizon,
  UsersThree,
  Waves,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { LifeArea } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * Life Area icons use only the already-installed Phosphor Icons React package.
 * Phosphor is MIT licensed (see node_modules/@phosphor-icons/react/LICENSE).
 *
 * `phosphorIcons` makes every Life Area's canonical source explicit. Where a
 * richer metaphor needs two forms, it composes Phosphor components only—there
 * are no local SVG paths or assets from another icon family.
 */

type LifeAreaIconId = LifeArea["id"];
type GlyphProps = { className?: string };

type LifeAreaIconComponent = (props: GlyphProps) => React.JSX.Element;

type LifeAreaIconConfig = {
  Icon: LifeAreaIconComponent;
  phosphorIcons: readonly string[];
};

function Glyph({ Icon, className }: { Icon: PhosphorIcon; className?: string }) {
  return <Icon size="100%" weight="light" className={className} aria-hidden="true" />;
}

function IconComposition({ children, className }: React.PropsWithChildren<GlyphProps>) {
  return <span className={cn("relative block size-full", className)}>{children}</span>;
}

function DiamondIcon(props: GlyphProps) {
  return <Glyph Icon={Diamond} {...props} />;
}

function YogaIcon(props: GlyphProps) {
  return <Glyph Icon={PersonSimpleTaiChi} {...props} />;
}

function LotusIcon(props: GlyphProps) {
  return <Glyph Icon={FlowerLotus} {...props} />;
}

function IntertwinedHeartsIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={Heart} className="absolute -left-[2%] -top-[2%] size-[68%]" />
      <Glyph Icon={Heart} className="absolute -bottom-[2%] -right-[2%] size-[68%]" />
    </IconComposition>
  );
}

function FamilyIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={UsersThree} className="absolute inset-0" />
      <Glyph Icon={Heart} className="absolute -right-[3%] -top-[7%] size-[38%]" />
    </IconComposition>
  );
}

function ReachingHandsIcon(props: GlyphProps) {
  return <Glyph Icon={Handshake} {...props} />;
}

function PeakIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={Mountains} className="absolute inset-0" />
      <Glyph Icon={StarFour} className="absolute -right-[4%] -top-[5%] size-[38%]" />
    </IconComposition>
  );
}

function CoinSproutIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={Coins} className="absolute -bottom-[2%] -right-[3%] size-[84%]" />
      <Glyph Icon={Plant} className="absolute -left-[4%] -top-[4%] size-[65%]" />
    </IconComposition>
  );
}

function PalmSparkIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={HandPalm} className="absolute inset-0" />
      <Glyph Icon={Sparkle} className="absolute -left-[4%] -top-[5%] size-[36%]" />
    </IconComposition>
  );
}

function BookSparkIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={BookOpen} className="absolute inset-0" />
      <Glyph Icon={Sparkle} className="absolute -right-[4%] -top-[5%] size-[34%]" />
    </IconComposition>
  );
}

function CompassStarIcon(props: GlyphProps) {
  return <Glyph Icon={CompassRose} {...props} />;
}

function SunWaveIcon({ className }: GlyphProps) {
  return (
    <IconComposition className={className}>
      <Glyph Icon={SunHorizon} className="absolute inset-x-0 top-0 size-full" />
      <Glyph Icon={Waves} className="absolute inset-x-[6%] bottom-0 h-[55%]" />
    </IconComposition>
  );
}

/** Canonical Phosphor-only icon ownership for every persisted Life Area id. */
// eslint-disable-next-line react-refresh/only-export-components
export const LIFE_AREA_ICON_CONFIG: Record<LifeAreaIconId, LifeAreaIconConfig> = {
  personal_growth: { Icon: DiamondIcon, phosphorIcons: ["Diamond"] },
  body_health: { Icon: YogaIcon, phosphorIcons: ["PersonSimpleTaiChi"] },
  inner_state: { Icon: LotusIcon, phosphorIcons: ["FlowerLotus"] },
  love: { Icon: IntertwinedHeartsIcon, phosphorIcons: ["Heart", "Heart"] },
  family: { Icon: FamilyIcon, phosphorIcons: ["UsersThree", "Heart"] },
  friends: { Icon: ReachingHandsIcon, phosphorIcons: ["Handshake"] },
  career: { Icon: PeakIcon, phosphorIcons: ["Mountains", "StarFour"] },
  money: { Icon: CoinSproutIcon, phosphorIcons: ["Coins", "Plant"] },
  creativity: { Icon: PalmSparkIcon, phosphorIcons: ["HandPalm", "Sparkle"] },
  learning: { Icon: BookSparkIcon, phosphorIcons: ["BookOpen", "Sparkle"] },
  meaning: { Icon: CompassStarIcon, phosphorIcons: ["CompassRose"] },
  lifestyle: { Icon: SunWaveIcon, phosphorIcons: ["SunHorizon", "Waves"] },
};

// eslint-disable-next-line react-refresh/only-export-components
export function getLifeAreaPresentation(area: LifeArea) {
  return {
    ...area,
    Icon: LIFE_AREA_ICON_CONFIG[area.id].Icon,
  };
}

export function LifeAreaIcon({ id, className }: { id: LifeAreaIconId; className?: string }) {
  const Icon = LIFE_AREA_ICON_CONFIG[id].Icon;
  return <Icon className={className} />;
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
