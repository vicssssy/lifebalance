import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Clock,
  EditPencil,
  Hourglass,
  MultiplePages as Layers,
  OpenNewWindow as ExternalLink,
  SkipNext as SkipForward,
  Undo as Undo2,
} from "iconoir-react";
import { toast } from "sonner";
import { fetchAttachments, updateActionConfiguration } from "@/data/actions";
import { markActionCompleted, markActionSkipped, toggleRitualItem } from "@/data/completions";
import { rescheduleAction } from "@/data/schedules";
import { ACTION_FORMAT_NAME } from "@/domain/constants";
import {
  formatDayShort,
  formatDuration,
  formatTime,
  fromDateKey,
  todayKey,
} from "@/domain/schedule";
import { useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { ActionForm, type ActionFormValues } from "@/components/ActionForm";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { DayPicker } from "@/components/planning";
import { DurationWheels, PickerSheet } from "@/components/pickers";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider, PageContainer, Section } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/action/$actionId")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: search["date"] ? String(search["date"]) : undefined,
    scheduleId: search["scheduleId"] ? String(search["scheduleId"]) : undefined,
    edit: search["edit"] === true || search["edit"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Действие — Путь" },
      { name: "description", content: "Детали действия, его смысл и отметка выполнения." },
      { property: "og:title", content: "Действие — Путь" },
      { property: "og:description", content: "Что нужно сделать и почему это важно." },
    ],
  }),
  component: ActionDetail,
});

function CircleAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: typeof Check;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  return (
    <div className="flex w-14 flex-col items-center gap-1.5 min-[360px]:w-16">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn(
          "focus-ring flex size-12 items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:opacity-60",
          variant === "primary"
            ? "bg-primary text-primary-foreground shadow-mid"
            : "border border-white/85 bg-white/72 text-foreground shadow-mid backdrop-blur-2xl",
        )}
      >
        <Icon className="size-5" strokeWidth={1.9} aria-hidden />
      </button>
      <span className="text-center text-xs leading-tight text-muted-foreground">{label}</span>
    </div>
  );
}

function MetaChip({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 text-sm font-medium text-foreground shadow-mid backdrop-blur-2xl">
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      {children}
    </span>
  );
}

