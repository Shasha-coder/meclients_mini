export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: { id: string; email: string; name: string | null; role: string; is_active: boolean | null; created_at: string | null }
        Insert: { id: string; email: string; name?: string | null; role?: string; is_active?: boolean | null; created_at?: string | null }
        Update: { id?: string; email?: string; name?: string | null; role?: string; is_active?: boolean | null; created_at?: string | null }
      }
      audit_logs: {
        Row: { id: string; tenant_id: string | null; actor_id: string | null; actor_type: string | null; action: string; entity_type: string | null; entity_id: string | null; metadata: Json | null; created_at: string | null }
        Insert: { id?: string; tenant_id?: string | null; actor_id?: string | null; actor_type?: string | null; action: string; entity_type?: string | null; entity_id?: string | null; metadata?: Json | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string | null; actor_id?: string | null; actor_type?: string | null; action?: string; entity_type?: string | null; entity_id?: string | null; metadata?: Json | null; created_at?: string | null }
      }
      availability_schedules: {
        Row: { id: string; tenant_id: string; day_of_week: number; is_open: boolean | null; open_time: string; close_time: string; created_at: string | null }
        Insert: { id?: string; tenant_id: string; day_of_week: number; is_open?: boolean | null; open_time?: string; close_time?: string; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; day_of_week?: number; is_open?: boolean | null; open_time?: string; close_time?: string; created_at?: string | null }
      }
      bookings: {
        Row: { id: string; tenant_id: string; call_id: string | null; service_type_id: string | null; caller_name: string | null; caller_phone: string | null; caller_email: string | null; start_time: string; end_time: string; timezone: string; status: string; notes: string | null; booked_by: string | null; confirmed_at: string | null; cancelled_at: string | null; cancel_reason: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; tenant_id: string; call_id?: string | null; service_type_id?: string | null; caller_name?: string | null; caller_phone?: string | null; caller_email?: string | null; start_time: string; end_time: string; timezone?: string; status?: string; notes?: string | null; booked_by?: string | null; confirmed_at?: string | null; cancelled_at?: string | null; cancel_reason?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; tenant_id?: string; call_id?: string | null; service_type_id?: string | null; caller_name?: string | null; caller_phone?: string | null; caller_email?: string | null; start_time?: string; end_time?: string; timezone?: string; status?: string; notes?: string | null; booked_by?: string | null; confirmed_at?: string | null; cancelled_at?: string | null; cancel_reason?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      business_profiles: {
        Row: { id: string; tenant_id: string; slug: string | null; website_url: string | null; tagline: string | null; description: string | null; address: string | null; city: string | null; country: string | null; timezone: string; email: string | null; phone: string | null; escalation_phone: string | null; hours_confirmed: boolean | null; scraped_at: string | null; confirmed_at: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; tenant_id: string; slug?: string | null; website_url?: string | null; tagline?: string | null; description?: string | null; address?: string | null; city?: string | null; country?: string | null; timezone?: string; email?: string | null; phone?: string | null; escalation_phone?: string | null; hours_confirmed?: boolean | null; scraped_at?: string | null; confirmed_at?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; tenant_id?: string; slug?: string | null; website_url?: string | null; tagline?: string | null; description?: string | null; address?: string | null; city?: string | null; country?: string | null; timezone?: string; email?: string | null; phone?: string | null; escalation_phone?: string | null; hours_confirmed?: boolean | null; scraped_at?: string | null; confirmed_at?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      call_outcomes: {
        Row: { id: string; call_id: string; tenant_id: string; outcome: string; booking_id: string | null; notes: string | null; created_at: string | null }
        Insert: { id?: string; call_id: string; tenant_id: string; outcome: string; booking_id?: string | null; notes?: string | null; created_at?: string | null }
        Update: { id?: string; call_id?: string; tenant_id?: string; outcome?: string; booking_id?: string | null; notes?: string | null; created_at?: string | null }
      }
      calls: {
        Row: { id: string; tenant_id: string; retell_call_id: string | null; phone_number_id: string | null; direction: string; caller_phone: string | null; duration_secs: number | null; status: string; transcript: string | null; summary: string | null; recording_url: string | null; started_at: string | null; ended_at: string | null; created_at: string | null }
        Insert: { id?: string; tenant_id: string; retell_call_id?: string | null; phone_number_id?: string | null; direction?: string; caller_phone?: string | null; duration_secs?: number | null; status?: string; transcript?: string | null; summary?: string | null; recording_url?: string | null; started_at?: string | null; ended_at?: string | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; retell_call_id?: string | null; phone_number_id?: string | null; direction?: string; caller_phone?: string | null; duration_secs?: number | null; status?: string; transcript?: string | null; summary?: string | null; recording_url?: string | null; started_at?: string | null; ended_at?: string | null; created_at?: string | null }
      }
      knowledge_sources: {
        Row: { id: string; tenant_id: string; type: string; label: string | null; source_url: string | null; raw_text: string | null; status: string; confidence: number | null; last_synced_at: string | null; created_at: string | null }
        Insert: { id?: string; tenant_id: string; type: string; label?: string | null; source_url?: string | null; raw_text?: string | null; status?: string; confidence?: number | null; last_synced_at?: string | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; type?: string; label?: string | null; source_url?: string | null; raw_text?: string | null; status?: string; confidence?: number | null; last_synced_at?: string | null; created_at?: string | null }
      }
      phone_numbers: {
        Row: { id: string; tenant_id: string | null; number: string; friendly_name: string | null; country_code: string | null; provider: string | null; twilio_sid: string | null; twilio_subaccount_sid: string | null; sip_trunk_sid: string | null; status: string; monthly_cost_usd: number | null; assigned_at: string | null; released_at: string | null; created_at: string | null }
        Insert: { id?: string; tenant_id?: string | null; number: string; friendly_name?: string | null; country_code?: string | null; provider?: string | null; twilio_sid?: string | null; twilio_subaccount_sid?: string | null; sip_trunk_sid?: string | null; status?: string; monthly_cost_usd?: number | null; assigned_at?: string | null; released_at?: string | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string | null; number?: string; friendly_name?: string | null; country_code?: string | null; provider?: string | null; twilio_sid?: string | null; twilio_subaccount_sid?: string | null; sip_trunk_sid?: string | null; status?: string; monthly_cost_usd?: number | null; assigned_at?: string | null; released_at?: string | null; created_at?: string | null }
      }
      prompt_versions: {
        Row: { id: string; tenant_id: string; agent_id: string; version: number; prompt: string; change_reason: string | null; created_by: string | null; is_active: boolean | null; created_at: string | null }
        Insert: { id?: string; tenant_id: string; agent_id: string; version?: number; prompt: string; change_reason?: string | null; created_by?: string | null; is_active?: boolean | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; agent_id?: string; version?: number; prompt?: string; change_reason?: string | null; created_by?: string | null; is_active?: boolean | null; created_at?: string | null }
      }
      provisioning_jobs: {
        Row: { id: string; tenant_id: string; step: string; status: string; payload: Json | null; result: Json | null; error: string | null; attempts: number | null; max_attempts: number | null; idempotency_key: string | null; started_at: string | null; completed_at: string | null; created_at: string | null }
        Insert: { id?: string; tenant_id: string; step: string; status?: string; payload?: Json | null; result?: Json | null; error?: string | null; attempts?: number | null; max_attempts?: number | null; idempotency_key?: string | null; started_at?: string | null; completed_at?: string | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; step?: string; status?: string; payload?: Json | null; result?: Json | null; error?: string | null; attempts?: number | null; max_attempts?: number | null; idempotency_key?: string | null; started_at?: string | null; completed_at?: string | null; created_at?: string | null }
      }
      retell_agents: {
        Row: { id: string; tenant_id: string; retell_agent_id: string | null; name: string | null; voice_id: string | null; status: string; vertical_pack: string | null; current_prompt: string | null; compiled_at: string | null; approved_at: string | null; approved_by: string | null; went_live_at: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; tenant_id: string; retell_agent_id?: string | null; name?: string | null; voice_id?: string | null; status?: string; vertical_pack?: string | null; current_prompt?: string | null; compiled_at?: string | null; approved_at?: string | null; approved_by?: string | null; went_live_at?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; tenant_id?: string; retell_agent_id?: string | null; name?: string | null; voice_id?: string | null; status?: string; vertical_pack?: string | null; current_prompt?: string | null; compiled_at?: string | null; approved_at?: string | null; approved_by?: string | null; went_live_at?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      service_types: {
        Row: { id: string; tenant_id: string; name: string; description: string | null; duration_mins: number; buffer_mins: number; max_per_day: number | null; is_active: boolean | null; created_at: string | null }
        Insert: { id?: string; tenant_id: string; name: string; description?: string | null; duration_mins?: number; buffer_mins?: number; max_per_day?: number | null; is_active?: boolean | null; created_at?: string | null }
        Update: { id?: string; tenant_id?: string; name?: string; description?: string | null; duration_mins?: number; buffer_mins?: number; max_per_day?: number | null; is_active?: boolean | null; created_at?: string | null }
      }
      subscriptions: {
        Row: { id: string; tenant_id: string; stripe_subscription_id: string | null; stripe_price_id: string | null; plan: string; status: string; current_period_start: string | null; current_period_end: string | null; cancel_at: string | null; cancelled_at: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; tenant_id: string; stripe_subscription_id?: string | null; stripe_price_id?: string | null; plan: string; status?: string; current_period_start?: string | null; current_period_end?: string | null; cancel_at?: string | null; cancelled_at?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; tenant_id?: string; stripe_subscription_id?: string | null; stripe_price_id?: string | null; plan?: string; status?: string; current_period_start?: string | null; current_period_end?: string | null; cancel_at?: string | null; cancelled_at?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      tenants: {
        Row: { id: string; owner_id: string | null; business_name: string; industry: string | null; status: string; plan: string; stripe_customer_id: string | null; stripe_subscription_id: string | null; trial_ends_at: string | null; created_at: string | null; updated_at: string | null }
        Insert: { id?: string; owner_id?: string | null; business_name: string; industry?: string | null; status?: string; plan?: string; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; trial_ends_at?: string | null; created_at?: string | null; updated_at?: string | null }
        Update: { id?: string; owner_id?: string | null; business_name?: string; industry?: string | null; status?: string; plan?: string; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; trial_ends_at?: string | null; created_at?: string | null; updated_at?: string | null }
      }
      webhook_events: {
        Row: { id: string; source: string; event_type: string; event_id: string; payload: Json | null; processed: boolean | null; processed_at: string | null; error: string | null; created_at: string | null }
        Insert: { id?: string; source: string; event_type: string; event_id: string; payload?: Json | null; processed?: boolean | null; processed_at?: string | null; error?: string | null; created_at?: string | null }
        Update: { id?: string; source?: string; event_type?: string; event_id?: string; payload?: Json | null; processed?: boolean | null; processed_at?: string | null; error?: string | null; created_at?: string | null }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
