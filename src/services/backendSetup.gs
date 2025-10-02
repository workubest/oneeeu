// EEU Complaint Management System - Backend Module
// Version: 3.2.2 - Refactored for consistent token handling, complaint CRUD, and error responses
// Updated: 2025-09-23

/**
 * Configuration
 */
const CONFIG = {
  SHEET_ID: PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1ecQ0GtASZyBPlhTjzqjVY00MZQfaVqUBhwm8HOXd9eE',
  DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1AMbkns9nonfAnEMYRxkyqhbmA2YBXfIM',
  JWT_SECRET: PropertiesService.getScriptProperties().getProperty('JWT_SECRET') || 'eeu-complaint-jwt-secret-2025-enhanced',
  API_KEY: PropertiesService.getScriptProperties().getProperty('API_KEY') || 'eeu-complaint-api-key-2025',
  VERSION: '3.2.2',
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  PAGINATION_LIMIT: 1000,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  TABLES: {
    USERS: 'Users',
    COMPLAINTS: 'Complaints',
    NOTIFICATIONS: 'Notifications',
    USER_SESSIONS: 'UserSessions',
    AUDIT_LOGS: 'AuditLogs',
    CATEGORIES: 'Categories',
    REGIONS: 'Regions',
    SERVICE_CENTERS: 'ServiceCenters',
    PERMISSIONS: 'Permissions',
    ROLES: 'Roles',
    COMPLAINT_STATUS_HISTORY: 'ComplaintStatusHistory',
    DASHBOARD_METRICS: 'DashboardMetrics',
    ANALYTICS_DATA: 'AnalyticsData',
    CUSTOMER_PORTAL: 'CustomerPortal',
    WORK_TASKS: 'WorkTasks',
    COMPLAINT_TAGS: 'ComplaintTags',
    COMPLAINT_ATTACHMENTS: 'ComplaintAttachments',
    COMPLAINT_NOTES: 'ComplaintNotes',
    SYSTEM_SETTINGS: 'SystemSettings',
    REFERENCE_DATA: 'ReferenceData'
  },
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    TECHNICIAN: 'technician',
    CUSTOMER: 'customer'
  },
  COMPLAINT_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    CANCELLED: 'cancelled'
  },
  COMPLAINT_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  COMPLAINT_CATEGORIES: {
    POWER_OUTAGE: 'power_outage',
    BILLING_ISSUE: 'billing_issue',
    METER_PROBLEM: 'meter_problem',
    CONNECTION_REQUEST: 'connection_request',
    VOLTAGE_FLUCTUATION: 'voltage_fluctuation',
    EQUIPMENT_DAMAGE: 'equipment_damage'
  }
};

