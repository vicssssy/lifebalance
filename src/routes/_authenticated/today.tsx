import { createFileRoute } from "@tanstack/react-router";
import { occurrencesForDate } from "@/domain/occurrences";
import { addDays, formatDayShort, fromDateKey, todayKey } from "@/domain/schedule";
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

function TodayDateHero({ date }: { date: Date }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(date, index));

  return (
    <section
      className="animate-rise overflow-hidden rounded-[30px] border border-white/85 bg-white/76 px-4 pb-4 pt-5 shadow-mid backdrop-blur-2xl min-[390px]:px-5"
      aria-label={`Сегодня, ${formatDayShort(date)}`}
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
        <div className="pt-1 text-right">
          <p className="text-[17px] font-semibold leading-tight text-foreground">Сегодня</p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            {formatDayShort(date)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1" aria-label="Ближайшие семь дней">
        {days.map((day, index) => (
          <div
            key={day.toISOString()}
            className={
              index === 0
                ? "flex min-h-[64px] flex-col items-center justify-center rounded-[18px] bg-secondary text-primary shadow-low"
                : "flex min-h-[64px] flex-col items-center justify-center rounded-[18px] text-muted-foreground"
            }
            aria-current={index === 0 ? "date" : undefined}
          >
            <span className="text-[17px] font-semibold leading-none tabular-nums">
              {day.getDate()}
            </span>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
              {WEEKDAY_SHORT[day.getDay()]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TodayScreen() {
  const { source, isLoading } = usePlannerSource();
  const date = todayKey();
  const currentDate = fromDateKey(date);
  const occurrences = occurrencesForDate(source, date);

  return (
    <AppScreen title="Сегодня" header={<TodayDateHero date={currentDate} />}>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Загружаем план…</p>
      ) : (
        <DayPlan
          occurrences={occurrences}
          emptyText="На сегодня пока ничего не запланировано. Нажми ＋, чтобы добавить действие."
          maxTitleLines={2}
        />
      )}
    </AppScreen>
  );
}
