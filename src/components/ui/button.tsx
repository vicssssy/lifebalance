import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { RefreshDouble as Loader2 } from "iconoir-react";

import { cn } from "@/lib/utils";

/**
 * Кнопка дизайн-системы: токены, мягкая тень, тонкий lift на hover
 * и compress на нажатии. Состояния: default / hover / pressed / disabled / loading.
 */
const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-2xl font-semibold cursor-pointer",
    "transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98] active:shadow-low",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)] hover:-translate-y-px hover:shadow-high",
        primary:
          "bg-primary text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)] hover:-translate-y-px hover:shadow-high",
        secondary:
          "bg-secondary text-secondary-foreground shadow-low hover:bg-accent hover:-translate-y-px hover:shadow-mid",
        outline:
          "border border-white/80 bg-white/72 text-foreground shadow-mid backdrop-blur-2xl hover:bg-white/85 hover:-translate-y-px hover:shadow-high",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        glass: "glass-surface text-foreground hover:-translate-y-px hover:shadow-mid",
        destructive:
          "bg-destructive text-destructive-foreground shadow-low hover:-translate-y-px hover:shadow-mid",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-11 px-3 text-sm [&_svg]:size-4",
        default: "touch-target px-4 text-base [&_svg]:size-[18px]",
        md: "touch-target px-4 text-base [&_svg]:size-[18px]",
        lg: "min-h-[52px] w-full px-5 text-base [&_svg]:size-5",
        icon: "touch-target aspect-square p-0 [&_svg]:size-[20px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size }), className)}
          ref={ref}
          data-loading={loading ? "" : undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        data-loading={loading ? "" : undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
