import { Link } from "@tanstack/react-router";
import { NavArrowRight } from "iconoir-react";
import type { LifeArea } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Название сферы — это ссылка на соответствующую категорию в «Моих целях». */
export function LifeAreaCategoryLink({ area, className }: { area: LifeArea; className?: string }) {
  return (
    <Link
      to="/goals"
      search={{ area: area.id }}
      aria-label={`Открыть категорию «${area.name}»`}
      className={cn(
        "focus-ring group/category inline-flex min-h-8 items-center gap-1 rounded-lg text-sm font-semibold text-primary transition-colors hover:text-primary/75",
        className,
      )}
    >
      <span>{area.name}</span>
      <NavArrowRight
        className="size-3.5 transition-transform group-hover/category:translate-x-0.5"
        strokeWidth={1.8}
        aria-hidden
      />
    </Link>
  );
}

/** Сферы жизни отображаются как кликабельные категории без хештегов. */
export function LifeAreaTags({
  areas,
  ids,
  className = "",
}: {
  areas: LifeArea[];
  ids: string[];
  className?: string;
}) {
  const selectedAreas = ids
    .map((id) => areas.find((a) => a.id === id))
    .filter((area): area is LifeArea => Boolean(area));
  if (!selectedAreas.length) return null;
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`}>
      {selectedAreas.map((area) => (
        <LifeAreaCategoryLink key={area.id} area={area} />
      ))}
    </div>
  );
}
