PRAGMA foreign_keys = ON;

-- Provider-neutral account records. These tables are intentionally unused while
-- sign-in is hidden; they let a verified identity claim the existing anonymous
-- workspace later without moving planner history or changing workspace IDs.
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email_normalized TEXT UNIQUE,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE auth_identities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  email_normalized TEXT,
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  UNIQUE (provider, provider_subject)
);

CREATE TABLE workspace_memberships (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner','member')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  linked_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

CREATE UNIQUE INDEX workspace_primary_per_user_idx
  ON workspace_memberships (user_id)
  WHERE is_primary = 1;
CREATE INDEX workspace_memberships_user_idx ON workspace_memberships (user_id);
CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);
