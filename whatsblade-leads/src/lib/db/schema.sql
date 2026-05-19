-- ============================================================
-- Whatsblade Leads — Full Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'agent');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE message_channel AS ENUM ('email', 'sms', 'whatsapp', 'linkedin');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE lead_source_platform AS ENUM ('google', 'facebook', 'manual');

-- ── TABLES ──────────────────────────────────────────────────

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'agent',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE public.leads (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_to          UUID REFERENCES public.users(id),
  created_by           UUID REFERENCES public.users(id),
  first_name           TEXT,
  last_name            TEXT,
  email                TEXT,
  phone                TEXT,
  company              TEXT,
  position             TEXT,
  website              TEXT,
  status               lead_status NOT NULL DEFAULT 'new',
  source               TEXT,
  notes                TEXT,
  attachments          JSONB DEFAULT '[]'::jsonb,
  custom_fields        JSONB DEFAULT '{}'::jsonb,
  google_place_id      TEXT UNIQUE,
  facebook_page_id     TEXT UNIQUE,
  address              TEXT,
  city                 TEXT,
  country              TEXT,
  latitude             DOUBLE PRECISION,
  longitude            DOUBLE PRECISION,
  google_rating        DOUBLE PRECISION,
  google_review_count  INTEGER,
  social_media         JSONB DEFAULT '{}'::jsonb,
  lead_score           INTEGER DEFAULT 0,
  source_platform      lead_source_platform DEFAULT 'manual',
  industry             TEXT,
  photos               JSONB DEFAULT '[]'::jsonb,
  opening_hours        JSONB DEFAULT '{}'::jsonb,
  price_level          INTEGER,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns
CREATE TABLE public.campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  status        campaign_status NOT NULL DEFAULT 'draft',
  created_by    UUID REFERENCES public.users(id) NOT NULL,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign Leads (junction)
CREATE TABLE public.campaign_leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- Messages (outreach history)
CREATE TABLE public.messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  campaign_id  UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  sent_by      UUID REFERENCES public.users(id) NOT NULL,
  channel      message_channel NOT NULL DEFAULT 'email',
  subject      TEXT,
  body         TEXT NOT NULL,
  status       message_status NOT NULL DEFAULT 'pending',
  sent_at      TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at    TIMESTAMPTZ,
  replied_at   TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activities (audit log)
CREATE TABLE public.activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}'::jsonb,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API Keys (encrypted vault)
CREATE TABLE public.api_keys (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) NOT NULL,
  name            TEXT NOT NULL,
  provider        TEXT NOT NULL,
  key_encrypted   BYTEA NOT NULL,
  key_iv          BYTEA NOT NULL,
  key_tag         BYTEA NOT NULL,
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhooks
CREATE TABLE public.webhooks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.users(id) NOT NULL,
  name              TEXT NOT NULL,
  url               TEXT NOT NULL,
  events            TEXT[] NOT NULL DEFAULT '{}'::text[],
  secret            TEXT NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) NOT NULL,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_leads_google_place_id ON public.leads(google_place_id);
