# EEU Complaint Management System - Live Setup Guide

## 🚀 Live Authentication Setup (No Mock Data)

The EEU Complaint Management System has been converted to use **live Supabase authentication** without any demo/mock credentials. Follow this guide to set up your first admin user and start using the system.

## Prerequisites

1. **Supabase Database Tables**: Ensure you have created all required tables using the [Database Setup Guide](./database-setup.md)
2. **Backend Deployment**: The Supabase Edge Function should be deployed and running
3. **Frontend Configuration**: The app should be configured to use the Supabase backend

## Step 1: Create the First Admin User

Since there are no pre-created demo users, you need to create the first administrator account.

### Option A: Using the Setup Admin Endpoint

Make a POST request to the setup endpoint:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3ab915fe/setup-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "admin@eeu.gov.et",
    "password": "SecurePassword123!",
    "name": "System Administrator",
    "phone": "+251-11-123-4567",
    "region": "Addis Ababa",
    "serviceCenter": "Head Office"
  }'
```

### Option B: Using Supabase Dashboard

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication → Users**
3. **Click "Add user"**
4. **Fill in the details:**
   - Email: `admin@eeu.gov.et` (or your preferred admin email)
   - Password: Choose a secure password
   - Email confirm: ✅ (check this since email server isn't configured)
   - User metadata: 
     ```json
     {
       "name": "System Administrator",
       "role": "admin"
     }
     ```

5. **Create the user profile in the database:**
   - Go to the SQL Editor
   - Run this query (replace the values with your data):
   ```sql
   INSERT INTO eeu_users (
     id, 
     name, 
     email, 
     role, 
     region, 
     service_center, 
     phone, 
     is_active, 
     created_at, 
     updated_at, 
     created_by
   ) VALUES (
     'USER_ID_FROM_AUTH_USERS', -- Get this from the auth.users table
     'System Administrator',
     'admin@eeu.gov.et',
     'admin',
     'Addis Ababa',
     'Head Office',
     '+251-11-123-4567',
     true,
     NOW(),
     NOW(),
     'system'
   );
   ```

## Step 2: Login Credentials

After creating the admin user, you can log in with:

- **Email**: `admin@eeu.gov.et` (or the email you used)
- **Password**: The secure password you set

## Step 3: Create Additional Users

Once logged in as admin, you can:

1. **Use the Users section** in the app to create additional users
2. **Set up different roles:**
   - `admin`: Full system access
   - `manager`: Regional management access
   - `staff`: Customer service staff access
   - `technician`: Technical support access
   - `customer`: Customer self-service access

## Step 4: Configure User Registration

### Enable Public User Registration (Optional)

If you want customers to be able to register themselves:

1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Enable "Enable email confirmations"** (if you have email configured)
3. **Set "Site URL"** to your app's URL
4. **Configure "Email templates"** as needed

### Disable Public Registration (Recommended for Internal Use)

If you want only admins to create users:

1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Disable "Enable email confirmations"**
3. **Use the Users section in the app** to create all accounts

## Step 5: Security Configuration

### Row Level Security (RLS) Policies

Ensure you have proper RLS policies set up:

```sql
-- Users can only see their own profile unless they're admin/manager
CREATE POLICY "Users can view own profile" ON eeu_users
  FOR SELECT USING (
    auth.uid() = id::uuid OR 
    (SELECT role FROM eeu_users WHERE id = auth.uid()::text) IN ('admin', 'manager')
  );

-- Only admins can create/update users
CREATE POLICY "Admins can manage users" ON eeu_users
  FOR ALL USING (
    (SELECT role FROM eeu_users WHERE id = auth.uid()::text) = 'admin'
  );

-- Users can create complaints
CREATE POLICY "Users can create complaints" ON eeu_complaints
  FOR INSERT WITH CHECK (
    created_by = auth.uid()::text
  );

-- Users can view complaints based on role
CREATE POLICY "Role-based complaint access" ON eeu_complaints
  FOR SELECT USING (
    created_by = auth.uid()::text OR
    (SELECT role FROM eeu_users WHERE id = auth.uid()::text) IN ('admin', 'manager', 'staff', 'technician')
  );
```

## Step 6: Application Configuration

### Backend Selection

1. **Open the EEU app**
2. **Go to Settings**
3. **Select "Supabase" as the backend**
4. **The app will now use live authentication**

### Environment Variables

Ensure these are properly set in your Supabase project:

- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your project's anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (server-side only)

## Live Login Process

### For Users

1. **Open the EEU app**
2. **Enter your email and password**
3. **Click "Login"**
4. **System authenticates via Supabase Auth**
5. **User profile loaded from database**

### For First-Time Setup

If no admin exists:
1. **Use the setup-admin endpoint** (shown above)
2. **Or manually create via Supabase dashboard**
3. **Login with the admin credentials**
4. **Create additional users as needed**

## Troubleshooting

### "No admin users exist" Error

- Use the setup-admin endpoint to create the first admin
- Or manually create via Supabase dashboard

### "Invalid credentials" Error

- Verify the email and password are correct
- Check if the user exists in Supabase Auth
- Ensure the user profile exists in eeu_users table

### "Account deactivated" Error

- Check the `is_active` field in eeu_users table
- Admin can reactivate the account via the Users section

### Database Connection Issues

- Verify all tables exist (see database-setup.md)
- Check Supabase service status
- Verify environment variables are correct

## Production Recommendations

1. **Use strong passwords** for all admin accounts
2. **Enable email confirmation** if you have email service configured
3. **Set up proper backup procedures** for your database
4. **Monitor user activity** through Supabase dashboard
5. **Regularly review user permissions** and roles
6. **Enable logging** for security auditing

## Sample User Roles

### Admin User
- **Email**: `admin@eeu.gov.et`
- **Role**: `admin`
- **Permissions**: Full system access, user management, all complaints

### Manager User  
- **Email**: `manager.addis@eeu.gov.et`
- **Role**: `manager`
- **Permissions**: Regional management, staff oversight, complaint assignment

### Staff User
- **Email**: `staff.addis@eeu.gov.et`
- **Role**: `staff`
- **Permissions**: Customer service, complaint handling, basic reporting

### Customer User
- **Email**: `customer@eeu.gov.et`
- **Role**: `customer`
- **Permissions**: Submit complaints, view own complaints, account management

---

## 🎉 Congratulations!

Your EEU Complaint Management System is now running with **live authentication**. No more demo credentials - only real user accounts that you create and manage through proper authentication flows.

**Next Steps:**
1. Create your admin account
2. Log in and explore the system
3. Create additional user accounts as needed
4. Start managing real complaints and outages
5. Customize the system for your organization's needs

The system now provides enterprise-grade security with role-based access control, proper authentication, and live database persistence.