/**
 * Main request handlers
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const callback = params.callback || null;
    const action = params.action;
    const token = params.token;

    if (!action) {
      return jsonp(callback, { success: false, error: 'Action required' });
    }

    // Open spreadsheet and required sheets
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const userSheet = ss.getSheetByName(CONFIG.TABLES.USERS) || ss.insertSheet(CONFIG.TABLES.USERS);
    const complaintSheet = ss.getSheetByName(CONFIG.TABLES.COMPLAINTS) || ss.insertSheet(CONFIG.TABLES.COMPLAINTS);
    const sessionSheet = ss.getSheetByName(CONFIG.TABLES.USER_SESSIONS) || ss.insertSheet(CONFIG.TABLES.USER_SESSIONS);
    const notificationSheet = ss.getSheetByName(CONFIG.TABLES.NOTIFICATIONS) || ss.insertSheet(CONFIG.TABLES.NOTIFICATIONS);

    // Initialize headers if sheets are empty
    if (userSheet.getLastRow() === 0) {
      userSheet.appendRow(['ID', 'Name', 'Email', 'PasswordHash', 'Role', 'Region', 'ServiceCenter', 'Phone', 'IsActive', 'AccountLocked', 'FailedLoginAttempts', 'LastLogin', 'LoginCount', 'CreatedAt', 'UpdatedAt', 'CreatedBy', 'Metadata']);
    }
    if (complaintSheet.getLastRow() === 0) {
      complaintSheet.appendRow(['ID', 'CustomerID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt', 'Region', 'ServiceCenter']);
    }
    if (sessionSheet.getLastRow() === 0) {
      sessionSheet.appendRow(['Token', 'UserID', 'CreatedAt', 'ExpiresAt']);
    }
    if (notificationSheet.getLastRow() === 0) {
      notificationSheet.appendRow(['ID', 'Title', 'Message', 'Type', 'Priority', 'IsRead', 'CreatedAt', 'RelatedComplaintId', 'ActionRequired']);
    }

    // Validate session for protected actions
    if (action !== 'login' && action !== 'healthCheck') {
      const session = validateSession(token, sessionSheet, userSheet);
      if (!session.success) {
        return jsonp(callback, { success: false, error: session.error || 'Invalid or missing token' });
      }
    }

    // Route actions (reuse existing handlers, unwrapping their JSON)
    switch (action) {
      case 'healthCheck':
        return jsonp(callback, { success: true, data: { version: CONFIG.VERSION }, message: 'System online' });
      case 'validateSession': {
        const session = validateSession(token, sessionSheet, userSheet);
        if (!session.success) {
          return jsonp(callback, session);
        }
        return jsonp(callback, { success: true, data: session.data, message: 'Valid session' });
      }
      case 'login':
        return jsonp(callback, unwrap(handleLogin(params, userSheet, sessionSheet)));
      case 'getUsers':
        return jsonp(callback, unwrap(handleGetUsers(userSheet, params)));
      case 'createUser':
        return jsonp(callback, unwrap(handleCreateUser(userSheet, params, sessionSheet)));
      case 'updateUser':
        return jsonp(callback, unwrap(handleUpdateUser(userSheet, params)));
      case 'deleteUser':
        return jsonp(callback, unwrap(handleDeleteUser(userSheet, params)));
      case 'getComplaints': {
        const raw = unwrap(handleGetComplaints(complaintSheet, params));
        if (raw && raw.success) {
          const arr = raw.data && raw.data.complaints ? raw.data.complaints : (Array.isArray(raw.data) ? raw.data : []);
          return jsonp(callback, { success: true, data: arr, message: raw.message || 'Success', pagination: raw.data ? raw.data.pagination : undefined });
        }
        return jsonp(callback, raw || { success: false, error: 'Unknown error' });
      }
      case 'createComplaint':
        return jsonp(callback, unwrap(handleCreateComplaint(complaintSheet, params, sessionSheet)));
      case 'updateComplaint':
        return jsonp(callback, unwrap(handleUpdateComplaint(complaintSheet, params)));
      case 'deleteComplaint':
        return jsonp(callback, unwrap(handleDeleteComplaint(complaintSheet, params)));
      case 'getNotifications': {
        const data = notificationSheet.getDataRange().getValues();
        const notifications = data.slice(1).map(row => ({
          id: row[0],
          title: row[1],
          message: row[2],
          type: row[3] || 'system',
          priority: row[4] || 'low',
          isRead: row[5] === true,
          createdAt: row[6],
          relatedComplaintId: row[7] || '',
          actionRequired: row[8] === true
        }));
        return jsonp(callback, { success: true, data: { notifications }, message: 'Success' });
      }
      case 'getDashboardData': {
        // Compute simple metrics from complaints
        const data = complaintSheet.getDataRange().getValues();
        const complaints = data.slice(1).map(row => ({
          status: (row[6] || 'open').toString().toLowerCase(),
          priority: (row[5] || 'medium').toString().toLowerCase(),
          region: (row[10] || '').toString()
        }));
        const countBy = (arr, key) => arr.reduce((m, x) => { m[x[key]] = (m[x[key]] || 0) + 1; return m; }, {});
        const statusCounts = countBy(complaints, 'status');
        const priorityCounts = countBy(complaints, 'priority');
        const metrics = {
          complaints: {
            total: complaints.length,
            open: statusCounts.open || 0,
            inProgress: statusCounts.in_progress || statusCounts['in progress'] || 0,
            resolved: statusCounts.resolved || 0,
            closed: statusCounts.closed || 0,
            pending: statusCounts.pending || 0,
            escalated: statusCounts.escalated || 0,
            cancelled: statusCounts.cancelled || 0,
            critical: priorityCounts.critical || 0,
            high: priorityCounts.high || 0,
            medium: priorityCounts.medium || 0,
            low: priorityCounts.low || 0,
            todayCount: 0,
            yesterdayCount: 0,
            weekCount: 0,
            lastWeekCount: 0,
            monthCount: 0,
            lastMonthCount: 0,
            yearCount: 0,
          },
          performance: {
            resolutionRate: 85,
            avgResolutionTime: 36,
            customerSatisfaction: 90,
            responseTime: 3.5,
            firstResponseTime: 1.2,
            escalationRate: 5,
          },
          trends: {
            complaintsChange: 5,
            resolutionChange: 3,
            responseChange: -2,
            satisfactionChange: 1,
          },
          users: { total: 0, active: 0, online: 0 },
          dateFilters: { today: 0, yesterday: 0, thisWeek: 0, lastWeek: 0, thisMonth: 0, lastMonth: 0, thisYear: 0 }
        };
        return jsonp(callback, { success: true, data: metrics, message: 'Success' });
      }
      default:
        return jsonp(callback, { success: false, error: 'Invalid action' });
    }
  } catch (error) {
    Logger.log('Error: ' + (error && error.message ? error.message : error));
    const cb = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;
    return jsonp(cb, { success: false, error: 'Server error: ' + (error && error.message ? error.message : error) });
  }
}

// Helper: wrap handler output (ContentService TextOutput) into plain object
function unwrap(output) {
  try {
    return JSON.parse(output.getContent());
  } catch (e) {
    return { success: false, error: 'Invalid server response' };
  }
}



// Helper: JSONP response
function jsonp(callback, obj) {
  const body = JSON.stringify(obj);
  const output = callback
    ? ContentService.createTextOutput(`${callback}(${body})`).setMimeType(ContentService.MimeType.JAVASCRIPT)
    : ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);

  return output;
}

function doOptions() {
  return ContentService.createTextOutput("");
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData?.contents || '{}');
    const action = e.parameter.action;
    const token = params.token || e.parameter.token;

    if (!action) {
      return createErrorResponse('Action required');
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const userSheet = spreadsheet.getSheetByName(CONFIG.TABLES.USERS) || 
                     spreadsheet.insertSheet(CONFIG.TABLES.USERS);
    const complaintSheet = spreadsheet.getSheetByName(CONFIG.TABLES.COMPLAINTS) || 
                          spreadsheet.insertSheet(CONFIG.TABLES.COMPLAINTS);
    const sessionSheet = spreadsheet.getSheetByName(CONFIG.TABLES.USER_SESSIONS) || 
                        spreadsheet.insertSheet(CONFIG.TABLES.USER_SESSIONS);

    // Initialize sheets
    if (userSheet.getLastRow() === 0) {
      userSheet.appendRow(['ID', 'Name', 'Email', 'PasswordHash', 'Role', 'Region', 'ServiceCenter', 'Phone', 'IsActive', 'AccountLocked', 'FailedLoginAttempts', 'LastLogin', 'LoginCount', 'CreatedAt', 'UpdatedAt', 'CreatedBy', 'Metadata']);
    }
    if (complaintSheet.getLastRow() === 0) {
      complaintSheet.appendRow(['ID', 'CustomerID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt', 'Region', 'ServiceCenter']);
    }
    if (sessionSheet.getLastRow() === 0) {
      sessionSheet.appendRow(['Token', 'UserID', 'CreatedAt', 'ExpiresAt']);
    }

    // Validate token for protected actions
    if (action !== 'login' && action !== 'healthCheck') {
      const session = validateSession(token, sessionSheet, userSheet);
      if (!session.success) {
        return createErrorResponse(session.error || 'Invalid or missing token', 401);
      }
    }

    switch (action) {
      case 'healthCheck':
        return createSuccessResponse({ version: CONFIG.VERSION }, 'System online');
      case 'validateSession': {
        const session = validateSession(token, sessionSheet, userSheet);
        if (!session.success) {
          return createErrorResponse(session.error || 'Invalid or expired session', 401);
        }
        return createSuccessResponse(session.data, 'Valid session');
      }
      case 'login':
        return handleLogin(params, userSheet, sessionSheet);
      case 'getUsers':
        return handleGetUsers(userSheet, params);
      case 'createUser':
        return handleCreateUser(userSheet, params, sessionSheet);
      case 'updateUser':
        return handleUpdateUser(userSheet, params);
      case 'deleteUser':
        return handleDeleteUser(userSheet, params);
      case 'getComplaints':
        return handleGetComplaints(complaintSheet, params);
      case 'createComplaint':
        return handleCreateComplaint(complaintSheet, params, sessionSheet);
      case 'updateComplaint':
        return handleUpdateComplaint(complaintSheet, params);
      case 'deleteComplaint':
        return handleDeleteComplaint(complaintSheet, params);
      case 'importUsers':
        return handleImportUsers(userSheet, params);
      default:
        return createErrorResponse('Invalid action', 400);
    }
  } catch (error) {
    Logger.log('Error: ' + error.message);
    return createErrorResponse('Server error: ' + error.message, 500);
  }
}

/**
 * Response Helpers
 */
