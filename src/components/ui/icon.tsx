import type { SVGProps } from "react";
import { Check } from "iconoir-react";
import { cn } from "@/lib/utils";

export type AppIcon = typeof Check;

/** Единый иконочный язык: rounded outline, stroke 1.65, размеры sm/md/lg. */
const SIZES = { sm: 16, md: 20, lg: 24 } as const;

export function Icon({
  icon: Component,
  size = "md",
  className,
  ...props
}: { icon: AppIcon; size?: keyof typeof SIZES } & Omit<SVGProps<SVGSVGElement>, "ref">) {
  return (
    <Component
      width={SIZES[size]}
      height={SIZES[size]}
      strokeWidth={1.65}
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    />
  );
}

export const ICON_STROKE = 1.65;
