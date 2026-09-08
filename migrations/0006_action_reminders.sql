ALTER TABLE actions ADD COLUMN reminder_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE actions ADD COLUMN reminder_time TEXT;

CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  timezone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX push_subscriptions_workspace_idx ON push_subscriptions(workspace_id);

CREATE TABLE reminder_deliveries (
  workspace_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  original_date TEXT NOT NULL,
  delivered_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, subscription_id, schedule_id, original_date),
  FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE
);
