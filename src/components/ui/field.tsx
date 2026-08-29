import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

/** Блок формы: подпись + содержимое + подсказка. */
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="field-label">{label}</p>
      {children}
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Текстовое поле с примером-подсказкой. */
export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  type,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  type?: "text" | "password" | "email";
  className?: string;
}) {
  if (multiline) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={cn(className)}
      />
    );
  }

  return (
    <Input
      type={type ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(className)}
    />
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <Button type={type} onClick={onClick} disabled={disabled ?? false} loading={loading ?? false} size="lg">
      {children}
    </Button>
  );
}

export function GhostButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Button type="button" variant="outline" size="lg" className="font-medium" onClick={onClick}>
      {children}
    </Button>
  );
}
