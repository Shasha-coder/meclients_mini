-- ============================================================
-- MECLIENTS — FULL DATABASE SCHEMA v1.0
-- Paste entire file into Supabase SQL Editor and Run
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TENANTS (one per business / paying client)
-- ============================================================
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name       TEXT NOT NULL,
  industry            TEXT, -- dental, legal, salon, etc.
  status              TEXT NOT NULL DEFAULT 'trial'
                      CHECK (status IN ('trial','active','past_due','suspended','cancelled')),
  plan                TEXT NOT NULL DEFAULT 'starter'
                      CHECK (plan IN ('starter','pro','enterprise')),
  stripe_customer_id  TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_ends_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. BUSINESS PROFILES (scraped + confirmed business info)
-- ============================================================
CREATE TABLE business_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  website_url         TEXT,
  tagline             TEXT,
  description         TEXT,
  address             TEXT,
  city                TEXT,
  country             TEXT,
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  email               TEXT,
  phone               TEXT,         -- their existing phone (for forwarding instructions)
  escalation_phone    TEXT,         -- urgent calls transfer here
  hours_confirmed     BOOLEAN DEFAULT FALSE,
  scraped_at          TIMESTAMPTZ,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. KNOWLEDGE SOURCES (URLs, PDFs fed to agent)
-- ============================================================
CREATE TABLE knowledge_sources (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('url','pdf','text','faq')),
  label         TEXT,
  source_url    TEXT,
  raw_text      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','ready','failed')),
  confidence    NUMERIC(3,2),       -- 0.00 to 1.00
  last_synced_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. AVAILABILITY SCHEDULES (business hours per day)
-- ============================================================
CREATE TABLE availability_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  is_open       BOOLEAN DEFAULT TRUE,
  open_time     TIME NOT NULL DEFAULT '09:00',
  close_time    TIME NOT NULL DEFAULT '17:00',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, day_of_week)
);

-- ============================================================
-- 5. SERVICE TYPES (what the business offers + slot duration)
-- ============================================================
CREATE TABLE service_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  duration_mins   INT NOT NULL DEFAULT 30,
  buffer_mins     INT NOT NULL DEFAULT 10,
  max_per_day     INT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. BOOKINGS (quick booking — no third-party calendar)
-- ============================================================
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  call_id         UUID,             -- linked to calls table if booked during call
  service_type_id UUID REFERENCES service_types(id) ON DELETE SET NULL,
  caller_name     TEXT,
  caller_phone    TEXT,
  caller_email    TEXT,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  notes           TEXT,
  booked_by       TEXT DEFAULT 'agent' CHECK (booked_by IN ('agent','manual','system')),
  confirmed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. PHONE NUMBERS (provisioned Twilio numbers)
-- ============================================================
CREATE TABLE phone_numbers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE SET NULL,
  number              TEXT NOT NULL UNIQUE,
  friendly_name       TEXT,
  country_code        TEXT DEFAULT 'US',
  provider            TEXT DEFAULT 'twilio',
  twilio_sid          TEXT UNIQUE,
  twilio_subaccount_sid TEXT,
  sip_trunk_sid       TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','suspended','released')),
  monthly_cost_usd    NUMERIC(8,4) DEFAULT 1.15,
  assigned_at         TIMESTAMPTZ DEFAULT NOW(),
  released_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. RETELL AGENTS (AI agent config + prompt versions)
-- ============================================================
CREATE TABLE retell_agents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  retell_agent_id     TEXT UNIQUE,
  name                TEXT,
  voice_id            TEXT DEFAULT 'eleven_labs_default',
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','pending_review','approved','live','suspended')),
  vertical_pack       TEXT,         -- dental, legal, salon, etc.
  current_prompt      TEXT,
  compiled_at         TIMESTAMPTZ,
  approved_at         TIMESTAMPTZ,
  approved_by         UUID,         -- admin user id
  went_live_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. PROMPT VERSIONS (history of every agent prompt)
-- ============================================================
CREATE TABLE prompt_versions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id      UUID NOT NULL REFERENCES retell_agents(id) ON DELETE CASCADE,
  version       INT NOT NULL DEFAULT 1,
  prompt        TEXT NOT NULL,
  change_reason TEXT,
  created_by    UUID,               -- admin or system
  is_active     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. PROVISIONING JOBS (durable state machine A→Z)
-- ============================================================
CREATE TABLE provisioning_jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  step          TEXT NOT NULL,      -- scrape, create_agent, payment, provision_number, activate
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','completed','failed','rolled_back')),
  payload       JSONB,
  result        JSONB,
  error         TEXT,
  attempts      INT DEFAULT 0,
  max_attempts  INT DEFAULT 3,
  idempotency_key TEXT UNIQUE,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. CALLS (every inbound/outbound call log)
