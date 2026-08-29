import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatDuration, splitDuration } from "@/domain/schedule";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

const ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = 120;
const WHEEL_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

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
    <div className="relative min-w-0 flex-1">
      <div
        ref={ref}
        aria-label={unit}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          if (settling.current) window.clearTimeout(settling.current);
          settling.current = window.setTimeout(() => {
            const index = Math.round(top / ITEM_HEIGHT);
            const next = values[Math.min(Math.max(index, 0), values.length - 1)] ?? 0;
            if (next !== value) onChange(next);
          }, 90);
        }}
        className="no-scrollbar h-[120px] snap-y snap-mandatory overflow-y-scroll overscroll-contain"
        style={{ scrollPaddingBlock: WHEEL_PADDING }}
      >
        <div style={{ height: WHEEL_PADDING }} />
        {values.map((v) => (
          <div
            key={v}
            className={`flex snap-center items-center justify-center text-[19px] tabular-nums transition-[color,opacity,transform] duration-200 ${
              v === value ? "scale-105 font-semibold text-foreground" : "text-muted-foreground/55"
            }`}
            style={{ height: ITEM_HEIGHT }}
          >
            {v}
          </div>
        ))}
        <div style={{ height: WHEEL_PADDING }} />
      </div>
      <p className="pointer-events-none mt-1 h-5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
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
    <div className="relative overflow-hidden rounded-[28px] border border-white/85 bg-white/42 px-2 pb-1 shadow-low backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-2 top-[60px] h-10 -translate-y-1/2 rounded-[16px] border border-primary/10 bg-secondary/72 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.85)]" />
      <div className="relative flex gap-1">
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
  title,
  summary,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
  title?: string;
  summary?: string | null;
}) {
  if (!open) return null;
  return (
    <div
      className="phone-overlay z-50 flex items-end bg-foreground/20 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="phone-sheet safe-bottom w-full px-4 pb-4 pt-2.5 min-[390px]:px-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/20" aria-hidden />
        {title ? (
          <div className="mb-3 flex min-h-10 items-center justify-between gap-3 px-1">
            <p className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">{title}</p>
            {summary ? (
              <p className="max-w-[55%] truncate rounded-full bg-secondary px-3 py-1.5 text-[13px] font-semibold text-primary">
                {summary}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
        <div className="mt-3 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring touch-target flex-1 rounded-[18px] border border-white/85 bg-white/66 py-3 text-sm font-semibold text-muted-foreground shadow-low backdrop-blur-2xl transition-[transform,background-color] duration-200 active:scale-[0.98]"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="focus-ring touch-target flex-1 rounded-[18px] bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_rgb(96_71_232_/_0.28)] transition-[transform,box-shadow] duration-200 active:scale-[0.98]"
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
      title="Продолжительность"
      summary={
        formatDuration(parts.hours * 3600 + parts.minutes * 60 + parts.seconds) ?? "Не выбрана"
      }
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
