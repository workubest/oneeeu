import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Client-Info", "Apikey"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

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

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
}

async function authenticateUser(authToken: string): Promise<{ user: User; isValid: boolean }> {
  try {
    if (!authToken) {
      return { user: {} as User, isValid: false };
    }

    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    
    if (error || !user) {
      return { user: {} as User, isValid: false };
    }

    const { data: dbUser } = await supabase
      .from('eeu_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (dbUser && dbUser.isActive) {
      return { user: dbUser, isValid: true };
    }

    return { user: {} as User, isValid: false };
  } catch (error) {
    return { user: {} as User, isValid: false };
  }
}

app.get('/make-server-3ab915fe/health', (c) => {
  return c.json({
    success: true,
    data: { version: '3.5.0-fixed', mode: 'production', status: 'online' },
    message: 'EEU CMS - Supabase Backend Online'
  });
});

app.get('/make-server-3ab915fe/check-users', async (c) => {
  try {
    const { data: dbUsers } = await supabase
      .from('eeu_users')
      .select('id')
      .limit(1);

    const userCount = dbUsers ? dbUsers.length : 0;

    return c.json({
      success: true,
      data: { 
        usersExist: userCount > 0,
        userCount: userCount,
        needsSetup: userCount === 0,
        source: 'database'
      },
      message: 'User check completed'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Failed to check users'
    }, 500);
  }
});

app.post('/make-server-3ab915fe/setup-admin', async (c) => {
  try {
    const { data: dbAdmins } = await supabase
      .from('eeu_users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (dbAdmins && dbAdmins.length > 0) {
      return c.json({
        success: false,
        error: 'Admin user already exists'
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

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      email_confirm: true
    });

    if (authError) {
      return c.json({
        success: false,
        error: `Failed to create admin: ${authError.message}`
      }, 400);
    }

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

    const { error: dbError } = await supabase
      .from('eeu_users')
      .insert([adminUser]);

    if (dbError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return c.json({
        success: false,
        error: `Failed to create profile: ${dbError.message}`
      }, 500);
    }

    return c.json({
      success: true,
      data: { user: adminUser },
      message: 'Admin created successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Setup failed'
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
        error: 'Email and password required'
      }, 400);
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user || !authData.session) {
      return c.json({
        success: false,
        error: 'Invalid credentials'
      }, 401);
    }

    const { data: userProfile } = await supabase
      .from('eeu_users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (!userProfile || !userProfile.isActive) {
      return c.json({
        success: false,
        error: 'Account inactive'
      }, 403);
    }

    await supabase
      .from('eeu_users')
      .update({
        lastLogin: new Date().toISOString(),
        loginCount: (userProfile.loginCount || 0) + 1
      })
      .eq('id', authData.user.id);

    return c.json({
      success: true,
      data: { user: userProfile, token: authData.session.access_token },
      message: 'Login successful'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Login failed'
    }, 500);
  }
});

app.get('/make-server-3ab915fe/users', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const { isValid } = await authenticateUser(token || '');

  if (!isValid) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { data: users } = await supabase
    .from('eeu_users')
    .select('*')
    .order('createdAt', { ascending: false });

  return c.json({
    success: true,
    data: { users: users || [], total: users?.length || 0 }
  });
});

app.get('/make-server-3ab915fe/dashboard', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const { isValid } = await authenticateUser(token || '');

  if (!isValid) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const { data: complaints } = await supabase.from('eeu_complaints').select('*');
  const { data: users } = await supabase.from('eeu_users').select('*');

  const metrics = {
    complaints: {
      total: complaints?.length || 0,
      open: complaints?.filter(c => c.status === 'open').length || 0,
      inProgress: complaints?.filter(c => c.status === 'in_progress').length || 0,
      resolved: complaints?.filter(c => c.status === 'resolved').length || 0
    },
    users: {
      total: users?.length || 0,
      active: users?.filter(u => u.isActive).length || 0
    }
  };

  return c.json({ success: true, data: metrics });
});

app.all('*', (c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

Deno.serve(app.fetch);