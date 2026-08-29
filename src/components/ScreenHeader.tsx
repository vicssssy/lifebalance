import type { ReactNode } from "react";
import { NavArrowLeft } from "iconoir-react";
import { ICON_STROKE } from "@/components/ui/icon";
import { PageContainer, PageHeading } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

/**
 * Заголовок вложенного экрана: липкая матовая полоса с кнопкой «Назад»,
 * надзаголовком, крупным заголовком и опциональным индикатором шага.
 */
export function ScreenHeader({
  onBack,
  backLabel = "Назад",
  eyebrow,
  title,
  subtitle,
  steps,
  className,
}: {
  onBack: () => void;
  backLabel?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  steps?: { total: number; current: number };
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-30", className)}>
      <div className="border-b border-white/70 bg-background/78 backdrop-blur-2xl">
        <PageContainer className="safe-top pb-2.5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              className="focus-ring inline-flex min-h-12 items-center gap-1 rounded-full border border-white/85 bg-white/74 px-3 text-[13px] font-semibold text-foreground shadow-mid backdrop-blur-2xl transition-[transform,box-shadow,background-color] duration-200 ease-out hover:bg-white/88 active:scale-[0.96]"
            >
              <NavArrowLeft className="size-5" strokeWidth={ICON_STROKE} aria-hidden />
              <span>{backLabel}</span>
            </button>
            {steps ? <StepDots {...steps} /> : null}
          </div>
        </PageContainer>
      </div>

      {eyebrow || title || subtitle ? (
        <PageContainer className="pt-4">
          <PageHeading eyebrow={eyebrow} title={title ?? ""} subtitle={subtitle} />
        </PageContainer>
      ) : null}
    </header>
  );
}

/** Индикатор прогресса пошагового сценария. */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Шаг ${current} из ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300 ease-out",
            i < current ? "w-5 bg-primary shadow-low" : "w-1.5 bg-primary/15",
          )}
        />
      ))}
    </div>
  );
}
