ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS closed_on DATE;

COMMENT ON COLUMN public.goals.closed_on IS
  'Date-only cutoff: linked actions remain historical through this date and are inactive afterward.';
