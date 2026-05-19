-- ============================================================
-- Migration 001: Initial Schema
-- ============================================================
-- Run this in Supabase SQL Editor for a fresh installation.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'agent');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE message_channel AS ENUM ('email', 'sms', 'whatsapp', 'linkedin');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE lead_source_platform AS ENUM ('google', 'facebook', 'manual');

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
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE public.campaign_leads (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id     UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

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

CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
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

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_read ON public.users FOR SELECT USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY users_insert ON public.users FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY users_update ON public.users FOR UPDATE USING (
  id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

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

CREATE POLICY campaign_leads_select ON public.campaign_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY campaign_leads_insert ON public.campaign_leads FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY campaign_leads_delete ON public.campaign_leads FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND (c.created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY messages_select ON public.messages FOR SELECT USING (
  sent_by = auth.uid() OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND (l.assigned_to = auth.uid() OR l.created_by = auth.uid()))
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY messages_insert ON public.messages FOR INSERT WITH CHECK (sent_by = auth.uid());

CREATE POLICY activities_select ON public.activities FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY activities_insert ON public.activities FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY api_keys_select ON public.api_keys FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY api_keys_insert ON public.api_keys FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY api_keys_update ON public.api_keys FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY api_keys_delete ON public.api_keys FOR DELETE USING (user_id = auth.uid());

CREATE POLICY webhooks_select ON public.webhooks FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY webhooks_insert ON public.webhooks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY webhooks_update ON public.webhooks FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY webhooks_delete ON public.webhooks FOR DELETE USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());

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
