import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Archive,
  Check,
  CheckSquare,
  Clock,
  NavArrowRight,
  Repeat,
  Sparks,
  TaskList,
  Trophy,
  Xmark,
} from "iconoir-react";
import { toast } from "sonner";
import { setGoalStatus } from "@/data/goals";
import { ACTION_FORMAT_NAME, type ActionType } from "@/domain/constants";
import { todayKey } from "@/domain/schedule";
import { useGoals, useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppIcon } from "@/components/ui/icon";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";
import { setLocalPreviewGoalStatus } from "@/lib/local-preview-store";
import type { GoalStatus } from "@/domain/types";

const ACTION_ICON: Record<ActionType, AppIcon> = {
  ritual: Sparks,
  regular_action: Repeat,
  task: CheckSquare,
  time_slot: Clock,
  preparation: TaskList,
};

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
  const localPreview = isLocalPreviewAuthBypassEnabled();

  const closeGoal = usePlannerMutation(
    async ({ goalId, status }: { goalId: string; status: Exclude<GoalStatus, "active"> }) => {
      const closedOn = todayKey();
      if (localPreview) {
        return setLocalPreviewGoalStatus(closedOn, goalId, status, closedOn);
      }
      await setGoalStatus(goalId, status, closedOn);
    },
  );

  const displayGoals = goals;

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
            ? "Архив результатов"
            : "Активные результаты"
          : showArchive
            ? "Архив результатов"
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
            <Archive strokeWidth={1.75} aria-hidden />
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
            <Archive strokeWidth={1.75} aria-hidden />
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
              ? "Завершённые и отменённые результаты появятся здесь."
              : "Нажми ＋ и начни со сферы жизни."
          }
        />
      ) : (
        <div className="animate-rise space-y-8">
          {areasWithGoals.map((area) => (
            <section key={area.id}>
              {!selectedArea ? (
                <div className="mb-3 flex min-w-0 items-center gap-2.5 px-1">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-secondary/80 text-primary shadow-low"
                    aria-hidden
                  >
                    <Trophy className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  <LifeAreaCategoryLink
                    area={area}
                    className="min-h-11 w-full min-w-0 justify-between text-[17px] leading-tight tracking-[-0.012em] [&>span]:min-w-0 [&>span]:break-words [&>svg]:size-5"
                  />
                </div>
              ) : null}
              <div className="space-y-7">
                {visible
                  .filter((g) => g.life_area_id === area.id)
                  .map((goal) => {
                    const actions = source.actions.filter((a) => a.goal_id === goal.id);
                    return (
                      <div key={goal.id} className="relative px-1 py-1">
                        <span
                          className="absolute bottom-9 left-5 top-9 w-px bg-primary/20"
                          aria-hidden
                        />

                        <div className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
                          <span
                            className="z-10 flex size-10 items-center justify-center rounded-full border border-primary/25 bg-background text-primary shadow-low"
                            aria-hidden
                          >
                            <Trophy className="size-[18px]" strokeWidth={1.8} />
                          </span>
                          <div className="min-w-0 pb-4 pt-0.5">
                            <p className="text-[12px] font-medium leading-none text-muted-foreground">
                              {goal.status === "completed"
                                ? "✓ Результат достигнут"
                                : goal.status === "cancelled"
                                  ? "× Отменено"
                                  : "Результат"}
                            </p>
                            <h3 className="mt-2 text-[18px] font-semibold leading-[1.34] tracking-[-0.02em] text-foreground">
                              {goal.result_text}
                            </h3>
                          </div>
                        </div>

                        {actions.length ? (
                          <div>
                            {actions.map((action) => {
                              const ActionIcon = ACTION_ICON[action.type];
                              return (
                                <div
                                  key={action.id}
                                  className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3"
                                >
                                  <span
                                    className="z-10 mt-3 flex size-10 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-low"
                                    aria-hidden
                                  >
                                    <ActionIcon className="size-[18px]" strokeWidth={1.75} />
                                  </span>
                                  <Link
                                    to="/action/$actionId"
                                    params={{ actionId: action.id }}
                                    search={{ date: undefined, scheduleId: undefined }}
                                    className="focus-ring group/action flex min-h-20 min-w-0 items-start gap-2 border-t border-white/85 py-3 pl-0.5 pr-1 transition-colors duration-200 hover:text-primary"
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-[12px] font-medium leading-none text-muted-foreground">
                                        Действие
                                      </span>
                                      <span className="mt-2 block break-words text-[15px] font-medium leading-[1.38] tracking-[-0.012em] text-foreground transition-colors group-hover/action:text-primary">
                                        {action.name}
                                      </span>
                                      <Badge
                                        variant="muted"
                                        className="mt-2 max-w-full bg-secondary/85 text-primary"
                                      >
                                        {ACTION_FORMAT_NAME[action.type]}
                                      </Badge>
                                    </span>
                                    <NavArrowRight
                                      className="mt-6 size-5 shrink-0 text-primary/70 transition-transform group-hover/action:translate-x-0.5"
                                      strokeWidth={1.75}
                                      aria-hidden
                                    />
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
                            <span
                              className="z-10 mt-3 flex size-10 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-low"
                              aria-hidden
                            >
                              <TaskList className="size-[18px]" strokeWidth={1.75} />
                            </span>
                            <p className="min-w-0 border-t border-white/85 py-4 text-sm leading-snug text-muted-foreground">
                              Пока нет действий, ведущих к этому результату.
                            </p>
                          </div>
                        )}

                        {goal.status === "active" ? (
                          <div className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-3">
                            <span
                              className="z-10 mt-3 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_26px_rgb(96_71_232_/_0.28)]"
                              aria-hidden
                            >
                              <Check className="size-[18px]" strokeWidth={2.25} />
                            </span>
                            <div className="space-y-1 border-t border-white/85 pt-2.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start rounded-2xl px-2 text-primary hover:bg-white/60"
                                loading={closeGoal.isPending}
                                onClick={() =>
                                  closeGoal.mutate(
                                    { goalId: goal.id, status: "completed" },
                                    {
                                      onSuccess: () => toast.success("Результат достигнут"),
                                    },
                                  )
                                }
                              >
                                Результат достигнут
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start rounded-2xl px-2 text-muted-foreground hover:bg-white/60 hover:text-foreground"
                                disabled={closeGoal.isPending}
                                onClick={() =>
                                  closeGoal.mutate(
                                    { goalId: goal.id, status: "cancelled" },
                                    {
                                      onSuccess: () => toast.success("Результат отменён"),
                                    },
                                  )
                                }
                              >
                                <Xmark strokeWidth={1.9} aria-hidden />
                                Отменено
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
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