-- ============================================================
CREATE TABLE calls (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  retell_call_id      TEXT UNIQUE,
  phone_number_id     UUID REFERENCES phone_numbers(id) ON DELETE SET NULL,
  direction           TEXT NOT NULL DEFAULT 'inbound'
                      CHECK (direction IN ('inbound','outbound','callback')),
  caller_phone        TEXT,
  duration_secs       INT,
  status              TEXT NOT NULL DEFAULT 'completed'
                      CHECK (status IN ('completed','missed','failed','in_progress')),
  transcript          TEXT,
  summary             TEXT,
  recording_url       TEXT,
  started_at          TIMESTAMPTZ,
  ended_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. CALL OUTCOMES (normalized — powers ROI reporting)
-- ============================================================
CREATE TABLE call_outcomes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id       UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outcome       TEXT NOT NULL
                CHECK (outcome IN (
                  'booked','transferred','message_taken','info_provided',
                  'after_hours_lead','missed','spam','callback_requested',
                  'urgent_escalated','no_action'
                )),
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SUBSCRIPTIONS / ENTITLEMENTS
-- ============================================================
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  stripe_price_id         TEXT,
  plan                    TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('trialing','active','past_due','cancelled','paused')),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at               TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. WEBHOOK EVENTS (idempotency — Stripe, Twilio, Retell)
-- ============================================================
CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source          TEXT NOT NULL CHECK (source IN ('stripe','twilio','retell')),
  event_type      TEXT NOT NULL,
  event_id        TEXT NOT NULL,    -- provider's own event ID
  payload         JSONB,
  processed       BOOLEAN DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, event_id)
);

-- ============================================================
-- 15. ADMIN USERS (internal team only)
-- ============================================================
CREATE TABLE admin_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'reviewer'
              CHECK (role IN ('super_admin','reviewer','support')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. AUDIT LOGS (critical events trail)
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id    UUID,                 -- admin or owner user id
  actor_type  TEXT CHECK (actor_type IN ('admin','owner','system')),
  action      TEXT NOT NULL,        -- e.g. 'agent.approved', 'number.provisioned'
  entity_type TEXT,                 -- 'agent', 'booking', 'tenant', etc.
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES (performance)
-- ============================================================
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_business_profiles_tenant ON business_profiles(tenant_id);
CREATE INDEX idx_knowledge_sources_tenant ON knowledge_sources(tenant_id);
CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_calls_tenant ON calls(tenant_id);
CREATE INDEX idx_calls_retell_id ON calls(retell_call_id);
CREATE INDEX idx_call_outcomes_tenant ON call_outcomes(tenant_id);
CREATE INDEX idx_call_outcomes_outcome ON call_outcomes(outcome);
CREATE INDEX idx_provisioning_jobs_tenant ON provisioning_jobs(tenant_id);
CREATE INDEX idx_provisioning_jobs_status ON provisioning_jobs(status);
CREATE INDEX idx_webhook_events_source ON webhook_events(source, event_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_retell_agents_updated_at
  BEFORE UPDATE ON retell_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE TENANT PROFILE ON SIGNUP (Supabase Auth trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenants (owner_id, business_name, status)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 'trial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retell_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenants: owner sees only their own
CREATE POLICY "owner_select_tenant" ON tenants
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "owner_update_tenant" ON tenants
  FOR UPDATE USING (owner_id = auth.uid());

-- All tenant-scoped tables: helper function
CREATE OR REPLACE FUNCTION get_tenant_id_for_user()
RETURNS UUID AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Business profiles
CREATE POLICY "owner_all_business_profiles" ON business_profiles
  FOR ALL USING (tenant_id = get_tenant_id_for_user());

-- Knowledge sources
CREATE POLICY "owner_all_knowledge_sources" ON knowledge_sources
  FOR ALL USING (tenant_id = get_tenant_id_for_user());

-- Availability
CREATE POLICY "owner_all_availability" ON availability_schedules
  FOR ALL USING (tenant_id = get_tenant_id_for_user());

-- Service types
CREATE POLICY "owner_all_service_types" ON service_types
  FOR ALL USING (tenant_id = get_tenant_id_for_user());

-- Bookings
CREATE POLICY "owner_all_bookings" ON bookings
  FOR ALL USING (tenant_id = get_tenant_id_for_user());

-- Phone numbers
CREATE POLICY "owner_select_phone_numbers" ON phone_numbers
  FOR SELECT USING (tenant_id = get_tenant_id_for_user());

-- Retell agents
CREATE POLICY "owner_select_agents" ON retell_agents
  FOR SELECT USING (tenant_id = get_tenant_id_for_user());

-- Calls
CREATE POLICY "owner_select_calls" ON calls
  FOR SELECT USING (tenant_id = get_tenant_id_for_user());

-- Call outcomes
CREATE POLICY "owner_select_outcomes" ON call_outcomes
  FOR SELECT USING (tenant_id = get_tenant_id_for_user());

-- Subscriptions
CREATE POLICY "owner_select_subscriptions" ON subscriptions
  FOR SELECT USING (tenant_id = get_tenant_id_for_user());

-- ============================================================
-- DONE. 16 tables. Run this and confirm all green.
-- ============================================================
