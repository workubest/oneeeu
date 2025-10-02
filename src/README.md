# EEU Complaint Management System

A comprehensive complaint management system for Ethiopian Electric Utility (EEU) with role-based access control and real-time data management.

## Features

- **User Authentication**: Secure login with JWT-based session management
- **Role-Based Access**: Admin, Manager, Staff, Technician, and Customer roles
- **Complaint Management**: Create, update, track, and resolve complaints
- **Real-time Dashboard**: Live metrics and performance indicators
- **Multi-language Support**: English and Amharic interface
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Google Sheets Backend**: No-server required, uses Google Apps Script

## Quick Start

### Frontend Setup

1. The frontend is already configured and ready to run
2. All components are integrated with the API service
3. Mock data has been replaced with real API calls

### Backend Setup (Google Apps Script)

1. **Create a Google Spreadsheet**:
   - Go to Google Sheets and create a new spreadsheet
   - Note the spreadsheet ID from the URL

2. **Set up Google Apps Script**:
   - Go to script.google.com
   - Create a new project
   - Copy the code from `/services/api.ts` backend module (the Google Apps Script code in the comments)
   - Save and deploy as a web app

3. **Configure API URL**:
   - Update the `BASE_URL` in `/services/api.ts` with your deployed script URL

4. **Seed Initial Data** (Optional):
   - Copy the seed script from `/services/seedData.gs`
   - Run `seedInitialData()` function once to populate test data

### Demo Accounts

The system comes with the following demo accounts:

- **Admin**: admin@eeu.gov.et / admin123
- **Manager**: manager@eeu.gov.et / manager123  
- **Staff**: staff@eeu.gov.et / staff123
- **Customer**: customer@eeu.gov.et / customer123
- **Technician**: technician@eeu.gov.et / tech123

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: React Context for authentication
- **API Client**: Custom service layer with JSONP support for CORS

### Backend (Google Apps Script)
- **Runtime**: Google Apps Script (JavaScript V8)
- **Database**: Google Sheets as database
- **Authentication**: JWT tokens with session management
- **API**: RESTful endpoints with JSONP support

### Data Model

#### Users
- ID, Name, Email, Password, Role, Region, ServiceCenter
- Account status and security tracking

#### Complaints  
- ID, CustomerID, Title, Description, Category, Priority, Status
- Timestamps, assignments, and location data

#### Notifications
- System alerts, complaint updates, and action items
- Priority levels and read status tracking

## API Endpoints

- `GET /exec?action=healthCheck` - System status
- `GET /exec?action=login` - User authentication
- `GET /exec?action=getComplaints` - Fetch complaints
- `POST /exec` with `action=createComplaint` - Create complaint
- `GET /exec?action=getDashboardData` - Dashboard metrics
- `GET /exec?action=getNotifications` - System notifications

## Security

- JWT-based authentication with session expiration
- Role-based access control for all operations
- Password hashing with salt
- Session validation for protected endpoints
- Rate limiting and request throttling

## Mobile Features

- Bottom navigation for easy thumb navigation
- Card-based layouts for touch interactions
- Responsive design that works on all screen sizes
- Optimized loading states and error handling
- Pull-to-refresh functionality (planned)

## EEU Branding

- Official orange (#f97316) and green (#22c55e) color scheme
- Ethiopian Electric Utility logo integration
- Amharic language support
- Utility-specific terminology and workflows

## Development

The system is designed to be easily extensible:

- Add new complaint categories in the API configuration
- Extend user roles and permissions
- Add new dashboard metrics and charts
- Implement additional notification types
- Integrate with external systems via API

## Support

Built for Ethiopian Electric Utility by WORKU MESAFINT ADDIS [504530].

For technical support or customization requests, refer to the development team.