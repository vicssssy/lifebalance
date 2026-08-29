import * as React from "react";

import { cn } from "@/lib/utils";

/** Поле ввода: 44px тач-таргет, rounded-xl, тонкая граница, аккуратный focus-ring. */
const inputBase = [
  "flex w-full rounded-[22px] border border-white/80 bg-white/72 px-4 text-[16px] text-foreground shadow-mid backdrop-blur-2xl",
  "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
  "placeholder:text-hint",
  "hover:border-neutral-400",
  "focus:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(inputBase, "touch-target py-3", className)}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(inputBase, "min-h-24 resize-none py-3 leading-snug", className)}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Input, Textarea, inputBase };
