-- =====================================================
-- Supabase Database Setup for Renovation Platform
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Add role column to auth.users table
-- =====================================================

-- Add role column to auth.users for role-based access control
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'contractor', 'admin'));

-- Create function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;
  
  -- Update the user role
  UPDATE auth.users 
  SET role = new_role 
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$;

-- =====================================================
-- 2. Create main tables
-- =====================================================

-- Quotes table - stores approved quote requests
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  space_type TEXT NOT NULL CHECK (space_type IN ('detached_house', 'town_house', 'condo', 'commercial')),
  project_types TEXT[] NOT NULL, -- Array of project types
  budget TEXT NOT NULL CHECK (budget IN ('under_50k', '50k_100k', 'over_100k')),
  timeline TEXT NOT NULL CHECK (timeline IN ('immediate', '1_month', '3_months', 'planning')),
  postal_code TEXT NOT NULL,
  full_address TEXT NOT NULL,
  visit_dates TEXT[] DEFAULT '{}',
  details JSONB NOT NULL DEFAULT '{}', -- Flexible details including description and photos
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Temporary quotes table - stores draft quote requests
CREATE TABLE IF NOT EXISTS temp_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  space_type TEXT CHECK (space_type IN ('detached_house', 'town_house', 'condo', 'commercial')),
  project_types TEXT[],
  budget TEXT CHECK (budget IN ('under_50k', '50k_100k', 'over_100k')),
  timeline TEXT CHECK (timeline IN ('immediate', '1_month', '3_months', 'planning')),
  postal_code TEXT,
  full_address TEXT,
  visit_dates TEXT[] DEFAULT '{}',
  details JSONB DEFAULT '{}',
  step INTEGER DEFAULT 1 CHECK (step BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contractors table - stores contractor profiles
CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  license_number TEXT,
  insurance_info TEXT,
  specialties JSONB DEFAULT '[]',
  years_experience INTEGER DEFAULT 0,
  portfolio_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolios table - stores contractor project photos and descriptions
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  space_type TEXT NOT NULL,
  budget_range TEXT,
  completion_date DATE,
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  thumbnail_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table - stores customer reviews for contractors
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID REFERENCES contractors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  photos JSONB DEFAULT '[]', -- Array of photo URLs
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contractor_id, customer_id, quote_id) -- One review per quote
);

-- Events table - stores admin-managed events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('workshop', 'seminar', 'showcase', 'other')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  address TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_required BOOLEAN DEFAULT TRUE,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  cover_image_url TEXT,
  details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_contractor_id ON quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_space_type ON quotes(space_type);
CREATE INDEX IF NOT EXISTS idx_quotes_budget ON quotes(budget);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_postal_code ON quotes(postal_code);

-- Temp quotes indexes
CREATE INDEX IF NOT EXISTS idx_temp_quotes_customer_id ON temp_quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_temp_quotes_session_id ON temp_quotes(session_id);

-- Pros indexes
CREATE INDEX IF NOT EXISTS idx_pros_user_id ON pros(user_id);
CREATE INDEX IF NOT EXISTS idx_pros_is_verified ON pros(is_verified);
CREATE INDEX IF NOT EXISTS idx_pros_is_active ON pros(is_active);
CREATE INDEX IF NOT EXISTS idx_pros_service_areas ON pros USING GIN(service_areas);
CREATE INDEX IF NOT EXISTS idx_pros_specialties ON pros USING GIN(specialties);

-- Portfolios indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_contractor_id ON portfolios(contractor_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_project_type ON portfolios(project_type);
CREATE INDEX IF NOT EXISTS idx_portfolios_space_type ON portfolios(space_type);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_featured ON portfolios(is_featured);
CREATE INDEX IF NOT EXISTS idx_portfolios_created_at ON portfolios(created_at);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_contractor_id ON reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_is_verified ON reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

-- =====================================================
-- 4. Create updated_at triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_temp_quotes_updated_at BEFORE UPDATE ON temp_quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pros_updated_at BEFORE UPDATE ON pros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Enable Row Level Security (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pros ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Create RLS Policies
-- =====================================================

-- Quotes policies
CREATE POLICY "Customers can view their own quotes" ON quotes
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Contractors can view quotes assigned to them" ON quotes
  FOR SELECT USING (auth.uid() = contractor_id);

CREATE POLICY "Admins can view all quotes" ON quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Customers can create quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update quotes" ON quotes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Temp quotes policies
CREATE POLICY "Users can manage their own temp quotes" ON temp_quotes
  FOR ALL USING (auth.uid() = customer_id OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all temp quotes" ON temp_quotes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Pros policies
CREATE POLICY "Contractors can view their own profile" ON pros
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified contractor profiles" ON pros
  FOR SELECT USING (is_verified = TRUE AND is_active = TRUE);

CREATE POLICY "Contractors can update their own profile" ON pros
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Contractors can insert their own profile" ON pros
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contractor profiles" ON pros
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Portfolios policies
CREATE POLICY "Contractors can manage their own portfolios" ON portfolios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pros 
      WHERE id = contractor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view portfolios" ON portfolios
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage all portfolios" ON portfolios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviews policies
CREATE POLICY "Customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own reviews" ON reviews
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Contractors can view reviews about them" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pros 
      WHERE id = contractor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view verified reviews" ON reviews
  FOR SELECT USING (is_verified = TRUE);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Events policies
CREATE POLICY "Public can view active events" ON events
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage all events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 7. Create Storage Bucket and Policies
-- =====================================================

-- Create project-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-photos bucket
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-photos');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 8. Create helper functions
-- =====================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role FROM auth.users 
    WHERE id = user_id
  );
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' FROM auth.users 
    WHERE id = user_id
  );
END;
$$;

-- Function to get contractor profile by user_id
CREATE OR REPLACE FUNCTION get_contractor_profile(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  is_verified BOOLEAN,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_name,
    p.contact_name,
    p.email,
    p.phone,
    p.is_verified,
    p.is_active
  FROM pros p
  WHERE p.user_id = get_contractor_profile.user_id;
END;
$$;

-- =====================================================
-- 9. Insert initial admin user (replace with actual admin email)
-- =====================================================

-- Note: This will create an admin user. Replace the email with your actual admin email.
-- The user will need to sign up normally first, then you can run this to make them admin.
-- 
-- INSERT INTO auth.users (id, email, role, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   uuid_generate_v4(),
--   'admin@yourdomain.com',
--   'admin',
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- =====================================================
-- Setup Complete!
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
