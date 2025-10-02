import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Database table initialization
async function initializeDatabaseTables() {
  try {
    console.log('Initializing database tables...');
    
    // Check if tables exist by trying to read from them
    const { data: usersCheck } = await supabase.from('eeu_users').select('id').limit(1);
    const { data: complaintsCheck } = await supabase.from('eeu_complaints').select('id').limit(1);
    const { data: notificationsCheck } = await supabase.from('eeu_notifications').select('id').limit(1);
    const { data: outagesCheck } = await supabase.from('eeu_outages').select('id').limit(1);
    
    // If tables don't exist, they need to be created manually in Supabase dashboard
    // We'll log instructions for the user
    console.log('Database tables check completed. Tables should be created manually in Supabase dashboard if they don\'t exist.');
    
    return true;
  } catch (error) {
    console.error('Database initialization check failed:', error);
    console.log('Tables may need to be created manually in Supabase dashboard.');
    return false;
  }
}

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'technician' | 'customer';
  region?: string;
  serviceCenter?: string;
  phone?: string;
  isActive?: boolean;
  accountLocked?: boolean;
  failedLoginAttempts?: number;
  lastLogin?: string;
  loginCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
}

interface Complaint {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  region?: string;
  serviceCenter?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'alert' | 'warning' | 'info';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: string;
  relatedComplaintId?: string;
  actionRequired: boolean;
}

interface Outage {
  id: string;
  title: string;
  status: 'active' | 'scheduled' | 'investigating' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedCustomers: number;
  area: string;
  reportedAt: string;
  estimatedRestoration: string;
  cause: string;
  assignedCrew: string;
  crewStatus: 'preparing' | 'en-route' | 'on-site' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
}

// Utility functions
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

