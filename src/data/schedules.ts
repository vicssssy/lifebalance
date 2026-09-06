import { fetchCloudWorkspace, mutateCloudWorkspace } from "@/cloud/client";
import type { Schedule } from "@/domain/types";

export async function fetchSchedules(): Promise<Schedule[]> {
  return (await fetchCloudWorkspace()).source.schedules.filter(
    (schedule) => schedule.status === "planned",
  );
}

export async function updateSchedule(
  scheduleId: string,
  patch: Partial<{
    weekdays: number[];
    scheduled_date: string | null;
    start_time: string | null;
    duration_seconds: number | null;
  }>,
): Promise<void> {
  await mutateCloudWorkspace({ type: "updateSchedule", scheduleId, patch });
}

export async function rescheduleAction(input: {
  scheduleId: string;
  fromDate: string;
  date: string;
  startTime: string | null;
  durationSeconds: number | null;
}): Promise<void> {
  await mutateCloudWorkspace({ type: "rescheduleOccurrence", ...input });
}
