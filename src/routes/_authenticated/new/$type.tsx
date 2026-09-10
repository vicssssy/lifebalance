import { createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createAction } from "@/data/actions";
import { ACTION_FORMAT_NAME, type ActionType } from "@/domain/constants";
import { useGoals, useLifeAreas, usePlannerMutation } from "@/hooks/useAppData";
import { ActionForm, type ActionFormValues } from "@/components/ActionForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PageContainer } from "@/components/ui/layout";
import { readNewActionFlowLocationState } from "@/lib/new-action-flow";
import type { Goal } from "@/domain/types";

const TYPES: ActionType[] = ["ritual", "regular_action", "task", "time_slot", "preparation"];

export const Route = createFileRoute("/_authenticated/new/$type")({
  validateSearch: (search: Record<string, unknown>) => ({
    lifeAreaId: String(search["lifeAreaId"] ?? ""),
    goalId: search["goalId"] ? String(search["goalId"]) : undefined,
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
  const { data: goals = [] } = useGoals();
  const flowState = readNewActionFlowLocationState(
    useLocation({ select: (location) => location.state }),
  );
  const newGoalDraft = flowState.newActionGoalDraft ?? null;
  const existingGoal = goals.find((goal) => goal.id === search.goalId) ?? null;
  const draftGoal: Goal | null = newGoalDraft
    ? {
        id: newGoalDraft.id,
        life_area_id: newGoalDraft.lifeAreaId,
        result_text: newGoalDraft.resultText,
        why_important: newGoalDraft.whyImportant,
        status: "active",
        created_at: "",
        completed_at: null,
        archived_at: null,
        closed_on: null,
      }
    : null;
  const formGoals = draftGoal ? [draftGoal, ...goals] : goals;
  const type = (TYPES.includes(rawType as ActionType) ? rawType : "task") as ActionType;

  const save = usePlannerMutation((values: ActionFormValues) =>
    createAction({
      goalId: values.goalId === newGoalDraft?.id ? null : values.goalId,
      newGoal:
        values.goalId === newGoalDraft?.id && values.lifeAreaId === newGoalDraft.lifeAreaId
          ? {
              lifeAreaId: newGoalDraft.lifeAreaId,
              resultText: newGoalDraft.resultText,
              whyImportant: newGoalDraft.whyImportant,
            }
          : null,
      name: values.name,
      type,
      description: values.description,
      durationSeconds: values.durationSeconds,
      whyImportant: values.whyImportant,
      helpsWith: null,
      startDate: values.startDate,
      endDate: values.endDate,
      reminderEnabled: values.reminderEnabled,
      reminderTime: values.reminderTime,
      lifeAreaId: values.lifeAreaId,
      ritualItems: values.ritualItems,
      attachments: values.attachments,
      schedules: values.schedules,
    }),
  );

  return (
    <div className="app-screen min-h-dvh bg-background pb-28">
      <ScreenHeader
        onBack={() =>
          navigate({
            to: "/new",
            state: newGoalDraft
              ? { newActionGoalDraft: newGoalDraft, newActionStep: "format" }
              : {},
          })
        }
        eyebrow="Настройка действия"
        title={ACTION_FORMAT_NAME[type]}
        subtitle={
          newGoalDraft?.resultText || existingGoal?.result_text
            ? `Моя цель: ${newGoalDraft?.resultText ?? existingGoal?.result_text}`
            : undefined
        }
      />

      <PageContainer as="main" className="animate-rise pt-6">
        <ActionForm
          type={type}
          areas={areas}
          goals={formGoals}
          initial={{
            // Goal text is context only; this field belongs to the Action.
            whyImportant: null,
            goalId: newGoalDraft?.id ?? search.goalId ?? null,
            lifeAreaId: search.lifeAreaId || null,
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
      </PageContainer>
    </div>
  );
}
