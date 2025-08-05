# SKRAM System Overview - Complete Architecture & API Documentation (Updated August 2025)

## System Description
SKRAM is an advanced enterprise communication platform designed for secure, intelligent healthcare collaboration with comprehensive PHI handling and HIPAA-compliant messaging capabilities. The system features real-time messaging, encrypted file storage, role-based access control, and comprehensive audit trails.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     SKRAM SECURE MESSAGING PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    HTTP/WebSocket    ┌──────────────────────────────────┐  │
│  │   FRONTEND      │◄──────────────────►  │         BACKEND                  │  │
│  │                 │                       │                                  │  │
│  │ React 18 + TS   │                       │ Node.js/Express + WebSocket     │  │
│  │ • Chat UI       │                       │ • REST API (120+ endpoints)     │  │
│  │ • Admin Panels  │                       │ • Real-time Messaging           │  │
│  │ • PHI Modals    │                       │ • Dual Authentication           │  │
│  │ • File Upload   │                       │ • PHI Compliance Engine         │  │
│  │ • Mobile UI     │                       │ • Auto Message Deletion         │  │
│  └─────────────────┘                       └──────────────────────────────────┘  │
│                                                          │                       │
│                                                          │                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                           DATA LAYER                                       │  │
│  │                                                                             │  │
│  │  ┌──────────────────┐              ┌─────────────────────────────────────┐  │  │
│  │  │   PostgreSQL     │              │      Google Cloud Storage          │  │  │
│  │  │  (Neon Database) │              │                                     │  │  │
│  │  │ • Users/Auth     │              │ • File Attachments (.private/)     │  │  │
│  │  │ • Messages       │              │ • PHI Documents w/ Audit           │  │  │
│  │  │ • Conversations  │              │ • Signed URL Access Control        │  │  │
│  │  │ • PHI Audit Logs │              │ • Automatic Activity Logging       │  │  │
│  │  │ • Workforce Data │              │ • Patient Data Preservation        │  │  │
│  │  │ • Sessions       │              │ • HIPAA-Compliant Storage          │  │  │
│  │  └──────────────────┘              └─────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │                        EXTERNAL SERVICES                                   │  │
│  │                                                                             │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │  │ Replit Auth │  │  SendGrid   │  │   Twilio    │  │ Neon Database   │   │  │
│  │  │ (OIDC)      │  │ (Email)     │  │ (SMS)       │  │ (PostgreSQL)    │   │  │
│  │  │ Master Admin│  │ Invitations │  │ Invitations │  │ Production DB   │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Interconnections

### 1. Frontend ↔ Backend Communication

#### **REST API Endpoints (120+ Total)**
```
┌─────────────────────┐         ┌─────────────────────────────────┐
│    Frontend Page    │   API   │       Backend Endpoint          │
├─────────────────────┤  Calls  ├─────────────────────────────────┤
│ Login Page          │ ──────► │ POST /api/auth/signin           │
│ Registration        │ ──────► │ POST /api/auth/signup           │
│ Password Reset      │ ──────► │ POST /api/auth/reset-password   │
│ Chat Interface      │ ──────► │ GET /api/conversations          │
│ Message Sending     │ ──────► │ POST /api/messages              │
│ PHI Message Modal   │ ──────► │ POST /api/messages/secure       │
│ File Upload         │ ──────► │ POST /api/attachments/upload    │
│ File Serving        │ ──────► │ GET /api/attachments/serve/{id} │
│ Admin Dashboard     │ ──────► │ GET /api/admin/analytics        │
│ PHI Access Logs     │ ──────► │ GET /api/phi-access-logs        │
│ Workforce Mgmt      │ ──────► │ GET /api/workforces             │
│ Member Invitations  │ ──────► │ POST /api/workforces/invite     │
│ Demo Login          │ ──────► │ POST /api/demo/login            │
│ User Profile        │ ──────► │ PATCH /api/user/username        │
│ Admin Pwd Reset     │ ──────► │ PUT /api/admin/reset-password   │
│ Cross-Workforce     │ ──────► │ GET /api/admin/cross-workforce  │
│ API Documentation   │ ──────► │ GET /api-docs (Swagger UI)      │
└─────────────────────┘         └─────────────────────────────────┘
```