async function authenticateUser(authToken: string): Promise<{ user: User; isValid: boolean }> {
  try {
    if (!authToken) {
      return { user: {} as User, isValid: false };
    }

    // Validate token with Supabase auth
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    
    if (error || !user) {
      console.warn('Token validation failed:', error?.message || 'No user data');
      return { user: {} as User, isValid: false };
    }

    // Get user profile from database first
    let userProfile = null;
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('eeu_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!dbError && dbUser) {
        userProfile = dbUser;
      }
    } catch (error) {
      console.warn('Database user lookup failed:', error);
    }

    // Fallback to KV store if database lookup failed
    if (!userProfile) {
      const kvUserProfile = await kv.get(`user:${user.id}`);
      if (kvUserProfile) {
        userProfile = JSON.parse(kvUserProfile);
      }
    }

    // If still no profile, create default customer profile
    if (!userProfile) {
      userProfile = {
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'customer',
        region: 'Addis Ababa',
        serviceCenter: 'General',
        isActive: true,
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Check if user account is active
    if (!userProfile.isActive) {
      console.warn('User account is inactive:', userProfile.email);
      return { user: {} as User, isValid: false };
    }

    return { user: userProfile, isValid: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: {} as User, isValid: false };
  }
}

// Initialize database tables without demo data seeding
async function initializeSupabaseData() {
  try {
    console.log('Initializing live Supabase database...');
    
    // Initialize database tables check
    await initializeDatabaseTables();

    // Only seed minimal sample data for testing (no predefined users)
    const sampleComplaints: Complaint[] = [
      {
        id: 'CMP-SAMPLE-001',
        customerId: 'system',
        title: 'Sample Complaint - Power Quality Issues',
        description: 'This is a sample complaint for testing purposes. Delete after creating real complaints.',
        category: 'Power Quality',
        priority: 'low',
        status: 'open',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        region: 'Sample Region',
        serviceCenter: 'Sample Service Center'
      }
    ];

    // Try to insert sample data only if no data exists
    try {
      const { data: existingComplaints } = await supabase
        .from('eeu_complaints')
        .select('id')
        .limit(1);
      
      if (!existingComplaints || existingComplaints.length === 0) {
        const { error: complaintsError } = await supabase
          .from('eeu_complaints')
          .insert(sampleComplaints);
        
        if (!complaintsError) {
          console.log('Sample complaint data seeded successfully');
        }
      }
    } catch (error) {
      console.warn('Could not seed sample data - tables may not exist yet:', error);
    }

    console.log('Live Supabase database initialization completed');
  } catch (error) {
    console.error('Error during Supabase initialization:', error);
  }
}

// Initialize Supabase data on startup
await initializeSupabaseData();

// Public routes (no authentication required)
app.get('/make-server-3ab915fe/health', (c) => {
  return c.json({
    success: true,
    data: { version: '3.4.0-live', mode: 'production', status: 'online' },
    message: 'EEU Complaint Management System - Live Supabase Backend Online'
  });
});

// Simple test endpoint to verify routing works
app.get('/make-server-3ab915fe/test', (c) => {
  console.log('🧪 Test endpoint called - no auth required');
  console.log('🧪 Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  console.log('🧪 Authorization:', c.req.header('Authorization'));
  return c.json({
    success: true,
    data: { message: 'Test endpoint working', timestamp: new Date().toISOString() },
    message: 'Test successful'
  });
});

// Simple debug endpoint that accepts any authorization
app.get('/make-server-3ab915fe/debug', (c) => {
  console.log('🐛 Debug endpoint called');
  const authHeader = c.req.header('Authorization');
  console.log('🐛 Has auth header:', !!authHeader);
  console.log('🐛 Auth header value:', authHeader ? authHeader.substring(0, 20) + '...' : 'none');
  
  return c.json({
    success: true,
    data: { 
      hasAuth: !!authHeader,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(c.req.raw.headers.entries())
    },
    message: 'Debug endpoint working'
  });
});

// Check if any users exist (public endpoint for setup detection)
app.get('/make-server-3ab915fe/check-users', async (c) => {
  console.log('🔍 Check users endpoint called');
  console.log('🔍 Request headers:', Object.fromEntries(c.req.raw.headers.entries()));
  console.log('🔍 Authorization header:', c.req.header('Authorization'));
  
  try {
    // Check if any users exist without requiring authentication
    let userCount = 0;
    let source = 'unknown';
    
    try {
      console.log('🔍 Checking database for users...');
      const { data: dbUsers, error } = await supabase
        .from('eeu_users')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('⚠️ Error checking users in database:', error.message);
        // Fallback to KV store
        console.log('🔍 Falling back to KV store...');
        const users = await kv.get('demo:users');
        userCount = users ? JSON.parse(users).length : 0;
        source = 'kv_store';
      } else {
        userCount = dbUsers ? dbUsers.length : 0;
        source = 'database';
        console.log(`✅ Found ${userCount} users in database`);
      }
    } catch (error) {
      console.warn('⚠️ Database connection error, checking KV store:', error);
      const users = await kv.get('demo:users');
      userCount = users ? JSON.parse(users).length : 0;
      source = 'kv_store_fallback';
    }

    const result = {
      success: true,
      data: { 
        usersExist: userCount > 0,
        userCount: userCount,
        needsSetup: userCount === 0,
        source: source
      },
      message: 'User check completed'
    };

    console.log('✅ Check users result:', result);
    return c.json(result);
  } catch (error) {
    console.error('❌ Check users error:', error);
    return c.json({
      success: false,
      error: 'Failed to check users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Setup route for creating the first admin user
app.post('/make-server-3ab915fe/setup-admin', async (c) => {
  console.log('🚀 Setup admin endpoint called');
  console.log('🚀 Request headers:', Object.fromEntries(c.req.raw.headers.entries()));
  console.log('🚀 Request method:', c.req.method);
  console.log('🚀 Request path:', c.req.path);
  
  try {
    // Check if any admin users already exist
    let existingAdmins = [];
    try {
      const { data: dbAdmins, error: checkError } = await supabase
        .from('eeu_users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        console.warn('Database table might not exist, checking KV store:', checkError.message);
        // Check KV store for existing admin users
        const kvUsers = await kv.get('demo:users');
        if (kvUsers) {
          const users = JSON.parse(kvUsers);
          existingAdmins = users.filter((user: User) => user.role === 'admin');
        }
      } else {
        existingAdmins = dbAdmins || [];
      }
    } catch (error) {
      console.warn('Error checking for existing admins, continuing with setup:', error);
      // Allow setup to continue if we can't check
    }

    if (existingAdmins.length > 0) {
      return c.json({
        success: false,
        error: 'Admin user already exists. Use the login page to access the system.'
      }, 409);
    }

    const body = await c.req.json();
    const { email, password, name, phone, region = 'Addis Ababa', serviceCenter = 'Head Office' } = body;

    if (!email || !password || !name) {
      return c.json({
        success: false,
        error: 'Email, password, and name are required'
      }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (authError) {
      console.error('Supabase auth error during admin setup:', authError);
      return c.json({
        success: false,
        error: `Failed to create admin account: ${authError.message}`
      }, 400);
    }

    // Create admin user profile
    const adminUser: User = {
      id: authData.user.id,
      name,
      email,
      role: 'admin',
      region,
      serviceCenter,
      phone,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system'
    };

    // Insert admin profile into database
    let profileCreated = false;
    try {
      const { error: dbError } = await supabase
        .from('eeu_users')
        .insert([adminUser]);

      if (dbError) {
        console.warn('Database insert failed, trying KV store fallback:', dbError.message);
        // Fallback to KV store if database table doesn't exist
        await kv.set(`user:${adminUser.id}`, JSON.stringify(adminUser));
        
        // Also add to demo users list for compatibility
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        users.push(adminUser);
        await kv.set('demo:users', JSON.stringify(users));
        
        profileCreated = true;
        console.log('Admin profile saved to KV store successfully');
      } else {
        profileCreated = true;
        console.log('Admin profile saved to database successfully');
      }
    } catch (error) {
      console.error('Failed to save admin profile:', error);
      // Try to delete the auth user since profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user after profile creation failure:', cleanupError);
      }
      
      return c.json({
        success: false,
        error: `Failed to create admin profile: ${error}`
      }, 500);
    }

    if (!profileCreated) {
      // Try to delete the auth user since profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user after profile creation failure:', cleanupError);
      }
      
      return c.json({
        success: false,
        error: 'Failed to create admin profile in database or KV store'
      }, 500);
    }

    console.log('First admin user created successfully:', email);

    return c.json({
      success: true,
      data: { 
        user: adminUser,
        message: 'Admin account created successfully. You can now log in with your credentials.'
      },
      message: 'First admin user setup completed'
    });
  } catch (error) {
    console.error('Setup admin error:', error);
    return c.json({
      success: false,
      error: 'Failed to setup admin user due to server error'
    }, 500);
  }
});

app.post('/make-server-3ab915fe/signup', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role = 'customer', region, serviceCenter } = body;

    if (!email || !password || !name) {
      return c.json({
        success: false,
        error: 'Email, password, and name are required'
      }, 400);
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // Auto-confirm since email server not configured
    });

    if (authError) {
      return c.json({
        success: false,
        error: `Registration failed: ${authError.message}`
      }, 400);
    }

    // Create user profile
    const newUser: User = {
      id: authData.user.id,
      name,
      email,
      role: role as User['role'],
      region: region || 'Addis Ababa',
      serviceCenter: serviceCenter || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store user profile in KV store
    await kv.set(`user:${newUser.id}`, JSON.stringify(newUser));

    // Update users list
    const existingUsers = await kv.get('demo:users');
    const users = existingUsers ? JSON.parse(existingUsers) : [];
    users.push(newUser);
    await kv.set('demo:users', JSON.stringify(users));

    return c.json({
      success: true,
      data: { user: newUser },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({
      success: false,
      error: 'Registration failed due to server error'
    }, 500);
  }
});

app.post('/make-server-3ab915fe/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Email and password are required'
      }, 400);
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return c.json({
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.'
      }, 401);
    }

    if (!authData.user || !authData.session) {
      return c.json({
        success: false,
        error: 'Authentication failed. Please try again.'
      }, 401);
    }

    // Get user profile from database
    let userProfile = null;
    try {
      const { data: dbUser, error: dbError } = await supabase
        .from('eeu_users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (!dbError && dbUser) {
        userProfile = dbUser;
      }
    } catch (error) {
      console.warn('Database user lookup failed, checking KV store fallback:', error);
    }

    // Fallback to KV store if database lookup failed
    if (!userProfile) {
      const kvUserProfile = await kv.get(`user:${authData.user.id}`);
      if (kvUserProfile) {
        userProfile = JSON.parse(kvUserProfile);
      }
    }

    // If no profile exists, create a default customer profile
    if (!userProfile) {
      userProfile = {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        email: authData.user.email,
        role: 'customer',
        region: 'Addis Ababa',
        serviceCenter: 'General',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Try to save the new profile to database
      try {
        const { error: insertError } = await supabase
          .from('eeu_users')
          .insert([userProfile]);
        
        if (insertError) {
          console.warn('Failed to save user profile to database:', insertError);
          // Save to KV store as fallback
          await kv.set(`user:${userProfile.id}`, JSON.stringify(userProfile));
        }
      } catch (error) {
        console.warn('Database insert failed, using KV store:', error);
        await kv.set(`user:${userProfile.id}`, JSON.stringify(userProfile));
      }
    }

    // Check if user account is active
    if (!userProfile.isActive) {
      return c.json({
        success: false,
        error: 'Your account has been deactivated. Please contact an administrator.'
      }, 403);
    }

    // Update last login
    const loginUpdate = {
      lastLogin: new Date().toISOString(),
      loginCount: (userProfile.loginCount || 0) + 1,
      failedLoginAttempts: 0,
      updatedAt: new Date().toISOString()
    };

    try {
      await supabase
        .from('eeu_users')
        .update(loginUpdate)
        .eq('id', authData.user.id);
    } catch (error) {
      console.warn('Failed to update login stats:', error);
    }

    const updatedUserProfile = { ...userProfile, ...loginUpdate };

    return c.json({
      success: true,
      data: { user: updatedUserProfile, token: authData.session.access_token },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: 'Login failed due to server error. Please try again.'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/validate-session', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return c.json({
        success: false,
        error: 'No authorization token provided'
      }, 401);
    }

    const { user, isValid } = await authenticateUser(token);

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Invalid or expired session'
      }, 401);
    }

    return c.json({
      success: true,
      data: { user },
      message: 'Valid session'
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return c.json({
      success: false,
      error: 'Session validation failed'
    }, 500);
  }
});

