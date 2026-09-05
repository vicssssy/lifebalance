import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Базовая поверхность: rounded-xl, тонкая граница, деликатная тень. */
export function Surface({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  return <Tag className={cn("content-surface rounded-3xl p-5", className)}>{children}</Tag>;
}

/** Мелкий заголовок раздела. */
export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("day-part-title", className)}>{children}</h2>;
}