CREATE INDEX idx_leads_facebook_page_id ON public.leads(facebook_page_id);
CREATE INDEX idx_leads_geo ON public.leads(latitude, longitude);
CREATE INDEX idx_leads_lead_score ON public.leads(lead_score DESC);
CREATE INDEX idx_leads_country ON public.leads(country);
CREATE INDEX idx_leads_city ON public.leads(city);
CREATE INDEX idx_leads_industry ON public.leads(industry);
CREATE INDEX idx_leads_source_platform ON public.leads(source_platform);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_by ON public.campaigns(created_by);
CREATE INDEX idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX idx_messages_sent_by ON public.messages(sent_by);
CREATE INDEX idx_messages_campaign_id ON public.messages(campaign_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY users_read ON public.users FOR SELECT USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY users_update ON public.users FOR UPDATE USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Leads
CREATE POLICY leads_select ON public.leads FOR SELECT USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY leads_insert ON public.leads FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY leads_update ON public.leads FOR UPDATE USING (
  assigned_to = auth.uid() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY leads_delete ON public.leads FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Campaigns
CREATE POLICY campaigns_select ON public.campaigns FOR SELECT USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY campaigns_delete ON public.campaigns FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Campaign Leads
CREATE POLICY campaign_leads_select ON public.campaign_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY campaign_leads_insert ON public.campaign_leads FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY campaign_leads_delete ON public.campaign_leads FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

-- Messages
CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  sent_by = auth.uid() OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (sent_by = auth.uid());

-- Activities
CREATE POLICY activities_select ON public.activities FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY activities_insert ON public.activities FOR INSERT WITH CHECK (user_id = auth.uid());

-- API Keys
CREATE POLICY api_keys_select ON public.api_keys FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY api_keys_insert ON public.api_keys FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY api_keys_update ON public.api_keys FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY api_keys_delete ON public.api_keys FOR DELETE USING (user_id = auth.uid());

-- Webhooks
CREATE POLICY webhooks_select ON public.webhooks FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY webhooks_insert ON public.webhooks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY webhooks_update ON public.webhooks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY webhooks_delete ON public.webhooks FOR DELETE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- ── TRIGGER: auto-update updated_at ─────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── AUTO-CREATE user profile on signup ──────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- MIGRATION: Business Intelligence Discovery Fields
-- Run this separately on existing databases:
-- ============================================================
-- ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'google';
-- ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'facebook';
-- ALTER TYPE lead_source_platform ADD VALUE IF NOT EXISTS 'manual';
-- ALTER TABLE public.leads ALTER COLUMN first_name DROP NOT NULL;
-- ALTER TABLE public.leads ALTER COLUMN last_name DROP NOT NULL;
-- ALTER TABLE public.leads ALTER COLUMN created_by DROP NOT NULL;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS facebook_page_id TEXT UNIQUE;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address TEXT;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_rating DOUBLE PRECISION;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_review_count INTEGER;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_platform lead_source_platform DEFAULT 'manual';
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;
-- ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS price_level INTEGER;
-- CREATE INDEX IF NOT EXISTS idx_leads_google_place_id ON public.leads(google_place_id);
-- CREATE INDEX IF NOT EXISTS idx_leads_facebook_page_id ON public.leads(facebook_page_id);
-- CREATE INDEX IF NOT EXISTS idx_leads_geo ON public.leads(latitude, longitude);
-- CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(lead_score DESC);
-- CREATE INDEX IF NOT EXISTS idx_leads_country ON public.leads(country);
-- CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
-- CREATE INDEX IF NOT EXISTS idx_leads_industry ON public.leads(industry);
-- CREATE INDEX IF NOT EXISTS idx_leads_source_platform ON public.leads(source_platform);

-- ============================================================
-- MIGRATION: AI Outreach Engine
-- Run this separately on existing databases:
-- ============================================================

-- Extend message_channel enum
ALTER TYPE message_channel ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE message_channel ADD VALUE IF NOT EXISTS 'facebook';

-- Extend messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS character_count INTEGER;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.message_templates(id);

-- Business profiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name  TEXT NOT NULL,
  services       TEXT[] NOT NULL DEFAULT '{}',
  pricing_info   TEXT,
  offer_text     TEXT,
  location       TEXT,
  base_currency  TEXT NOT NULL DEFAULT 'ZMW',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  platform    message_channel NOT NULL,
  tone        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'English',
  body        TEXT NOT NULL,
  variables   TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead analysis (AI summaries and opportunity tags)
CREATE TABLE IF NOT EXISTS public.lead_analysis (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id              UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL UNIQUE,
  summary              TEXT,
  opportunity_tags     TEXT[] DEFAULT '{}',
  recommended_platform message_channel,
  recommended_tone     TEXT,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_platform ON public.messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_ai_generated ON public.messages(ai_generated);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_analysis_lead_id ON public.lead_analysis(lead_id);

-- RLS
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analysis ENABLE ROW LEVEL SECURITY;

-- Business profiles policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_select') THEN
    CREATE POLICY bp_select ON public.business_profiles FOR SELECT USING (
      user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_insert') THEN
    CREATE POLICY bp_insert ON public.business_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_update') THEN
    CREATE POLICY bp_update ON public.business_profiles FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- Message templates policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_select') THEN
    CREATE POLICY mt_select ON public.message_templates FOR SELECT USING (
      user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_insert') THEN
    CREATE POLICY mt_insert ON public.message_templates FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_update') THEN
    CREATE POLICY mt_update ON public.message_templates FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_delete') THEN
    CREATE POLICY mt_delete ON public.message_templates FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Lead analysis policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_analysis' AND policyname = 'la_select') THEN
    CREATE POLICY la_select ON public.lead_analysis FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_analysis' AND policyname = 'la_insert') THEN
    CREATE POLICY la_insert ON public.lead_analysis FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Trigger for business_profiles updated_at
CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MIGRATION: Contact Intelligence Engine
-- Run this separately on existing databases:
-- ============================================================

-- Extend leads table with enrichment columns
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

-- Lead enrichment log table
CREATE TABLE IF NOT EXISTS public.lead_enrichment_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  stage       TEXT NOT NULL,
  status      TEXT NOT NULL,
  details     JSONB DEFAULT '{}',
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrichment_log_lead_id ON public.lead_enrichment_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_log_created_at ON public.lead_enrichment_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_enriched_at ON public.leads(last_enriched_at);
CREATE INDEX IF NOT EXISTS idx_leads_social_presence_score ON public.leads(social_presence_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_website_quality_score ON public.leads(website_quality_score DESC);

-- RLS for enrichment log
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

-- ============================================================
-- MIGRATION: Enterprise CRM Pipeline
-- ============================================================

-- Extend lead_status enum
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'replied';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'meeting_booked';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'proposal_sent';

-- Pipeline columns on leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_deal_value ON public.leads(deal_value DESC);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON public.leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON public.leads(next_action_date);

-- ── Lead Notes ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.users(id) NOT NULL,
  content     TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_id ON public.lead_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_select') THEN
    CREATE POLICY ln_select ON public.lead_notes FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_insert') THEN
    CREATE POLICY ln_insert ON public.lead_notes FOR INSERT WITH CHECK (
      user_id = auth.uid() AND
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_update') THEN
    CREATE POLICY ln_update ON public.lead_notes FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_delete') THEN
    CREATE POLICY ln_delete ON public.lead_notes FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER lead_notes_updated_at BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Lead Reminders ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lead_reminders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id      UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.users(id) NOT NULL,
  action       TEXT NOT NULL,
  remind_at    TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead_id ON public.lead_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_user_id ON public.lead_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_remind_at ON public.lead_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_status ON public.lead_reminders(status);

ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_select') THEN
    CREATE POLICY lr_select ON public.lead_reminders FOR SELECT USING (
      user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_insert') THEN
    CREATE POLICY lr_insert ON public.lead_reminders FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_update') THEN
    CREATE POLICY lr_update ON public.lead_reminders FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_delete') THEN
    CREATE POLICY lr_delete ON public.lead_reminders FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Saved Filters ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);

ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_select') THEN
    CREATE POLICY sf_select ON public.saved_filters FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_insert') THEN
    CREATE POLICY sf_insert ON public.saved_filters FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_update') THEN
    CREATE POLICY sf_update ON public.saved_filters FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_delete') THEN
    CREATE POLICY sf_delete ON public.saved_filters FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER saved_filters_updated_at BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- MIGRATION: Settings, Admin Panel & Integrations
-- ============================================================

-- Theme enum
CREATE TYPE theme_preference AS ENUM ('dark', 'light', 'system');

-- ── User Preferences ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  default_country         TEXT,
  default_currency        TEXT NOT NULL DEFAULT 'ZMW',
  favourite_industries    TEXT[] NOT NULL DEFAULT '{}',
  notification_email      BOOLEAN NOT NULL DEFAULT true,
  notification_inapp      BOOLEAN NOT NULL DEFAULT true,
  notification_slack      BOOLEAN NOT NULL DEFAULT false,
  notification_webhook    BOOLEAN NOT NULL DEFAULT false,
  theme                   theme_preference NOT NULL DEFAULT 'system',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'up_select') THEN
    CREATE POLICY up_select ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'up_insert') THEN
    CREATE POLICY up_insert ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'up_update') THEN
    CREATE POLICY up_update ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Business Profile: add bio column ────────────────────────

ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── API Usage Log ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  provider        TEXT NOT NULL,
  endpoint        TEXT,
  status_code     INTEGER,
  response_time_ms INTEGER,
  success         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_provider ON public.api_usage_log(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON public.api_usage_log(created_at DESC);

ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_usage_log' AND policyname = 'aul_select') THEN
    CREATE POLICY aul_select ON public.api_usage_log FOR SELECT USING (
      user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_usage_log' AND policyname = 'aul_insert') THEN
    CREATE POLICY aul_insert ON public.api_usage_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ── Integrations ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.integrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL,
  name            TEXT NOT NULL,
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_sync_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON public.integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.integrations(type);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'int_select') THEN
    CREATE POLICY int_select ON public.integrations FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'int_insert') THEN
    CREATE POLICY int_insert ON public.integrations FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'int_update') THEN
    CREATE POLICY int_update ON public.integrations FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integrations' AND policyname = 'int_delete') THEN
    CREATE POLICY int_delete ON public.integrations FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