function ActionDetail() {
  const { actionId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { source, isLoading } = usePlannerSource();
  const { data: areas = [] } = useLifeAreas();
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDate, setMoveDate] = useState(todayKey());
  const [moveTime, setMoveTime] = useState("");
  const [moveDuration, setMoveDuration] = useState<number | null>(null);

  const date = search.date ?? todayKey();
  const action = source.actions.find((item) => item.id === actionId) ?? null;
  const schedules = source.schedules.filter(
    (item) => item.action_id === actionId && item.status === "planned",
  );
  const schedule = schedules.find((item) => item.id === search.scheduleId) ?? schedules[0] ?? null;
  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", actionId],
    queryFn: () => fetchAttachments(actionId),
  });
  const items = source.ritualItems
    .filter((item) => item.ritual_action_id === actionId)
    .slice()
    .sort((left, right) => left.sort_order - right.sort_order);
  const actionAreaIds = source.actionLifeAreas
    .filter((link) => link.action_id === actionId)
    .map((link) => link.life_area_id);
  const actionAreas = actionAreaIds
    .map((areaId) => areas.find((area) => area.id === areaId))
    .filter((area): area is NonNullable<typeof area> => Boolean(area));
  const goal = source.goals.find((item) => item.id === action?.goal_id) ?? null;
  const actionIsActive = !action?.goal_id || goal?.status === "active";
  const completed = source.completions.some(
    (item) =>
      item.schedule_id === schedule?.id &&
      item.occurrence_date === date &&
      item.status === "completed",
  );
  const itemDone = (itemId: string) =>
    source.ritualItemCompletions.some(
      (item) =>
        item.ritual_item_id === itemId &&
        item.schedule_id === schedule?.id &&
        item.occurrence_date === date,
    );
  const doneCount = items.filter((item) => itemDone(item.id)).length;

  const complete = usePlannerMutation(() =>
    markActionCompleted({ actionId, scheduleId: schedule!.id, date }),
  );
  const skip = usePlannerMutation(() =>
    markActionSkipped({ actionId, scheduleId: schedule!.id, date }),
  );
  const move = usePlannerMutation(() =>
    rescheduleAction({
      scheduleId: schedule!.id,
      repeatType: schedule!.repeat_type,
      date: moveDate,
      startTime: moveTime || null,
      durationSeconds: moveDuration,
    }),
  );
  const toggleItem = usePlannerMutation(async (input: { itemId: string; done: boolean }) => {
    await toggleRitualItem({
      ritualItemId: input.itemId,
      scheduleId: schedule!.id,
      date,
      done: input.done,
    });
    const nextDone = input.done ? doneCount + 1 : doneCount - 1;
    if (items.length && nextDone >= items.length && !completed) {
      await markActionCompleted({ actionId, scheduleId: schedule!.id, date });
    }
  });
  const saveConfiguration = usePlannerMutation((values: ActionFormValues) =>
    updateActionConfiguration(actionId, values),
  );

  if (isLoading) {
    return (
      <div className="safe-top px-5 py-16">
        <p className="glass-surface rounded-[30px] px-5 py-10 text-center text-sm text-muted-foreground">
          Загружаем…
        </p>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="safe-top px-5 py-16 text-center">
        <div className="glass-surface rounded-[30px] px-5 py-10">
          <p className="text-lg font-semibold">Действие не найдено</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/today" })}
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground shadow-mid"
          >
            Вернуться к плану
          </button>
        </div>
      </div>
    );
  }

  if (search.edit && actionIsActive) {
    return (
      <div className="app-screen min-h-dvh bg-background pb-28">
        <ScreenHeader
          onBack={() =>
            navigate({
              to: "/action/$actionId",
              params: { actionId },
              search: { date: search.date, scheduleId: search.scheduleId, edit: undefined },
            })
          }
          eyebrow="Редактирование"
          title={ACTION_FORMAT_NAME[action.type]}
          subtitle={goal?.result_text ? `Моя цель: ${goal.result_text}` : undefined}
        />
        <main className="animate-rise page-gutter mx-auto w-full max-w-md pt-6">
          <ActionForm
            type={action.type}
            areas={areas}
            initial={{
              name: action.name,
              description: action.description,
              durationSeconds: action.duration_seconds,
              whyImportant: action.why_important,
              startDate: action.start_date,
              lifeAreaIds: actionAreaIds,
              ritualItems: items,
              attachments,
              schedules,
            }}
            submitting={saveConfiguration.isPending}
            onSubmit={(values) =>
              saveConfiguration.mutate(values, {
                onSuccess: () => {
                  toast.success("Изменения сохранены");
                  navigate({
                    to: "/action/$actionId",
                    params: { actionId },
                    search: { date: search.date, scheduleId: search.scheduleId, edit: undefined },
                  });
                },
                onError: (error) =>
                  toast.error(
                    error instanceof Error ? error.message : "Не удалось сохранить изменения",
                  ),
              })
            }
          />
        </main>
      </div>
    );
  }

  const durationSeconds = schedule?.duration_seconds ?? action.duration_seconds;
  const duration = formatDuration(durationSeconds);
  const time = formatTime(schedule?.start_time ?? null);

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader onBack={() => navigate({ to: "/today" })} backLabel="К плану" />

      <main className="animate-rise pt-2">
        <PageContainer className="space-y-8">
          <section className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{ACTION_FORMAT_NAME[action.type]}</Badge>
                {completed ? (
                  <Badge variant="default">
                    <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
                    Выполнено
                  </Badge>
                ) : null}
              </div>
              {actionIsActive ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/action/$actionId",
                      params: { actionId },
                      search: { date: search.date, scheduleId: search.scheduleId, edit: true },
                    })
                  }
                  className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-mid"
                >
                  <EditPencil className="size-4" aria-hidden />
                  Изменить
                </button>
              ) : null}
            </div>

            <h1 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]">
              {action.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {time ? <MetaChip icon={Clock}>{time}</MetaChip> : null}
              {duration ? <MetaChip icon={Hourglass}>{duration}</MetaChip> : null}
              <MetaChip icon={Calendar}>
                с {formatDayShort(fromDateKey(action.start_date))}
              </MetaChip>
              {items.length ? <MetaChip icon={Layers}>{items.length} пункта</MetaChip> : null}
            </div>

            {actionAreas.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {actionAreas.map((area) => (
                  <LifeAreaCategoryLink key={area.id} area={area} />
                ))}
              </div>
            ) : null}
          </section>

          {goal ? (
            <>
              <Divider />
              <Section title="Моя цель">
                <div className="rounded-[24px] border border-white/80 bg-white/70 px-4 py-3.5 shadow-mid backdrop-blur-2xl">
                  <p className="text-base leading-relaxed">{goal.result_text}</p>
                </div>
              </Section>
            </>
          ) : null}

          {action.description ? (
            <>
              <Divider />
              <Section title="Описание">
                <p className="text-base leading-relaxed">{action.description}</p>
              </Section>
            </>
          ) : null}

          {items.length ? (
            <>
              <Divider />
              <Section title="Ритуал">
                <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/64 shadow-mid backdrop-blur-2xl">
                  {items.map((item) => {
                    const done = itemDone(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 border-b border-white/75 px-3 last:border-b-0"
                      >
                        <button
                          type="button"
                          disabled={!schedule || !actionIsActive}
                          onClick={() => toggleItem.mutate({ itemId: item.id, done: !done })}
                          aria-label={done ? "Снять отметку" : "Отметить пункт"}
                          className="focus-ring touch-target flex shrink-0 items-center justify-center rounded-xl"
                        >
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-full",
                              done
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-secondary",
                            )}
                          >
                            {done ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                          </span>
                        </button>
                        <div className="min-w-0 flex-1 py-3">
                          <p
                            className={cn(
                              "text-base",
                              done && "text-muted-foreground line-through",
                            )}
                          >
                            {item.name}
                          </p>
                          {item.description ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </>
          ) : null}

          {action.why_important ? (
            <>
              <Divider />
              <Section title="Почему это важно">
                <p className="text-base leading-relaxed">{action.why_important}</p>
              </Section>
            </>
          ) : null}

          {attachments.length ? (
            <>
              <Divider />
              <Section title="Материалы">
                <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/68 shadow-mid backdrop-blur-2xl">
                  {attachments.map((attachment, index) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "focus-ring flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-200 hover:bg-secondary/60",
                        index > 0 && "border-t border-border/70",
                      )}
                    >
                      <span className="min-w-0 truncate text-base">
                        {attachment.title || attachment.url}
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </Section>
            </>
          ) : null}

          {schedule && actionIsActive ? (
            <StickyActions
              hint={items.length ? `Пунктов выполнено: ${doneCount} из ${items.length}` : undefined}
            >
              <div className="flex items-start justify-center gap-2 min-[360px]:gap-5">
                <CircleAction
                  icon={Check}
                  label="Выполнено"
                  variant="primary"
                  disabled={complete.isPending}
                  onClick={() =>
                    complete.mutate(undefined as never, {
                      onSuccess: () => {
                        toast.success("Выполнено");
                        navigate({ to: "/today" });
                      },
                    })
                  }
                />
                <CircleAction
                  icon={SkipForward}
                  label="Пропустить"
                  disabled={skip.isPending}
                  onClick={() =>
                    skip.mutate(undefined as never, {
                      onSuccess: () => {
                        toast.success("Пропущено");
                        navigate({ to: "/today" });
                      },
                    })
                  }
                />
                <CircleAction
                  icon={Calendar}
                  label="Перенести"
                  onClick={() => {
                    setMoveDate(date);
                    setMoveTime(schedule.start_time?.slice(0, 5) ?? "");
                    setMoveDuration(durationSeconds);
                    setMoveOpen(true);
                  }}
                />
                {items.length ? (
                  <CircleAction
                    icon={Undo2}
                    label="Вернусь позже"
                    onClick={() => {
                      toast.success(`Прогресс сохранён: ${doneCount} из ${items.length}`);
                      navigate({ to: "/today" });
                    }}
                  />
                ) : null}
              </div>
            </StickyActions>
          ) : null}
        </PageContainer>
      </main>

      <PickerSheet
        open={actionIsActive && moveOpen}
        onCancel={() => setMoveOpen(false)}
        submitLabel="Перенести"
        onSubmit={() => {
          setMoveOpen(false);
          move.mutate(undefined as never, {
            onSuccess: () => {
              toast.success("Перенесено");
              navigate({ to: "/today" });
            },
          });
        }}
      >
        <p className="pb-3 text-base font-semibold">Перенести действие</p>
        <div className="space-y-4">
          <DayPicker
            value={[moveDate]}
            onChange={(next) => setMoveDate(next[0] ?? moveDate)}
            multiple={false}
          />
          <label className="block space-y-1.5">
            <span className="text-sm text-muted-foreground">Время</span>
            <Input
              type="time"
              value={moveTime}
              onChange={(event) => setMoveTime(event.target.value)}
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm text-muted-foreground">Продолжительность</span>
            <DurationWheels
              hours={Math.floor((moveDuration ?? 0) / 3600)}
              minutes={Math.floor(((moveDuration ?? 0) % 3600) / 60)}
              seconds={(moveDuration ?? 0) % 60}
              onChange={(next) => {
                const hours = next.hours ?? Math.floor((moveDuration ?? 0) / 3600);
                const minutes = next.minutes ?? Math.floor(((moveDuration ?? 0) % 3600) / 60);
                const seconds = next.seconds ?? (moveDuration ?? 0) % 60;
                const total = hours * 3600 + minutes * 60 + seconds;
                setMoveDuration(total > 0 ? total : null);
              }}
            />
          </div>
        </div>
      </PickerSheet>
    </div>
  );
}
