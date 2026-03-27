-- Migration: Add tables for agent provisioning and OTP verification
-- Run this in Supabase SQL Editor

-- 1. Add columns to businesses table for agent data
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS scraped_data JSONB,
ADD COLUMN IF NOT EXISTS analysis_result JSONB,
ADD COLUMN IF NOT EXISTS retell_agent_id TEXT,
ADD COLUMN IF NOT EXISTS retell_llm_id TEXT,
ADD COLUMN IF NOT EXISTS twilio_sip_trunk_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_sid TEXT,
ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS agent_voice TEXT DEFAULT 'James',
ADD COLUMN IF NOT EXISTS agent_language TEXT DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS notification_method TEXT DEFAULT 'email',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS provisioned_at TIMESTAMPTZ;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_businesses_retell_agent ON businesses(retell_agent_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(agent_status);

-- 3. Create call_logs table for tracking AI calls
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  retell_call_id TEXT UNIQUE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  caller_number TEXT,
  callee_number TEXT,
  duration_seconds INT,
  status TEXT DEFAULT 'pending',
  transcript JSONB,
  summary TEXT,
  sentiment TEXT,
  action_items JSONB,
  recording_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create appointments table for CRUD by AI agent
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  service_type TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_by TEXT DEFAULT 'ai_agent',
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create callback_requests table for outbound calls
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  reason TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'calling', 'completed', 'failed')),
  scheduled_for TIMESTAMPTZ,
  called_at TIMESTAMPTZ,
  call_log_id UUID REFERENCES call_logs(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create usage_tracking table for billing
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_calls INT DEFAULT 0,
  total_minutes DECIMAL(10,2) DEFAULT 0,
  inbound_calls INT DEFAULT 0,
  outbound_calls INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  retell_cost DECIMAL(10,4) DEFAULT 0,
  twilio_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, period_start, period_end)
);

-- 7. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_callback_requests_status ON callback_requests(status);

-- 8. Enable Row Level Security
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies (business owners can only see their own data)
CREATE POLICY "Users can view own call_logs" ON call_logs
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own appointments" ON appointments
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own callbacks" ON callback_requests
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Service role policies for API access
CREATE POLICY "Service role full access call_logs" ON call_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access appointments" ON appointments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access callbacks" ON callback_requests
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- 10. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Trigger for appointments updated_at
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE call_logs IS 'Stores all AI call records with transcripts and summaries';
COMMENT ON TABLE appointments IS 'Appointments managed by the AI receptionist';
COMMENT ON TABLE callback_requests IS 'Queue for outbound calls triggered by cron or user request';
COMMENT ON TABLE usage_tracking IS 'Monthly usage metrics for billing calculations';