function createSuccessResponse(data, message = 'Success') {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: true, data, message })
  ).setMimeType(ContentService.MimeType.JSON);

  return output;
}

function createErrorResponse(error, statusCode = 400) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: false, error, message: error })
  ).setMimeType(ContentService.MimeType.JSON);

  return output;
}

/**
 * Session Validation
 */
function validateSession(token, sessionSheet, userSheet) {
  if (!token) {
    return { success: false, error: 'Session token required' };
  }
  const sessions = sessionSheet.getDataRange().getValues();
  const now = Date.now();
  const session = sessions.slice(1).find(row => row[0] === token && new Date(row[3]).getTime() > now);
  if (!session) {
    return { success: false, error: 'Invalid or expired session' };
  }
  const data = userSheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return { success: false, error: 'User sheet empty' };
  }
  const headers = data[0] || [];
  const idx = (name) => headers.indexOf(name);
  const idIdx = idx('ID') !== -1 ? idx('ID') : 0;
  const nameIdx = idx('Name') !== -1 ? idx('Name') : 1;
  const emailIdx = idx('Email') !== -1 ? idx('Email') : 2;
  const roleIdx = idx('Role');
  const regionIdx = idx('Region');
  const serviceCenterIdx = idx('ServiceCenter');
  const isActiveIdx = idx('IsActive');

  const userRow = data.slice(1).find(row => {
    const rowId = row[idIdx];
    const active = isActiveIdx === -1 ? true : row[isActiveIdx] === true;
    return rowId === session[1] && active;
  });

  if (!userRow) {
    return { success: false, error: 'User not found or inactive' };
  }

  return {
    success: true,
    data: {
      user: {
        id: userRow[idIdx],
        name: userRow[nameIdx],
        email: userRow[emailIdx],
        role: roleIdx !== -1 ? userRow[roleIdx] : (userRow[4] || userRow[3] || ''),
        region: regionIdx !== -1 ? userRow[regionIdx] : (userRow[5] || userRow[4] || ''),
        serviceCenter: serviceCenterIdx !== -1 ? userRow[serviceCenterIdx] : (userRow[6] || userRow[5] || '')
      }
    }
  };
}

