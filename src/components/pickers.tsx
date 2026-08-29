import { useEffect, useRef, useState, type ReactNode } from "react";
import { splitDuration } from "@/domain/schedule";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

const ITEM_HEIGHT = 40;

/** Крутилка одного разряда. */
function Wheel({
  values,
  value,
  onChange,
  unit,
}: {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  unit: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settling = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = value * ITEM_HEIGHT;
  }, [value]);

  useEffect(
    () => () => {
      if (settling.current) window.clearTimeout(settling.current);
    },
    [],
  );

  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          if (settling.current) window.clearTimeout(settling.current);
          settling.current = window.setTimeout(() => {
            const index = Math.round(top / ITEM_HEIGHT);
            const next = values[Math.min(Math.max(index, 0), values.length - 1)] ?? 0;
            if (next !== value) onChange(next);
          }, 90);
        }}
        className="no-scrollbar h-[200px] snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollPaddingBlock: ITEM_HEIGHT * 2 }}
      >
        <div style={{ height: ITEM_HEIGHT * 2 }} />
        {values.map((v) => (
          <div
            key={v}
            className={`flex snap-center items-center justify-center text-xl tabular-nums transition-colors ${
              v === value ? "font-semibold text-foreground" : "text-hint"
            }`}
            style={{ height: ITEM_HEIGHT }}
          >
            {v}
          </div>
        ))}
        <div style={{ height: ITEM_HEIGHT * 2 }} />
      </div>
      <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-xs uppercase tracking-widest text-muted-foreground">
        {unit}
      </p>
    </div>
  );
}

/** Три крутилки: часы / минуты / секунды. Используется в листах выбора. */
export function DurationWheels({
  hours,
  minutes,
  seconds,
  onChange,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  onChange: (next: Partial<{ hours: number; minutes: number; seconds: number }>) => void;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-[18px] border border-white/80 bg-white/62 shadow-low" />
      <div className="relative flex gap-2">
        <Wheel values={HOURS} value={hours} onChange={(v) => onChange({ hours: v })} unit="часы" />
        <Wheel
          values={MINUTES}
          value={minutes}
          onChange={(v) => onChange({ minutes: v })}
          unit="минуты"
        />
        <Wheel
          values={SECONDS}
          value={seconds}
          onChange={(v) => onChange({ seconds: v })}
          unit="секунды"
        />
      </div>
    </div>
  );
}

/** Нижний лист с кнопками ОТМЕНИТЬ / ДОБАВИТЬ. */
export function PickerSheet({
  open,
  onCancel,
  onSubmit,
  children,
  submitLabel = "Добавить",
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="phone-overlay z-50 flex items-end bg-foreground/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className="phone-sheet safe-bottom w-full p-5 pt-6" onClick={(e) => e.stopPropagation()}>
        {children}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring touch-target flex-1 rounded-[20px] border border-white/80 bg-white/62 py-3.5 text-sm font-semibold text-muted-foreground shadow-low backdrop-blur-2xl"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="focus-ring touch-target flex-1 rounded-[20px] bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)]"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Выбор времени начала: тап по значению → лист с временем. */
export function TimeSheet({
  open,
  value,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  value: string | null;
  onCancel: () => void;
  onSubmit: (next: string | null) => void;
}) {
  const [draft, setDraft] = useState(value?.slice(0, 5) ?? "");
  useEffect(() => {
    if (open) setDraft(value?.slice(0, 5) ?? "");
  }, [open, value]);

  return (
    <PickerSheet open={open} onCancel={onCancel} onSubmit={() => onSubmit(draft || null)}>
      <p className="pb-3 text-base font-semibold">Время начала</p>
      <input
        type="time"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 text-center text-2xl tabular-nums shadow-mid backdrop-blur-2xl focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => setDraft("")}
          className="mt-3 w-full text-sm text-muted-foreground"
        >
          Убрать время
        </button>
      ) : null}
    </PickerSheet>
  );
}

/** Выбор продолжительности: часы / минуты / секунды. */
export function DurationSheet({
  open,
  seconds,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  seconds: number | null;
  onCancel: () => void;
  onSubmit: (next: number | null) => void;
}) {
  const [parts, setParts] = useState(() => splitDuration(seconds));
  useEffect(() => {
    if (open) setParts(splitDuration(seconds));
  }, [open, seconds]);

  return (
    <PickerSheet
      open={open}
      onCancel={onCancel}
      onSubmit={() => {
        const total = parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
        onSubmit(total > 0 ? total : null);
      }}
    >
      <DurationWheels
        hours={parts.hours}
        minutes={parts.minutes}
        seconds={parts.seconds}
        onChange={(next) => setParts((prev) => ({ ...prev, ...next }))}
      />
    </PickerSheet>
  );
}
