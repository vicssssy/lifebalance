import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createAction } from "@/data/actions";
import { ACTION_FORMAT_NAME, type ActionType } from "@/domain/constants";
import { useLifeAreas, usePlannerMutation } from "@/hooks/useAppData";
import { ActionForm, type ActionFormValues } from "@/components/ActionForm";
import { ScreenHeader } from "@/components/ScreenHeader";

const TYPES: ActionType[] = ["ritual", "regular_action", "task", "time_slot", "preparation"];

export const Route = createFileRoute("/_authenticated/new/$type")({
  validateSearch: (search: Record<string, unknown>) => ({
    lifeAreaId: String(search["lifeAreaId"] ?? ""),
    goalId: search["goalId"] ? String(search["goalId"]) : undefined,
    resultText: String(search["resultText"] ?? ""),
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

function CreateAction() {
  const { type: rawType } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: areas = [] } = useLifeAreas();
  const type = (TYPES.includes(rawType as ActionType) ? rawType : "task") as ActionType;

  const save = usePlannerMutation((values: ActionFormValues) =>
    createAction({
      goalId: search.goalId ?? null,
      newGoal:
        !search.goalId && search.resultText && search.lifeAreaId
          ? {
              lifeAreaId: search.lifeAreaId,
              resultText: search.resultText,
              whyImportant: null,
            }
          : null,
      name: values.name,
      type,
      description: values.description,
      durationSeconds: values.durationSeconds,
      whyImportant: values.whyImportant,
      helpsWith: null,
      startDate: values.startDate,
      lifeAreaIds: values.lifeAreaIds,
      ritualItems: values.ritualItems,
      attachments: values.attachments,
      schedules: values.schedules,
    }),
  );

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader
        onBack={() => navigate({ to: "/new" })}
        eyebrow="Настройка действия"
        title={ACTION_FORMAT_NAME[type]}
        subtitle={search.resultText ? `Моя цель: ${search.resultText}` : undefined}
      />

      <main className="animate-rise page-gutter mx-auto w-full max-w-md pt-6">
        <ActionForm
          type={type}
          areas={areas}
          initial={{
            whyImportant: search.resultText || null,
            lifeAreaIds: search.lifeAreaId ? [search.lifeAreaId] : [],
          }}
          submitting={save.isPending}
          onSubmit={(values) =>
            save.mutate(values, {
              onSuccess: () => {
                toast.success("Действие добавлено");
                navigate({ to: "/today" });
              },
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "Не удалось сохранить"),
            })
          }
        />
      </main>
    </div>
  );
}