// DUPLICATE ROUTE REMOVED - Check if any users exist is defined earlier in the file

// Data routes
app.get('/make-server-3ab915fe/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Try to get users from Supabase database first
    let userData: User[] = [];
    try {
      const { data: dbUsers, error } = await supabase
        .from('eeu_users')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching users from database:', error);
        // Fallback to KV store
        const users = await kv.get('demo:users');
        userData = users ? JSON.parse(users) : [];
      } else {
        userData = dbUsers || [];
        console.log(`Retrieved ${userData.length} users from Supabase database`);
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Fallback to KV store
      const users = await kv.get('demo:users');
      userData = users ? JSON.parse(users) : [];
    }

    return c.json({
      success: true,
      data: {
        users: userData,
        total: userData.length,
        pagination: {
          page: 1,
          limit: userData.length,
          total: userData.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve users'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/complaints', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Try to get complaints from Supabase database first
    let complaintsData: Complaint[] = [];
    try {
      const { data: dbComplaints, error } = await supabase
        .from('eeu_complaints')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching complaints from database:', error);
        // Fallback to KV store
        const complaints = await kv.get('demo:complaints');
        complaintsData = complaints ? JSON.parse(complaints) : [];
      } else {
        complaintsData = dbComplaints || [];
        console.log(`Retrieved ${complaintsData.length} complaints from Supabase database`);
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Fallback to KV store
      const complaints = await kv.get('demo:complaints');
      complaintsData = complaints ? JSON.parse(complaints) : [];
    }

    return c.json({
      success: true,
      data: {
        complaints: complaintsData,
        total: complaintsData.length
      },
      message: 'Complaints retrieved successfully'
    });
  } catch (error) {
    console.error('Get complaints error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve complaints'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/dashboard', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Generate dashboard metrics from stored data - fetch from database first
    let complaintsData: Complaint[] = [];
    let usersData: User[] = [];
    
    try {
      // Fetch complaints from database
      const { data: dbComplaints, error: complaintsError } = await supabase
        .from('eeu_complaints')
        .select('*');
      
      if (complaintsError) {
        console.error('Error fetching complaints for dashboard:', complaintsError);
        const complaints = await kv.get('demo:complaints');
        complaintsData = complaints ? JSON.parse(complaints) : [];
      } else {
        complaintsData = dbComplaints || [];
      }

      // Fetch users from database
      const { data: dbUsers, error: usersError } = await supabase
        .from('eeu_users')
        .select('*');
      
      if (usersError) {
        console.error('Error fetching users for dashboard:', usersError);
        const users = await kv.get('demo:users');
        usersData = users ? JSON.parse(users) : [];
      } else {
        usersData = dbUsers || [];
      }
    } catch (error) {
      console.error('Database connection error in dashboard:', error);
      // Fallback to KV store
      const complaints = await kv.get('demo:complaints');
      complaintsData = complaints ? JSON.parse(complaints) : [];
      const users = await kv.get('demo:users');
      usersData = users ? JSON.parse(users) : [];
    }

    const metrics = {
      complaints: {
        total: complaintsData.length,
        open: complaintsData.filter((c: Complaint) => c.status === 'open').length,
        inProgress: complaintsData.filter((c: Complaint) => c.status === 'in_progress').length,
        resolved: complaintsData.filter((c: Complaint) => c.status === 'resolved').length,
        closed: complaintsData.filter((c: Complaint) => c.status === 'closed').length,
        pending: complaintsData.filter((c: Complaint) => c.status === 'pending').length,
        escalated: 0,
        cancelled: complaintsData.filter((c: Complaint) => c.status === 'cancelled').length,
        critical: complaintsData.filter((c: Complaint) => c.priority === 'critical').length,
        high: complaintsData.filter((c: Complaint) => c.priority === 'high').length,
        medium: complaintsData.filter((c: Complaint) => c.priority === 'medium').length,
        low: complaintsData.filter((c: Complaint) => c.priority === 'low').length,
        todayCount: complaintsData.filter((c: Complaint) => 
          new Date(c.createdAt).toDateString() === new Date().toDateString()
        ).length,
        yesterdayCount: 0,
        weekCount: complaintsData.length,
        lastWeekCount: 0,
        monthCount: complaintsData.length,
        lastMonthCount: 0,
        yearCount: complaintsData.length
      },
      performance: {
        resolutionRate: 85.2,
        avgResolutionTime: 2.3,
        customerSatisfaction: 4.2,
        responseTime: 1.8,
        firstResponseTime: 0.5,
        escalationRate: 12.1
      },
      trends: {
        complaintsChange: 15.3,
        resolutionChange: 8.7,
        responseChange: -5.2,
        satisfactionChange: 12.8
      },
      users: {
        total: usersData.length,
        active: usersData.filter((u: User) => u.isActive).length,
        online: Math.floor(usersData.length * 0.7)
      },
      dateFilters: {
        today: 2,
        yesterday: 1,
        thisWeek: complaintsData.length,
        lastWeek: 0,
        thisMonth: complaintsData.length,
        lastMonth: 0,
        thisYear: complaintsData.length
      }
    };

    return c.json({
      success: true,
      data: metrics,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve dashboard data'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Try to get notifications from Supabase database first
    let notificationsData: Notification[] = [];
    try {
      const { data: dbNotifications, error } = await supabase
        .from('eeu_notifications')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching notifications from database:', error);
        // Fallback to KV store
        const notifications = await kv.get('demo:notifications');
        notificationsData = notifications ? JSON.parse(notifications) : [];
      } else {
        notificationsData = dbNotifications || [];
        console.log(`Retrieved ${notificationsData.length} notifications from Supabase database`);
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Fallback to KV store
      const notifications = await kv.get('demo:notifications');
      notificationsData = notifications ? JSON.parse(notifications) : [];
    }

    return c.json({
      success: true,
      data: {
        notifications: notificationsData,
        total: notificationsData.length
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve notifications'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/outages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Try to get outages from Supabase database first
    let outagesData: Outage[] = [];
    try {
      const { data: dbOutages, error } = await supabase
        .from('eeu_outages')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching outages from database:', error);
        // Fallback to KV store
        const outages = await kv.get('demo:outages');
        outagesData = outages ? JSON.parse(outages) : [];
      } else {
        outagesData = dbOutages || [];
        console.log(`Retrieved ${outagesData.length} outages from Supabase database`);
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Fallback to KV store
      const outages = await kv.get('demo:outages');
      outagesData = outages ? JSON.parse(outages) : [];
    }

    return c.json({
      success: true,
      data: outagesData,
      message: 'Outages retrieved successfully'
    });
  } catch (error) {
    console.error('Get outages error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve outages'
    }, 500);
  }
});

// Create complaint
app.post('/make-server-3ab915fe/complaints', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const body = await c.req.json();
    const { title, description, category, priority = 'medium' } = body;

    if (!title || !description || !category) {
      return c.json({
        success: false,
        error: 'Title, description, and category are required'
      }, 400);
    }

    const newComplaint: Complaint = {
      id: generateId('CMP'),
      customerId: user.id,
      title,
      description,
      category,
      priority: priority as Complaint['priority'],
      status: 'open',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      region: user.region,
      serviceCenter: user.serviceCenter
    };

    // Insert complaint into Supabase database
    try {
      const { data: insertedComplaint, error } = await supabase
        .from('eeu_complaints')
        .insert([newComplaint])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting complaint into database:', error);
        // Fallback to KV store
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        complaints.push(newComplaint);
        await kv.set('demo:complaints', JSON.stringify(complaints));
      } else {
        console.log('Successfully inserted complaint into Supabase database');
        // Also update KV store for backup
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        complaints.push(newComplaint);
        await kv.set('demo:complaints', JSON.stringify(complaints));
      }
    } catch (error) {
      console.error('Database connection error during complaint creation:', error);
      // Fallback to KV store
      const existingComplaints = await kv.get('demo:complaints');
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      complaints.push(newComplaint);
      await kv.set('demo:complaints', JSON.stringify(complaints));
    }

    return c.json({
      success: true,
      data: newComplaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    return c.json({
      success: false,
      error: 'Failed to create complaint'
    }, 500);
  }
});

// Create user
app.post('/make-server-3ab915fe/users', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to create users
    if (!['admin', 'manager'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to create users'
      }, 403);
    }

    const body = await c.req.json();
    const { name, email, password, role = 'staff', region, serviceCenter } = body;

    if (!name || !email || !password) {
      return c.json({
        success: false,
        error: 'Name, email, and password are required'
      }, 400);
    }

    const newUser: User = {
      id: generateId('USR'),
      name,
      email,
      role: role as User['role'],
      region: region || 'Addis Ababa',
      serviceCenter: serviceCenter || 'General',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id
    };

    // Insert user into Supabase database
    try {
      const { data: insertedUser, error } = await supabase
        .from('eeu_users')
        .insert([newUser])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting user into database:', error);
        // Fallback to KV store
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        users.push(newUser);
        await kv.set('demo:users', JSON.stringify(users));
      } else {
        console.log('Successfully inserted user into Supabase database');
        // Also update KV store for backup
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        users.push(newUser);
        await kv.set('demo:users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('Database connection error during user creation:', error);
      // Fallback to KV store
      const existingUsers = await kv.get('demo:users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      users.push(newUser);
      await kv.set('demo:users', JSON.stringify(users));
    }

    return c.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({
      success: false,
      error: 'Failed to create user'
    }, 500);
  }
});

// Update user
app.put('/make-server-3ab915fe/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to update users
    if (!['admin', 'manager'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to update users'
      }, 403);
    }

    const userId = c.req.param('id');
    const body = await c.req.json();
    const { name, email, role, region, serviceCenter, isActive } = body;

    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400);
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(region && { region }),
      ...(serviceCenter && { serviceCenter }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString()
    };

    // Update user in Supabase database
    try {
      const { data: updatedUser, error } = await supabase
        .from('eeu_users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user in database:', error);
        // Fallback to KV store
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        const userIndex = users.findIndex((u: User) => u.id === userId);
        if (userIndex >= 0) {
          users[userIndex] = { ...users[userIndex], ...updateData };
          await kv.set('demo:users', JSON.stringify(users));
          return c.json({
            success: true,
            data: users[userIndex],
            message: 'User updated successfully (fallback mode)'
          });
        } else {
          return c.json({
            success: false,
            error: 'User not found'
          }, 404);
        }
      } else {
        console.log('Successfully updated user in Supabase database');
        // Also update KV store for backup
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        const userIndex = users.findIndex((u: User) => u.id === userId);
        if (userIndex >= 0) {
          users[userIndex] = updatedUser;
          await kv.set('demo:users', JSON.stringify(users));
        }
        return c.json({
          success: true,
          data: updatedUser,
          message: 'User updated successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during user update:', error);
      // Fallback to KV store
      const existingUsers = await kv.get('demo:users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      const userIndex = users.findIndex((u: User) => u.id === userId);
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...updateData };
        await kv.set('demo:users', JSON.stringify(users));
        return c.json({
          success: true,
          data: users[userIndex],
          message: 'User updated successfully (fallback mode)'
        });
      } else {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404);
      }
    }
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({
      success: false,
      error: 'Failed to update user'
    }, 500);
  }
});

