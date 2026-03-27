// types/index.ts — Shared types across the app

export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled'
export type TenantPlan = 'starter' | 'pro' | 'enterprise'
export type AgentStatus = 'draft' | 'pending_review' | 'approved' | 'live' | 'suspended'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
export type CallDirection = 'inbound' | 'outbound' | 'callback'
export type CallStatus = 'completed' | 'missed' | 'failed' | 'in_progress'
export type CallOutcome =
  | 'booked'
  | 'transferred'
  | 'message_taken'
  | 'info_provided'
  | 'after_hours_lead'
  | 'missed'
  | 'spam'
  | 'callback_requested'
  | 'urgent_escalated'
  | 'no_action'

export type Industry =
  | 'dental'
  | 'legal'
  | 'salon'
  | 'medical'
  | 'realestate'
  | 'plumbing'
  | 'vet'
  | 'restaurant'
  | 'hvac'
  | 'other'

export interface Tenant {
  id: string
  owner_id: string
  business_name: string
  industry: Industry | null
  status: TenantStatus
  plan: TenantPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  tenant_id: string
  website_url: string | null
  tagline: string | null
  description: string | null
  address: string | null
  city: string | null
  country: string | null
  timezone: string
  email: string | null
  phone: string | null
  escalation_phone: string | null
  hours_confirmed: boolean
  scraped_at: string | null
  confirmed_at: string | null
}

export interface AvailabilitySchedule {
  id: string
  tenant_id: string
  day_of_week: number // 0=Sun, 6=Sat
  is_open: boolean
  open_time: string  // HH:MM
  close_time: string // HH:MM
}

export interface ServiceType {
  id: string
  tenant_id: string
  name: string
  description: string | null
  duration_mins: number
  buffer_mins: number
  max_per_day: number | null
  is_active: boolean
}

export interface Booking {
  id: string
  tenant_id: string
  call_id: string | null
  service_type_id: string | null
  caller_name: string | null
  caller_phone: string | null
  caller_email: string | null
  start_time: string
  end_time: string
  timezone: string
  status: BookingStatus
  notes: string | null
  booked_by: 'agent' | 'manual' | 'system'
  confirmed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  // Joined
  service_types?: ServiceType | null
}

export interface Call {
  id: string
  tenant_id: string
  retell_call_id: string | null
  phone_number_id: string | null
  direction: CallDirection
  caller_phone: string | null
  duration_secs: number | null
  status: CallStatus
  transcript: string | null
  summary: string | null
  recording_url: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  // Joined
  call_outcomes?: CallOutcomeRecord[]
}

export interface CallOutcomeRecord {
  id: string
  call_id: string
  tenant_id: string
  outcome: CallOutcome
  booking_id: string | null
  notes: string | null
}

export interface RetellAgent {
  id: string
  tenant_id: string
  retell_agent_id: string | null
  name: string | null
  voice_id: string
  status: AgentStatus
  vertical_pack: string | null
  current_prompt: string | null
  compiled_at: string | null
  approved_at: string | null
  went_live_at: string | null
}

export interface PhoneNumber {
  id: string
  tenant_id: string | null
  number: string
  friendly_name: string | null
  country_code: string
  provider: string
  twilio_sid: string | null
  status: 'active' | 'suspended' | 'released'
  monthly_cost_usd: number
}

export interface ProvisioningJob {
  id: string
  tenant_id: string
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back'
  payload: Record<string, any> | null
  result: Record<string, any> | null
  error: string | null
  attempts: number
  created_at: string
  completed_at: string | null
}

// Scraped business info from Firecrawl + AI extraction
export interface ScrapedBusinessInfo {
  name: string
  industry: Industry | ''
  description: string
  hours: string
  services: string
  phone: string
  address: string
  escalation_phone: string
}
