import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  Calendar,
  Check,
  NavArrowRight as ChevronRight,
  Clock,
  OpenNewWindow as ExternalLink,
  MoreVert as GripVertical,
  Hourglass,
  MultiplePages as Layers,
  SkipNext as SkipForward,
  Undo as Undo2,
} from "iconoir-react";
import { toast } from "sonner";
import {
  fetchAttachments,
  reorderRitualItems,
  updateAction,
  updateRitualItem,
} from "@/data/actions";
import { markActionCompleted, markActionSkipped, toggleRitualItem } from "@/data/completions";
import { rescheduleAction, updateSchedule } from "@/data/schedules";
import { ACTION_FORMAT_NAME } from "@/domain/constants";
import {
  formatDayShort,
  formatDuration,
  formatTime,
  fromDateKey,
  todayKey,
} from "@/domain/schedule";
import type { RitualItem } from "@/domain/types";
import { useLifeAreas, usePlannerMutation, usePlannerSource } from "@/hooks/useAppData";
import { DayPicker } from "@/components/planning";
import { DurationSheet, DurationWheels, PickerSheet, TimeSheet } from "@/components/pickers";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Divider, EditableSection, PageContainer, Section } from "@/components/ui/layout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/action/$actionId")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: search["date"] ? String(search["date"]) : undefined,
    scheduleId: search["scheduleId"] ? String(search["scheduleId"]) : undefined,
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

