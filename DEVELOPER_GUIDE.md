# SKRAM System - Developer Guide

## Overview
SKRAM is an enterprise-grade, secure messaging platform designed for healthcare workforce management with comprehensive PHI (Protected Health Information) handling and HIPAA-compliant audit capabilities. The system features real-time messaging, automatic message deletion, multi-role authentication, mobile-optimized interfaces, and comprehensive API documentation with 120+ endpoints.

## System Architecture

### 🏗️ Architecture Overview
```
Frontend (React/TypeScript) ←→ Backend (Node.js/Express) ←→ Database (PostgreSQL)
                             ↕
                        WebSocket Server
                             ↕
                     Google Cloud Storage
```

### 🛠️ Technology Stack

#### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query v5)
- **UI Components**: Radix UI primitives with shadcn/ui (New York variant)
- **Styling**: Tailwind CSS with custom design system and dark mode
- **Real-time**: WebSocket client integration
- **Mobile Optimization**: 44px touch targets, responsive design
- **Form Handling**: React Hook Form with Zod validation

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript with ES modules
- **Real-time**: Custom WebSocket server using 'ws' library
- **Session Management**: Express sessions with PostgreSQL storage
- **Authentication**: Dual system (Custom + Replit Auth with Passport.js)
- **API Documentation**: Comprehensive Swagger documentation (120+ endpoints)
- **Scheduling**: Node-cron for automatic message deletion

#### **Database & Storage**
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM with Drizzle Kit for schema management
- **Object Storage**: Google Cloud Storage (GCS) for file attachments
- **Session Store**: PostgreSQL-backed sessions via connect-pg-simple
- **File Access**: Signed URL system with automatic PHI logging

### 🔐 Authentication Systems

#### **Dual Authentication**
1. **Custom Username/Password**: For regular workforce members
2. **Replit Auth (OIDC)**: For master admin access using openid-client

#### **Role Hierarchy**
- **Master Admin**: System-wide access, cross-workforce management
- **Moderator**: Workforce-level admin privileges
- **Regular User**: Standard messaging and PHI access

### 🏥 PHI & HIPAA Compliance

#### **PHI Message Handling**
- **Secure Message Creation**: `/api/messages/secure` endpoint with comprehensive validation
- **Password Authentication**: User password verification for PHI access
- **Automatic Expiration**: 24-hour message lifecycle with cron job cleanup
- **Comprehensive Logging**: All PHI access logged with user, timestamp, IP, and content preservation
- **Patient Name Tracking**: Systematic capture and audit of patient identification data
- **Multi-Level Security**: Confidential, Restricted, and Classified message categories

#### **Audit System**
- **PHI Access Logs**: Complete audit trail in `phi_access_logs` table with filtering
- **Message Authentication**: Tracked via `secure_message_audit_logs` with user verification
- **File Download Tracking**: Attachment access with metadata preservation and automatic logging
- **HIPAA Compliance**: Patient name tracking, workforce identification, and regulatory reporting
- **Organization Filtering**: Dropdown-based filtering by workforce names for precise audit searches
- **Content Preservation**: Complete message details modal for regulatory compliance and forensic analysis



### 📁 File Storage & Object Management

#### **Google Cloud Storage Integration**
```javascript
// Core storage service
server/objectStorage.ts
server/objectAcl.ts
```

**Storage Architecture:**
- **Bucket Structure**: `.private/attachments/` for secure file storage
- **Signed URLs**: Temporary access URLs with automatic expiration
- **Access Control**: Role-based file access with workforce boundaries
- **Audit Integration**: Automatic logging of all file downloads for PHI compliance
- **File Serving**: `/api/attachments/serve/{id}` endpoint with authentication

#### **File Upload Flow**
1. **Client Upload**: File upload via React components with validation
2. **Server Processing**: File metadata extraction and storage path generation
3. **Cloud Storage**: Secure upload to Google Cloud Storage bucket
4. **Database Record**: File metadata stored in PostgreSQL with message association
5. **Access Control**: Signed URL generation for authorized access

### 📱 Mobile Optimization

#### **Mobile-First Design**
- **Touch Targets**: 44px minimum touch targets for all interactive elements
- **Responsive Layout**: Adaptive interfaces for different screen sizes
- **Chat Optimization**: Mobile-specific improvements for messaging interface
- **Navigation**: Collapsible elements and overlay sidebars for mobile
- **Performance**: Optimized loading and rendering for mobile devices

### 📊 API Documentation System

#### **Comprehensive Swagger Documentation**
- **120+ Endpoints**: Complete API coverage with detailed schemas
- **Interactive Testing**: Swagger UI for real-time API testing
- **Authentication Models**: Documentation for dual auth system
- **Role-Based Examples**: API examples for different user roles
- **Schema Definitions**: Complete data model documentation
- **Error Responses**: Comprehensive error handling documentation

#### **Key API Categories**
- **Authentication**: Sign in/up, password reset, demo login
- **Messaging**: Regular and secure message endpoints
- **Workforce Management**: User invitation and role management
- **PHI Compliance**: Audit logs and access tracking
- **File Management**: Upload, download, and access control
- **Admin Functions**: Cross-workforce management and analytics

