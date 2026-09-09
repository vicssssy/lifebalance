import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Clock,
  EditPencil,
  Hourglass,
  OpenNewWindow as ExternalLink,
  SkipNext as SkipForward,
  Undo as Undo2,
} from "@/components/ui/icons";
import { toast } from "sonner";
import { fetchAttachments, updateActionConfiguration } from "@/data/actions";
import {
  markActionCompleted,
  markActionSkipped,
  toggleRitualItem,
  unmarkActionCompleted,
} from "@/data/completions";
import { rescheduleAction } from "@/data/schedules";
import { ACTION_FORMAT_NAME } from "@/domain/constants";
import {
  formatDayLong,
  formatDayShort,
  toDateKey,
  formatDuration,
  formatTime,
  fromDateKey,
  todayKey,
} from "@/domain/schedule";
import { useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { ActionForm, type ActionFormValues } from "@/components/ActionForm";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { DayPicker, WeekdaySchedule } from "@/components/planning";
import { DurationWheels, PickerSheet } from "@/components/pickers";
import { ScreenHeader } from "@/components/ScreenHeader";
import { occurrencesForDate } from "@/domain/occurrences";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MetaChip, PageContainer, Section } from "@/components/ui/layout";
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

  // An occurrence needs an explicit, valid date and its own schedule. Never guess.
  const date = search.date ?? "";
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && toDateKey(fromDateKey(date)) === date;
  const occurrence =
    validDate && search.scheduleId
      ? (occurrencesForDate(source, date, "history").find(
          (item) => item.action.id === actionId && item.schedule.id === search.scheduleId,
        ) ?? null)
      : null;
  const action = source.actions.find((item) => item.id === actionId) ?? null;
  const schedules = source.schedules
    .filter((item) => item.action_id === actionId && item.status === "planned")
    .map((entry) => {
      const override =
        entry.repeat_type === "once"
          ? source.occurrenceOverrides?.find((item) => item.schedule_id === entry.id)
          : undefined;
      return override
        ? {
            ...entry,
            scheduled_date: override.target_date,
            start_time: override.start_time,
            duration_seconds: override.duration_seconds,
          }
        : entry;
    });
  const schedule = occurrence?.schedule ?? null;
  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", actionId],
    queryFn: () => fetchAttachments(actionId),
  });
  const items = source.ritualItems
    .filter((item) => action?.type === "ritual" && item.ritual_action_id === actionId)
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
  const completed = occurrence?.completed ?? false;
  const itemDone = (itemId: string) =>
    Boolean(occurrence) &&
    source.ritualItemCompletions.some(
      (item) =>
        item.ritual_item_id === itemId &&
        item.schedule_id === schedule?.id &&
        item.occurrence_date === occurrence?.originalDate,
    );
  const doneCount = items.filter((item) => itemDone(item.id)).length;

  const complete = usePlannerMutation(() =>
    markActionCompleted({ actionId, scheduleId: schedule!.id, date }),
  );
  const skip = usePlannerMutation(() =>
    markActionSkipped({ actionId, scheduleId: schedule!.id, date }),
  );
  const pause = usePlannerMutation(() => unmarkActionCompleted({ scheduleId: schedule!.id, date }));
  const move = usePlannerMutation(() =>
    rescheduleAction({
      scheduleId: schedule!.id,
      fromDate: date,
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
  });
  const saveConfiguration = usePlannerMutation((values: ActionFormValues) =>
    updateActionConfiguration(actionId, values),
  );
  const occurrencePending =
    complete.isPending ||
    skip.isPending ||
    move.isPending ||
    toggleItem.isPending ||
    pause.isPending;
  const mutationError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "Не удалось сохранить");

  if (isLoading) {
    return (
      <PageContainer as="div" className="safe-top py-16">
        <p className="content-surface rounded-[30px] px-5 py-10 text-center text-sm text-muted-foreground">
          Загружаем…
        </p>
      </PageContainer>
    );
  }

  if (!action) {
    return (
      <PageContainer as="div" className="safe-top py-16 text-center">
        <div className="content-surface rounded-[30px] px-5 py-10">
          <p className="text-lg font-semibold">Действие не найдено</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/today" })}
            className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-base font-semibold text-primary-foreground shadow-mid"
          >
            Вернуться к плану
          </button>
        </div>
      </PageContainer>
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
        <PageContainer as="main" className="animate-rise pt-6">
          <ActionForm
            type={action.type}
            areas={areas}
            goals={source.goals}
            initial={{
              goalId: action.goal_id,
              name: action.name,
              description: action.description,
              durationSeconds: action.duration_seconds,
              whyImportant: action.why_important,
              startDate: action.start_date,
              endDate: action.end_date,
              reminderEnabled: action.reminder_enabled,
              reminderTime: action.reminder_time,
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
        </PageContainer>
      </div>
    );
  }

  const durationSeconds = occurrence?.durationSeconds ?? null;
  const description = action.description?.trim();
  const goalResult = goal?.result_text.trim();
  const whyImportant = action.why_important?.trim();
  const materials = attachments.filter((attachment) => attachment.url.trim());
  const timeLabel = (start: string | null, seconds: number | null) => {
    const time = formatTime(start);
    if (!time || action.type !== "time_slot" || !seconds || seconds <= 0) return time;
    const [hours = 0, minutes = 0, startSeconds = 0] = start!.split(":").map(Number);
    const endSeconds = hours * 3600 + minutes * 60 + startSeconds + seconds;
    const days = Math.floor(endSeconds / 86400);
    const end = `${String(Math.floor(endSeconds / 3600) % 24).padStart(2, "0")}:${String(Math.floor(endSeconds / 60) % 60).padStart(2, "0")}`;
    const exactEnd = endSeconds % 60 ? `${end}:${String(endSeconds % 60).padStart(2, "0")}` : end;
    return `${time}–${exactEnd}${days ? ` (+${days} дн.)` : ""}`;
  };
  const progress = items.length ? `Пунктов выполнено: ${doneCount} из ${items.length}` : undefined;
  const completionControls =
    schedule && actionIsActive ? (
      <section
        aria-label="Управление выполнением"
        className="space-y-3 border-t border-border/60 pt-5"
      >
        <Button
          size="lg"
          variant={completed ? "occurrenceCompleted" : "primary"}
          aria-label={completed ? "✓ Выполнено" : "Выполнено"}
          loading={complete.isPending}
          disabled={occurrencePending}
          onClick={() =>
            complete.mutate(undefined as never, {
              onSuccess: () => toast.success("Выполнено"),
              onError: mutationError,
            })
          }
        >
          <Check aria-hidden /> Выполнено
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            loading={skip.isPending}
            disabled={occurrencePending}
            onClick={() =>
              skip.mutate(undefined as never, {
                onSuccess: () => {
                  toast.success("Пропущено");
                  navigate({ to: "/today" });
                },
                onError: mutationError,
              })
            }
          >
            <SkipForward aria-hidden /> Пропустить
          </Button>
          <Button
            variant="outline"
            disabled={occurrencePending}
            onClick={() => {
              setMoveDate(date);
              setMoveTime(occurrence?.startTime?.slice(0, 5) ?? "");
              setMoveDuration(durationSeconds);
              setMoveOpen(true);
            }}
          >
            <Calendar aria-hidden /> Перенести
          </Button>
        </div>
        {items.length && doneCount < items.length && !completed ? (
          <Button
            variant="ghost"
            className="w-full"
            disabled={occurrencePending}
            onClick={() => {
              pause.mutate(undefined as never, {
                onSuccess: () => {
                  toast.success(`Прогресс сохранён: ${doneCount} из ${items.length}`);
                  navigate({ to: "/today" });
                },
                onError: mutationError,
              });
            }}
          >
            <Undo2 aria-hidden /> Вернусь позже
          </Button>
        ) : null}
      </section>
    ) : null;

  return (
    <div className="app-screen min-h-dvh bg-background pb-36">
      <ScreenHeader
        onBack={() => navigate({ to: "/today" })}
        backLabel="К плану"
        right={
          actionIsActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({
                  to: "/action/$actionId",
                  params: { actionId },
                  search: { date: search.date, scheduleId: search.scheduleId, edit: true },
                })
              }
            >
              <EditPencil aria-hidden /> Изменить
            </Button>
          ) : undefined
        }
      />
      <main className="animate-rise pt-5">
        <PageContainer className="space-y-7 break-words">
          <section className="space-y-3">
            <Badge variant="muted">{ACTION_FORMAT_NAME[action.type]}</Badge>
            <h1 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]">
              {action.name}
            </h1>
            {actionAreas.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {actionAreas.map((area) => (
                  <LifeAreaCategoryLink key={area.id} area={area} />
                ))}
              </div>
            ) : null}
          </section>

          {occurrence ? (
            <section
              aria-label="Текущее выполнение"
              className="content-surface space-y-3 rounded-[24px] p-4"
            >
              <p className="text-base font-semibold">
                <time dateTime={date}>{formatDayLong(fromDateKey(date))}</time>
              </p>
              {occurrence.startTime || formatDuration(durationSeconds) ? (
                <div className="flex flex-wrap gap-2">
                  {occurrence.startTime ? (
                    <MetaChip icon={Clock}>
                      {timeLabel(occurrence.startTime, durationSeconds)}
                    </MetaChip>
                  ) : null}
                  {formatDuration(durationSeconds) ? (
                    <MetaChip icon={Hourglass}>{formatDuration(durationSeconds)}</MetaChip>
                  ) : null}
                </div>
              ) : null}
              {completed || occurrence.skipped || progress ? (
                <div aria-live="polite" className="space-y-2">
                  {completed ? (
                    <Badge>
                      <Check aria-hidden className="size-3.5" /> Выполнено
                    </Badge>
                  ) : occurrence.skipped ? (
                    <Badge variant="muted">Пропущено</Badge>
                  ) : null}
                  {progress ? <p className="text-sm text-muted-foreground">{progress}</p> : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {completionControls}

          {description ? (
            <Section title="Описание">
              <div className="content-surface rounded-[24px] px-4 py-3.5">
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                  {description}
                </p>
              </div>
            </Section>
          ) : null}

          {items.length ? (
            <Section title="Ритуал">
              <div className="content-surface divide-y divide-border/60 overflow-hidden rounded-[24px]">
                {items.map((item) => {
                  const done = itemDone(item.id);
                  return (
                    <div key={item.id} className="flex items-start gap-2 px-4">
                      <button
                        type="button"
                        disabled={!schedule || !actionIsActive || occurrencePending}
                        onClick={() =>
                          toggleItem.mutate(
                            { itemId: item.id, done: !done },
                            { onError: mutationError },
                          )
                        }
                        aria-label={done ? "Снять отметку" : "Отметить пункт"}
                        aria-pressed={done}
                        className="focus-ring touch-target flex shrink-0 items-center justify-center rounded-xl disabled:opacity-60"
                      >
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-full",
                            done
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-secondary",
                          )}
                        >
                          {done ? (
                            <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                          ) : null}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1 break-words py-3.5">
                        <p
                          className={cn("text-base", done && "text-muted-foreground line-through")}
                        >
                          {item.name}
                        </p>
                        {item.description?.trim() ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                            {item.description.trim()}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {goalResult ? (
            <Section title="Моя цель">
              <div className="content-surface rounded-[24px] px-4 py-3.5">
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                  {goalResult}
                </p>
              </div>
            </Section>
          ) : null}

          {whyImportant ? (
            <Section title="Почему это важно">
              <div className="content-surface rounded-[24px] px-4 py-3.5">
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed">
                  {whyImportant}
                </p>
              </div>
            </Section>
          ) : null}

          {materials.length ? (
            <Section title="Материалы">
              <div className="content-surface divide-y divide-border/60 overflow-hidden rounded-[24px]">
                {materials.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url.trim()}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-secondary/60"
                  >
                    <span className="min-w-0 break-words text-base">
                      {attachment.title?.trim() || attachment.url.trim()}
                    </span>
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </a>
                ))}
              </div>
            </Section>
          ) : null}

          {schedules.some(
            (entry) =>
              entry.scheduled_date ||
              entry.weekdays.length ||
              entry.start_time ||
              formatDuration(entry.duration_seconds ?? action.duration_seconds),
          ) ? (
            <Section title="Расписание">
              <div className="content-surface divide-y divide-border/60 rounded-[24px] px-4">
                {schedules.map((entry) => {
                  const seconds = entry.duration_seconds ?? action.duration_seconds;
                  const weekly = entry.repeat_type === "weekly" && entry.weekdays.length > 0;
                  const days =
                    entry.repeat_type === "once" && entry.scheduled_date
                      ? formatDayShort(fromDateKey(entry.scheduled_date))
                      : "";
                  const time = timeLabel(entry.start_time, seconds);
                  const duration = formatDuration(seconds);
                  if (!weekly && !days && !time && !duration) return null;
                  return (
                    <div key={entry.id} className="space-y-1 py-3">
                      {weekly ? <WeekdaySchedule value={entry.weekdays} /> : null}
                      {days ? <p className="text-base font-medium">{days}</p> : null}
                      {time || duration ? (
                        <p className="text-sm text-muted-foreground">
                          {[time, duration].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}
        </PageContainer>
      </main>

      <PickerSheet
        open={actionIsActive && moveOpen}
        onCancel={() => setMoveOpen(false)}
        submitLabel="Перенести"
        onSubmit={() => {
          if (occurrencePending) return;
          move.mutate(undefined as never, {
            onSuccess: () => {
              setMoveOpen(false);
              toast.success("Перенесено");
              navigate({ to: "/today" });
            },
            onError: mutationError,
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
