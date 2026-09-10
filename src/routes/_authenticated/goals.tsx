import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Archive,
  Check,
  CheckSquare,
  Clock,
  MoreHoriz,
  NavArrowRight,
  Plus,
  Repeat,
  Sparks,
  TaskList,
  Trophy,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { deleteArchivedGoal, setGoalStatus } from "@/data/goals";
import { ArchivedGoalSwipe } from "@/components/ArchivedGoalSwipe";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ACTION_FORMAT_NAME, type ActionType } from "@/domain/constants";
import { todayKey } from "@/domain/schedule";
import { useGoals, useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { LifeAreaIconFrame } from "@/components/LifeAreaIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppIcon } from "@/components/ui/icon";
import type { GoalStatus } from "@/domain/types";

const ACTION_ICON: Record<ActionType, AppIcon> = {
  ritual: Sparks,
  regular_action: Repeat,
  task: CheckSquare,
  time_slot: Clock,
  preparation: TaskList,
};

const ACTION_TYPES: ActionType[] = ["ritual", "regular_action", "task", "time_slot", "preparation"];

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
  const [goalLifecycleDialog, setGoalLifecycleDialog] = useState<{
    goalId: string;
    status: Exclude<GoalStatus, "active">;
  } | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const archiveButton = useRef<HTMLButtonElement>(null);
  const deleteGoal = usePlannerMutation(async (goalId: string) => {
    await deleteArchivedGoal(goalId);
    setDeletedIds((ids) => new Set([...ids, goalId]));
    setGoalToDelete(null);
  });

  const closeGoal = usePlannerMutation(
    async ({ goalId, status }: { goalId: string; status: Exclude<GoalStatus, "active"> }) => {
      const closedOn = todayKey();
      await setGoalStatus(goalId, status, closedOn);
    },
  );

  const displayGoals = goals.filter((goal) => !deletedIds.has(goal.id));
  const lifecycleGoal = goalLifecycleDialog
    ? (displayGoals.find((goal) => goal.id === goalLifecycleDialog.goalId) ?? null)
    : null;

  const selectedArea = areas.find((area) => area.id === search.area) ?? null;
  const currentActions = source.actions.filter((action) => !action.archived_at);
  const activeGoalIdsWithActions = new Set(
    currentActions.flatMap((action) => (action.goal_id ? [action.goal_id] : [])),
  );

  const visible = displayGoals.filter(
    (goal) =>
      (showArchive
        ? goal.status !== "active"
        : goal.status === "active" && activeGoalIdsWithActions.has(goal.id)) &&
      (!selectedArea || goal.life_area_id === selectedArea.id),
  );
  const areasWithGoals = areas.filter((area) => visible.some((g) => g.life_area_id === area.id));

  return (
    <AppScreen
      title="Мои цели"
      subtitle="То, к чему ты сейчас идёшь"
      right={
        <Button
          ref={archiveButton}
          variant="outline"
          size="sm"
          className="mt-2 rounded-full border-white/85 bg-white/72 shadow-mid backdrop-blur-2xl"
          onClick={() => setShowArchive((v) => !v)}
        >
          <Archive strokeWidth={1.75} aria-hidden />
          {showArchive ? "Активные" : "Архив"}
        </Button>
      }
    >
      {selectedArea ? (
        <div className="mb-5 flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/85 bg-white/72 shadow-mid backdrop-blur-2xl"
            onClick={() => navigate({ to: "/goals", search: { area: undefined } })}
          >
            Все сферы
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
                  <LifeAreaIconFrame area={area} className="size-10 rounded-[16px]" />
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
                    const actions = (showArchive ? source.actions : currentActions).filter(
                      (action) => action.goal_id === goal.id,
                    );
                    const card = (
                      <div
                        key={goal.id}
                        className="content-surface relative overflow-hidden rounded-[30px] px-3 py-4"
                      >
                        <div className="relative grid grid-cols-[40px_minmax(0,1fr)_44px] gap-x-3">
                          <span
                            className="z-10 flex size-10 items-center justify-center rounded-[16px] border border-white/85 bg-secondary text-primary shadow-low"
                            aria-hidden
                          >
                            <Trophy className="size-[18px]" strokeWidth={1.8} />
                          </span>
                          <div className="min-w-0 pb-4 pt-0.5">
                            <p className="text-[12px] font-semibold leading-none text-muted-foreground">
                              {goal.status === "completed"
                                ? "✓ Результат достигнут"
                                : goal.status === "cancelled"
                                  ? "× Отменено"
                                  : "Цель"}
                            </p>
                            <h3 className="mt-2 text-[18px] font-semibold leading-[1.34] tracking-[-0.02em] text-foreground">
                              {goal.result_text}
                            </h3>
                          </div>
                          {goal.status === "active" ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="focus-ring mt-0.5 size-11 rounded-2xl text-muted-foreground hover:bg-secondary/85 hover:text-foreground"
                                  aria-label="Действия цели"
                                >
                                  <MoreHoriz className="size-5" strokeWidth={2} aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                sideOffset={8}
                                className="content-surface min-w-52 rounded-[20px] border-white/85 p-1.5 shadow-high"
                              >
                                <DropdownMenuItem
                                  className="min-h-11 rounded-[14px] px-3 text-[15px] font-medium text-foreground focus:bg-secondary/85"
                                  onSelect={() =>
                                    setGoalLifecycleDialog({ goalId: goal.id, status: "completed" })
                                  }
                                >
                                  Цель достигнута
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="min-h-11 rounded-[14px] px-3 text-[15px] font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                                  onSelect={() =>
                                    setGoalLifecycleDialog({ goalId: goal.id, status: "cancelled" })
                                  }
                                >
                                  Отменить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span aria-hidden />
                          )}
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
                                    className="z-10 mt-3 flex size-10 items-center justify-center rounded-[16px] border border-white/85 bg-white text-primary shadow-low"
                                    aria-hidden
                                  >
                                    <ActionIcon className="size-[18px]" strokeWidth={1.75} />
                                  </span>
                                  <Link
                                    to="/action/$actionId"
                                    params={{ actionId: action.id }}
                                    search={{
                                      date: undefined,
                                      scheduleId: undefined,
                                      edit: undefined,
                                    }}
                                    className="focus-ring group/action flex min-h-20 min-w-0 items-start gap-2 border-t border-border/55 py-3 pl-0.5 pr-1 transition-colors duration-200 hover:text-primary"
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
                              className="z-10 mt-3 flex size-10 items-center justify-center rounded-[16px] border border-white/85 bg-white text-primary shadow-low"
                              aria-hidden
                            >
                              <TaskList className="size-[18px]" strokeWidth={1.75} />
                            </span>
                            <p className="min-w-0 border-t border-border/55 py-4 text-sm leading-snug text-muted-foreground">
                              Пока нет действий, ведущих к этому результату.
                            </p>
                          </div>
                        )}

                        {goal.status === "active" ? (
                          <div className="ml-[52px] mt-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-11 rounded-2xl border-white/85 bg-white/72 px-3 text-primary shadow-low hover:bg-secondary/75"
                                >
                                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                                  Добавить действие
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                sideOffset={8}
                                className="content-surface min-w-56 rounded-[20px] border-white/85 p-1.5 shadow-high"
                              >
                                {ACTION_TYPES.map((type) => (
                                  <DropdownMenuItem
                                    key={type}
                                    className="min-h-11 rounded-[14px] px-3 text-[15px] font-medium text-foreground focus:bg-secondary/85"
                                    onSelect={() =>
                                      navigate({
                                        to: "/new/$type",
                                        params: { type },
                                        search: {
                                          lifeAreaId: goal.life_area_id,
                                          goalId: goal.id,
                                          resultText: goal.result_text,
                                        },
                                      })
                                    }
                                  >
                                    {ACTION_FORMAT_NAME[type]}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : null}
                      </div>
                    );
                    return showArchive ? (
                      <ArchivedGoalSwipe
                        key={goal.id}
                        name={goal.result_text}
                        onRequestDelete={() => {
                          if (deleteGoal.isPending) return;
                          setDeleteError(null);
                          setGoalToDelete(goal.id);
                        }}
                      >
                        {card}
                      </ArchivedGoalSwipe>
                    ) : (
                      card
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}
      <AlertDialog
        open={goalLifecycleDialog !== null && lifecycleGoal !== null}
        onOpenChange={(open) => {
          if (!open && !closeGoal.isPending) setGoalLifecycleDialog(null);
        }}
      >
        <AlertDialogContent>
          {goalLifecycleDialog?.status === "completed" && lifecycleGoal ? (
            <>
              <div
                className="mx-auto flex size-16 items-center justify-center rounded-full bg-occurrence-completed text-foreground shadow-mid"
                aria-hidden
              >
                <Check className="size-8" strokeWidth={2.4} />
              </div>
              <AlertDialogHeader className="text-center sm:text-center">
                <AlertDialogTitle>Цель достигнута!</AlertDialogTitle>
                <AlertDialogDescription>
                  Поздравляем! Ты достигла цели «{lifecycleGoal.result_text}».
                </AlertDialogDescription>
              </AlertDialogHeader>
              <p className="text-center text-sm leading-relaxed text-muted-foreground">
                Цель будет сохранена в архиве вместе с историей и статистикой.
              </p>
            </>
          ) : lifecycleGoal ? (
            <AlertDialogHeader>
              <AlertDialogTitle>Отменить цель?</AlertDialogTitle>
              <AlertDialogDescription className="leading-relaxed">
                <span className="block">
                  Цель «{lifecycleGoal.result_text}» будет отменена и перемещена в архив.
                </span>
                <span className="mt-2 block">История и статистика сохранятся.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeGoal.isPending}>Вернуться</AlertDialogCancel>
            <AlertDialogAction
              aria-busy={closeGoal.isPending}
              disabled={closeGoal.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!goalLifecycleDialog || !lifecycleGoal || closeGoal.isPending) return;
                closeGoal.mutate(
                  { goalId: lifecycleGoal.id, status: goalLifecycleDialog.status },
                  {
                    onSuccess: () => {
                      toast.success(
                        goalLifecycleDialog.status === "completed"
                          ? "Цель перемещена в архив"
                          : "Цель отменена и перемещена в архив",
                      );
                      setGoalLifecycleDialog(null);
                    },
                  },
                );
              }}
            >
              {goalLifecycleDialog?.status === "completed" ? "В архив" : "Отменить цель"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={goalToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteGoal.isPending) setGoalToDelete(null);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            archiveButton.current?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Вы точно хотите удалить эту цель?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо и удалит связанную с ней статистику.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGoal.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              style={{ background: "var(--destructive)" }}
              aria-busy={deleteGoal.isPending}
              disabled={deleteGoal.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!goalToDelete || deleteGoal.isPending) return;
                deleteGoal.mutate(goalToDelete, {
                  onError: (error) => setDeleteError(error.message),
                });
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppScreen>
  );
}
