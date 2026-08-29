import { useState } from "react";
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

/** Дни недели для повторяющихся форматов. */
export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return (
    <div className="flex gap-1.5 rounded-[24px] border border-white/80 bg-white/55 p-1.5 shadow-mid backdrop-blur-2xl">
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
                ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(96_71_232_/_0.24)]"
                : "border-transparent bg-white/45 text-muted-foreground"
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
}: {
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
}) {
  const [month, setMonth] = useState(() => {
    const first = value[0] ? fromDateKey(value[0]) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });
  const grid = monthGrid(month);
  const today = todayKey();

  return (
    <div className="rounded-[30px] border border-white/85 bg-white/74 p-3.5 shadow-mid backdrop-blur-2xl">
      <div className="flex items-center justify-between px-0.5 pb-3">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          className="focus-ring touch-target flex items-center justify-center rounded-full border border-white/80 bg-white/62 text-muted-foreground shadow-low transition-transform duration-200 active:scale-95"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" strokeWidth={1.9} aria-hidden />
        </button>
        <p className="text-base font-semibold">{formatMonthTitle(month)}</p>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="focus-ring touch-target flex items-center justify-center rounded-full border border-white/80 bg-white/62 text-muted-foreground shadow-low transition-transform duration-200 active:scale-95"
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
              className={`flex h-10 items-center justify-center rounded-[14px] text-base transition-[background-color,color,transform,box-shadow] duration-200 active:scale-95 ${
                selected
                  ? "bg-primary font-semibold text-primary-foreground shadow-[0_8px_18px_rgb(96_71_232_/_0.24)]"
                  : otherMonth
                    ? "text-hint"
                    : key === today
                      ? "bg-muted font-semibold text-foreground"
                      : "text-foreground"
              }`}
            >
              {date.getDate()}
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
        className="flex-1 rounded-[22px] border border-white/80 bg-white/72 px-4 py-3 text-base shadow-mid backdrop-blur-2xl focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="focus-ring rounded-[20px] border border-white/80 bg-white/72 px-3 py-3 text-muted-foreground shadow-mid backdrop-blur-2xl"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-primary shadow-low backdrop-blur-2xl"
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
            className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/58 px-3 py-1.5 text-sm font-medium text-primary/75 shadow-low backdrop-blur-2xl"
          >
            <Plus className="size-3.5" /> Добавить сферу
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="phone-overlay z-50 flex items-end bg-foreground/20 backdrop-blur-sm">
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
              className="focus-ring mt-3 w-full rounded-2xl border border-white/80 bg-white/68 py-3.5 text-base font-semibold shadow-low backdrop-blur-2xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
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
          className="flex items-center justify-between gap-2 rounded-[22px] border border-white/80 bg-white/70 px-4 py-3 shadow-mid backdrop-blur-2xl"
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
        <div className="space-y-2.5 rounded-[26px] border border-white/80 bg-white/70 p-3 shadow-mid backdrop-blur-2xl">
          <div className="flex gap-1.5 rounded-[18px] bg-secondary/65 p-1">
            {(["video", "audio", "link"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-[14px] border py-2 text-sm font-semibold transition-colors ${
                  type === t
                    ? "border-primary bg-primary text-primary-foreground shadow-low"
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
            className="w-full rounded-[18px] border border-white/80 bg-white/70 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название, если нужно"
            className="w-full rounded-[18px] border border-white/80 bg-white/70 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setUrl("");
                setTitle("");
              }}
              className="flex-1 rounded-2xl border border-white/80 bg-white/60 py-2.5 text-sm font-semibold text-muted-foreground shadow-low"
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
              className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_rgb(96_71_232_/_0.24)] disabled:opacity-40"
            >
              Добавить
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-base text-primary"
        >
          <Plus className="size-4" /> Добавить видео / аудио / ссылку
        </button>
      )}
    </div>
  );
}

export { addDays };