/**
 * Salted SHA-256 hashing
 * Must match backend SecurityModule.hashPassword implementation:
 *   salt = provided (email) or default secret
 *   hashed = SHA256(password + salt)
 */
function hashPassword(password, salt) {
  var effectiveSalt = salt || 'eeu-complaint-jwt-secret-2025-enhanced';
  var salted = password + effectiveSalt;
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salted);
  return bytes.map(function (b) { return (b + 256).toString(16).slice(-2); }).join('');
}

/**
 * Authentication
 */
function handleLogin(params, userSheet, sessionSheet) {
  const { email, password } = params;
  if (!email || !password) {
    return createErrorResponse('Email and password required', 400);
  }
  const data = userSheet.getDataRange().getValues();
  if (!data || data.length === 0) {
    return createErrorResponse('No users found', 404);
  }
  const headers = data[0] || [];
  const idx = (name) => headers.indexOf(name);
  const idIdx = idx('ID') !== -1 ? idx('ID') : 0;
  const nameIdx = idx('Name') !== -1 ? idx('Name') : 1;
  const emailIdx = idx('Email') !== -1 ? idx('Email') : 2;
  const roleIdx = idx('Role');
  const regionIdx = idx('Region');
  const serviceCenterIdx = idx('ServiceCenter');
  const isActiveIdx = idx('IsActive');

  // Support both schema variants: plaintext Password or hashed PasswordHash
  const passwordIdx = idx('Password');
  const passwordHashIdx = idx('PasswordHash');

  // The seed script uses plaintext passwords. If Password exists, match directly.
  let userRow = data.slice(1).find(row => {
    const active = isActiveIdx === -1 ? true : row[isActiveIdx] === true;
    if (!active) return false;
    if (row[emailIdx] !== email) return false;
    if (passwordIdx !== -1) {
      return row[passwordIdx] === password; // plaintext match
    }
    if (passwordHashIdx !== -1) {
      const computed = hashPassword(password, email); // hash with email as salt
      return row[passwordHashIdx] === computed;
    }
    return false;
  });

  if (!userRow) {
    return createErrorResponse('Invalid credentials', 401);
  }

  const token = Utilities.getUuid();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CONFIG.SESSION_DURATION).toISOString();
  sessionSheet.appendRow([token, userRow[idIdx], createdAt, expiresAt]);

  return createSuccessResponse({
    user: {
      id: userRow[idIdx],
      name: userRow[nameIdx],
      email: userRow[emailIdx],
      role: roleIdx !== -1 ? userRow[roleIdx] : (userRow[4] || userRow[3] || ''),
      region: regionIdx !== -1 ? userRow[regionIdx] : (userRow[5] || userRow[4] || ''),
      serviceCenter: serviceCenterIdx !== -1 ? userRow[serviceCenterIdx] : (userRow[6] || userRow[5] || ''),
      isActive: isActiveIdx === -1 ? true : userRow[isActiveIdx],
      createdAt: (idx('CreatedAt') !== -1 ? userRow[idx('CreatedAt')] : '')
    },
    token
  }, 'Login successful');
}