/** Значение, которое можно поменять нажатием. */
function EditableChip({
  icon: Icon,
  children,
  onClick,
  disabled = false,
}: {
  icon: typeof Clock;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3.5 text-sm font-medium text-foreground shadow-mid backdrop-blur-2xl transition-[background-color,box-shadow] duration-200 hover:bg-white/84 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
      {children}
      <ChevronRight className="size-3.5 text-muted-foreground/70" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

function RitualItemRow({
  item,
  done,
  disabled,
  readOnly,
  onToggle,
  onEdit,
}: {
  item: RitualItem;
  done: boolean;
  disabled: boolean;
  readOnly: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition: transition ?? undefined,
      }}
      className={cn(
        "flex items-start gap-1 border-b border-white/75 bg-white/42 px-1.5 last:border-b-0",
        isDragging && "relative z-20 shadow-mid",
      )}
    >
      <button
        type="button"
        disabled={disabled || readOnly}
        onClick={onToggle}
        aria-label={done ? "Снять отметку" : "Отметить пункт"}
        className="focus-ring touch-target flex shrink-0 items-center justify-center rounded-xl"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full transition-colors duration-200",
            done ? "bg-primary text-primary-foreground" : "border border-border bg-secondary",
          )}
        >
          {done ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
        </span>
      </button>

      <button
        type="button"
        disabled={readOnly}
        onClick={onEdit}
        className="focus-ring min-w-0 flex-1 rounded-xl px-1.5 py-3 text-left disabled:cursor-default"
      >
        <span
          className={cn(
            "block text-base",
            done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {item.name}
        </span>
        {item.description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
        ) : null}
      </button>

      <button
        type="button"
        disabled={readOnly}
        aria-label="Изменить порядок"
        {...attributes}
        {...listeners}
        className="touch-target flex shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/70 disabled:cursor-default disabled:opacity-45"
      >
        <GripVertical className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

/** Круглая кнопка-действие с подписью. */
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

function ActionDetail() {
  const { actionId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { source, isLoading } = usePlannerSource();
  const { data: areas = [] } = useLifeAreas();

  const [sheet, setSheet] = useState<"time" | "duration" | "start" | "move" | null>(null);
  const [moveDate, setMoveDate] = useState<string>(todayKey());
  const [moveTime, setMoveTime] = useState<string>("");
  const [moveDuration, setMoveDuration] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<RitualItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemHint, setItemHint] = useState("");
  const [startDraft, setStartDraft] = useState<string>(todayKey());

  const date = search.date ?? todayKey();
  const action = source.actions.find((a) => a.id === actionId) ?? null;
  const schedule =
    source.schedules.find((s) => s.id === search.scheduleId) ??
    source.schedules.find((s) => s.action_id === actionId) ??
    null;

  const { data: attachments = [] } = useQuery({
    queryKey: ["attachments", actionId],
    queryFn: () => fetchAttachments(actionId),
  });

  const items = source.ritualItems
    .filter((i) => i.ritual_action_id === actionId)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const actionAreas = source.actionLifeAreas
    .filter((l) => l.action_id === actionId)
    .map((l) => areas.find((a) => a.id === l.life_area_id))
    .filter((area): area is NonNullable<typeof area> => Boolean(area));

  const goal = source.goals.find((g) => g.id === action?.goal_id) ?? null;
  const actionIsActive = !action?.goal_id || goal?.status === "active";

  const completed = source.completions.some(
    (c) => c.schedule_id === schedule?.id && c.occurrence_date === date && c.status === "completed",
  );

  const itemDone = (itemId: string) =>
    source.ritualItemCompletions.some(
      (c) =>
        c.ritual_item_id === itemId && c.schedule_id === schedule?.id && c.occurrence_date === date,
    );

  const doneCount = items.filter((i) => itemDone(i.id)).length;

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
    // Когда выполнены все пункты — ритуал становится выполненным.
    const nextDone = input.done ? doneCount + 1 : doneCount - 1;
    if (items.length && nextDone >= items.length && !completed) {
      await markActionCompleted({ actionId, scheduleId: schedule!.id, date });
    }
  });

  const patch = usePlannerMutation((input: Parameters<typeof updateAction>[1]) =>
    updateAction(actionId, input),
  );

  const patchSchedule = usePlannerMutation((input: Parameters<typeof updateSchedule>[1]) =>
    updateSchedule(schedule!.id, input),
  );

  const patchItem = usePlannerMutation(
    (input: { itemId: string; patch: Parameters<typeof updateRitualItem>[1] }) =>
      updateRitualItem(input.itemId, input.patch),
  );

  const reorder = usePlannerMutation((ids: string[]) => reorderRitualItems(ids));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
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

  const durationSeconds = schedule?.duration_seconds ?? action.duration_seconds;
  const duration = formatDuration(durationSeconds);
  const time = formatTime(schedule?.start_time ?? null);

  const savePatch =
    (field: "name" | "description" | "why_important" | "helps_with") => (next: string) =>
      patch.mutateAsync(
        field === "name" ? { name: next || action.name } : { [field]: next || null },
      );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    reorder.mutate(next.map((i) => i.id));
  };

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader onBack={() => navigate({ to: "/today" })} backLabel="К плану" />

      <main className="animate-rise pt-2">
        <PageContainer className="space-y-8">
          <section className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Badge variant="muted">{ACTION_FORMAT_NAME[action.type]}</Badge>
              {completed ? (
                <Badge variant="default">
                  <Check className="size-3.5" strokeWidth={2.25} aria-hidden />
                  Выполнено
                </Badge>
              ) : null}
            </div>

            <EditableSection
              key={`name-${actionIsActive}`}
              title="Название"
              value={action.name}
              placeholder="Название действия"
              emptyText="Добавь название."
              onSave={savePatch("name")}
              saving={patch.isPending}
              editable={actionIsActive}
              multiline={false}
              valueClassName="text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]"
            />

            <div className="flex flex-wrap items-center gap-2">
              {schedule ? (
                <EditableChip
                  icon={Clock}
                  onClick={() => setSheet("time")}
                  disabled={!actionIsActive}
                >
                  {time ?? "Время"}
                </EditableChip>
              ) : null}
              <EditableChip
                icon={Hourglass}
                onClick={() => setSheet("duration")}
                disabled={!actionIsActive}
              >
                {duration ?? "Длительность"}
              </EditableChip>
              <EditableChip
                icon={Calendar}
                disabled={!actionIsActive}
                onClick={() => {
                  setStartDraft(action.start_date);
                  setSheet("start");
                }}
              >
                с {formatDayShort(fromDateKey(action.start_date))}
              </EditableChip>
              {items.length ? (
                <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-white/62 px-3.5 text-sm text-muted-foreground shadow-low backdrop-blur-2xl">
                  <Layers className="size-3.5" strokeWidth={1.75} aria-hidden />
                  {items.length} пункта
                </span>
              ) : null}
            </div>

            {actionAreas.length ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {actionAreas.map((area) => (
                  <LifeAreaCategoryLink key={area.id} area={area} />
                ))}
              </div>
            ) : null}
          </section>

          <Divider />

          {goal ? (
            <Section title="Результат">
              <div className="rounded-[24px] border border-white/80 bg-white/70 px-4 py-3.5 shadow-mid backdrop-blur-2xl">
                <p className="text-base leading-relaxed">{goal.result_text}</p>
              </div>
            </Section>
          ) : null}

          <EditableSection
            key={`description-${actionIsActive}`}
            title="Что делать"
            value={action.description ?? ""}
            placeholder="Опиши, что именно нужно сделать"
            emptyText="Добавь описание, чтобы не думать об этом в момент выполнения."
            onSave={savePatch("description")}
            saving={patch.isPending}
            editable={actionIsActive}
          >
            {items.length ? (
              <div className="mt-3 overflow-hidden rounded-[26px] border border-white/80 bg-white/64 shadow-mid backdrop-blur-2xl">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  modifiers={[restrictToVerticalAxis]}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <RitualItemRow
                        key={item.id}
                        item={item}
                        done={itemDone(item.id)}
                        disabled={!schedule || !actionIsActive}
                        readOnly={!actionIsActive}
                        onToggle={() =>
                          toggleItem.mutate({ itemId: item.id, done: !itemDone(item.id) })
                        }
                        onEdit={() => {
                          setEditItem(item);
                          setItemName(item.name);
                          setItemHint(item.description ?? "");
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            ) : null}
          </EditableSection>

          <Divider />

          <EditableSection
            key={`why-${actionIsActive}`}
            title="Почему это важно"
            value={action.why_important ?? ""}
            placeholder="Например, так я забочусь о себе"
            emptyText="Добавь личный смысл — это помогает возвращаться к действию."
            onSave={savePatch("why_important")}
            saving={patch.isPending}
            editable={actionIsActive}
          />

          <Divider />

          <EditableSection
            key={`helps-${actionIsActive}`}
            title="Как это ведёт к результату"
            value={action.helps_with ?? ""}
            placeholder="Опиши связь между действием и желаемым результатом"
            emptyText="Опиши, как это действие приближает тебя к результату."
            onSave={savePatch("helps_with")}
            saving={patch.isPending}
            editable={actionIsActive}
          />

          {attachments.length ? (
            <>
              <Divider />
              <Section title="Материалы">
                <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/68 shadow-mid backdrop-blur-2xl">
                  {attachments.map((att, index) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "focus-ring flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-200 hover:bg-secondary/60",
                        index > 0 && "border-t border-border/70",
                      )}
                    >
                      <span className="min-w-0 truncate text-base">{att.title || att.url}</span>
                      <ExternalLink
                        className="size-4 shrink-0 text-muted-foreground"
                        strokeWidth={1.75}
                      />
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
                    setSheet("move");
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

      {/* Время начала */}
      <TimeSheet
        open={actionIsActive && sheet === "time"}
        value={schedule?.start_time ?? null}
        onCancel={() => setSheet(null)}
        onSubmit={(next) => {
          setSheet(null);
          patchSchedule.mutate({ start_time: next });
        }}
      />

      {/* Продолжительность */}
      <DurationSheet
        open={actionIsActive && sheet === "duration"}
        seconds={durationSeconds}
        onCancel={() => setSheet(null)}
        onSubmit={(next) => {
          setSheet(null);
          if (schedule) patchSchedule.mutate({ duration_seconds: next });
          else patch.mutate({ duration_seconds: next });
        }}
      />

      {/* Дата начала */}
      <PickerSheet
        open={actionIsActive && sheet === "start"}
        onCancel={() => setSheet(null)}
        onSubmit={() => {
          setSheet(null);
          patch.mutate({ start_date: startDraft });
        }}
      >
        <p className="pb-3 text-base font-semibold">Дата начала</p>
        <DayPicker
          value={[startDraft]}
          onChange={(next) => setStartDraft(next[0] ?? startDraft)}
          multiple={false}
        />
      </PickerSheet>

      {/* Перенос действия */}
      <PickerSheet
        open={actionIsActive && sheet === "move"}
        onCancel={() => setSheet(null)}
        submitLabel="Перенести"
        onSubmit={() => {
          setSheet(null);
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
            <Input type="time" value={moveTime} onChange={(e) => setMoveTime(e.target.value)} />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm text-muted-foreground">Продолжительность</span>
            <DurationWheels
              hours={Math.floor((moveDuration ?? 0) / 3600)}
              minutes={Math.floor(((moveDuration ?? 0) % 3600) / 60)}
              seconds={(moveDuration ?? 0) % 60}
              onChange={(next) => {
                const h = next.hours ?? Math.floor((moveDuration ?? 0) / 3600);
                const m = next.minutes ?? Math.floor(((moveDuration ?? 0) % 3600) / 60);
                const sec = next.seconds ?? (moveDuration ?? 0) % 60;
                const total = h * 3600 + m * 60 + sec;
                setMoveDuration(total > 0 ? total : null);
              }}
            />
          </div>
        </div>
      </PickerSheet>

      {/* Пункт ритуала */}
      <PickerSheet
        open={actionIsActive && Boolean(editItem)}
        onCancel={() => setEditItem(null)}
        submitLabel="Сохранить"
        onSubmit={() => {
          const target = editItem;
          setEditItem(null);
          if (!target) return;
          patchItem.mutate({
            itemId: target.id,
            patch: {
              name: itemName.trim() || target.name,
              description: itemHint.trim() || null,
            },
          });
        }}
      >
        <p className="pb-3 text-base font-semibold">Пункт ритуала</p>
        <div className="space-y-2">
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Название"
          />
          <Input
            value={itemHint}
            onChange={(e) => setItemHint(e.target.value)}
            placeholder="Короткая подсказка (необязательно)"
          />
        </div>
      </PickerSheet>
    </div>
  );
}
