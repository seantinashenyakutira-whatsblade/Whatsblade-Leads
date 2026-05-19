-- ============================================================
-- Migration 003: Enterprise CRM Pipeline
-- ============================================================
-- Run after 002_business_intelligence.sql
-- ============================================================

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'replied';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'meeting_booked';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'proposal_sent';

ALTER TYPE message_channel ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE message_channel ADD VALUE IF NOT EXISTS 'facebook';

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deal_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_deal_value ON public.leads(deal_value DESC);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON public.leads(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_date ON public.leads(next_action_date);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS platform TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS character_count INTEGER;

CREATE INDEX IF NOT EXISTS idx_messages_platform ON public.messages(platform);
CREATE INDEX IF NOT EXISTS idx_messages_ai_generated ON public.messages(ai_generated);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name  TEXT NOT NULL,
  services       TEXT[] NOT NULL DEFAULT '{}',
  pricing_info   TEXT,
  offer_text     TEXT,
  location       TEXT,
  bio            TEXT,
  base_currency  TEXT NOT NULL DEFAULT 'ZMW',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.lead_analysis (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id              UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL UNIQUE,
  summary              TEXT,
  opportunity_tags     TEXT[] DEFAULT '{}',
  recommended_platform message_channel,
  recommended_tone     TEXT,
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lead_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES public.users(id) NOT NULL,
  content     TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON public.message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_analysis_lead_id ON public.lead_analysis(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_id ON public.lead_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead_id ON public.lead_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_user_id ON public.lead_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_remind_at ON public.lead_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_status ON public.lead_reminders(status);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON public.saved_filters(user_id);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_select') THEN
    CREATE POLICY bp_select ON public.business_profiles FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_insert') THEN
    CREATE POLICY bp_insert ON public.business_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'bp_update') THEN
    CREATE POLICY bp_update ON public.business_profiles FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_select') THEN
    CREATE POLICY mt_select ON public.message_templates FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_insert') THEN
    CREATE POLICY mt_insert ON public.message_templates FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_update') THEN
    CREATE POLICY mt_update ON public.message_templates FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_templates' AND policyname = 'mt_delete') THEN
    CREATE POLICY mt_delete ON public.message_templates FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_analysis' AND policyname = 'la_select') THEN
    CREATE POLICY la_select ON public.lead_analysis FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_analysis' AND policyname = 'la_insert') THEN
    CREATE POLICY la_insert ON public.lead_analysis FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_select') THEN
    CREATE POLICY ln_select ON public.lead_notes FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_insert') THEN
    CREATE POLICY ln_insert ON public.lead_notes FOR INSERT WITH CHECK (
      user_id = auth.uid() AND
      EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_update') THEN
    CREATE POLICY ln_update ON public.lead_notes FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_notes' AND policyname = 'ln_delete') THEN
    CREATE POLICY ln_delete ON public.lead_notes FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_select') THEN
    CREATE POLICY lr_select ON public.lead_reminders FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_insert') THEN
    CREATE POLICY lr_insert ON public.lead_reminders FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_update') THEN
    CREATE POLICY lr_update ON public.lead_reminders FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_reminders' AND policyname = 'lr_delete') THEN
    CREATE POLICY lr_delete ON public.lead_reminders FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_select') THEN
    CREATE POLICY sf_select ON public.saved_filters FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_insert') THEN
    CREATE POLICY sf_insert ON public.saved_filters FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_update') THEN
    CREATE POLICY sf_update ON public.saved_filters FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_filters' AND policyname = 'sf_delete') THEN
    CREATE POLICY sf_delete ON public.saved_filters FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE TRIGGER business_profiles_updated_at BEFORE UPDATE ON public.business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER lead_notes_updated_at BEFORE UPDATE ON public.lead_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER saved_filters_updated_at BEFORE UPDATE ON public.saved_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
