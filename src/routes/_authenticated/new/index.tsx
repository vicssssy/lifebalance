import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, Clock, NavArrowRight, Repeat, Sparks, TaskList } from "iconoir-react";
import { toast } from "sonner";
import { ACTION_FORMATS, type ActionType } from "@/domain/constants";
import { createGoal, updateGoal } from "@/data/goals";
import { useLifeAreas, usePlannerMutation } from "@/hooks/useAppData";
import { Field, PrimaryButton, TextField } from "@/components/fields";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StickyActions } from "@/components/StickyActions";
import type { AppIcon } from "@/components/ui/icon";
import { LifeAreaCategoryLink } from "@/components/LifeAreaTags";

export const Route = createFileRoute("/_authenticated/new/")({
  head: () => ({
    meta: [
      { title: "Новое действие — Путь" },
      {
        name: "description",
        content: "Сфера жизни, желаемый результат и формат действия — три шага до плана.",
      },
      { property: "og:title", content: "Новое действие — Путь" },
      { property: "og:description", content: "Начни со сферы жизни и результата." },
    ],
  }),
  component: NewFlow,
});

type Step = "area" | "goal" | "format";

const FORMAT_ICON: Record<ActionType, AppIcon> = {
  ritual: Sparks,
  regular_action: Repeat,
  task: CheckSquare,
  time_slot: Clock,
  preparation: TaskList,
};

function NewFlow() {
  const navigate = useNavigate();
  const { data: areas = [] } = useLifeAreas();

  const [step, setStep] = useState<Step>("area");
  const [lifeAreaId, setLifeAreaId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [goalWhyImportant, setGoalWhyImportant] = useState("");

  const area = areas.find((a) => a.id === lifeAreaId) ?? null;

  const saveGoal = usePlannerMutation(
    async (draft: {
      goalId: string | null;
      lifeAreaId: string;
      resultText: string;
      whyImportant: string | null;
    }) => {
      if (draft.goalId) {
        await updateGoal(draft.goalId, draft.resultText, draft.whyImportant);
        return draft.goalId;
      }
      const goal = await createGoal(draft);
      return goal.id;
    },
  );

  function back() {
    if (step === "area") navigate({ to: "/today" });
    else if (step === "goal") setStep("area");
    else setStep("goal");
  }

  const stepIndex = { area: 1, goal: 2, format: 3 }[step];

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader
        onBack={back}
        steps={{ total: 3, current: stepIndex }}
        eyebrow={area ? <LifeAreaCategoryLink area={area} /> : "Новое действие"}
        title={
          step === "area"
            ? "Выбери сферу жизни, в которой тебе сейчас важны изменения"
            : step === "goal"
              ? "Твоя цель"
              : "Выбери действие, которое поможет прийти к твоей цели"
        }
        subtitle={step === "goal" ? area?.description : undefined}
      />

      <main key={step} className="animate-rise page-gutter mx-auto w-full max-w-md space-y-6 pt-6">
        {step === "area" ? (
          <>
            <div className="flex flex-col gap-3">
              {areas.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setLifeAreaId(a.id);
                    setGoalId(null);
                    setResultText("");
                    setGoalWhyImportant("");
                    setStep("goal");
                  }}
                  className="row-card row-card-press w-full px-4 py-4 text-left"
                >
                  <p className="text-lg font-semibold">{a.name}</p>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">{a.question}</p>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === "goal" && area ? (
          <>
            <Field label="Какой цели ты хочешь достичь?">
              <TextField
                value={resultText}
                onChange={setResultText}
                placeholder="Например, я чувствую себя энергичной по утрам"
                multiline
              />
            </Field>

            <Field label="Почему для тебя это важно?">
              <TextField
                value={goalWhyImportant}
                onChange={setGoalWhyImportant}
                placeholder="Например, я хочу начинать день с силами и ясностью"
                multiline
              />
            </Field>

            <StickyActions
              hint={resultText.trim() ? undefined : "Сформулируй цель, чтобы продолжить"}
            >
              <PrimaryButton
                onClick={() =>
                  saveGoal.mutate(
                    {
                      goalId,
                      lifeAreaId: area.id,
                      resultText: resultText.trim(),
                      whyImportant: goalWhyImportant.trim() || null,
                    },
                    {
                      onSuccess: (savedGoalId) => {
                        setGoalId(savedGoalId);
                        setStep("format");
                      },
                      onError: (error) =>
                        toast.error(
                          error instanceof Error ? error.message : "Не удалось сохранить цель",
                        ),
                    },
                  )
                }
                disabled={!resultText.trim() || saveGoal.isPending}
                loading={saveGoal.isPending}
              >
                Далее
              </PrimaryButton>
            </StickyActions>
          </>
        ) : null}

        {step === "format" ? (
          <>
            <div className="flex flex-col gap-3">
              {ACTION_FORMATS.map((format) => {
                const FormatIcon = FORMAT_ICON[format.type];
                return (
                  <button
                    key={format.type}
                    type="button"
                    onClick={() =>
                      navigate({
                        to: "/new/$type",
                        params: { type: format.type },
                        search: {
                          lifeAreaId: lifeAreaId ?? "",
                          goalId: goalId ?? undefined,
                          resultText: resultText.trim(),
                        },
                      })
                    }
                    className="row-card row-card-press flex w-full items-center gap-3 px-4 py-4 text-left"
                  >
                    <FormatIcon
                      className="size-6 shrink-0 text-primary"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold">{format.name}</span>
                      <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                        {format.hint}
                      </span>
                    </span>
                    <NavArrowRight
                      className="size-5 shrink-0 text-muted-foreground/70"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
