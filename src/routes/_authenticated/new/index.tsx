import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, Clock, NavArrowRight, Repeat, Sparks, TaskList } from "iconoir-react";
import { ACTION_FORMATS, type ActionType } from "@/domain/constants";
import { useGoals, useLifeAreas } from "@/hooks/useAppData";
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

type Step = "area" | "result" | "helps" | "format";

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
  const { data: goals = [] } = useGoals();

  const [step, setStep] = useState<Step>("area");
  const [lifeAreaId, setLifeAreaId] = useState<string | null>(null);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [resultText, setResultText] = useState("");
  const [helpsWith, setHelpsWith] = useState("");

  const area = areas.find((a) => a.id === lifeAreaId) ?? null;
  const areaGoals = goals.filter((g) => g.life_area_id === lifeAreaId && g.status === "active");

  function back() {
    if (step === "area") navigate({ to: "/today" });
    else if (step === "result") setStep("area");
    else if (step === "helps") setStep("result");
    else setStep("helps");
  }

  const stepIndex = { area: 1, result: 2, helps: 3, format: 4 }[step];

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader
        onBack={back}
        steps={{ total: 4, current: stepIndex }}
        eyebrow={area ? <LifeAreaCategoryLink area={area} /> : "Новое действие"}
        title={
          step === "area"
            ? "Какую сферу жизни ты хочешь изменить?"
            : step === "result"
              ? "Какой результат ты хочешь получить?"
              : step === "helps"
                ? "Что поможет тебе прийти к этому результату?"
                : "В каком формате ты это сделаешь?"
        }
        subtitle={
          step === "result"
            ? area?.description
            : step === "helps"
              ? "Опиши своими словами. Дальше ты выберешь, в каком формате это делать."
              : undefined
        }
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
                    setStep("result");
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

        {step === "result" && area ? (
          <>
            {areaGoals.length ? (
              <Field label="Уже сформулированные результаты">
                <div className="space-y-2">
                  {areaGoals.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => {
                        setGoalId(goal.id);
                        setResultText(goal.result_text);
                        setStep("helps");
                      }}
                      className="row-card row-card-press block w-full px-4 py-3 text-left text-base"
                    >
                      {goal.result_text}
                    </button>
                  ))}
                </div>
              </Field>
            ) : null}

            <Field label="Новый результат">
              <TextField
                value={goalId ? "" : resultText}
                onChange={(value) => {
                  setGoalId(null);
                  setResultText(value);
                }}
                placeholder="Например, я чувствую себя энергичной по утрам"
                multiline
              />
            </Field>

            <StickyActions
              hint={resultText.trim() ? undefined : "Сформулируй результат, чтобы продолжить"}
            >
              <PrimaryButton onClick={() => setStep("helps")} disabled={!resultText.trim()}>
                Далее
              </PrimaryButton>
            </StickyActions>
          </>
        ) : null}

        {step === "helps" ? (
          <>
            <TextField
              value={helpsWith}
              onChange={setHelpsWith}
              placeholder="Например, спокойное утро без спешки"
              multiline
            />
            <StickyActions>
              <PrimaryButton onClick={() => setStep("format")}>Далее</PrimaryButton>
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
                          helpsWith: helpsWith.trim() || undefined,
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