// Delete user
app.delete('/make-server-3ab915fe/users/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to delete users
    if (user.role !== 'admin') {
      return c.json({
        success: false,
        error: 'Only administrators can delete users'
      }, 403);
    }

    const userId = c.req.param('id');

    if (!userId) {
      return c.json({
        success: false,
        error: 'User ID is required'
      }, 400);
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return c.json({
        success: false,
        error: 'Cannot delete your own account'
      }, 400);
    }

    // Delete user from Supabase database
    try {
      const { error } = await supabase
        .from('eeu_users')
        .delete()
        .eq('id', userId);
      
      if (error) {
        console.error('Error deleting user from database:', error);
        // Fallback to KV store
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        const filteredUsers = users.filter((u: User) => u.id !== userId);
        await kv.set('demo:users', JSON.stringify(filteredUsers));
        return c.json({
          success: true,
          message: 'User deleted successfully (fallback mode)'
        });
      } else {
        console.log('Successfully deleted user from Supabase database');
        // Also update KV store for backup
        const existingUsers = await kv.get('demo:users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        const filteredUsers = users.filter((u: User) => u.id !== userId);
        await kv.set('demo:users', JSON.stringify(filteredUsers));
        return c.json({
          success: true,
          message: 'User deleted successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during user deletion:', error);
      // Fallback to KV store
      const existingUsers = await kv.get('demo:users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      const filteredUsers = users.filter((u: User) => u.id !== userId);
      await kv.set('demo:users', JSON.stringify(filteredUsers));
      return c.json({
        success: true,
        message: 'User deleted successfully (fallback mode)'
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete user'
    }, 500);
  }
});

// Update complaint
app.put('/make-server-3ab915fe/complaints/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const complaintId = c.req.param('id');
    const body = await c.req.json();
    const { title, description, category, priority, status, assignedTo } = body;

    if (!complaintId) {
      return c.json({
        success: false,
        error: 'Complaint ID is required'
      }, 400);
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(category && { category }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(assignedTo && { assignedTo }),
      updatedAt: new Date().toISOString()
    };

    // Update complaint in Supabase database
    try {
      const { data: updatedComplaint, error } = await supabase
        .from('eeu_complaints')
        .update(updateData)
        .eq('id', complaintId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating complaint in database:', error);
        // Fallback to KV store
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        const complaintIndex = complaints.findIndex((c: Complaint) => c.id === complaintId);
        if (complaintIndex >= 0) {
          complaints[complaintIndex] = { ...complaints[complaintIndex], ...updateData };
          await kv.set('demo:complaints', JSON.stringify(complaints));
          return c.json({
            success: true,
            data: complaints[complaintIndex],
            message: 'Complaint updated successfully (fallback mode)'
          });
        } else {
          return c.json({
            success: false,
            error: 'Complaint not found'
          }, 404);
        }
      } else {
        console.log('Successfully updated complaint in Supabase database');
        // Also update KV store for backup
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        const complaintIndex = complaints.findIndex((c: Complaint) => c.id === complaintId);
        if (complaintIndex >= 0) {
          complaints[complaintIndex] = updatedComplaint;
          await kv.set('demo:complaints', JSON.stringify(complaints));
        }
        return c.json({
          success: true,
          data: updatedComplaint,
          message: 'Complaint updated successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during complaint update:', error);
      // Fallback to KV store
      const existingComplaints = await kv.get('demo:complaints');
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      const complaintIndex = complaints.findIndex((c: Complaint) => c.id === complaintId);
      if (complaintIndex >= 0) {
        complaints[complaintIndex] = { ...complaints[complaintIndex], ...updateData };
        await kv.set('demo:complaints', JSON.stringify(complaints));
        return c.json({
          success: true,
          data: complaints[complaintIndex],
          message: 'Complaint updated successfully (fallback mode)'
        });
      } else {
        return c.json({
          success: false,
          error: 'Complaint not found'
        }, 404);
      }
    }
  } catch (error) {
    console.error('Update complaint error:', error);
    return c.json({
      success: false,
      error: 'Failed to update complaint'
    }, 500);
  }
});

// Delete complaint
app.delete('/make-server-3ab915fe/complaints/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const complaintId = c.req.param('id');

    if (!complaintId) {
      return c.json({
        success: false,
        error: 'Complaint ID is required'
      }, 400);
    }

    // Check if user has permission to delete this complaint
    // Only admins, managers, or the complaint creator can delete
    if (!['admin', 'manager'].includes(user.role)) {
      // Check if user is the creator of the complaint
      let hasPermission = false;
      try {
        const { data: complaint, error } = await supabase
          .from('eeu_complaints')
          .select('createdBy')
          .eq('id', complaintId)
          .single();
        
        if (!error && complaint && complaint.createdBy === user.id) {
          hasPermission = true;
        } else {
          // Fallback to KV store check
          const existingComplaints = await kv.get('demo:complaints');
          const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
          const complaint = complaints.find((c: Complaint) => c.id === complaintId);
          if (complaint && complaint.createdBy === user.id) {
            hasPermission = true;
          }
        }
      } catch (error) {
        console.error('Error checking complaint ownership:', error);
      }

      if (!hasPermission) {
        return c.json({
          success: false,
          error: 'Insufficient permissions to delete this complaint'
        }, 403);
      }
    }

    // Delete complaint from Supabase database
    try {
      const { error } = await supabase
        .from('eeu_complaints')
        .delete()
        .eq('id', complaintId);
      
      if (error) {
        console.error('Error deleting complaint from database:', error);
        // Fallback to KV store
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        const filteredComplaints = complaints.filter((c: Complaint) => c.id !== complaintId);
        await kv.set('demo:complaints', JSON.stringify(filteredComplaints));
        return c.json({
          success: true,
          message: 'Complaint deleted successfully (fallback mode)'
        });
      } else {
        console.log('Successfully deleted complaint from Supabase database');
        // Also update KV store for backup
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        const filteredComplaints = complaints.filter((c: Complaint) => c.id !== complaintId);
        await kv.set('demo:complaints', JSON.stringify(filteredComplaints));
        return c.json({
          success: true,
          message: 'Complaint deleted successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during complaint deletion:', error);
      // Fallback to KV store
      const existingComplaints = await kv.get('demo:complaints');
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      const filteredComplaints = complaints.filter((c: Complaint) => c.id !== complaintId);
      await kv.set('demo:complaints', JSON.stringify(filteredComplaints));
      return c.json({
        success: true,
        message: 'Complaint deleted successfully (fallback mode)'
      });
    }
  } catch (error) {
    console.error('Delete complaint error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete complaint'
    }, 500);
  }
});

// Create outage
app.post('/make-server-3ab915fe/outages', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to create outages
    if (!['admin', 'manager'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to create outages'
      }, 403);
    }

    const body = await c.req.json();
    const { title, status = 'active', priority = 'medium', affectedCustomers, area, cause, assignedCrew, estimatedRestoration } = body;

    if (!title || !area || !cause) {
      return c.json({
        success: false,
        error: 'Title, area, and cause are required'
      }, 400);
    }

    const newOutage: Outage = {
      id: generateId('OUT'),
      title,
      status: status as Outage['status'],
      priority: priority as Outage['priority'],
      affectedCustomers: affectedCustomers || 0,
      area,
      reportedAt: new Date().toISOString(),
      estimatedRestoration: estimatedRestoration || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      cause,
      assignedCrew: assignedCrew || 'Unassigned',
      crewStatus: 'preparing',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert outage into Supabase database
    try {
      const { data: insertedOutage, error } = await supabase
        .from('eeu_outages')
        .insert([newOutage])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting outage into database:', error);
        // Fallback to KV store
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        outages.push(newOutage);
        await kv.set('demo:outages', JSON.stringify(outages));
      } else {
        console.log('Successfully inserted outage into Supabase database');
        // Also update KV store for backup
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        outages.push(newOutage);
        await kv.set('demo:outages', JSON.stringify(outages));
      }
    } catch (error) {
      console.error('Database connection error during outage creation:', error);
      // Fallback to KV store
      const existingOutages = await kv.get('demo:outages');
      const outages = existingOutages ? JSON.parse(existingOutages) : [];
      outages.push(newOutage);
      await kv.set('demo:outages', JSON.stringify(outages));
    }

    return c.json({
      success: true,
      data: newOutage,
      message: 'Outage created successfully'
    });
  } catch (error) {
    console.error('Create outage error:', error);
    return c.json({
      success: false,
      error: 'Failed to create outage'
    }, 500);
  }
});

