PRAGMA foreign_keys = ON;

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  seeded_for TEXT NOT NULL,
  initialized_at TEXT,
  imported_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE life_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL UNIQUE
);

INSERT INTO life_areas (id, name, question, description, sort_order) VALUES
('personal_growth','Личностное развитие','Каким человеком я становлюсь?','Самопознание, уверенность в себе, личные качества, границы, самостоятельность, привычки, убеждения и внутренний рост.',1),
('body_health','Тело и здоровье','Как я забочусь о своём теле?','Физическое здоровье, сон, питание, движение, физическая форма, энергия, внешность и забота о теле.',2),
('inner_state','Внутреннее состояние','Как я себя чувствую и справляюсь с жизнью?','Эмоции, настроение, стресс, тревога, психологическое благополучие, внутреннее равновесие и способность восстанавливаться.',3),
('love','Любовь и близость','Какие отношения я создаю с любимым человеком?','Романтические отношения, эмоциональная и физическая близость, сексуальность, доверие, любовь, партнёрство и совместная жизнь.',4),
('family','Семья','Какие отношения я создаю с близкими?','Дети, родители, родственники, семейные отношения, воспитание, поддержка, семейные традиции и время вместе.',5),
('friends','Друзья и окружение','Кто меня окружает?','Дружба, социальные связи, новые знакомства, сообщество, поддержка, общение и чувство принадлежности.',6),
('career','Дело и карьера','Чем я хочу заниматься и что создавать в мире?','Работа, профессия, карьера, бизнес, профессиональная реализация, достижения, рабочая среда и вклад.',7),
('money','Деньги и материальное благополучие','Насколько свободно и устойчиво я живу материально?','Доход, расходы, накопления, финансовая безопасность, имущество, материальные возможности и финансовая свобода.',8),
('creativity','Творчество и самореализация','Что я хочу создавать и выражать?','Творческие проекты, идеи, таланты, самовыражение, увлечения, создание нового и реализация своего потенциала.',9),
('learning','Развитие и обучение','Чему я хочу научиться?','Знания, образование, новые навыки, языки, профессиональное обучение, интеллектуальное развитие, чтение и исследование нового.',10),
('meaning','Смысл и духовность','Ради чего я живу и во что верю?','Ценности, смысл жизни, духовные практики, вера, мировоззрение, связь с собой, другими людьми и чем-то большим.',11),
('lifestyle','Образ жизни и удовольствие','Как я хочу проживать свою жизнь каждый день?','Отдых, путешествия, развлечения, хобби, впечатления, красота, личное пространство, повседневные ритуалы и то, что приносит радость.',12);

CREATE TABLE goals (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  life_area_id TEXT NOT NULL REFERENCES life_areas(id),
  result_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  archived_at TEXT,
  closed_on TEXT,
  CHECK (closed_on IS NULL OR closed_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  PRIMARY KEY (workspace_id, id)
);

CREATE TABLE actions (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ritual','regular_action','task','time_slot','preparation')),
  description TEXT,
  duration_seconds INTEGER,
  why_important TEXT,
  helps_with TEXT,
  start_date TEXT NOT NULL,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, goal_id) REFERENCES goals(workspace_id, id)
);

CREATE TABLE action_life_areas (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  life_area_id TEXT NOT NULL REFERENCES life_areas(id),
  PRIMARY KEY (workspace_id, action_id, life_area_id),
  FOREIGN KEY (workspace_id, action_id) REFERENCES actions(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE ritual_items (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ritual_action_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, ritual_action_id) REFERENCES actions(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE schedules (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  repeat_type TEXT NOT NULL CHECK (repeat_type IN ('once','weekly')),
  scheduled_date TEXT,
  weekdays_json TEXT NOT NULL DEFAULT '[]',
  start_time TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','cancelled')),
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, action_id) REFERENCES actions(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE completions (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  schedule_id TEXT,
  occurrence_date TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed','in_progress','skipped')),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, schedule_id, occurrence_date),
  FOREIGN KEY (workspace_id, action_id) REFERENCES actions(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, schedule_id) REFERENCES schedules(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE ritual_item_completions (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  ritual_item_id TEXT NOT NULL,
  schedule_id TEXT,
  occurrence_date TEXT NOT NULL,
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, ritual_item_id, schedule_id, occurrence_date),
  FOREIGN KEY (workspace_id, ritual_item_id) REFERENCES ritual_items(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, schedule_id) REFERENCES schedules(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE attachments (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video','audio','link')),
  url TEXT NOT NULL,
  title TEXT,
  PRIMARY KEY (workspace_id, id),
  FOREIGN KEY (workspace_id, action_id) REFERENCES actions(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE reflections (
  id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  real_result TEXT,
  effective_actions TEXT,
  obstacles TEXT,
  system_change TEXT,
  next_experiment TEXT,
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, month)
);

CREATE INDEX goals_workspace_status_idx ON goals (workspace_id, status);
CREATE INDEX actions_workspace_idx ON actions (workspace_id);
CREATE INDEX actions_goal_idx ON actions (workspace_id, goal_id);
CREATE INDEX schedules_workspace_date_idx ON schedules (workspace_id, scheduled_date);
CREATE INDEX schedules_action_idx ON schedules (workspace_id, action_id);
CREATE INDEX completions_workspace_date_idx ON completions (workspace_id, occurrence_date);
CREATE INDEX ritual_items_action_idx ON ritual_items (workspace_id, ritual_action_id, sort_order);
CREATE INDEX ritual_completions_workspace_date_idx ON ritual_item_completions (workspace_id, occurrence_date);
CREATE INDEX attachments_action_idx ON attachments (workspace_id, action_id);
CREATE INDEX reflections_workspace_month_idx ON reflections (workspace_id, month);
