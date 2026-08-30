import { fetchCloudWorkspace, mutateCloudWorkspace } from "@/cloud/client";
import type { Completion, RitualItemCompletion } from "@/domain/types";

export async function fetchCompletions(range?: {
  from: string;
  to: string;
}): Promise<Completion[]> {
  const completions = (await fetchCloudWorkspace()).source.completions;
  return range
    ? completions.filter(
        (completion) =>
          completion.occurrence_date >= range.from && completion.occurrence_date <= range.to,
      )
    : completions;
}

export async function fetchRitualItemCompletions(range?: {
  from: string;
  to: string;
}): Promise<RitualItemCompletion[]> {
  const completions = (await fetchCloudWorkspace()).source.ritualItemCompletions;
  return range
    ? completions.filter(
        (completion) =>
          completion.occurrence_date >= range.from && completion.occurrence_date <= range.to,
      )
    : completions;
}

export async function markActionCompleted(input: {
  userId?: string;
  actionId: string;
  scheduleId: string;
  date: string;
}): Promise<void> {
  await mutateCloudWorkspace({
    type: "setCompletion",
    actionId: input.actionId,
    scheduleId: input.scheduleId,
    date: input.date,
    status: "completed",
  });
}

export async function unmarkActionCompleted(input: {
  scheduleId: string;
  date: string;
}): Promise<void> {
  await mutateCloudWorkspace({ type: "removeCompletion", ...input });
}

export async function toggleRitualItem(input: {
  userId?: string;
  ritualItemId: string;
  scheduleId: string;
  date: string;
  done: boolean;
}): Promise<void> {
  await mutateCloudWorkspace({
    type: "setRitualItemCompletion",
    ritualItemId: input.ritualItemId,
    scheduleId: input.scheduleId,
    date: input.date,
    done: input.done,
  });
}

export async function markActionSkipped(input: {
  userId?: string;
  actionId: string;
  scheduleId: string;
  date: string;
}): Promise<void> {
  await mutateCloudWorkspace({
    type: "setCompletion",
    actionId: input.actionId,
    scheduleId: input.scheduleId,
    date: input.date,
    status: "skipped",
  });
}
