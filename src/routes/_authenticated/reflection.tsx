import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { saveReflection } from "@/data/reflections";
import { REFLECTION_QUESTIONS, type ReflectionField } from "@/domain/constants";
import { factsForRange } from "@/domain/occurrences";
import { addMonths, formatMonthTitle, monthStartKey, toDateKey } from "@/domain/schedule";
import { usePlannerMutation, usePlannerSource, useReflections } from "@/hooks/useAppData";
import { AppScreen } from "@/components/AppScreen";
import { Field, PrimaryButton, TextField } from "@/components/fields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/surface";
import { NavArrowLeft as ChevronLeft, NavArrowRight as ChevronRight } from "iconoir-react";

export const Route = createFileRoute("/_authenticated/reflection")({
  head: () => ({
    meta: [
      { title: "Рефлексия — Путь" },
      {
        name: "description",
        content: "Ежемесячный разбор: что получилось, что помешало и что изменить дальше.",
      },
      { property: "og:title", content: "Рефлексия — Путь" },
      { property: "og:description", content: "Факты месяца и пять вопросов для выводов." },
    ],
  }),
  component: ReflectionScreen,
});

function ReflectionScreen() {
  const { source } = usePlannerSource();
  const { data: reflections = [] } = useReflections();

  const [monthDate, setMonthDate] = useState(() => addMonths(new Date(), -1));
  const month = monthStartKey(monthDate);
  const saved = reflections.find((r) => r.month === month);

  const [answersByMonth, setAnswersByMonth] = useState<
    Record<string, Partial<Record<ReflectionField, string>>>
  >({});
  const answers = answersByMonth[month] ?? {};

  const facts = useMemo(() => {
    const from = monthStartKey(monthDate);
    const to = toDateKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
    return factsForRange(source, from, to);
  }, [source, monthDate]);

  const save = usePlannerMutation(() => {
    const nextAnswers = REFLECTION_QUESTIONS.reduce(
      (acc, q) => ({ ...acc, [q.field]: answers[q.field] ?? saved?.[q.field] ?? null }),
      {},
    );
    return saveReflection({ month, answers: nextAnswers });
  });

  return (
    <AppScreen
      title="Рефлексия"
      subtitle={formatMonthTitle(monthDate)}
      right={
        <div className="mt-2 flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setMonthDate(addMonths(monthDate, -1))}
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft strokeWidth={1.75} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setMonthDate(addMonths(monthDate, 1))}
            aria-label="Следующий месяц"
          >
            <ChevronRight strokeWidth={1.75} />
          </Button>
        </div>
      }
    >
      <div className="animate-rise space-y-8">
        <section>
          <SectionTitle className="mb-2.5 block">Факты месяца</SectionTitle>
          {facts.length ? (
            <Card className="divide-y divide-white/75 overflow-hidden">
              {facts.map((fact) => (
                <div
                  key={fact.action.id}
                  className="flex items-baseline justify-between gap-3 px-4 py-3"
                >
                  <span className="text-base">{fact.action.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {fact.completed} из {fact.planned}
                  </span>
                </div>
              ))}
            </Card>
          ) : (
            <p className="rounded-[24px] border border-white/80 bg-white/62 px-4 py-4 text-sm text-muted-foreground shadow-mid backdrop-blur-2xl">
              В этом месяце не было запланированных действий.
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Это только факты, без оценок. Выводы делаешь ты.
          </p>
        </section>

        <section className="space-y-5">
          <SectionTitle>Вопросы месяца</SectionTitle>
          {REFLECTION_QUESTIONS.map((q) => (
            <Field key={q.field} label={q.question}>
              <TextField
                value={answers[q.field] ?? saved?.[q.field] ?? ""}
                onChange={(value) =>
                  setAnswersByMonth((previous) => ({
                    ...previous,
                    [month]: { ...previous[month], [q.field]: value },
                  }))
                }
                placeholder="Твой ответ"
                multiline
              />
            </Field>
          ))}
          <PrimaryButton
            onClick={() =>
              save.mutate(undefined as never, {
                onSuccess: () => toast.success("Рефлексия сохранена"),
                onError: () => toast.error("Не удалось сохранить"),
              })
            }
            loading={save.isPending}
          >
            Сохранить рефлексию
          </PrimaryButton>
        </section>
      </div>
    </AppScreen>
  );
}
