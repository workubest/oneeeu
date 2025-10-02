# EEU Complaint Management System - Supabase Database Setup

## Required Database Tables

To complete the migration from KV store to live Supabase database, you need to create the following tables in your Supabase project:

### 1. Users Table (`eeu_users`)

```sql
CREATE TABLE eeu_users (
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

-- Create indexes for better performance
CREATE INDEX idx_eeu_users_email ON eeu_users(email);
CREATE INDEX idx_eeu_users_role ON eeu_users(role);
CREATE INDEX idx_eeu_users_region ON eeu_users(region);
CREATE INDEX idx_eeu_users_active ON eeu_users(is_active);
```

### 2. Complaints Table (`eeu_complaints`)

```sql
CREATE TABLE eeu_complaints (
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

-- Create indexes for better performance
CREATE INDEX idx_eeu_complaints_customer_id ON eeu_complaints(customer_id);
CREATE INDEX idx_eeu_complaints_status ON eeu_complaints(status);
CREATE INDEX idx_eeu_complaints_priority ON eeu_complaints(priority);
CREATE INDEX idx_eeu_complaints_category ON eeu_complaints(category);
CREATE INDEX idx_eeu_complaints_created_at ON eeu_complaints(created_at);
CREATE INDEX idx_eeu_complaints_region ON eeu_complaints(region);
```

### 3. Notifications Table (`eeu_notifications`)

```sql
CREATE TABLE eeu_notifications (
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

-- Create indexes for better performance
CREATE INDEX idx_eeu_notifications_is_read ON eeu_notifications(is_read);
CREATE INDEX idx_eeu_notifications_type ON eeu_notifications(type);
CREATE INDEX idx_eeu_notifications_priority ON eeu_notifications(priority);
CREATE INDEX idx_eeu_notifications_created_at ON eeu_notifications(created_at);
CREATE INDEX idx_eeu_notifications_target_user ON eeu_notifications(target_user_id);
```

### 4. Outages Table (`eeu_outages`)

```sql
CREATE TABLE eeu_outages (
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

-- Create indexes for better performance
CREATE INDEX idx_eeu_outages_status ON eeu_outages(status);
CREATE INDEX idx_eeu_outages_priority ON eeu_outages(priority);
CREATE INDEX idx_eeu_outages_area ON eeu_outages(area);
CREATE INDEX idx_eeu_outages_reported_at ON eeu_outages(reported_at);
CREATE INDEX idx_eeu_outages_assigned_crew ON eeu_outages(assigned_crew);
```

## Setup Instructions

1. **Open your Supabase project dashboard**
   - Go to https://supabase.com
   - Navigate to your project

2. **Access the SQL Editor**
   - Go to the "SQL Editor" tab in the left sidebar
   - Create a new query

3. **Run the table creation scripts**
   - Copy and paste each table creation script above
   - Run them one by one to create the tables
   - Verify that all tables were created successfully

4. **Enable Row Level Security (Optional but Recommended)**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE eeu_users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE eeu_complaints ENABLE ROW LEVEL SECURITY;
   ALTER TABLE eeu_notifications ENABLE ROW LEVEL SECURITY;
   ALTER TABLE eeu_outages ENABLE ROW LEVEL SECURITY;

   -- Create basic policies (adjust based on your security requirements)
   -- Users can read their own data
   CREATE POLICY "Users can read own data" ON eeu_users FOR SELECT USING (auth.uid() = id::uuid);
   
   -- Complaints policies
   CREATE POLICY "Users can read all complaints" ON eeu_complaints FOR SELECT USING (true);
   CREATE POLICY "Users can create complaints" ON eeu_complaints FOR INSERT WITH CHECK (true);
   CREATE POLICY "Staff can update complaints" ON eeu_complaints FOR UPDATE USING (true);
   
   -- Notifications policies
   CREATE POLICY "Users can read notifications" ON eeu_notifications FOR SELECT USING (true);
   
   -- Outages policies
   CREATE POLICY "Users can read outages" ON eeu_outages FOR SELECT USING (true);
   CREATE POLICY "Staff can manage outages" ON eeu_outages FOR ALL USING (true);
   ```

5. **Test the setup**
   - Switch to Supabase backend in the EEU application settings
   - Try logging in with demo credentials
   - Verify that data operations work correctly

## Migration Notes

- The backend automatically attempts to use the database tables first
- If the database tables are not available, it falls back to the KV store
- The system maintains both database and KV store data for compatibility
- All CRUD operations are now supported: Create, Read, Update, Delete

## Troubleshooting

If you encounter issues:

1. **Check table names**: Ensure all table names match exactly (case-sensitive)
2. **Verify columns**: Make sure all required columns exist with correct data types
3. **Check constraints**: Ensure all CHECK constraints allow the expected values
4. **Review permissions**: Verify RLS policies if enabled
5. **Monitor logs**: Check the browser console and Supabase logs for errors

## Performance Optimization

For better performance in production:

1. **Add more indexes** based on your query patterns
2. **Configure connection pooling** in Supabase
3. **Use database functions** for complex operations
4. **Enable real-time subscriptions** for live updates
5. **Implement caching strategies** at the application level

The migration is now complete! Your EEU Complaint Management System should now be using live Supabase database tables with full CRUD functionality.