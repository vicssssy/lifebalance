-- The original schedule/date is the stable identity of completions and ritual progress.
-- Moving an occurrence never edits or deletes its schedule or history.
CREATE TABLE occurrence_overrides (
  workspace_id TEXT NOT NULL,
  schedule_id TEXT NOT NULL,
  original_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  start_time TEXT,
  duration_seconds INTEGER,
  PRIMARY KEY (workspace_id, schedule_id, original_date),
  UNIQUE (workspace_id, schedule_id, target_date),
  FOREIGN KEY (workspace_id, schedule_id) REFERENCES schedules(workspace_id, id)
);
