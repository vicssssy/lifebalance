import { supabase } from "@/integrations/supabase/client";
import type { ActionType } from "@/domain/constants";
import type { Action, Attachment, RitualItem, Schedule } from "@/domain/types";

const ACTION_FIELDS =
  "id, goal_id, name, type, description, duration_seconds, why_important, helps_with, start_date, archived_at, created_at";

export async function fetchActions(): Promise<Action[]> {
  const { data, error } = await supabase
    .from("actions")
    .select(ACTION_FIELDS)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Action[];
}

export async function fetchAction(actionId: string): Promise<Action | null> {
  const { data, error } = await supabase
    .from("actions")
    .select(ACTION_FIELDS)
    .eq("id", actionId)
    .maybeSingle();
  if (error) throw error;
  return (data as Action) ?? null;
}

export async function fetchActionLifeAreas(): Promise<{ action_id: string; life_area_id: string }[]> {
  const { data, error } = await supabase.from("action_life_areas").select("action_id, life_area_id");
  if (error) throw error;
  return data ?? [];
}

export async function fetchRitualItems(actionId: string): Promise<RitualItem[]> {
  const { data, error } = await supabase
    .from("ritual_items")
    .select("id, ritual_action_id, name, description, duration_seconds, sort_order")
    .eq("ritual_action_id", actionId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as RitualItem[];
}

export async function fetchAllRitualItems(): Promise<RitualItem[]> {
  const { data, error } = await supabase
    .from("ritual_items")
    .select("id, ritual_action_id, name, description, duration_seconds, sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as RitualItem[];
}

export async function fetchAttachments(actionId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("id, action_id, type, url, title")
    .eq("action_id", actionId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Attachment[];
}

export interface ScheduleDraft {
  repeat_type: "once" | "weekly";
  scheduled_date: string | null;
  weekdays: number[];
  start_time: string | null;
  duration_seconds: number | null;
}

export interface ActionDraft {
  userId: string;
  goalId: string | null;
  name: string;
  type: ActionType;
  description: string | null;
  durationSeconds: number | null;
  whyImportant: string | null;
  helpsWith: string | null;
  startDate: string;
  lifeAreaIds: string[];
  ritualItems: { name: string; description: string | null }[];
  attachments: { type: "video" | "audio" | "link"; url: string; title: string | null }[];
  schedules: ScheduleDraft[];
}

/** Создаёт действие вместе со сферами, элементами ритуала, материалами и планированием. */
export async function createAction(draft: ActionDraft): Promise<Action> {
  const { data, error } = await supabase
    .from("actions")
    .insert({
      user_id: draft.userId,
      goal_id: draft.goalId,
      name: draft.name,
      type: draft.type,
      description: draft.description,
      duration_seconds: draft.durationSeconds,
      why_important: draft.whyImportant,
      helps_with: draft.helpsWith,
      start_date: draft.startDate,
    })
    .select(ACTION_FIELDS)
    .single();
  if (error) throw error;
  const action = data as Action;

  const areas = draft.lifeAreaIds.slice(0, 3);
  if (areas.length) {
    const { error: areaError } = await supabase.from("action_life_areas").insert(
      areas.map((id) => ({
        action_id: action.id,
        life_area_id: id,
        user_id: draft.userId,
      })),
    );
    if (areaError) throw areaError;
  }

  const items = draft.ritualItems.filter((i) => i.name.trim().length > 0);
  if (items.length) {
    const { error: itemError } = await supabase.from("ritual_items").insert(
      items.map((item, index) => ({
        ritual_action_id: action.id,
        user_id: draft.userId,
        name: item.name.trim(),
        description: item.description,
        sort_order: index,
      })),
    );
    if (itemError) throw itemError;
  }

  if (draft.attachments.length) {
    const { error: attError } = await supabase.from("attachments").insert(
      draft.attachments.map((a) => ({
        action_id: action.id,
        user_id: draft.userId,
        type: a.type,
        url: a.url,
        title: a.title,
      })),
    );
    if (attError) throw attError;
  }

  if (draft.schedules.length) {
    const { error: schedError } = await supabase.from("schedules").insert(
      draft.schedules.map((s) => ({
        action_id: action.id,
        user_id: draft.userId,
        repeat_type: s.repeat_type,
        scheduled_date: s.scheduled_date,
        weekdays: s.weekdays,
        start_time: s.start_time,
        duration_seconds: s.duration_seconds,
      })),
    );
    if (schedError) throw schedError;
  }

  return action;
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
  const { error } = await supabase.from("actions").update(patch).eq("id", actionId);
  if (error) throw error;
}

export async function addRitualItem(input: {
  userId: string;
  actionId: string;
  name: string;
  sortOrder: number;
}): Promise<void> {
  const { error } = await supabase.from("ritual_items").insert({
    ritual_action_id: input.actionId,
    user_id: input.userId,
    name: input.name,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
}

export async function fetchSchedulesForAction(actionId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, action_id, repeat_type, scheduled_date, weekdays, start_time, duration_seconds, status")
    .eq("action_id", actionId)
    .eq("status", "planned");
  if (error) throw error;
  return (data ?? []) as Schedule[];
}

/** Обновляет пункт ритуала: название, подсказка, порядок. */
export async function updateRitualItem(
  itemId: string,
  patch: Partial<{ name: string; description: string | null; duration_seconds: number | null; sort_order: number }>,
): Promise<void> {
  const { error } = await supabase.from("ritual_items").update(patch).eq("id", itemId);
  if (error) throw error;
}

/** Сохраняет новый порядок пунктов ритуала. */
export async function reorderRitualItems(orderedIds: string[]): Promise<void> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase.from("ritual_items").update({ sort_order: index }).eq("id", id);
    if (error) throw error;
  }
}
