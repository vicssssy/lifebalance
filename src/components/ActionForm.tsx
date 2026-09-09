import { useState } from "react";
import { toast } from "sonner";
import { Bell, Plus, Xmark as X } from "@/components/ui/icons";
import { RECURRING_TYPES, type ActionType } from "@/domain/constants";
import { todayKey } from "@/domain/schedule";
import type { Attachment, Goal, LifeArea, RitualItem, Schedule } from "@/domain/types";
import { DurationPicker } from "@/components/DurationPicker";
import { Field, PrimaryButton, TextField } from "@/components/fields";
import {
  AttachmentsField,
  CompactDatePicker,
  DayPicker,
  LifeAreaPicker,
  SelectedDays,
  TimeField,
  WeekdayPicker,
  type AttachmentDraft,
} from "@/components/planning";
import { StickyActions } from "@/components/StickyActions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enableDeviceReminders } from "@/lib/reminders";

export interface ActionFormRitualItem {
  id?: string;
  name: string;
  description: string;
}

export interface ActionFormAttachment extends AttachmentDraft {
  id?: string;
}

export interface ActionFormSchedule {
  id?: string;
  repeat_type: "once" | "weekly";
  scheduled_date: string | null;
  weekdays: number[];
  start_time: string | null;
  duration_seconds: number | null;
}

export interface ActionFormValues {
  goalId: string | null;
  name: string;
  description: string | null;
  durationSeconds: number | null;
  whyImportant: string | null;
  startDate: string;
  endDate: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
  lifeAreaIds: string[];
  ritualItems: Array<{
    id?: string;
    name: string;
    description: string | null;
  }>;
  attachments: ActionFormAttachment[];
  schedules: ActionFormSchedule[];
}

export interface ActionFormInitialValues {
  goalId?: string | null;
  name?: string;
  description?: string | null;
  durationSeconds?: number | null;
  whyImportant?: string | null;
  startDate?: string;
  endDate?: string | null;
  reminderEnabled?: boolean;
  reminderTime?: string | null;
  lifeAreaIds?: string[];
  ritualItems?: RitualItem[];
  attachments?: Attachment[];
  schedules?: Schedule[];
}

const PLACEHOLDERS: Record<ActionType, { name: string; description: string }> = {
  ritual: { name: "Например, утренний ритуал", description: "Например, спокойное начало дня" },
  regular_action: { name: "Например, прогулка", description: "Например, 30 минут в парке" },
  task: { name: "Например, записаться к врачу", description: "Например, найти клинику рядом" },
  time_slot: { name: "Например, время на учёбу", description: "Например, курс по фотографии" },
  preparation: {
    name: "Например, разобраться с переездом",
    description: "Например, собрать информацию и понять первый шаг",
  },
};