#### **WebSocket Real-time Communication**
```
Client WebSocket ←────────────────────────→ Server WebSocket
                                           
Events Sent:                     Events Received:
• authenticate                   • authenticated
• join_conversation             • new_message
• send_message                  • message_updated
• typing_start                  • user_typing
• typing_stop                   • typing_stopped
```

### 2. Backend ↔ Database Integration

#### **Drizzle ORM Operations**
```
Backend Service          Database Table           Purpose
├─────────────────────   ├──────────────────────  ├─────────────────────────────
│ AuthService          │ │ users                │ │ User authentication/profiles
│ ConversationService  │ │ conversations        │ │ Chat room management
│ MessageService       │ │ messages             │ │ Message storage/retrieval
│ WorkforceService     │ │ workforce_members    │ │ Organization membership
│ PHIAuditService      │ │ phi_access_logs      │ │ HIPAA compliance logging
│ FileService          │ │ attachments metadata │ │ File reference tracking
└─────────────────────   └──────────────────────  └─────────────────────────────
```

### 3. Backend ↔ Object Storage Flow

#### **File Upload Process**
```
1. Client requests upload URL
   ├─► POST /api/attachments/upload-url
   
2. Backend generates signed URL
   ├─► Google Cloud Storage API
   ├─► Returns temporary upload URL
   
3. Client uploads directly to GCS
   ├─► PUT {signed_url}
   ├─► File stored in .private/attachments/
   
4. Client notifies completion
   ├─► POST /api/attachments/complete
   ├─► Backend updates database metadata
   
5. File access through backend
   ├─► GET /api/attachments/serve/{id}
   ├─► Backend generates signed download URL
   ├─► PHI access logging if applicable
```

## API Endpoint Mapping

### Authentication & User Management
```
Frontend Component          → API Endpoint              → Backend Handler
─────────────────────────────────────────────────────────────────────────
LoginForm                   → POST /api/auth/signin     → AuthController.signin()
ProfileSettings             → GET /api/auth/user        → AuthController.getUser()
UsernameUpdate              → PATCH /api/auth/user/username → AuthController.updateUsername()
LogoutButton               → GET /api/logout            → AuthController.logout()
```

### Messaging & Conversations
```
Frontend Component          → API Endpoint              → Backend Handler
─────────────────────────────────────────────────────────────────────────
ChatList                   → GET /api/conversations     → ConversationController.list()
MessageHistory             → GET /api/conversations/{id}/messages → MessageController.getHistory()
SendMessage                → POST /api/messages         → MessageController.create()
SecurePHIModal             → POST /api/messages/secure  → MessageController.createSecure()
MessageAuth                → POST /api/messages/authenticate-secure → MessageController.authenticate()
```

### File & Attachment Handling
```
Frontend Component          → API Endpoint              → Backend Handler
─────────────────────────────────────────────────────────────────────────
FileUploader               → POST /api/attachments/upload-url → AttachmentController.getUploadUrl()
AttachmentView             → GET /api/attachments/serve/{id} → AttachmentController.serve()
ImagePreview               → GET /api/attachments-proxy → AttachmentController.proxy()
```

### Admin & Audit Functions
```
Frontend Component          → API Endpoint              → Backend Handler
─────────────────────────────────────────────────────────────────────────
AdminDashboard             → GET /api/admin/analytics   → AdminController.getAnalytics()
PHIAccessLogs              → GET /api/phi-access-logs   → AuditController.getPHILogs()
MessageAuditModal          → GET /api/admin/message-details/{id} → AuditController.getMessageDetails()
UserManagement             → GET /api/admin/users       → AdminController.getUsers()
WorkforceManagement        → GET /api/workforces        → WorkforceController.list()
```

### Workforce & Organization
```
Frontend Component          → API Endpoint              → Backend Handler
─────────────────────────────────────────────────────────────────────────
WorkforceList              → GET /api/workforces        → WorkforceController.list()
MemberManagement           → GET /api/workforces/{id}/members → WorkforceController.getMembers()
UserInvitation             → POST /api/workforces/{id}/invite → WorkforceController.inviteUser()
RoleManagement             → PATCH /api/admin/users/{id}/role → AdminController.updateUserRole()
```

