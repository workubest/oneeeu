// EEU Complaint Management System - Seed Data Script
// Run this function once to populate the spreadsheet with initial test data

function seedInitialData() {
  const SHEET_ID = '1RlT-_2iWwzDHkRmhHAhFrtjCWL2frFz4AW-L0Znh_mQ';
  const ss = SpreadsheetApp.openById(SHEET_ID);
  
  // Clear existing data (optional - comment out if you want to keep existing data)
  // clearAllSheets(ss);
  
  // Seed users
  seedUsers(ss);
  
  // Seed complaints
  seedComplaints(ss);
  
  // Seed notifications
  seedNotifications(ss);
  
  Logger.log('Seed data completed successfully!');
}

function clearAllSheets(ss) {
  const sheetNames = ['Users', 'Complaints', 'Notifications', 'UserSessions'];
  sheetNames.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clear();
    }
  });
}

function seedUsers(ss) {
  const userSheet = ss.getSheetByName('Users') || ss.insertSheet('Users');
  
  // Initialize headers if needed
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(['ID', 'Name', 'Email', 'Password', 'Role', 'Region', 'ServiceCenter', 'Phone', 'IsActive', 'AccountLocked', 'FailedLoginAttempts', 'LastLogin', 'LoginCount', 'CreatedAt', 'UpdatedAt', 'CreatedBy', 'Metadata']);
  }
  
  const users = [
    ['USR-ADMIN-001', 'System Administrator', 'admin@eeu.gov.et', 'admin2025', 'admin', 'Addis Ababa', 'Head Office', '+251-11-123-4567', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', ''],
    ['USR-MGR-ADD-001', 'Addis Ababa Manager', 'manager.addis@eeu.gov.et', 'mgrAddis2025', 'manager', 'Addis Ababa', 'Addis Ababa Main', '+251-11-234-5678', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', ''],
    ['USR-MGR-DIR-001', 'Dire Dawa Manager', 'manager.dire@eeu.gov.et', 'mgrDire2025', 'manager', 'Dire Dawa', 'Dire Dawa Main', '+251-25-123-4567', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', ''],
    ['USR-STAFF-ADD-001', 'Almaz Tadesse', 'staff.addis@eeu.gov.et', 'staffAddis2025', 'staff', 'Addis Ababa', 'Customer Service Center', '+251-11-567-8901', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', ''],
    ['USR-TECH-ADD-001', 'Bereket Alemayehu', 'tech.addis@eeu.gov.et', 'techAddis2025', 'technician', 'Addis Ababa', 'Technical Services', '+251-11-890-1234', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', ''],
    ['USR-CUST-001', 'Meron Haile', 'customer@eeu.gov.et', 'cust2025', 'customer', 'Addis Ababa', 'General', '+251-91-123-4567', true, false, 0, '', 0, new Date().toISOString(), new Date().toISOString(), 'system', '']
  ];
  
  // Only add if no data exists (to avoid duplicates)
  if (userSheet.getLastRow() <= 1) {
    users.forEach(user => userSheet.appendRow(user));
    Logger.log(`Added ${users.length} users`);
  }
}

function seedComplaints(ss) {
  const complaintSheet = ss.getSheetByName('Complaints') || ss.insertSheet('Complaints');
  
  // Initialize headers if needed
  if (complaintSheet.getLastRow() === 0) {
    complaintSheet.appendRow(['ID', 'CustomerID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'CreatedBy', 'CreatedAt', 'UpdatedAt', 'Region', 'ServiceCenter']);
  }
  
  const complaints = [
    ['CMP-001', 'CUST-12345', 'Power outage in Bole area', 'Frequent power outages affecting multiple buildings in Bole subcity. Customers experiencing 3-4 hour blackouts daily.', 'power_outage', 'high', 'open', 'customer@eeu.gov.et', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Addis Ababa', 'Bole Service Center'],
    ['CMP-002', 'CUST-12346', 'Incorrect billing amount', 'Monthly bill shows unusually high consumption (850 kWh) despite normal usage patterns. Previous months averaged 300 kWh.', 'billing_issue', 'medium', 'in_progress', 'customer@eeu.gov.et', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Oromia', 'Adama Service Center'],
    ['CMP-003', 'CUST-12347', 'Meter reading discrepancy', 'Digital meter showing different readings when checked manually vs. automatic readings sent to billing system.', 'meter_problem', 'medium', 'pending', 'staff@eeu.gov.et', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Amhara', 'Bahir Dar Service Center'],
    ['CMP-004', 'CUST-12348', 'New connection request', 'Requesting new electrical connection for residential building. All documentation has been submitted as per requirements.', 'connection_request', 'low', 'resolved', 'customer@eeu.gov.et', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Tigray', 'Mekelle Service Center'],
    ['CMP-005', 'CUST-12349', 'Voltage fluctuation damage', 'Severe voltage fluctuations causing damage to home appliances. Multiple neighbors reporting similar issues.', 'voltage_fluctuation', 'critical', 'in_progress', 'technician@eeu.gov.et', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Dire Dawa', 'Dire Dawa Service Center'],
    ['CMP-006', 'CUST-12350', 'Street light not working', 'Street light on main road has been non-functional for 2 weeks, creating safety concerns for pedestrians.', 'equipment_damage', 'medium', 'open', 'manager@eeu.gov.et', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Addis Ababa', 'Central Office'],
    ['CMP-007', 'CUST-12351', 'Transformer noise complaint', 'Electrical transformer making loud humming noises, especially at night, disturbing residents in the area.', 'equipment_damage', 'low', 'closed', 'staff@eeu.gov.et', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Oromia', 'Adama Service Center'],
    ['CMP-008', 'CUST-12352', 'Billing system error', 'Account showing duplicate charges for the same billing period. Need immediate correction and refund.', 'billing_issue', 'high', 'pending', 'customer@eeu.gov.et', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), new Date().toISOString(), 'Amhara', 'Bahir Dar Service Center']
  ];
  
  // Only add if no data exists (to avoid duplicates)
  if (complaintSheet.getLastRow() <= 1) {
    complaints.forEach(complaint => complaintSheet.appendRow(complaint));
    Logger.log(`Added ${complaints.length} complaints`);
  }
}

function seedNotifications(ss) {
  const notificationSheet = ss.getSheetByName('Notifications') || ss.insertSheet('Notifications');
  
  // Initialize headers if needed
  if (notificationSheet.getLastRow() === 0) {
    notificationSheet.appendRow(['ID', 'Title', 'Message', 'Type', 'Priority', 'IsRead', 'CreatedAt', 'RelatedComplaintId', 'ActionRequired']);
  }
  
  const notifications = [
    ['NOT-001', 'Critical Outage Alert', 'Multiple power outages reported in Bole area affecting over 500 customers.', 'alert', 'critical', false, new Date(Date.now() - 30 * 60 * 1000).toISOString(), 'CMP-001', true],
    ['NOT-002', 'Billing Issue Resolution', 'Billing discrepancy for customer CUST-12346 has been investigated and resolved.', 'system', 'medium', false, new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 'CMP-002', false],
    ['NOT-003', 'New Connection Approved', 'Connection request CMP-004 has been approved and scheduled for installation.', 'info', 'low', true, new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), 'CMP-004', false],
    ['NOT-004', 'Equipment Maintenance Scheduled', 'Scheduled maintenance for transformer in Dire Dawa area this weekend.', 'warning', 'medium', false, new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), '', false],
    ['NOT-005', 'System Update Complete', 'Customer billing system has been successfully updated with latest patches.', 'system', 'low', true, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), '', false]
  ];
  
  // Only add if no data exists (to avoid duplicates)
  if (notificationSheet.getLastRow() <= 1) {
    notifications.forEach(notification => notificationSheet.appendRow(notification));
    Logger.log(`Added ${notifications.length} notifications`);
  }
}

// Helper function to test the API
function testAPI() {
  const url = 'https://script.google.com/macros/s/AKfycbzH8vR4L3mP2qN5tO6sU9wX1yV7zA8bC4dE2fG3hI5jK6lM7nO8pQ/exec';
  
  // Test health check
  const healthResponse = UrlFetchApp.fetch(url + '?action=healthCheck');
  Logger.log('Health Check Response:', healthResponse.getContentText());
  
  // Test login
  const loginResponse = UrlFetchApp.fetch(url + '?action=login&email=admin@eeu.gov.et&password=admin123');
  Logger.log('Login Response:', loginResponse.getContentText());
}