export function ActionForm({
  type,
  areas,
  goals,
  initial,
  submitting,
  submitLabel = "Сохранить",
  onSubmit,
}: {
  type: ActionType;
  areas: LifeArea[];
  goals: Goal[];
  initial?: ActionFormInitialValues;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ActionFormValues) => void;
}) {
  const recurring = RECURRING_TYPES.includes(type);
  const initialSchedules = initial?.schedules ?? [];
  const [goalId, setGoalId] = useState<string | null>(initial?.goalId ?? null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [whyImportant, setWhyImportant] = useState(initial?.whyImportant ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayKey());
  const [endDate, setEndDate] = useState<string | null>(initial?.endDate ?? null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    initial?.durationSeconds ?? initialSchedules[0]?.duration_seconds ?? null,
  );
  const [startTime, setStartTime] = useState<string | null>(
    initialSchedules[0]?.start_time ?? null,
  );
  const [reminderEnabled, setReminderEnabled] = useState(initial?.reminderEnabled ?? false);
  const [reminderTime, setReminderTime] = useState<string | null>(
    initial?.reminderTime ?? initialSchedules[0]?.start_time ?? null,
  );
  const [weekdays, setWeekdays] = useState<number[]>(initialSchedules[0]?.weekdays ?? []);
  const [dates, setDates] = useState<string[]>(
    recurring
      ? []
      : (initialSchedules.map((schedule) => schedule.scheduled_date).filter(Boolean) as string[]),
  );
  const [lifeAreaIds, setLifeAreaIds] = useState<string[]>(initial?.lifeAreaIds ?? []);
  const [attachments, setAttachments] = useState<ActionFormAttachment[]>(
    initial?.attachments?.map((item) => ({ ...item })) ?? [],
  );
  const [items, setItems] = useState<ActionFormRitualItem[]>(
    initial?.ritualItems?.length
      ? initial.ritualItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? "",
        }))
      : [{ name: "", description: "" }],
  );

  const selectedDates = dates.length ? dates : recurring ? [] : [todayKey()];
  const activeGoals = goals.filter((goal) => goal.status === "active");
  const invalidDateRange = Boolean(endDate && endDate < startDate);
  const hasAdditionalDetails =
    Boolean(goalId) ||
    lifeAreaIds.length > 0 ||
    Boolean(whyImportant.trim()) ||
    attachments.length > 0;
  const additionalSummary = [
    lifeAreaIds.length ? `Сфер: ${lifeAreaIds.length}` : null,
    attachments.length ? `Материалов: ${attachments.length}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const canSave =
    Boolean(name.trim()) &&
    Boolean(startDate) &&
    !invalidDateRange &&
    (recurring ? weekdays.length > 0 : selectedDates.length > 0) &&
    (!reminderEnabled || Boolean(startTime ?? reminderTime)) &&
    (type !== "ritual" || items.some((item) => item.name.trim()));

  const submit = () => {
    const schedules: ActionFormSchedule[] = recurring
      ? [
          {
            ...(initialSchedules.find((schedule) => schedule.repeat_type === "weekly")?.id
              ? {
                  id: initialSchedules.find((schedule) => schedule.repeat_type === "weekly")!.id,
                }
              : {}),
            repeat_type: "weekly",
            scheduled_date: null,
            weekdays,
            start_time: startTime,
            duration_seconds: durationSeconds,
          },
        ]
      : selectedDates.map((date) => ({
          ...(initialSchedules.find((schedule) => schedule.scheduled_date === date)?.id
            ? { id: initialSchedules.find((schedule) => schedule.scheduled_date === date)!.id }
            : {}),
          repeat_type: "once" as const,
          scheduled_date: date,
          weekdays: [],
          start_time: startTime,
          duration_seconds: durationSeconds,
        }));

    onSubmit({
      goalId,
      name: name.trim(),
      description: description.trim() || null,
      durationSeconds,
      whyImportant: whyImportant.trim() || null,
      startDate,
      endDate: recurring ? endDate : null,
      reminderEnabled,
      reminderTime: reminderEnabled ? (startTime ?? reminderTime) : null,
      lifeAreaIds,
      ritualItems:
        type === "ritual"
          ? items
              .filter((item) => item.name.trim())
              .map((item) => ({
                ...(item.id ? { id: item.id } : {}),
                name: item.name.trim(),
                description: item.description.trim() || null,
              }))
          : [],
      attachments,
      schedules,
    });
  };

  return (
    <div className="space-y-6">
      <Field label="Название">
        <TextField value={name} onChange={setName} placeholder={PLACEHOLDERS[type].name} />
      </Field>

      <Field label="Описание">
        <TextField
          value={description}
          onChange={setDescription}
          placeholder={PLACEHOLDERS[type].description}
          multiline
        />
      </Field>

      {type === "ritual" ? (
        <Field
          label="Из чего состоит ритуал"
          hint="Каждый пункт можно отмечать отдельно во время выполнения."
        >
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={item.id ?? `new-${index}`}
                className="content-surface space-y-2 rounded-[26px] p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index ? { ...entry, name: event.target.value } : entry,
                        ),
                      )
                    }
                    placeholder="Например, стакан воды"
                    className="flex-1 rounded-[18px] border border-border/75 bg-white/92 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
                  />
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                    aria-label="Удалить пункт"
                    className="focus-ring touch-target flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/65"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <input
                  value={item.description}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((entry, itemIndex) =>
                        itemIndex === index ? { ...entry, description: event.target.value } : entry,
                      ),
                    )
                  }
                  placeholder="Описание, если нужно"
                  className="w-full rounded-[18px] border border-border/75 bg-white/92 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((current) => [...current, { name: "", description: "" }])}
              className="control-glass focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-base font-semibold text-primary"
            >
              <Plus className="size-4" /> Добавить пункт
            </button>
          </div>
        </Field>
      ) : null}

      {recurring ? (
        <>
          <Field label="Дата начала">
            <CompactDatePicker
              value={startDate}
              onChange={(value) => {
                if (value) setStartDate(value);
              }}
            />
          </Field>

          <Field label="Дата завершения">
            <CompactDatePicker value={endDate} onChange={setEndDate} emptyLabel="Не ограничена" />
            {invalidDateRange ? (
              <p className="text-sm text-destructive" role="alert">
                Дата завершения не может быть раньше даты начала.
              </p>
            ) : null}
          </Field>

          <Field label="Дни недели" hint="Действие будет появляться в выбранные дни каждую неделю.">
            <WeekdayPicker value={weekdays} onChange={setWeekdays} />
          </Field>
        </>
      ) : (
        <Field
          label={type === "time_slot" ? "Дни" : "День"}
          hint={
            type === "time_slot"
              ? "Можно выбрать несколько дней."
              : "Выбери день, когда это нужно сделать."
          }
        >
          <DayPicker
            value={selectedDates}
            onChange={(next) => {
              setDates(next);
              if (next[0]) setStartDate(next[0]);
            }}
            multiple={type === "time_slot"}
          />
          <SelectedDays dates={selectedDates} />
        </Field>
      )}

      <Field label="Время начала">
        <TimeField value={startTime} onChange={setStartTime} />
      </Field>

      <Field label="Продолжительность">
        <DurationPicker seconds={durationSeconds} onChange={setDurationSeconds} />
      </Field>

      <Field label="Напоминание">
        <div className="content-surface rounded-[26px] p-4">
          <div className="flex min-h-11 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-5" />
              </span>
              <span className="text-base font-semibold">Установить напоминание</span>
            </div>
            <Switch
              checked={reminderEnabled}
              onCheckedChange={async (checked) => {
                if (!checked) {
                  setReminderEnabled(false);
                  return;
                }
                try {
                  const status = await enableDeviceReminders();
                  if (status !== "granted") {
                    toast.error(
                      status === "denied"
                        ? "Системные уведомления отключены в настройках устройства."
                        : "Этот браузер не поддерживает системные уведомления.",
                    );
                    return;
                  }
                  setReminderEnabled(true);
                  if (!reminderTime) setReminderTime(startTime);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Не удалось включить уведомления.",
                  );
                }
              }}
              aria-label="Установить напоминание"
            />
          </div>
          {reminderEnabled && !startTime ? (
            <div className="mt-3 border-t border-border/70 pt-3">
              <p className="mb-2 text-sm text-muted-foreground">Время напоминания</p>
              <TimeField value={reminderTime} onChange={setReminderTime} />
            </div>
          ) : null}
        </div>
      </Field>

      <Accordion
        type="single"
        collapsible
        {...(hasAdditionalDetails ? { defaultValue: "additional" } : {})}
        className="content-surface rounded-[26px] px-4"
      >
        <AccordionItem value="additional" className="border-0">
          <AccordionTrigger className="min-h-12 py-3 text-base font-semibold hover:no-underline">
            <span className="space-y-0.5">
              <span className="block">Дополнительно</span>
              {additionalSummary ? (
                <span className="block text-sm font-normal text-muted-foreground">
                  {additionalSummary}
                </span>
              ) : null}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-2">
            <Field label="Сферы жизни" hint="Максимум три сферы.">
              <LifeAreaPicker areas={areas} value={lifeAreaIds} onChange={setLifeAreaIds} />
            </Field>

            <Field label="Цель">
              <Select
                value={goalId ?? "none"}
                onValueChange={(value) => setGoalId(value === "none" ? null : value)}
              >
                <SelectTrigger aria-label="Выбрать цель">
                  <SelectValue placeholder="Выбери цель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без цели</SelectItem>
                  {activeGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.result_text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Почему это важно для тебя">
              <TextField
                value={whyImportant}
                onChange={setWhyImportant}
                placeholder="Например, так я забочусь о себе"
                multiline
              />
            </Field>

            <Field label="Материалы">
              <AttachmentsField value={attachments} onChange={setAttachments} />
            </Field>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <StickyActions
        hint={
          canSave
            ? undefined
            : reminderEnabled && !startTime && !reminderTime
              ? "Выбери время напоминания"
              : "Заполни название и выбери, когда это делать"
        }
      >
        <PrimaryButton
          onClick={submit}
          disabled={!canSave || Boolean(submitting)}
          loading={Boolean(submitting)}
        >
          {submitLabel}
        </PrimaryButton>
      </StickyActions>
    </div>
  );
}