/**
 * User CRUD
 */
function handleGetUsers(sheet, params) {
  const data = sheet.getDataRange().getValues();
  let users = data.slice(1).map(row => ({
    id: row[0],
    name: row[1],
    email: row[2],
    role: row[3],
    region: row[4],
    serviceCenter: row[5],
    isActive: row[6],
    createdAt: row[7]
  }));
  if (params.id) {
    users = users.filter(u => u.id == params.id);
    return users.length
      ? createSuccessResponse(users[0])
      : createErrorResponse('User not found', 404);
  }
  const page = parseInt(params.page || 1);
  const limit = parseInt(params.limit || CONFIG.PAGINATION_LIMIT);
  const start = (page - 1) * limit;
  const paginated = users.slice(start, start + limit);
  return createSuccessResponse({
    users: paginated,
    total: users.length,
    pagination: {
      page,
      limit,
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
      hasNext: start + limit < users.length,
      hasPrev: page > 1
    }
  });
}

function handleCreateUser(sheet, params, sessionSheet) {
  const { name, email, password, role, region, serviceCenter, token } = params;
  if (!name || !email || !password) {
    return createErrorResponse('Name, email, and password required', 400);
  }
  const session = validateSession(token, sessionSheet, sheet);
  if (!session.success || !['admin', 'manager'].includes(session.data.user.role)) {
    return createErrorResponse('Admin or manager access required', 403);
  }
  const id = 'USER-' + Utilities.getUuid().slice(0, 8);
  const createdAt = new Date().toISOString();
  sheet.appendRow([id, name, email, role || 'technician', region || '', serviceCenter || '', true, createdAt, password]);
  return createSuccessResponse({
    id, name, email, role: role || 'technician', region: region || '', serviceCenter: serviceCenter || '', isActive: true, createdAt
  }, 'User created', 201);
}

