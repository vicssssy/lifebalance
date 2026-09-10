import webpush from "web-push";

type ReminderEnv = {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
};
type DueRow = {
  subscription_id: string;
  workspace_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  action_id: string;
  action_name: string;
  start_date: string;
  end_date: string | null;
  reminder_time: string;
  schedule_id: string;
  repeat_type: "once" | "weekly";
  scheduled_date: string | null;
  weekdays_json: string;
  original_date: string | null;
  target_date: string | null;
};

function localParts(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}

function weekday(date: string): number {
  return ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}
function includesWeekday(value: string, date: string) {
  try {
    return (JSON.parse(value) as unknown[]).includes(weekday(date));
  } catch {
    return false;
  }
}

export async function deliverDueReminders(db: D1Database, env: ReminderEnv): Promise<void> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) return;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  const subscriptions = await db
    .prepare("SELECT DISTINCT timezone FROM push_subscriptions")
    .all<{ timezone: string }>();
  for (const { timezone } of subscriptions.results) {
    let current: { date: string; time: string };
    try {
      current = localParts(timezone);
    } catch {
      continue;
    }
    const rows = await db
      .prepare(
        "SELECT ps.id subscription_id, ps.workspace_id, ps.endpoint, ps.p256dh, ps.auth, ps.timezone, a.id action_id, a.name action_name, a.start_date, a.end_date, a.reminder_time, s.id schedule_id, s.repeat_type, s.scheduled_date, s.weekdays_json, o.original_date, o.target_date FROM push_subscriptions ps JOIN actions a ON a.workspace_id = ps.workspace_id LEFT JOIN goals g ON g.workspace_id = a.workspace_id AND g.id = a.goal_id JOIN schedules s ON s.workspace_id = a.workspace_id AND s.action_id = a.id LEFT JOIN occurrence_overrides o ON o.workspace_id = s.workspace_id AND o.schedule_id = s.id AND (o.original_date = ? OR o.target_date = ?) WHERE ps.timezone = ? AND a.reminder_enabled = 1 AND a.reminder_time IS NOT NULL AND a.archived_at IS NULL AND (a.goal_id IS NULL OR g.status = 'active') AND s.status = 'planned'",
      )
      .bind(current.date, current.date, timezone)
      .all<DueRow>();
    for (const row of rows.results) {
      if (row.reminder_time.slice(0, 5) !== current.time) continue;
      const incoming = row.target_date === current.date;
      const movedAway = row.original_date === current.date && !incoming;
      const normal =
        row.repeat_type === "once"
          ? row.scheduled_date === current.date
          : includesWeekday(row.weekdays_json, current.date);
      if ((!incoming && (movedAway || !normal)) || (incoming && !row.original_date)) continue;
      const originalDate = incoming ? row.original_date! : current.date;
      if (
        originalDate < row.start_date ||
        current.date < row.start_date ||
        (row.end_date && (originalDate > row.end_date || current.date > row.end_date))
      )
        continue;
      const inserted = await db
        .prepare(
          "INSERT OR IGNORE INTO reminder_deliveries (workspace_id, subscription_id, schedule_id, original_date, delivered_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          row.workspace_id,
          row.subscription_id,
          row.schedule_id,
          originalDate,
          new Date().toISOString(),
        )
        .run();
      if (!inserted.meta.changes) continue;
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          JSON.stringify({
            title: row.action_name,
            body: "Время запланированного действия.",
            url: `/action/${row.action_id}?date=${current.date}&scheduleId=${row.schedule_id}`,
          }),
          { TTL: 120 },
        );
      } catch (error) {
        await db
          .prepare(
            "DELETE FROM reminder_deliveries WHERE workspace_id = ? AND subscription_id = ? AND schedule_id = ? AND original_date = ?",
          )
          .bind(row.workspace_id, row.subscription_id, row.schedule_id, originalDate)
          .run();
        const status =
          error instanceof Error && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : 0;
        if (status === 404 || status === 410)
          await db
            .prepare("DELETE FROM push_subscriptions WHERE id = ?")
            .bind(row.subscription_id)
            .run();
        console.error(JSON.stringify({ event: "reminder_push_error", status }));
      }
    }
  }
}
