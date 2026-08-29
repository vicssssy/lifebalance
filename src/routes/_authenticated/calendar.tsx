import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { occurrencesForDate } from "@/domain/occurrences";
import { formatDayLong, fromDateKey, todayKey } from "@/domain/schedule";
import { usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { DayPlan } from "@/components/DayPlan";
import { DayPicker } from "@/components/planning";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Календарь — Путь" },
      { name: "description", content: "Выбери день и посмотри, что на него запланировано." },
      { property: "og:title", content: "Календарь — Путь" },
      { property: "og:description", content: "План на любой день месяца." },
    ],
  }),
  component: CalendarScreen,
});

function CalendarScreen() {
  const [selected, setSelected] = useState<string[]>([todayKey()]);
  const date = selected[0] ?? todayKey();
  const { source, isLoading } = usePlannerSource();
  const occurrences = occurrencesForDate(source, date);

  return (
    <AppScreen title="Календарь" subtitle={formatDayLong(fromDateKey(date))}>
      <div className="space-y-6">
        <DayPicker value={selected} onChange={setSelected} multiple={false} />
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Загружаем план…</p>
        ) : (
          <DayPlan
            key={date}
            occurrences={occurrences}
            emptyText="На этот день ничего не запланировано."
          />
        )}
      </div>
    </AppScreen>
  );
}
