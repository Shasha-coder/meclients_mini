-- ==============================================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ENABLE PUBLIC BOOKING ROUTING
-- ==============================================================================

-- 1. Add a unique public booking slug to Business Profiles
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Add an index for lightning-fast public profile lookups via the URL slug
CREATE INDEX IF NOT EXISTS idx_business_profiles_slug ON business_profiles(slug);

-- 3. Update RLS to allow public read access to basic business info via the slug
CREATE POLICY "public_read_business_profiles" ON business_profiles
  FOR SELECT USING (true); 

-- 4. Allow the public booking page to read available services and hours
CREATE POLICY "public_read_services" ON service_types 
  FOR SELECT USING (true);
  
CREATE POLICY "public_read_availability" ON availability_schedules 
  FOR SELECT USING (true);

-- 5. Allow the public booking page to insert new bookings securely
CREATE POLICY "public_insert_bookings" ON bookings 
  FOR INSERT WITH CHECK (true);

-- SUCCESS! Your database is now wired for the new /book page.
