import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { occurrencesForDate } from "@/domain/occurrences";
import {
  addDays,
  formatDayLong,
  formatDayShort,
  fromDateKey,
  todayKey,
  toDateKey,
} from "@/domain/schedule";
import { usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { DayPlan } from "@/components/DayPlan";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Сегодня — Путь" },
      {
        name: "description",
        content: "План дня по категориям: утро, день, вечер и дополнительно.",
      },
      { property: "og:title", content: "Сегодня — Путь" },
      { property: "og:description", content: "Твои действия на сегодня в одном спокойном списке." },
    ],
  }),
  component: TodayScreen,
});

const WEEKDAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAY_LONG = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

function TodayDateHero({
  date,
  today,
  onSelect,
}: {
  date: Date;
  today: Date;
  onSelect: (date: string) => void;
}) {
  const selectedKey = toDateKey(date);
  const todayDateKey = toDateKey(today);
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const selectedIsToday = selectedKey === todayDateKey;

  return (
    <section
      className="animate-rise overflow-hidden rounded-[30px] border border-white/85 bg-white/76 px-4 pb-4 pt-5 shadow-mid backdrop-blur-2xl min-[390px]:px-5"
      aria-label={`Выбрано: ${formatDayLong(date)}`}
    >
      <div className="flex items-start justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-[64px] font-semibold leading-none tracking-[-0.065em] text-foreground">
            {date.getDate()}
          </span>
          <span
            className="mt-2 size-3 rounded-full bg-primary shadow-[0_5px_14px_rgb(96_71_232_/_0.32)]"
            aria-hidden
          />
        </div>
        <div className="pt-1 text-right" aria-live="polite" aria-atomic="true">
          <p className="text-[17px] font-semibold leading-tight text-foreground">
            {selectedIsToday ? "Сегодня" : WEEKDAY_LONG[date.getDay()]}
          </p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            {formatDayShort(date)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1" role="group" aria-label="Ближайшие семь дней">
        {days.map((day) => {
          const dayKey = toDateKey(day);
          const selected = dayKey === selectedKey;

          return (
            <button
              key={dayKey}
              type="button"
              className={
                selected
                  ? "focus-ring flex min-h-[64px] flex-col items-center justify-center rounded-[18px] bg-secondary text-primary shadow-low transition-colors"
                  : "focus-ring flex min-h-[64px] flex-col items-center justify-center rounded-[18px] text-muted-foreground transition-colors hover:bg-white/55 hover:text-foreground"
              }
              onClick={() => onSelect(dayKey)}
              aria-label={`Выбрать ${formatDayLong(day)}`}
              aria-pressed={selected}
              aria-current={dayKey === todayDateKey ? "date" : undefined}
            >
              <span className="text-[17px] font-semibold leading-none tabular-nums">
                {day.getDate()}
              </span>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
                {WEEKDAY_SHORT[day.getDay()]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TodayScreen() {
  const { source, isLoading } = usePlannerSource();
  const [today] = useState(todayKey);
  const [date, setDate] = useState(today);
  const currentDate = fromDateKey(date);
  const occurrences = occurrencesForDate(source, date, "active-plan");

  return (
    <AppScreen
      title="Сегодня"
      header={<TodayDateHero date={currentDate} today={fromDateKey(today)} onSelect={setDate} />}
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Загружаем план…</p>
      ) : (
        <DayPlan
          key={date}
          occurrences={occurrences}
          emptyText={
            date === today
              ? "На сегодня пока ничего не запланировано. Нажми ＋, чтобы добавить действие."
              : "На этот день ничего не запланировано."
          }
          maxTitleLines={2}
        />
      )}
    </AppScreen>
  );
}
