-- A ritual can be completed explicitly even when its item checklist is partial.
-- Existing facts predate this distinction, so preserve them as explicit decisions.
ALTER TABLE completions
  ADD COLUMN completion_source TEXT NOT NULL DEFAULT 'manual'
  CHECK (completion_source IN ('manual', 'ritual_items'));