// Update outage
app.put('/make-server-3ab915fe/outages/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to update outages
    if (!['admin', 'manager', 'technician'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to update outages'
      }, 403);
    }

    const outageId = c.req.param('id');
    const body = await c.req.json();
    const { title, status, priority, affectedCustomers, area, cause, assignedCrew, crewStatus, progress, estimatedRestoration } = body;

    if (!outageId) {
      return c.json({
        success: false,
        error: 'Outage ID is required'
      }, 400);
    }

    const updateData = {
      ...(title && { title }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(affectedCustomers !== undefined && { affectedCustomers }),
      ...(area && { area }),
      ...(cause && { cause }),
      ...(assignedCrew && { assignedCrew }),
      ...(crewStatus && { crewStatus }),
      ...(progress !== undefined && { progress }),
      ...(estimatedRestoration && { estimatedRestoration }),
      updatedAt: new Date().toISOString()
    };

    // Update outage in Supabase database
    try {
      const { data: updatedOutage, error } = await supabase
        .from('eeu_outages')
        .update(updateData)
        .eq('id', outageId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating outage in database:', error);
        // Fallback to KV store
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        const outageIndex = outages.findIndex((o: Outage) => o.id === outageId);
        if (outageIndex >= 0) {
          outages[outageIndex] = { ...outages[outageIndex], ...updateData };
          await kv.set('demo:outages', JSON.stringify(outages));
          return c.json({
            success: true,
            data: outages[outageIndex],
            message: 'Outage updated successfully (fallback mode)'
          });
        } else {
          return c.json({
            success: false,
            error: 'Outage not found'
          }, 404);
        }
      } else {
        console.log('Successfully updated outage in Supabase database');
        // Also update KV store for backup
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        const outageIndex = outages.findIndex((o: Outage) => o.id === outageId);
        if (outageIndex >= 0) {
          outages[outageIndex] = updatedOutage;
          await kv.set('demo:outages', JSON.stringify(outages));
        }
        return c.json({
          success: true,
          data: updatedOutage,
          message: 'Outage updated successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during outage update:', error);
      // Fallback to KV store
      const existingOutages = await kv.get('demo:outages');
      const outages = existingOutages ? JSON.parse(existingOutages) : [];
      const outageIndex = outages.findIndex((o: Outage) => o.id === outageId);
      if (outageIndex >= 0) {
        outages[outageIndex] = { ...outages[outageIndex], ...updateData };
        await kv.set('demo:outages', JSON.stringify(outages));
        return c.json({
          success: true,
          data: outages[outageIndex],
          message: 'Outage updated successfully (fallback mode)'
        });
      } else {
        return c.json({
          success: false,
          error: 'Outage not found'
        }, 404);
      }
    }
  } catch (error) {
    console.error('Update outage error:', error);
    return c.json({
      success: false,
      error: 'Failed to update outage'
    }, 500);
  }
});

