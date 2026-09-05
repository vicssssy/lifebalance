import type { ReactNode } from "react";
import { PageContainer } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

/** Липкая матовая панель с основным действием экрана. */
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
    <div
      className={cn(
        "sticky z-30 -mx-5 mt-8 bottom-[calc(5.9rem+env(safe-area-inset-bottom))] sm:-mx-6",
        className,
      )}
    >
      <div className="control-glass mx-2 rounded-[28px]">
        <PageContainer className="py-3">
          {hint ? (
            <p className="mb-2 text-center text-xs leading-relaxed text-muted-foreground">{hint}</p>
          ) : null}
          <div className="space-y-2.5">{children}</div>
        </PageContainer>
      </div>
    </div>
  );
}
