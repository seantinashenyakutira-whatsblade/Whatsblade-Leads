-- ============================================================
-- Migration 002: Business Intelligence & Enrichment
-- ============================================================
-- Run after 001_initial_schema.sql
-- ============================================================

ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'google';
ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'facebook';
ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'manual';

ALTER TABLE public.leads ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS facebook_page_id TEXT UNIQUE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_review_count INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_platform lead_source_platform DEFAULT 'manual';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS price_level INTEGER;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS instagram_followers INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS instagram_verified BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS facebook_followers INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS facebook_last_post_date TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_available BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS has_booking_system BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_mobile_responsive BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website_quality_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS social_presence_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS opportunity_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON public.leads(google_place_id);
CREATE INDEX IF NOT EXISTS idx_leads_facebook_page_id ON public.leads(facebook_page_id);
CREATE INDEX IF NOT EXISTS idx_leads_geo ON public.leads(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_country ON public.leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON public.leads(source_platform);
CREATE INDEX IF NOT EXISTS idx_leads_last_enriched_at ON public.leads(last_enriched_at);
CREATE INDEX IF NOT EXISTS idx_leads_social_presence_score ON public.leads(social_presence_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_website_quality_score ON public.leads(website_quality_score DESC);

CREATE TABLE IF NOT EXISTS public.lead_enrichment_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  stage       TEXT NOT NULL,
  status      TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_log_lead_id ON public.lead_enrichment_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_created_at ON public.lead_enrichment_log(created_at DESC);

ALTER TABLE public.lead_enrichment_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_enrichment_log' AND policyname = 'el_select') THEN
    CREATE POLICY el_select ON public.lead_enrichment_log FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_enrichment_log' AND policyname = 'el_insert') THEN
    CREATE POLICY el_insert ON public.lead_enrichment_log FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;
