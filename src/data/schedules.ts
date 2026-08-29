import { supabase } from "@/integrations/supabase/client";
import type { Schedule } from "@/domain/types";

const SCHEDULE_FIELDS =
  "id, action_id, repeat_type, scheduled_date, weekdays, start_time, duration_seconds, status";

export async function fetchSchedules(): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from("schedules")
    .select(SCHEDULE_FIELDS)
    .eq("status", "planned");
  if (error) throw error;
  return (data ?? []) as Schedule[];
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
  const { error } = await supabase.from("schedules").update(patch).eq("id", scheduleId);
  if (error) throw error;
}

/** «Перенести» — переносит действие на другой день/время с сохранением в расписании. */
export async function rescheduleAction(input: {
  scheduleId: string;
  repeatType: "once" | "weekly";
  date: string;
  startTime: string | null;
  durationSeconds: number | null;
}): Promise<void> {
  const weekday = ((new Date(`${input.date}T00:00:00`).getDay() + 6) % 7) + 1;
  await updateSchedule(input.scheduleId, {
    ...(input.repeatType === "once"
      ? { scheduled_date: input.date }
      : { weekdays: [weekday] }),
    start_time: input.startTime,
    duration_seconds: input.durationSeconds,
  });
}
