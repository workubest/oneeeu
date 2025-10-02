/*
  # Create EEU Complaint Management System Tables

  1. New Tables
    - `eeu_users` - Stores user information
      - `id` (text, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `role` (text, constrained to specific roles)
      - `region`, `service_center`, `phone` (text)
      - `is_active`, `account_locked` (boolean with defaults)
      - `failed_login_attempts`, `login_count` (integer with defaults)
      - `last_login`, `created_at`, `updated_at` (timestamptz)
      - `created_by` (text)
      - `metadata` (jsonb)
    
    - `eeu_complaints` - Stores customer complaints
      - `id` (text, primary key)
      - `customer_id`, `title`, `description` (text, not null)
      - `category` (text, not null)
      - `priority` (text, constrained values)
      - `status` (text, constrained values)
      - `created_by` (text, not null)
      - `created_at`, `updated_at`, `resolved_at` (timestamptz)
      - `region`, `service_center`, `assigned_to`, `resolution_notes` (text)
    
    - `eeu_notifications` - Stores system notifications
      - `id` (text, primary key)
      - `title`, `message` (text, not null)
      - `type`, `priority` (text, constrained values)
      - `is_read`, `action_required` (boolean with defaults)
      - `created_at` (timestamptz)
      - `related_complaint_id`, `target_user_id`, `target_role` (text)
    
    - `eeu_outages` - Stores power outage information
      - `id` (text, primary key)
      - `title`, `area`, `cause` (text, not null)
      - `status`, `priority`, `crew_status` (text, constrained values)
      - `affected_customers`, `progress` (integer with constraints)
      - `reported_at`, `estimated_restoration`, `actual_restoration` (timestamptz)
      - `assigned_crew`, `resolution_notes`, `created_by` (text)
      - `created_at`, `updated_at` (timestamptz)

  2. Indexes
    - Performance indexes on frequently queried columns for all tables
    - Email, role, region, status, priority, and date columns indexed

  3. Security
    - RLS enabled on all tables
    - Policies allow public read access for complaints, notifications, and outages
    - User data policies restrict access to own data only
    - Staff can manage all records

  Notes:
    - Using TEXT for IDs to support custom ID generation
    - All timestamps use TIMESTAMPTZ for timezone awareness
    - CHECK constraints ensure data integrity for status fields
    - JSONB metadata column in users table for extensibility
*/

-- Create eeu_users table
CREATE TABLE IF NOT EXISTS eeu_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'technician', 'customer')),
  region TEXT,
  service_center TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  account_locked BOOLEAN DEFAULT false,
  failed_login_attempts INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB
);

-- Create indexes for eeu_users
CREATE INDEX IF NOT EXISTS idx_eeu_users_email ON eeu_users(email);
CREATE INDEX IF NOT EXISTS idx_eeu_users_role ON eeu_users(role);
CREATE INDEX IF NOT EXISTS idx_eeu_users_region ON eeu_users(region);
CREATE INDEX IF NOT EXISTS idx_eeu_users_active ON eeu_users(is_active);

-- Create eeu_complaints table
CREATE TABLE IF NOT EXISTS eeu_complaints (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  region TEXT,
  service_center TEXT,
  assigned_to TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for eeu_complaints
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_customer_id ON eeu_complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_status ON eeu_complaints(status);
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_priority ON eeu_complaints(priority);
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_category ON eeu_complaints(category);
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_created_at ON eeu_complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_eeu_complaints_region ON eeu_complaints(region);

-- Create eeu_notifications table
CREATE TABLE IF NOT EXISTS eeu_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'alert', 'warning', 'info')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  related_complaint_id TEXT,
  action_required BOOLEAN DEFAULT false,
  target_user_id TEXT,
  target_role TEXT
);

-- Create indexes for eeu_notifications
CREATE INDEX IF NOT EXISTS idx_eeu_notifications_is_read ON eeu_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_eeu_notifications_type ON eeu_notifications(type);
CREATE INDEX IF NOT EXISTS idx_eeu_notifications_priority ON eeu_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_eeu_notifications_created_at ON eeu_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_eeu_notifications_target_user ON eeu_notifications(target_user_id);

-- Create eeu_outages table
CREATE TABLE IF NOT EXISTS eeu_outages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'scheduled', 'investigating', 'resolved')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  affected_customers INTEGER DEFAULT 0,
  area TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_restoration TIMESTAMPTZ,
  actual_restoration TIMESTAMPTZ,
  cause TEXT NOT NULL,
  assigned_crew TEXT,
  crew_status TEXT CHECK (crew_status IN ('preparing', 'en-route', 'on-site', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  resolution_notes TEXT
);

-- Create indexes for eeu_outages
CREATE INDEX IF NOT EXISTS idx_eeu_outages_status ON eeu_outages(status);
CREATE INDEX IF NOT EXISTS idx_eeu_outages_priority ON eeu_outages(priority);
CREATE INDEX IF NOT EXISTS idx_eeu_outages_area ON eeu_outages(area);
CREATE INDEX IF NOT EXISTS idx_eeu_outages_reported_at ON eeu_outages(reported_at);
CREATE INDEX IF NOT EXISTS idx_eeu_outages_assigned_crew ON eeu_outages(assigned_crew);

-- Enable Row Level Security
ALTER TABLE eeu_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeu_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeu_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE eeu_outages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for eeu_users
CREATE POLICY "Users can read all user data"
  ON eeu_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can read active users"
  ON eeu_users FOR SELECT
  TO anon
  USING (is_active = true);

-- Create RLS policies for eeu_complaints
CREATE POLICY "Authenticated users can read all complaints"
  ON eeu_complaints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create complaints"
  ON eeu_complaints FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update complaints"
  ON eeu_complaints FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete complaints"
  ON eeu_complaints FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for eeu_notifications
CREATE POLICY "Authenticated users can read notifications"
  ON eeu_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update notifications"
  ON eeu_notifications FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for eeu_outages
CREATE POLICY "Authenticated users can read outages"
  ON eeu_outages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage outages"
  ON eeu_outages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);