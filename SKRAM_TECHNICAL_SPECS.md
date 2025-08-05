# SKRAM Technical Specifications
**Developer Reference for Integration and Technical Documentation**

## API Architecture Overview

### Core Endpoints Summary
- **120+ REST API endpoints** with comprehensive Swagger documentation
- **Real-time WebSocket communication** for instant messaging
- **File upload/download** with Google Cloud Storage integration
- **Authentication & session management** with Passport.js
- **Role-based access control** with granular permissions

### Base URL Structure
```
Production: https://your-domain.replit.app
Development: http://localhost:5000
WebSocket: wss://your-domain.replit.app/ws
API Documentation: https://your-domain.replit.app/api-docs
```

## Authentication & Security

### Authentication Methods
1. **Replit Auth Integration** (Primary)
2. **Custom Username/Password** (Secondary)
3. **Token-based Password Reset** (Recovery)

### Session Management
- Express sessions with PostgreSQL storage
- Secure cookie configuration
- Session timeout and renewal
- Cross-origin request handling

### Security Headers
```javascript
{
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

## Database Schema

### Core Tables
- `users`: User profiles and authentication
- `workforces`: Organization management
- `workforce_members`: User-organization relationships
- `conversations`: Chat rooms and direct messages
- `messages`: All message content with encryption
- `phi_access_logs`: HIPAA compliance audit trails
- `message_reactions`: Emoji reactions system

### Key Relationships
```sql
users → workforce_members → workforces
users → conversation_members → conversations
conversations → messages → phi_access_logs
messages → message_reactions
```

## Real-Time Communication

### WebSocket Events
```typescript
// Client to Server
{
  type: "authenticate",
  userId: string
}
{
  type: "join_conversation", 
  conversationId: string
}
{
  type: "send_message",
  content: string,
  conversationId: string
}
{
  type: "typing_start" | "typing_stop",
  conversationId: string
}

// Server to Client
{
  type: "authenticated",
  success: boolean
}
{
  type: "new_message",
  message: MessageObject
}
{
  type: "typing_indicator",
  userId: string,
  isTyping: boolean
}
```

### Connection Management
- Automatic reconnection with exponential backoff
- User presence tracking
- Typing indicators with debouncing
- Message delivery confirmation

## File Storage System

### Google Cloud Storage Integration
```typescript
// Upload Configuration
{
  bucket: "repl-default-bucket-{REPL_ID}",
  directories: {
    public: "/public",
    private: "/.private"
  },
  maxFileSize: "50MB",
  allowedTypes: ["image/*", "application/pdf", "text/*"]
}
```

### File Access Control
- Signed URL generation for secure access
- User authentication required for all files
- Automatic cleanup of expired attachments
- Virus scanning integration ready

## PHI & HIPAA Compliance

### Data Classification Levels
1. **Normal**: Standard business communication
2. **Confidential**: Internal sensitive information  
3. **Restricted**: Limited access information
4. **Classified**: Highest security level

### PHI Handling Workflow
```typescript
interface PHIMessage {
  phiTypes: string[];          // ["patient_name", "insurance_card", "patient_dob"]
  phiDescription?: string;     // Additional context
  patientFirstName?: string;   // Patient identification
  patientLastName?: string;    // Patient identification
  requiresAuthentication: boolean;
  accessPassword?: string;     // Hashed password for access
}
```

### Audit Trail Structure
```typescript
interface PHIAccessLog {
  messageId: string;
  userId: string;
  userEmail: string;
  workforceName: string;
  accessTime: Date;
  activityType: "upload" | "view" | "download" | "authenticate_success" | "authenticate_failure";
  phiTypes: string[];
  patientFirstName?: string;
  patientLastName?: string;
  success: boolean;
  authMethod: string;
  ipAddress?: string;
  userAgent?: string;
}
```

## Message Processing Pipeline

### Standard Message Flow
1. Client sends message via WebSocket
2. Server validates user authentication
3. Message encrypted and stored in database
4. Real-time broadcast to conversation members
5. Automatic expiration scheduling (24 hours default)

### PHI Message Flow
1. Client initiates PHI message creation
2. PHI modal captures required information
3. Server validates PHI data and user permissions
4. Message stored with PHI classifications
5. Access attempt logged to audit trail
6. Encrypted delivery to authorized recipients

## Performance Specifications

### Response Time Targets
- API endpoints: < 200ms average
- WebSocket message delivery: < 50ms
- File upload processing: < 2 seconds
- Database queries: < 100ms average

### Scalability Metrics
- Concurrent users: 1000+ per instance
- Messages per second: 500+ throughput
- File storage: Unlimited via Google Cloud
- Database connections: 100 concurrent max

## Integration Capabilities

### External Service APIs
```typescript
// Email Integration (SendGrid)
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  templates: {
    invitation: string;
    passwordReset: string;
    phiAlert: string;
  }
}

// SMS Integration (Twilio)
interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}
```

### Webhook Support (Planned)
- Message creation events
- User authentication events
- PHI access alerts
- File upload notifications

## Development Environment

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
PGPORT=5432
PGUSER=postgres
PGPASSWORD=...
PGDATABASE=...
PGHOST=...

# Authentication
REPLIT_CLUSTER=...
REPLIT_DB_URL=...

# File Storage
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_CLOUD_BUCKET_NAME=...
GOOGLE_APPLICATION_CREDENTIALS=...

# External Services
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Security
NODE_ENV=production
SESSION_SECRET=...
ENCRYPTION_KEY=...
```

### Local Development Setup
```bash
# Install dependencies
npm install

# Database setup
npm run db:push

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Monitoring & Analytics

### Built-in Analytics
- User activity tracking
- Message volume statistics
- PHI access frequency
- Failed authentication attempts
- System performance metrics

### Logging Levels
```typescript
enum LogLevel {
  ERROR = "error",      // System errors and failures
  WARN = "warn",        // Security warnings and unusual activity
  INFO = "info",        // General application flow
  DEBUG = "debug"       // Detailed debugging information
}
```

## Deployment Specifications

### Production Requirements
- Node.js 20+ runtime environment
- PostgreSQL 14+ database
- Google Cloud Storage account
- SSL/TLS certificate
- CDN for static assets (recommended)

### Scaling Considerations
- Horizontal scaling with load balancer
- Database read replicas for analytics
- Redis for session storage (enterprise)
- Message queue for high-volume processing

### Backup & Recovery
- Automated daily database backups
- File storage versioning
- Point-in-time recovery capability
- Disaster recovery procedures

## Security Audit Points

### Regular Security Checks
- Authentication bypass attempts
- SQL injection vulnerability scans
- XSS and CSRF protection validation
- File upload security verification
- Session management security

### Compliance Monitoring
- PHI access audit reviews
- User permission validation
- Data retention policy enforcement
- Encryption key rotation
- Security incident response

## Future Roadmap

### Planned Features
- Two-factor authentication (2FA)
- Advanced message encryption
- Push notifications via Service Workers
- Mobile app development
- Advanced analytics dashboard
- API rate limiting
- Enterprise SSO integration

### Performance Improvements
- Message caching system
- Database query optimization
- CDN integration for files
- WebSocket connection pooling
- Background job processing

---

*This technical specification provides developers with comprehensive information for understanding, integrating with, or extending the SKRAM application. All specifications reflect the current implementation as of August 2025.*