// Delete outage
app.delete('/make-server-3ab915fe/outages/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to delete outages
    if (!['admin', 'manager'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to delete outages'
      }, 403);
    }

    const outageId = c.req.param('id');

    if (!outageId) {
      return c.json({
        success: false,
        error: 'Outage ID is required'
      }, 400);
    }

    // Delete outage from Supabase database
    try {
      const { error } = await supabase
        .from('eeu_outages')
        .delete()
        .eq('id', outageId);
      
      if (error) {
        console.error('Error deleting outage from database:', error);
        // Fallback to KV store
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        const filteredOutages = outages.filter((o: Outage) => o.id !== outageId);
        await kv.set('demo:outages', JSON.stringify(filteredOutages));
        return c.json({
          success: true,
          message: 'Outage deleted successfully (fallback mode)'
        });
      } else {
        console.log('Successfully deleted outage from Supabase database');
        // Also update KV store for backup
        const existingOutages = await kv.get('demo:outages');
        const outages = existingOutages ? JSON.parse(existingOutages) : [];
        const filteredOutages = outages.filter((o: Outage) => o.id !== outageId);
        await kv.set('demo:outages', JSON.stringify(filteredOutages));
        return c.json({
          success: true,
          message: 'Outage deleted successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during outage deletion:', error);
      // Fallback to KV store
      const existingOutages = await kv.get('demo:outages');
      const outages = existingOutages ? JSON.parse(existingOutages) : [];
      const filteredOutages = outages.filter((o: Outage) => o.id !== outageId);
      await kv.set('demo:outages', JSON.stringify(filteredOutages));
      return c.json({
        success: true,
        message: 'Outage deleted successfully (fallback mode)'
      });
    }
  } catch (error) {
    console.error('Delete outage error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete outage'
    }, 500);
  }
});