#### **Storage Structure**
```
Bucket: replit-objstore-{REPL_ID}
├── .private/
│   └── attachments/
│       └── {uuid}.{extension}
└── public/
    └── assets/
```

#### **File Access Control**
- **Signed URLs**: Temporary access tokens (1-hour TTL)
- **Authentication Required**: All file access requires user authentication
- **PHI Logging**: Download activity logged for audit compliance

### 🌐 API Architecture

#### **RESTful Endpoints**
- **Authentication**: `/api/auth/*`
- **Messaging**: `/api/messages/*`, `/api/conversations/*`
- **PHI & Security**: `/api/messages/secure`, `/api/phi-access-logs`
- **Admin**: `/api/admin/*`
- **File Handling**: `/api/attachments/*`

#### **WebSocket Integration**
- **Real-time Messaging**: Custom WebSocket server on `/ws`
- **Connection Management**: User-based connection tracking
- **Message Broadcasting**: Conversation-scoped message distribution
- **Typing Indicators**: Real-time user activity

### 🗄️ Database Schema

#### **Core Tables**
```sql
-- User Management
users                    -- User accounts and profiles
workforce_members        -- Workforce memberships and roles
workforces              -- Organization/workforce definitions

-- Messaging
conversations           -- Chat conversations (group/direct)
conversation_members    -- Conversation participation
messages               -- All message content and metadata

-- Security & Audit
phi_access_logs        -- PHI access audit trail
secure_message_audit_logs -- Message authentication logs
```

#### **Key Relations**
- Users ←→ Workforce Members (many-to-many via workforce_members)
- Messages ←→ Conversations (one-to-many)
- PHI Logs ←→ Messages (one-to-many for audit)

### 🔗 System Interfaces

#### **External Services**
1. **Neon Database**: PostgreSQL hosting with connection pooling
2. **Google Cloud Storage**: File storage with signed URL access
3. **SendGrid**: Email service integration (optional)
4. **Twilio**: SMS service integration (optional)
5. **Replit Auth**: OIDC authentication provider

#### **Internal Communication**
```
Client ←→ Express API (REST/JSON)
Client ←→ WebSocket Server (Real-time)
Express ←→ PostgreSQL (Drizzle ORM)
Express ←→ Google Cloud Storage (GCS SDK)
```

### 📋 Environment Requirements

#### **Required Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Object Storage (Google Cloud)
PUBLIC_OBJECT_SEARCH_PATHS=/bucket-name/public
PRIVATE_OBJECT_DIR=/bucket-name/.private

# Optional Services
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### 🚀 Development Setup

#### **Prerequisites**
- Node.js 20+
- PostgreSQL database (Neon recommended)
- Google Cloud Storage bucket with service account

#### **Installation**
```bash
# Clone and install dependencies
npm install

# Database setup
npm run db:push

# Start development server
npm run dev
```

#### **Project Structure**
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Route components
│   │   └── lib/           # Utilities
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── objectStorage.ts   # File handling
│   └── index.ts           # Server entry
├── shared/                # Shared types
│   └── schema.ts          # Database schema
└── drizzle.config.ts      # Database configuration
```

### 🔧 Key Development Guidelines

#### **Database Operations**
- Use Drizzle ORM for all database interactions
- Run `npm run db:push` for schema changes
- Never use raw SQL migrations

#### **File Handling**
- All files stored in Google Cloud Storage
- Use signed URLs for temporary access
- Log all PHI-related file downloads

#### **PHI Compliance**
- Always log PHI access attempts
- Include patient names in secure messages
- Maintain complete audit trails
- Use password authentication for sensitive content

#### **Security**
- Validate all user inputs with Zod schemas
- Implement proper session management
- Use HTTPS in production
- Follow HIPAA guidelines for healthcare data

### 📊 Monitoring & Debugging

#### **Logging**
- Console logging for development
- PHI access logging to database
- WebSocket connection tracking
- File download activity logs

#### **Health Checks**
- Database connectivity via `/api/auth/user`
- Object storage via file upload/download
- WebSocket connectivity via client connection

### 🔄 Deployment Considerations

#### **Replit Deployment**
- Uses Replit's native deployment system
- Automatic HTTPS and domain management
- Built-in environment variable management
- Integrated object storage support

#### **Production Requirements**
- Google Cloud Storage service account
- PostgreSQL database with connection pooling
- Proper environment variable configuration
- HIPAA-compliant hosting environment

### 📚 API Documentation
Complete API documentation available at `/api-docs` with:
- All REST endpoints
- Request/response schemas
- Authentication requirements
- PHI and audit endpoints
- File handling operations

### 🆘 Troubleshooting

#### **Common Issues**
1. **File Access**: Ensure Google Cloud credentials are configured
2. **Database Connection**: Verify PostgreSQL connection string
3. **PHI Logging**: Check workforce membership for proper logging
4. **WebSocket**: Confirm authentication before message sending

#### **Debug Endpoints**
- `GET /api/auth/user` - User authentication status
- `GET /api/admin/analytics` - System health (Master Admin)
- `GET /api/phi-access-logs` - Audit trail verification

---

## Support & Maintenance

For technical issues or architecture questions, refer to:
- `/api-docs` for complete API reference
- `replit.md` for project-specific context
- Database schema in `shared/schema.ts`
- Authentication logic in `server/replitAuth.ts`

Last Updated: August 2025