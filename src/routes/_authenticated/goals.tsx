import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Trophy } from "iconoir-react";
import { toast } from "sonner";
import { setGoalStatus } from "@/data/goals";
import { ACTION_FORMAT_NAME } from "@/domain/constants";
import { useGoals, useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/surface";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";

export const Route = createFileRoute("/_authenticated/goals")({
  validateSearch: (search: Record<string, unknown>) => ({
    area: search["area"] ? String(search["area"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Мои цели — Путь" },
      {
        name: "description",
        content: "Сферы жизни, желаемые результаты и действия, которые к ним ведут.",
      },
      { property: "og:title", content: "Мои цели — Путь" },
      { property: "og:description", content: "Все результаты и связанные с ними действия." },
    ],
  }),
  component: GoalsScreen,
});

function GoalsScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: areas = [] } = useLifeAreas();
  const { data: goals = [] } = useGoals();
  const { source } = usePlannerSource();
  const [showArchive, setShowArchive] = useState(false);
  const [previewCompleted, setPreviewCompleted] = useState<Set<string>>(() => new Set());
  const localPreview = isLocalPreviewAuthBypassEnabled();

  const complete = usePlannerMutation(async (goalId: string) => {
    if (localPreview) {
      setPreviewCompleted((current) => new Set(current).add(goalId));
      return;
    }
    await setGoalStatus(goalId, "completed");
  });

  const displayGoals = localPreview
    ? goals.map((goal) =>
        previewCompleted.has(goal.id)
          ? { ...goal, status: "completed" as const, completed_at: new Date().toISOString() }
          : goal,
      )
    : goals;

  const selectedArea = areas.find((area) => area.id === search.area) ?? null;

  const visible = displayGoals.filter(
    (goal) =>
      (showArchive ? goal.status !== "active" : goal.status === "active") &&
      (!selectedArea || goal.life_area_id === selectedArea.id),
  );
  const areasWithGoals = areas.filter((area) => visible.some((g) => g.life_area_id === area.id));

  return (
    <AppScreen
      title={selectedArea?.name ?? "Мои цели"}
      subtitle={
        selectedArea
          ? showArchive
            ? "Завершённые результаты"
            : "Активные результаты"
          : showArchive
            ? "Завершённые результаты"
            : "Активные результаты по сферам жизни"
      }
      right={
        selectedArea ? undefined : (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 rounded-full border-white/85 bg-white/72 shadow-mid backdrop-blur-2xl"
            onClick={() => setShowArchive((v) => !v)}
          >
            {showArchive ? "Активные" : "Архив"}
          </Button>
        )
      }
    >
      {selectedArea ? (
        <div className="mb-5 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/85 bg-white/72 shadow-mid backdrop-blur-2xl"
            onClick={() => navigate({ to: "/goals", search: { area: undefined } })}
          >
            Все сферы
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/85 bg-white/72 shadow-mid backdrop-blur-2xl"
            onClick={() => setShowArchive((v) => !v)}
          >
            {showArchive ? "Активные" : "Архив"}
          </Button>
        </div>
      ) : null}

      {!areasWithGoals.length ? (
        <EmptyState
          icon={Trophy}
          title={showArchive ? "Архив пуст" : "Ещё нет результатов"}
          description={
            showArchive
              ? "Завершённые результаты появятся здесь."
              : "Нажми ＋ и начни со сферы жизни."
          }
        />
      ) : (
        <div className="animate-rise space-y-7">
          {areasWithGoals.map((area) => (
            <section key={area.id}>
              {!selectedArea ? (
                <SectionTitle className="mb-2.5 block">
                  <LifeAreaCategoryLink area={area} className="uppercase tracking-[0.12em]" />
                </SectionTitle>
              ) : null}
              <div className="space-y-2.5">
                {visible
                  .filter((g) => g.life_area_id === area.id)
                  .map((goal) => {
                    const actions = source.actions.filter((a) => a.goal_id === goal.id);
                    return (
                      <Card key={goal.id} className="px-4 py-4">
                        <p className="text-lg font-semibold leading-snug">{goal.result_text}</p>

                        {actions.length ? (
                          <ul className="mt-2.5 space-y-1.5">
                            {actions.map((action) => (
                              <li key={action.id}>
                                <Link
                                  to="/action/$actionId"
                                  params={{ actionId: action.id }}
                                  search={{ date: undefined, scheduleId: undefined }}
                                  className="focus-ring flex min-h-11 items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white/42 px-3 transition-[background-color,box-shadow] duration-200 hover:bg-white/72 hover:shadow-low"
                                >
                                  <span className="text-base">{action.name}</span>
                                  <Badge variant="muted">{ACTION_FORMAT_NAME[action.type]}</Badge>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Пока нет действий, ведущих к этому результату.
                          </p>
                        )}

                        {goal.status === "active" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 rounded-full px-3 text-primary hover:bg-white/60"
                            loading={complete.isPending}
                            onClick={() =>
                              complete.mutate(goal.id, {
                                onSuccess: () => toast.success("Результат достигнут"),
                              })
                            }
                          >
                            <Check strokeWidth={1.75} /> Результат достигнут
                          </Button>
                        ) : null}
                      </Card>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppScreen>
  );
}