## Data Flow Architecture

### 1. Message Creation Flow
```
User Types Message
       ↓
Frontend Validation (Zod Schema)
       ↓
PHI Detection Modal (if applicable)
       ↓
POST /api/messages or /api/messages/secure
       ↓
Backend Authentication Check
       ↓
Database Insert (messages table)
       ↓
PHI Access Log (if secure message)
       ↓
WebSocket Broadcast to Conversation
       ↓
Real-time Update in Other Clients
```

### 2. File Upload Flow
```
User Selects File
       ↓
Frontend File Validation
       ↓
POST /api/attachments/upload-url
       ↓
Backend Generates Signed URL
       ↓
Direct Upload to Google Cloud Storage
       ↓
File Metadata Saved to Database
       ↓
File Reference Added to Message
       ↓
Attachment Available via /api/attachments/serve/{id}
```

### 3. PHI Access Audit Flow
```
User Accesses PHI Content
       ↓
Password Authentication Required
       ↓
POST /api/messages/authenticate-secure
       ↓
Backend Verifies Credentials
       ↓
PHI Access Log Created
       ↓
Content Delivered to User
       ↓
Admin Can View in PHI Access Logs
```

## System Dependencies

### Runtime Dependencies
```
Frontend Dependencies        Backend Dependencies        External Services
├─────────────────────       ├─────────────────────      ├─────────────────────
│ React 18               │   │ Express.js           │    │ PostgreSQL (Neon)  │
│ TypeScript             │   │ Node.js              │    │ Google Cloud Storage│
│ Wouter (Routing)       │   │ WebSocket (ws)       │    │ Replit Auth (OIDC) │
│ TanStack Query         │   │ Drizzle ORM          │    │ SendGrid (Optional) │
│ Radix UI + shadcn/ui   │   │ Passport.js          │    │ Twilio (Optional)   │
│ Tailwind CSS           │   │ TypeScript           │    │                     │
└─────────────────────       └─────────────────────      └─────────────────────
```

### Database Schema Relationships
```
users ←──────────────────┐
  │                      │
  │ (1:N)                │ (1:N)
  ↓                      ↓
workforce_members    messages ←──────────┐
  │                    │                │
  │ (N:1)              │ (N:1)          │ (1:N)
  ↓                    ↓                ↓
workforces       conversations   phi_access_logs
                       │
                       │ (1:N)
                       ↓
               conversation_members
```

## Security & Access Control

### Authentication Flow
```
1. User Login
   ├─► Custom Auth: Username/Password → Express Session
   └─► Replit Auth: OIDC → Passport Session

2. Session Management
   ├─► PostgreSQL Session Store
   ├─► Session Cookies
   └─► Dual Auth Support (Custom + Replit)

3. Authorization Checks
   ├─► Role-based Access (Master/Moderator/User)
   ├─► Workforce Boundaries
   └─► PHI Access Controls
```

### PHI Security Layers
```
1. Message Creation
   ├─► PHI Type Detection
   ├─► Patient Name Capture
   └─► Automatic Classification

2. Access Authentication
   ├─► Password Verification
   ├─► User Authorization
   └─► Audit Log Creation

3. File Security
   ├─► Signed URL Generation
   ├─► Temporary Access (1 hour)
   └─► Download Activity Logging
```

## Performance & Scalability

### Connection Management
```
WebSocket Connections
├─► User-based Connection Tracking
├─► Conversation Room Management
├─► Automatic Reconnection Logic
└─► Message Broadcasting Optimization

Database Connections
├─► Connection Pooling (Neon)
├─► Query Optimization (Drizzle ORM)
├─► Session Storage (PostgreSQL)
└─► Audit Log Batching
```

### File Storage Optimization
```
Google Cloud Storage
├─► Direct Client Uploads
├─► Signed URL Caching
├─► Automatic File Cleanup
└─► Bandwidth Optimization
```

This system overview shows how SKRAM operates as a cohesive platform with clear separation of concerns, secure data handling, and comprehensive audit capabilities for healthcare compliance.