// Create notification
app.post('/make-server-3ab915fe/notifications', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    // Check if user has permission to create notifications
    if (!['admin', 'manager'].includes(user.role)) {
      return c.json({
        success: false,
        error: 'Insufficient permissions to create notifications'
      }, 403);
    }

    const body = await c.req.json();
    const { title, message, type = 'info', priority = 'medium', relatedComplaintId, actionRequired = false } = body;

    if (!title || !message) {
      return c.json({
        success: false,
        error: 'Title and message are required'
      }, 400);
    }

    const newNotification: Notification = {
      id: generateId('NOT'),
      title,
      message,
      type: type as Notification['type'],
      priority: priority as Notification['priority'],
      isRead: false,
      createdAt: new Date().toISOString(),
      relatedComplaintId,
      actionRequired
    };

    // Insert notification into Supabase database
    try {
      const { data: insertedNotification, error } = await supabase
        .from('eeu_notifications')
        .insert([newNotification])
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting notification into database:', error);
        // Fallback to KV store
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        notifications.push(newNotification);
        await kv.set('demo:notifications', JSON.stringify(notifications));
      } else {
        console.log('Successfully inserted notification into Supabase database');
        // Also update KV store for backup
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        notifications.push(newNotification);
        await kv.set('demo:notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Database connection error during notification creation:', error);
      // Fallback to KV store
      const existingNotifications = await kv.get('demo:notifications');
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
      notifications.push(newNotification);
      await kv.set('demo:notifications', JSON.stringify(notifications));
    }

    return c.json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({
      success: false,
      error: 'Failed to create notification'
    }, 500);
  }
});

