import { useState } from "react";
import { Plus, Xmark as X } from "iconoir-react";
import { RECURRING_TYPES, type ActionType } from "@/domain/constants";
import { todayKey } from "@/domain/schedule";
import type { Attachment, LifeArea, RitualItem, Schedule } from "@/domain/types";
import { DurationPicker } from "@/components/DurationPicker";
import { Field, PrimaryButton, TextField } from "@/components/fields";
import {
  AttachmentsField,
  DayPicker,
  LifeAreaPicker,
  SelectedDays,
  TimeField,
  WeekdayPicker,
  type AttachmentDraft,
} from "@/components/planning";
import { StickyActions } from "@/components/StickyActions";

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
  name: string;
  description: string | null;
  durationSeconds: number | null;
  whyImportant: string | null;
  startDate: string;
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
  name?: string;
  description?: string | null;
  durationSeconds?: number | null;
  whyImportant?: string | null;
  startDate?: string;
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
  initial,
  submitting,
  submitLabel = "Сохранить",
  onSubmit,
}: {
  type: ActionType;
  areas: LifeArea[];
  initial?: ActionFormInitialValues;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ActionFormValues) => void;
}) {
  const recurring = RECURRING_TYPES.includes(type);
  const initialSchedules = initial?.schedules ?? [];
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [whyImportant, setWhyImportant] = useState(initial?.whyImportant ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayKey());
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    initial?.durationSeconds ?? initialSchedules[0]?.duration_seconds ?? null,
  );
  const [startTime, setStartTime] = useState<string | null>(
    initialSchedules[0]?.start_time ?? null,
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
  const canSave =
    Boolean(name.trim()) &&
    Boolean(startDate) &&
    (recurring ? weekdays.length > 0 : selectedDates.length > 0) &&
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
      name: name.trim(),
      description: description.trim() || null,
      durationSeconds,
      whyImportant: whyImportant.trim() || null,
      startDate,
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
                className="space-y-2 rounded-[26px] border border-white/80 bg-white/70 p-3 shadow-mid backdrop-blur-2xl"
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
                    className="flex-1 rounded-[18px] border border-white/85 bg-white/68 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
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
                  className="w-full rounded-[18px] border border-white/85 bg-white/68 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((current) => [...current, { name: "", description: "" }])}
              className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/80 bg-white/58 px-3.5 text-base font-semibold text-primary shadow-low backdrop-blur-2xl"
            >
              <Plus className="size-4" /> Добавить пункт
            </button>
          </div>
        </Field>
      ) : null}

      <Field label="Дата начала" hint="До этой даты действие не появится в плане.">
        <DayPicker
          value={[startDate]}
          onChange={(next) => setStartDate(next[0] ?? todayKey())}
          multiple={false}
        />
        <SelectedDays dates={[startDate]} />
      </Field>

      {recurring ? (
        <Field label="Дни недели" hint="Действие будет появляться в выбранные дни каждую неделю.">
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        </Field>
      ) : (
        <Field
          label={type === "time_slot" ? "Дни" : "День"}
          hint={
            type === "time_slot"
              ? "Можно выбрать несколько дней."
              : "Выбери день, когда это нужно сделать."
          }
        >
          <DayPicker value={selectedDates} onChange={setDates} multiple={type === "time_slot"} />
          <SelectedDays dates={selectedDates} />
        </Field>
      )}

      <Field label="Время начала" hint="Без времени действие попадёт в «Дополнительно».">
        <TimeField value={startTime} onChange={setStartTime} />
      </Field>

      <Field label="Продолжительность">
        <DurationPicker seconds={durationSeconds} onChange={setDurationSeconds} />
      </Field>

      <Field label="Сферы жизни" hint="Максимум три сферы.">
        <LifeAreaPicker areas={areas} value={lifeAreaIds} onChange={setLifeAreaIds} />
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

      <StickyActions hint={canSave ? undefined : "Заполни название и выбери, когда это делать"}>
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
