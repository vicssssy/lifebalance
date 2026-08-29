import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Xmark as X } from "iconoir-react";
import { toast } from "sonner";
import { createAction, type ScheduleDraft } from "@/data/actions";
import { createGoal } from "@/data/goals";
import { ACTION_FORMAT_NAME, RECURRING_TYPES, type ActionType } from "@/domain/constants";
import { todayKey } from "@/domain/schedule";
import { useAuth } from "@/hooks/useAuth";
import { useLifeAreas, usePlannerMutation } from "@/hooks/useAppData";
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
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import { isLocalPreviewAuthBypassEnabled } from "@/lib/local-preview";

const TYPES: ActionType[] = ["ritual", "regular_action", "task", "time_slot", "preparation"];

export const Route = createFileRoute("/_authenticated/new/$type")({
  validateSearch: (search: Record<string, unknown>) => ({
    lifeAreaId: String(search["lifeAreaId"] ?? ""),
    goalId: search["goalId"] ? String(search["goalId"]) : undefined,
    resultText: String(search["resultText"] ?? ""),
    helpsWith: search["helpsWith"] ? String(search["helpsWith"]) : undefined,
  }),
  head: ({ params }) => {
    const name = ACTION_FORMAT_NAME[params.type as ActionType] ?? "Новое действие";
    return {
      meta: [
        { title: `${name} — Путь` },
        { name: "description", content: `Настрой формат «${name}»: название, время и повторение.` },
        { property: "og:title", content: `${name} — Путь` },
        { property: "og:description", content: `Создание действия в формате «${name}».` },
      ],
    };
  },
  component: CreateAction,
});

interface RitualItemDraft {
  name: string;
  description: string;
}

function CreateAction() {
  const { type: rawType } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data: areas = [] } = useLifeAreas();
  const localPreview = isLocalPreviewAuthBypassEnabled();

  const type = (TYPES.includes(rawType as ActionType) ? rawType : "task") as ActionType;
  const recurring = RECURRING_TYPES.includes(type);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // «Почему это важно» по умолчанию наследует сформулированный результат.
  const [whyImportant, setWhyImportant] = useState(search.resultText ?? "");
  const [startDate, setStartDate] = useState<string>(todayKey());
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [dates, setDates] = useState<string[]>(recurring ? [] : [todayKey()]);
  const [lifeAreaIds, setLifeAreaIds] = useState<string[]>(
    search.lifeAreaId ? [search.lifeAreaId] : [],
  );
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [items, setItems] = useState<RitualItemDraft[]>([{ name: "", description: "" }]);

  const save = usePlannerMutation(async () => {
    if (localPreview) return;
    const goalId =
      search.goalId ??
      (search.resultText && search.lifeAreaId
        ? (
            await createGoal({
              userId: userId!,
              lifeAreaId: search.lifeAreaId,
              resultText: search.resultText,
            })
          ).id
        : null);

    const schedules: ScheduleDraft[] = recurring
      ? weekdays.length
        ? [
            {
              repeat_type: "weekly",
              scheduled_date: null,
              weekdays,
              start_time: startTime,
              duration_seconds: durationSeconds,
            },
          ]
        : []
      : dates.map((date) => ({
          repeat_type: "once" as const,
          scheduled_date: date,
          weekdays: [],
          start_time: startTime,
          duration_seconds: durationSeconds,
        }));

    return createAction({
      userId: userId!,
      goalId,
      name: name.trim(),
      type,
      description: description.trim() || null,
      durationSeconds,
      whyImportant: whyImportant.trim() || null,
      helpsWith: search.helpsWith ?? null,
      startDate,
      lifeAreaIds,
      ritualItems:
        type === "ritual"
          ? items
              .filter((i) => i.name.trim())
              .map((i) => ({ name: i.name.trim(), description: i.description.trim() || null }))
          : [],
      attachments,
      schedules,
    });
  });

  const canSave =
    Boolean(name.trim()) &&
    Boolean(startDate) &&
    Boolean(userId) &&
    !localPreview &&
    (recurring ? weekdays.length > 0 : dates.length > 0) &&
    (type !== "ritual" || items.some((i) => i.name.trim()));

  const placeholders: Record<ActionType, { name: string; description: string }> = {
    ritual: { name: "Например, утренний ритуал", description: "Например, спокойное начало дня" },
    regular_action: { name: "Например, прогулка", description: "Например, 30 минут в парке" },
    task: { name: "Например, записаться к врачу", description: "Например, найти клинику рядом" },
    time_slot: { name: "Например, время на учёбу", description: "Например, курс по фотографии" },
    preparation: {
      name: "Например, разобраться с переездом",
      description: "Например, собрать информацию и понять первый шаг",
    },
  };

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader
        onBack={() => navigate({ to: "/new" })}
        eyebrow="Настройка действия"
        title={ACTION_FORMAT_NAME[type]}
        subtitle={search.resultText ? `Результат: ${search.resultText}` : undefined}
      />

      <main className="animate-rise page-gutter mx-auto w-full max-w-md space-y-6 pt-6">
        <Field label="Название">
          <TextField value={name} onChange={setName} placeholder={placeholders[type].name} />
        </Field>

        <Field label="Описание">
          <TextField
            value={description}
            onChange={setDescription}
            placeholder={placeholders[type].description}
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
                  key={index}
                  className="space-y-2 rounded-[26px] border border-white/80 bg-white/70 p-3 shadow-mid backdrop-blur-2xl"
                >
                  <div className="flex items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, name: e.target.value } : it)),
                        )
                      }
                      placeholder="Например, стакан воды"
                      className="flex-1 rounded-[18px] border border-white/85 bg-white/68 px-3 py-2.5 text-base shadow-low focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/25"
                    />
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                        aria-label="Удалить пункт"
                        className="focus-ring touch-target flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/65"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <input
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === index ? { ...it, description: e.target.value } : it,
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
                onClick={() => setItems((prev) => [...prev, { name: "", description: "" }])}
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
            <DayPicker value={dates} onChange={setDates} multiple={type === "time_slot"} />
            <SelectedDays dates={dates} />
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

        <StickyActions
          hint={
            localPreview
              ? "В демо-режиме сохранение отключено"
              : canSave
                ? undefined
                : "Заполни название и выбери, когда это делать"
          }
        >
          <PrimaryButton
            onClick={() =>
              save.mutate(undefined as never, {
                onSuccess: () => {
                  toast.success("Действие добавлено");
                  navigate({ to: "/today" });
                },
                onError: (error) =>
                  toast.error(error instanceof Error ? error.message : "Не удалось сохранить"),
              })
            }
            disabled={!canSave || save.isPending}
            loading={save.isPending}
          >
            Сохранить
          </PrimaryButton>
        </StickyActions>
      </main>
    </div>
  );
}
