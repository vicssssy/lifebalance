-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ life_areas ============
CREATE TABLE public.life_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL
);
GRANT SELECT ON public.life_areas TO authenticated;
GRANT SELECT ON public.life_areas TO anon;
GRANT ALL ON public.life_areas TO service_role;
ALTER TABLE public.life_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "life_areas_read" ON public.life_areas FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.life_areas (id, name, question, description, sort_order) VALUES
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

-- ============ goals ============
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id TEXT NOT NULL REFERENCES public.life_areas(id),
  result_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_own" ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX goals_user_status_idx ON public.goals (user_id, status);

-- ============ actions ============
CREATE TABLE public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ritual','regular_action','task','time_slot','preparation')),
  description TEXT,
  duration_seconds INT,
  why_important TEXT,
  helps_with TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actions TO authenticated;
GRANT ALL ON public.actions TO service_role;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_own" ON public.actions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER actions_updated_at BEFORE UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX actions_user_idx ON public.actions (user_id);
CREATE INDEX actions_goal_idx ON public.actions (goal_id);

-- ============ action_life_areas ============
CREATE TABLE public.action_life_areas (
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  life_area_id TEXT NOT NULL REFERENCES public.life_areas(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (action_id, life_area_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.action_life_areas TO authenticated;
GRANT ALL ON public.action_life_areas TO service_role;
ALTER TABLE public.action_life_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "action_life_areas_own" ON public.action_life_areas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_max_three_life_areas()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.action_life_areas WHERE action_id = NEW.action_id) > 3 THEN
    RAISE EXCEPTION 'Максимум 3 сферы';
  END IF;
  RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER action_life_areas_max_three
  AFTER INSERT ON public.action_life_areas DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_three_life_areas();

-- ============ ritual_items ============
CREATE TABLE public.ritual_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ritual_action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_seconds INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritual_items TO authenticated;
GRANT ALL ON public.ritual_items TO service_role;
ALTER TABLE public.ritual_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ritual_items_own" ON public.ritual_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ritual_items_updated_at BEFORE UPDATE ON public.ritual_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ritual_items_action_idx ON public.ritual_items (ritual_action_id, sort_order);

-- ============ schedules ============
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  repeat_type TEXT NOT NULL DEFAULT 'once' CHECK (repeat_type IN ('once','weekly')),
  scheduled_date DATE,
  weekdays SMALLINT[] NOT NULL DEFAULT '{}',
  start_time TIME,
  duration_seconds INT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_own" ON public.schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER schedules_updated_at BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX schedules_user_date_idx ON public.schedules (user_id, scheduled_date);
CREATE INDEX schedules_action_idx ON public.schedules (action_id);

-- ============ completions ============
CREATE TABLE public.completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','in_progress')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, occurrence_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completions TO authenticated;
GRANT ALL ON public.completions TO service_role;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "completions_own" ON public.completions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER completions_updated_at BEFORE UPDATE ON public.completions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX completions_user_date_idx ON public.completions (user_id, occurrence_date);

-- ============ ritual_item_completions ============
CREATE TABLE public.ritual_item_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ritual_item_id UUID NOT NULL REFERENCES public.ritual_items(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ritual_item_id, schedule_id, occurrence_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ritual_item_completions TO authenticated;
GRANT ALL ON public.ritual_item_completions TO service_role;
ALTER TABLE public.ritual_item_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ritual_item_completions_own" ON public.ritual_item_completions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ric_date_idx ON public.ritual_item_completions (user_id, occurrence_date);

-- ============ attachments ============
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video','audio','link')),
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_own" ON public.attachments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX attachments_action_idx ON public.attachments (action_id);

-- ============ reflections ============
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  real_result TEXT,
  effective_actions TEXT,
  obstacles TEXT,
  system_change TEXT,
  next_experiment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reflections_own" ON public.reflections FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reflections_updated_at BEFORE UPDATE ON public.reflections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();