// Update notification (mark as read)
app.put('/make-server-3ab915fe/notifications/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const notificationId = c.req.param('id');
    const body = await c.req.json();
    const { isRead } = body;

    if (!notificationId) {
      return c.json({
        success: false,
        error: 'Notification ID is required'
      }, 400);
    }

    const updateData = {
      ...(isRead !== undefined && { isRead })
    };

    // Update notification in Supabase database
    try {
      const { data: updatedNotification, error } = await supabase
        .from('eeu_notifications')
        .update(updateData)
        .eq('id', notificationId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating notification in database:', error);
        // Fallback to KV store
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        const notificationIndex = notifications.findIndex((n: Notification) => n.id === notificationId);
        if (notificationIndex >= 0) {
          notifications[notificationIndex] = { ...notifications[notificationIndex], ...updateData };
          await kv.set('demo:notifications', JSON.stringify(notifications));
          return c.json({
            success: true,
            data: notifications[notificationIndex],
            message: 'Notification updated successfully (fallback mode)'
          });
        } else {
          return c.json({
            success: false,
            error: 'Notification not found'
          }, 404);
        }
      } else {
        console.log('Successfully updated notification in Supabase database');
        // Also update KV store for backup
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        const notificationIndex = notifications.findIndex((n: Notification) => n.id === notificationId);
        if (notificationIndex >= 0) {
          notifications[notificationIndex] = updatedNotification;
          await kv.set('demo:notifications', JSON.stringify(notifications));
        }
        return c.json({
          success: true,
          data: updatedNotification,
          message: 'Notification updated successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during notification update:', error);
      // Fallback to KV store
      const existingNotifications = await kv.get('demo:notifications');
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
      const notificationIndex = notifications.findIndex((n: Notification) => n.id === notificationId);
      if (notificationIndex >= 0) {
        notifications[notificationIndex] = { ...notifications[notificationIndex], ...updateData };
        await kv.set('demo:notifications', JSON.stringify(notifications));
        return c.json({
          success: true,
          data: notifications[notificationIndex],
          message: 'Notification updated successfully (fallback mode)'
        });
      } else {
        return c.json({
          success: false,
          error: 'Notification not found'
        }, 404);
      }
    }
  } catch (error) {
    console.error('Update notification error:', error);
    return c.json({
      success: false,
      error: 'Failed to update notification'
    }, 500);
  }
});

// Delete notification
app.delete('/make-server-3ab915fe/notifications/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { user, isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const notificationId = c.req.param('id');

    if (!notificationId) {
      return c.json({
        success: false,
        error: 'Notification ID is required'
      }, 400);
    }

    // Delete notification from Supabase database
    try {
      const { error } = await supabase
        .from('eeu_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error deleting notification from database:', error);
        // Fallback to KV store
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        const filteredNotifications = notifications.filter((n: Notification) => n.id !== notificationId);
        await kv.set('demo:notifications', JSON.stringify(filteredNotifications));
        return c.json({
          success: true,
          message: 'Notification deleted successfully (fallback mode)'
        });
      } else {
        console.log('Successfully deleted notification from Supabase database');
        // Also update KV store for backup
        const existingNotifications = await kv.get('demo:notifications');
        const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
        const filteredNotifications = notifications.filter((n: Notification) => n.id !== notificationId);
        await kv.set('demo:notifications', JSON.stringify(filteredNotifications));
        return c.json({
          success: true,
          message: 'Notification deleted successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error during notification deletion:', error);
      // Fallback to KV store
      const existingNotifications = await kv.get('demo:notifications');
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
      const filteredNotifications = notifications.filter((n: Notification) => n.id !== notificationId);
      await kv.set('demo:notifications', JSON.stringify(filteredNotifications));
      return c.json({
        success: true,
        message: 'Notification deleted successfully (fallback mode)'
      });
    }
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete notification'
    }, 500);
  }
});

// Get single complaint by ID
app.get('/make-server-3ab915fe/complaints/:id', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { isValid } = await authenticateUser(token || '');

    if (!isValid) {
      return c.json({
        success: false,
        error: 'Unauthorized access'
      }, 401);
    }

    const complaintId = c.req.param('id');

    if (!complaintId) {
      return c.json({
        success: false,
        error: 'Complaint ID is required'
      }, 400);
    }

    // Try to get complaint from Supabase database first
    try {
      const { data: complaint, error } = await supabase
        .from('eeu_complaints')
        .select('*')
        .eq('id', complaintId)
        .single();
      
      if (error) {
        console.error('Error fetching complaint from database:', error);
        // Fallback to KV store
        const existingComplaints = await kv.get('demo:complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
        const foundComplaint = complaints.find((c: Complaint) => c.id === complaintId);
        
        if (foundComplaint) {
          return c.json({
            success: true,
            data: foundComplaint,
            message: 'Complaint retrieved successfully (fallback mode)'
          });
        } else {
          return c.json({
            success: false,
            error: 'Complaint not found'
          }, 404);
        }
      } else {
        return c.json({
          success: true,
          data: complaint,
          message: 'Complaint retrieved successfully'
        });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Fallback to KV store
      const existingComplaints = await kv.get('demo:complaints');
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      const foundComplaint = complaints.find((c: Complaint) => c.id === complaintId);
      
      if (foundComplaint) {
        return c.json({
          success: true,
          data: foundComplaint,
          message: 'Complaint retrieved successfully (fallback mode)'
        });
      } else {
        return c.json({
          success: false,
          error: 'Complaint not found'
        }, 404);
      }
    }
  } catch (error) {
    console.error('Get complaint error:', error);
    return c.json({
      success: false,
      error: 'Failed to retrieve complaint'
    }, 500);
  }
});

// Catch-all route for undefined endpoints
app.all('/make-server-3ab915fe/*', (c) => {
  console.log('🔥 Catch-all route triggered for:', c.req.path);
  console.log('🔥 Method:', c.req.method);
  console.log('🔥 Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  return c.json({
    success: false,
    error: 'Endpoint not found'
  }, 404);
});

// Health check endpoint (without prefix for external monitoring)
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);