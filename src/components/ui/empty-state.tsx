import type { ReactNode } from "react";
import type { AppIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Пустое состояние: спокойная иконка, текст и опциональное действие. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: AppIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-surface animate-rise flex w-full flex-col items-center justify-center gap-3 rounded-[30px] border-white/85 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_26px_rgb(96_71_232_/_0.26)]">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
