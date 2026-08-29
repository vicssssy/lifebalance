import { createFileRoute } from "@tanstack/react-router";
import { occurrencesForDate } from "@/domain/occurrences";
import { formatDayLong, fromDateKey, todayKey } from "@/domain/schedule";
import { usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { DayPlan } from "@/components/DayPlan";
import { DayProgress } from "@/components/DayProgress";

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

function TodayScreen() {
  const { source, isLoading } = usePlannerSource();
  const date = todayKey();
  const occurrences = occurrencesForDate(source, date);

  return (
    <AppScreen title="Сегодня" subtitle={formatDayLong(fromDateKey(date))}>
      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Загружаем план…</p>
      ) : (
        <>
          <DayProgress occurrences={occurrences} />
          <DayPlan
            occurrences={occurrences}
            emptyText="На сегодня пока ничего не запланировано. Нажми ＋, чтобы добавить действие."
          />
        </>
      )}
    </AppScreen>
  );
}
