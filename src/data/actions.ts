import { fetchCloudWorkspace, mutateCloudWorkspace } from "@/cloud/client";
import type { CloudActionDraft } from "@/cloud/types";
import type { ActionType } from "@/domain/constants";
import type { Action, Attachment, RitualItem, Schedule } from "@/domain/types";

export async function fetchActions(): Promise<Action[]> {
  return (await fetchCloudWorkspace()).source.actions;
}

export async function fetchAction(actionId: string): Promise<Action | null> {
  return (
    (await fetchCloudWorkspace()).source.actions.find((action) => action.id === actionId) ?? null
  );
}

export async function fetchActionLifeAreas(): Promise<
  { action_id: string; life_area_id: string }[]
> {
  return (await fetchCloudWorkspace()).source.actionLifeAreas;
}

export async function fetchRitualItems(actionId: string): Promise<RitualItem[]> {
  return (await fetchCloudWorkspace()).source.ritualItems.filter(
    (item) => item.ritual_action_id === actionId,
  );
}

export async function fetchAllRitualItems(): Promise<RitualItem[]> {
  return (await fetchCloudWorkspace()).source.ritualItems;
}

export async function fetchAttachments(actionId: string): Promise<Attachment[]> {
  return (await fetchCloudWorkspace()).attachments.filter(
    (attachment) => attachment.action_id === actionId,
  );
}

export interface ScheduleDraft {
  repeat_type: "once" | "weekly";
  scheduled_date: string | null;
  weekdays: number[];
  start_time: string | null;
  duration_seconds: number | null;
}

export interface ActionDraft extends Omit<CloudActionDraft, "type" | "schedules"> {
  userId?: string;
  type: ActionType;
  schedules: ScheduleDraft[];
}

/** Создаёт действие вместе со сферами, элементами ритуала, материалами и планированием. */
export async function createAction(draft: ActionDraft): Promise<Action> {
  const { userId: _userId, ...cloudDraft } = draft;
  void _userId;
  return mutateCloudWorkspace<Action>({ type: "createAction", draft: cloudDraft });
}

export async function updateAction(
  actionId: string,
  patch: Partial<{
    name: string;
    description: string | null;
    duration_seconds: number | null;
    why_important: string | null;
    helps_with: string | null;
    start_date: string;
  }>,
): Promise<void> {
  await mutateCloudWorkspace({ type: "updateAction", actionId, patch });
}

export async function addRitualItem(input: {
  userId?: string;
  actionId: string;
  name: string;
  sortOrder: number;
}): Promise<void> {
  await mutateCloudWorkspace({
    type: "addRitualItem",
    actionId: input.actionId,
    name: input.name,
    sortOrder: input.sortOrder,
  });
}

export async function fetchSchedulesForAction(actionId: string): Promise<Schedule[]> {
  return (await fetchCloudWorkspace()).source.schedules.filter(
    (schedule) => schedule.action_id === actionId && schedule.status === "planned",
  );
}

/** Обновляет пункт ритуала: название, подсказка, порядок. */
export async function updateRitualItem(
  itemId: string,
  patch: Partial<{
    name: string;
    description: string | null;
    duration_seconds: number | null;
    sort_order: number;
  }>,
): Promise<void> {
  await mutateCloudWorkspace({ type: "updateRitualItem", itemId, patch });
}

/** Сохраняет новый порядок пунктов ритуала. */
export async function reorderRitualItems(orderedIds: string[]): Promise<void> {
  await mutateCloudWorkspace({ type: "reorderRitualItems", orderedIds });
}