function handleUpdateUser(sheet, params) {
  const { id, userId, name, email, role, region, serviceCenter, isActive, token } = params;
  const userIdToUse = id || userId;
  if (!userIdToUse) {
    return createErrorResponse('User ID required', 400);
  }
  const session = validateSession(token, sheet.getParent().getSheetByName(CONFIG.TABLES.USER_SESSIONS), sheet);
  if (!session.success || !['admin', 'manager'].includes(session.data.user.role)) {
    return createErrorResponse('Admin or manager access required', 403);
  }
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.slice(1).findIndex(row => row[0] == userIdToUse) + 2;
  if (rowIndex < 2) {
    return createErrorResponse('User not found', 404);
  }
  const existing = data[rowIndex - 1];
  const updatedRow = [
    userIdToUse,
    name || existing[1],
    email || existing[2],
    role || existing[3],
    region || existing[4],
    serviceCenter || existing[5],
    isActive !== undefined ? isActive : existing[6],
    existing[7],
    existing[8]
  ];
  sheet.getRange(rowIndex, 1, 1, 9).setValues([updatedRow]);
  return createSuccessResponse({
    id: updatedRow[0],
    name: updatedRow[1],
    email: updatedRow[2],
    role: updatedRow[3],
    region: updatedRow[4],
    serviceCenter: updatedRow[5],
    isActive: updatedRow[6],
    createdAt: updatedRow[7]
  }, 'User updated');
}

function handleDeleteUser(sheet, params) {
  const { id, userId, token } = params;
  const userIdToUse = id || userId;
  if (!userIdToUse) {
    return createErrorResponse('User ID required', 400);
  }
  const session = validateSession(token, sheet.getParent().getSheetByName(CONFIG.TABLES.USER_SESSIONS), sheet);
  if (!session.success || !['admin'].includes(session.data.user.role)) {
    return createErrorResponse('Admin access required', 403);
  }
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.slice(1).findIndex(row => row[0] == userIdToUse) + 2;
  if (rowIndex < 2) {
    return createErrorResponse('User not found', 404);
  }
  sheet.deleteRow(rowIndex);
  return createSuccessResponse({}, 'User deleted');
}

/**
 * Complaint CRUD
 */
function handleGetComplaints(sheet, params) {
  const data = sheet.getDataRange().getValues();
  let complaints = data.slice(1).map(row => ({
    id: row[0],
    customerId: row[1],
    title: row[2],
    description: row[3],
    category: row[4],
    priority: row[5],
    status: row[6],
    createdBy: row[7],
    createdAt: row[8],
    updatedAt: row[9],
    region: row[10],
    serviceCenter: row[11]
  }));
  if (params.id) {
    complaints = complaints.filter(c => c.id == params.id);
    return complaints.length
      ? createSuccessResponse(complaints[0])
      : createErrorResponse('Complaint not found', 404);
  }
  const page = parseInt(params.page || 1);
  const limit = parseInt(params.limit || CONFIG.PAGINATION_LIMIT);
  const start = (page - 1) * limit;
  const paginated = complaints.slice(start, start + limit);
  return createSuccessResponse({
    complaints: paginated,
    total: complaints.length,
    pagination: {
      page,
      limit,
      total: complaints.length,
      totalPages: Math.ceil(complaints.length / limit),
      hasNext: start + limit < complaints.length,
      hasPrev: page > 1
    }
  });
}

