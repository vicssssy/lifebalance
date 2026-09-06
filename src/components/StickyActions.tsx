import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Панель действий в потоке формы: не перекрывает поля на коротком экране. */
export function StickyActions({
  children,
  hint,
  className,
}: {
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mt-8 pt-2", className)}>
      {hint ? (
        <p className="mb-2 text-center text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
