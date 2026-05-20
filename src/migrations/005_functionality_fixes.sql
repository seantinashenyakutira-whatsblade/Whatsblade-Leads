-- ============================================================
-- Migration 005: Functionality Fixes & Enhancements
-- ============================================================
-- Run after 004_push_notifications_settings.sql
-- Adds missing columns, new tables for search history,
-- saved searches, enrichment scheduling, and technographics
-- ============================================================

-- Add technographics column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS technographics JSONB DEFAULT '{}'::jsonb;

-- Add email_addresses column for multiple emails from discovery
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email_addresses TEXT[] DEFAULT '{}';

-- Add photo_urls column for resolved Google Places photo URLs
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Add opening_hours_formatted for human-readable hours
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS opening_hours_formatted TEXT;

-- Add enrichment_status to track if enrichment is running
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending';

-- Add sentiment_score from review analysis
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS review_sentiment_score DOUBLE PRECISION;

-- Add competitor_analysis JSONB
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS competitor_analysis JSONB DEFAULT '[]'::jsonb;

-- Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  query       TEXT NOT NULL,
  industry    TEXT,
  country     TEXT,
  city        TEXT,
  radius      INTEGER,
  filters     JSONB DEFAULT '{}',
  result_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON public.search_history(query);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'sh_select') THEN
    CREATE POLICY sh_select ON public.search_history FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'sh_insert') THEN
    CREATE POLICY sh_insert ON public.search_history FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'sh_delete') THEN
    CREATE POLICY sh_delete ON public.search_history FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  industry    TEXT,
  country     TEXT,
  city        TEXT,
  radius      INTEGER DEFAULT 25,
  filters     JSONB NOT NULL DEFAULT '{}',
  max_results INTEGER DEFAULT 25,
  sort_by     TEXT DEFAULT 'leadScore',
  sort_order  TEXT DEFAULT 'desc',
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_name ON public.saved_searches(name);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'ss_select') THEN
    CREATE POLICY ss_select ON public.saved_searches FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'ss_insert') THEN
    CREATE POLICY ss_insert ON public.saved_searches FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'ss_update') THEN
    CREATE POLICY ss_update ON public.saved_searches FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'ss_delete') THEN
    CREATE POLICY ss_delete ON public.saved_searches FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Create enrichment_schedules table
CREATE TABLE IF NOT EXISTS public.enrichment_schedules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lead_id         UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  schedule_type   TEXT NOT NULL DEFAULT 'once',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  recurrence      TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_schedules_user_id ON public.enrichment_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_schedules_lead_id ON public.enrichment_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_schedules_status ON public.enrichment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_schedules_scheduled_at ON public.enrichment_schedules(scheduled_at);

ALTER TABLE public.enrichment_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_schedules' AND policyname = 'es_select') THEN
    CREATE POLICY es_select ON public.enrichment_schedules FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_schedules' AND policyname = 'es_insert') THEN
    CREATE POLICY es_insert ON public.enrichment_schedules FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_schedules' AND policyname = 'es_update') THEN
    CREATE POLICY es_update ON public.enrichment_schedules FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_schedules' AND policyname = 'es_delete') THEN
    CREATE POLICY es_delete ON public.enrichment_schedules FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER saved_searches_updated_at BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER enrichment_schedules_updated_at BEFORE UPDATE ON public.enrichment_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
