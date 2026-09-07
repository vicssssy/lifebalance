import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  NavArrowLeft as ChevronLeft,
  NavArrowRight as ChevronRight,
  Plus,
  Xmark as X,
} from "iconoir-react";
import { WEEKDAYS } from "@/domain/constants";
import {
  addDays,
  addMonths,
  formatDayShort,
  formatMonthTitle,
  fromDateKey,
  monthGrid,
  toDateKey,
  todayKey,
} from "@/domain/schedule";
import type { LifeArea } from "@/domain/types";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { cn } from "@/lib/utils";

/** Дни недели для повторяющихся форматов. */
export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return (
    <div className="content-surface flex gap-1.5 rounded-[24px] p-1.5">
      {WEEKDAYS.map((day) => {
        const active = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() =>
              onChange(active ? value.filter((v) => v !== day.value) : [...value, day.value].sort())
            }
            className={`flex h-11 flex-1 items-center justify-center rounded-[18px] border text-sm font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-95 ${
              active
                ? "accent-control border-primary"
                : "border-transparent bg-white/60 text-muted-foreground"
            }`}
          >
            {day.short}
          </button>
        );
      })}
    </div>
  );
}

/** Выбор одного или нескольких конкретных дней. */
export function DayPicker({
  value,
  onChange,
  multiple = true,
  getProgress,
  alignCalendarRightEdge = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  getProgress?: (date: string) => { planned: number; completed: number };
  /** Совмещает навигацию с визуальной границей крайней даты в месячной сетке. */
  alignCalendarRightEdge?: boolean;
}) {
  const [month, setMonth] = useState(() => {
    const first = value[0] ? fromDateKey(value[0]) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });
  const grid = monthGrid(month);
  const today = todayKey();

  return (
    <div className="content-surface rounded-[30px] p-3.5">
      <div
        className={cn(
          "flex items-center justify-between pb-3",
          alignCalendarRightEdge ? "px-1" : "px-0.5",
        )}
      >
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          className="control-glass focus-ring touch-target flex items-center justify-center rounded-full text-muted-foreground transition-transform duration-200 active:scale-95"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" strokeWidth={1.9} aria-hidden />
        </button>
        <p className="text-base font-semibold">{formatMonthTitle(month)}</p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="control-glass focus-ring touch-target flex items-center justify-center rounded-full text-muted-foreground transition-transform duration-200 active:scale-95"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" strokeWidth={1.9} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((d) => (
          <span key={d.value} className="text-center text-xs text-muted-foreground">
            {d.short}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((date) => {
          const key = toDateKey(date);
          const selected = value.includes(key);
          const otherMonth = date.getMonth() !== month.getMonth();
          const progress = getProgress?.(key);
          const hasProgress = Boolean(progress && progress.planned > 0);
          const ratio =
            progress && progress.planned > 0
              ? Math.max(0, Math.min(1, progress.completed / progress.planned))
              : 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                onChange(
                  multiple
                    ? selected
                      ? value.filter((v) => v !== key)
                      : [...value, key].sort()
                    : [key],
                )
              }
              aria-pressed={selected}
              aria-label={
                hasProgress
                  ? `${formatDayShort(date)} — выполнено ${progress!.completed} из ${progress!.planned}`
                  : formatDayShort(date)
              }
              className={`focus-ring flex h-11 items-center justify-center rounded-full text-base tabular-nums transition-[background-color,color,transform,box-shadow] duration-200 active:scale-95 ${
                hasProgress
                  ? "text-foreground"
                  : selected
                    ? "accent-control font-semibold"
                    : otherMonth
                      ? "text-hint"
                      : key === today
                        ? "bg-muted font-semibold text-foreground"
                        : "text-foreground"
              }`}
            >
              {hasProgress ? (
                <span className="relative flex aspect-square w-full max-w-10 items-center justify-center">
                  <span
                    className={`absolute inset-[5px] flex items-center justify-center rounded-full text-[14px] ${selected ? "accent-control font-semibold" : key === today ? "bg-muted font-semibold" : "bg-secondary/45"}`}
                  >
                    {date.getDate()}
                  </span>
                  <svg
                    viewBox="0 0 40 40"
                    className="pointer-events-none absolute inset-0 size-full"
                    aria-hidden="true"
                    data-day-progress={key}
                  >
                    <circle cx="20" cy="20" r="18" fill="none" stroke="#e1e4e8" strokeWidth="2.5" />
                    {ratio > 0 ? (
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        fill="none"
                        stroke="#6b8514"
                        strokeWidth="2.5"
                        pathLength="100"
                        strokeDasharray={`${ratio * 100} 100`}
                        transform="rotate(-90 20 20)"
                      />
                    ) : null}
                  </svg>
                </span>
              ) : (
                date.getDate()
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SelectedDays({ dates }: { dates: string[] }) {
  if (!dates.length) return null;
  return (
    <p className="text-sm text-muted-foreground">
      {dates.map((d) => formatDayShort(fromDateKey(d))).join(" · ")}
    </p>
  );
}

/** Время начала. */
export function TimeField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="inset-field min-w-0 flex-1 rounded-[18px] px-4 py-3 text-[16px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="control-glass focus-ring touch-target rounded-[20px] px-3 text-muted-foreground"
          aria-label="Убрать время"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Сферы жизни: первая приходит из начального выбора, максимум 3. */
export function LifeAreaPicker({
  areas,
  value,
  onChange,
}: {
  areas: LifeArea[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {value.map((id) => {
          const area = areas.find((a) => a.id === id);
          if (!area) return null;
          return (
            <span
              key={id}
              className="control-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary"
            >
              <LifeAreaCategoryLink area={area} className="min-h-0" />
              {value.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== id))}
                  aria-label={`Убрать ${area.name}`}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </span>
          );
        })}
        {value.length < 3 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="control-glass focus-ring inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary"
          >
            <Plus className="size-3.5" /> Добавить сферу
          </button>
        ) : null}
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="phone-overlay z-[100] flex items-end bg-foreground/18 backdrop-blur-sm">
              <div className="phone-sheet safe-bottom max-h-[80dvh] w-full overflow-y-auto p-5 pt-6">
                <p className="pb-3 text-base font-semibold">Сфера жизни</p>
                <div className="space-y-1.5">
                  {areas.map((area) => {
                    const selected = value.includes(area.id);
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => {
                          if (selected) onChange(value.filter((v) => v !== area.id));
                          else if (value.length < 3) onChange([...value, area.id]);
                          setOpen(false);
                        }}
                        className="focus-ring flex w-full items-center justify-between gap-3 rounded-[20px] px-3 py-3 text-left transition-colors duration-200 hover:bg-white/55"
                      >
                        <span className="text-base">{area.name}</span>
                        {selected ? <Check className="size-4 text-primary" /> : null}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="control-glass focus-ring mt-3 w-full rounded-[18px] py-3.5 text-base font-semibold"
                >
                  Закрыть
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** Добавить видео / аудио / ссылку. */
export interface AttachmentDraft {
  type: "video" | "audio" | "link";
  url: string;
  title: string | null;
}

const ATTACHMENT_LABEL: Record<AttachmentDraft["type"], string> = {
  video: "Видео",
  audio: "Аудио",
  link: "Ссылка",
};

export function AttachmentsField({
  value,
  onChange,
}: {
  value: AttachmentDraft[];
  onChange: (value: AttachmentDraft[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AttachmentDraft["type"]>("video");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div
          key={`${item.url}-${index}`}
          className="content-surface flex items-center justify-between gap-2 rounded-[22px] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-base">{item.title || item.url}</p>
            <p className="text-xs text-muted-foreground">{ATTACHMENT_LABEL[item.type]}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label="Удалить материал"
            className="text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      {open ? (
        <div className="content-surface space-y-2.5 rounded-[26px] p-3">
          <div className="flex gap-1.5 rounded-[18px] bg-secondary/65 p-1">
            {(["video", "audio", "link"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-[14px] border py-2 text-sm font-semibold transition-colors ${
                  type === t
                    ? "accent-control border-primary"
                    : "border-transparent bg-white/42 text-muted-foreground"
                }`}
              >
                {ATTACHMENT_LABEL[t]}
              </button>
            ))}
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Ссылка"
            className="w-full rounded-[18px] border border-border/80 bg-white/92 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название, если нужно"
            className="w-full rounded-[18px] border border-border/80 bg-white/92 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setUrl("");
                setTitle("");
              }}
              className="control-glass flex-1 rounded-[18px] py-2.5 text-sm font-semibold text-muted-foreground"
            >
              Отменить
            </button>
            <button
              type="button"
              disabled={!url.trim()}
              onClick={() => {
                onChange([...value, { type, url: url.trim(), title: title.trim() || null }]);
                setOpen(false);
                setUrl("");
                setTitle("");
              }}
              className="accent-control focus-ring min-h-11 flex-1 rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              Добавить
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="control-glass focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-primary"
        >
          <Plus className="size-4" /> Добавить видео / аудио / ссылку
        </button>
      )}
    </div>
  );
}

export { addDays };