function handleCreateComplaint(sheet, params, sessionSheet) {
  const { customerId, title, description, category, priority, createdBy, region, serviceCenter, token } = params;
  if (!title || !description || !category || !createdBy) {
    return createErrorResponse('Title, description, category, and createdBy required', 400);
  }
  const session = validateSession(token, sessionSheet, sheet.getParent().getSheetByName(CONFIG.TABLES.USERS));
  if (!session.success) {
    return createErrorResponse('Invalid or missing token', 401);
  }
  const id = 'CMP-' + Utilities.getUuid().slice(0, 8);
  const now = new Date().toISOString();
  sheet.appendRow([id, customerId || 'N/A', title, description, category, priority || 'medium', 'open', createdBy, now, now, region || '', serviceCenter || '']);
  return createSuccessResponse({
    id, customerId: customerId || 'N/A', title, description, category, priority: priority || 'medium', status: 'open', createdBy, createdAt: now, updatedAt: now, region: region || '', serviceCenter: serviceCenter || ''
  }, 'Complaint created', 201);
}

function handleUpdateComplaint(sheet, params) {
  const { id, title, description, category, priority, status, token } = params;
  if (!id) {
    return createErrorResponse('Complaint ID required', 400);
  }
  const session = validateSession(token, sheet.getParent().getSheetByName(CONFIG.TABLES.USER_SESSIONS), sheet.getParent().getSheetByName(CONFIG.TABLES.USERS));
  if (!session.success) {
    return createErrorResponse('Invalid or missing token', 401);
  }
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.slice(1).findIndex(row => row[0] == id) + 2;
  if (rowIndex < 2) {
    return createErrorResponse('Complaint not found', 404);
  }
  const existing = data[rowIndex - 1];
  const updatedRow = [
    id,
    existing[1],
    title || existing[2],
    description || existing[3],
    category || existing[4],
    priority || existing[5],
    status || existing[6],
    existing[7],
    existing[8],
    new Date().toISOString(),
    existing[10],
    existing[11]
  ];
  sheet.getRange(rowIndex, 1, 1, 12).setValues([updatedRow]);
  return createSuccessResponse({
    id: updatedRow[0],
    customerId: updatedRow[1],
    title: updatedRow[2],
    description: updatedRow[3],
    category: updatedRow[4],
    priority: updatedRow[5],
    status: updatedRow[6],
    createdBy: updatedRow[7],
    createdAt: updatedRow[8],
    updatedAt: updatedRow[9],
    region: updatedRow[10],
    serviceCenter: updatedRow[11]
  }, 'Complaint updated');
}

function handleDeleteComplaint(sheet, params) {
  const { id, token } = params;
  if (!id) {
    return createErrorResponse('Complaint ID required', 400);
  }
  const session = validateSession(token, sheet.getParent().getSheetByName(CONFIG.TABLES.USER_SESSIONS), sheet.getParent().getSheetByName(CONFIG.TABLES.USERS));
  if (!session.success || !['admin', 'manager'].includes(session.data.user.role)) {
    return createErrorResponse('Admin or manager access required', 403);
  }
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.slice(1).findIndex(row => row[0] == id) + 2;
  if (rowIndex < 2) {
    return createErrorResponse('Complaint not found', 404);
  }
  sheet.deleteRow(rowIndex);
  return createSuccessResponse({}, 'Complaint deleted');
}

/**
 * Import Users
 */
function handleImportUsers(sheet, params) {
  const { usersJson, token } = params;
  if (!usersJson) {
    return createErrorResponse('usersJson required', 400);
  }
  const session = validateSession(token, sheet.getParent().getSheetByName(CONFIG.TABLES.USER_SESSIONS), sheet);
  if (!session.success || session.data.user.role !== 'admin') {
    return createErrorResponse('Admin access required', 403);
  }
  const users = JSON.parse(usersJson);
  users.forEach(user => {
    sheet.appendRow([
      user.id,
      user.name,
      user.email,
      user.passwordHash,
      user.role,
      user.region || '',
      user.serviceCenter || '',
      user.phone || '',
      user.isActive,
      user.accountLocked,
      user.failedLoginAttempts,
      user.lastLogin || '',
      user.loginCount,
      user.createdAt,
      user.updatedAt,
      user.createdBy,
      JSON.stringify(user.metadata || {})
    ]);
  });
  return createSuccessResponse({}, `Imported ${users.length} users`);
}
