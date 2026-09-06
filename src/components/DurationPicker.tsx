import { useState } from "react";
import { formatDuration } from "@/domain/schedule";
import { DurationSheet } from "@/components/pickers";

/** Продолжительность: «22 мин» → при нажатии выбор часов / минут / секунд. */
export function DurationPicker({
  seconds,
  onChange,
  placeholder = "Например, 22 мин",
}: {
  seconds: number | null;
  onChange: (seconds: number | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const label = formatDuration(seconds);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inset-field focus-ring min-h-11 w-full rounded-[18px] px-4 py-3 text-left text-[16px] transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/20 hover:bg-white"
      >
        {label ? (
          <span className="text-foreground">{label}</span>
        ) : (
          <span className="text-hint">{placeholder}</span>
        )}
      </button>

      <DurationSheet
        open={open}
        seconds={seconds}
        onCancel={() => setOpen(false)}
        onSubmit={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
