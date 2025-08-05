# Senior Full-Stack Developer - Healthcare Communication Platform (SKRAM)

## About the Project
We're seeking an experienced full-stack developer to join our team building **SKRAM**, an advanced enterprise communication platform designed for secure healthcare collaboration with comprehensive PHI handling and HIPAA-compliant messaging capabilities.

SKRAM is a production-ready, real-time messaging system that handles sensitive healthcare data with the highest security standards. Our platform features end-to-end encryption, automatic message deletion, role-based access control, and comprehensive audit trails.

## What We've Built So Far
- **120+ RESTful API endpoints** with comprehensive Swagger documentation
- **Real-time messaging** with custom WebSocket server
- **Multi-role authentication system** (Regular User, Moderator, Master Admin)
- **PHI compliance engine** with HIPAA-compliant audit logging
- **Mobile-optimized interface** with 44px touch targets
- **Secure file storage** using Google Cloud Storage with signed URLs
- **Cross-workforce management** with granular access controls
- **Comprehensive testing suite** with multi-role validation

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Wouter** (lightweight React router)
- **TanStack Query** (React Query v5) for server state management
- **Radix UI primitives** with shadcn/ui components (New York variant)
- **Tailwind CSS** with custom design system and dark mode
- **React Hook Form** with Zod validation
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **Custom WebSocket server** using 'ws' library
- **Express sessions** with PostgreSQL storage
- **Dual authentication** (Custom + Replit Auth with Passport.js)
- **Node-cron** for automatic message deletion
- **Comprehensive Swagger documentation** (interactive API docs)

### Database & Storage
- **PostgreSQL** via Neon Database (managed, auto-scaling)
- **Drizzle ORM** with Drizzle Kit for schema management
- **Google Cloud Storage** for secure file attachments
- **PostgreSQL session store** via connect-pg-simple
- **Signed URL system** for secure file access

### External Services & APIs
- **Google Cloud Storage** (file storage with authentication)
- **SendGrid** (email service integration)
- **Twilio** (SMS service integration)
- **Replit Auth** (OIDC authentication provider)
- **Neon Database** (managed PostgreSQL)

## Key Areas Where We Need Help

### 1. **File Upload & Image Handling Issues**
**Critical Bug:** Regular messages not allowing users to send images
**What We Need:**
- Debug and fix image upload functionality for regular messages
- Ensure file attachments work consistently across all message types
- Verify object storage integration for file uploads

### 2. **PHI Data Pipeline & Patient Name Registration**
**Current Challenge:** 
- PHI not registering Patient First Name & Patient Last Name correctly
- Patient name data not persisting from PHI modal through API to database
- PHI logs working but patient data incomplete

**What We Need:**
- Debug data transformation pipeline between client PHI modal and database
- Ensure complete patient data preservation for HIPAA compliance
- Fix patient name capture and storage system

### 3. **Object Storage & File Management**
**Challenge:** Object Storage for files (images) needs verification and optimization
**What We Need:**
- Verify PHI logs work at all times with file attachments
- Ensure proper Google Cloud Storage integration
- Fix any file access or storage issues
- Implement proper file serving with authentication

### 4. **User Interface & Download Functionality**
**Issues:** 
- Click on Picture in PHI or Non-PHI makes it large, not downloadable
- Need proper image viewing and download capabilities

**What We Need:**
- Implement proper image modal with download functionality
- Fix image viewing experience across PHI and regular messages
- Ensure file download tracking works properly

### 5. **Message Encryption & Security**
**Requirements:**
- Messages encrypted in database in transit and at rest
- PHI messages must be encrypted with additional security layers
- Password Grid or Email Implementation for secure access

**What We Need:**
- Implement comprehensive message encryption
- Add secure password grid system for PHI access
- Email notification system integration

### 6. **Two-Factor Authentication & Enhanced Security**
**Critical Need:** Two-Factor Authentication implementation
**What We Need:**
- Gmail & Microsoft integration for authentication
- Enhanced authentication systems (no Replit dependency)
- Secure login flows with 2FA verification

### 7. **Production Database & Environment Setup**
**Requirements:**
- Production Database setup and migration
- Testing Environment (Sandbox) for safe development
- Proper environment separation and data management

### 8. **Push Notification System**
**Goal:** Real-time notifications even when app is closed
**What We Need:**
- Service Worker implementation for push notifications
- Encrypted notification payloads for PHI security
- Cross-platform notification support
- Integration with existing WebSocket system

## What You'll Be Working With

### Comprehensive Documentation
- **System Overview** with complete architecture diagrams
- **Developer Guide** with detailed setup instructions
- **API Reference** with 120+ documented endpoints
- **Testing Guide** with multi-role validation scenarios
- **Interactive Swagger UI** for API testing

### Existing Features You'll Enhance
- **Real-time messaging** with typing indicators and auto-scroll
- **File upload system** with Google Cloud Storage integration
- **PHI message creation** with security level categorization
- **Role-based dashboards** for different user types
- **Cross-workforce communication** with boundary controls
- **Automatic message deletion** (24-hour lifecycle)
- **Comprehensive audit logging** with detailed tracking

### Development Environment
- **Replit-hosted** development environment
- **Automated testing suite** with role-based scenarios
- **Hot reload** development server with Vite
- **PostgreSQL development database** with test data
- **Swagger documentation** for API testing
- **ESLint/TypeScript** for code quality

## Ideal Candidate Profile

### Required Experience
- **5+ years** full-stack JavaScript/TypeScript development
- **Strong React/Node.js** expertise with modern frameworks
- **PostgreSQL/SQL** database design and optimization
- **RESTful API** design and WebSocket implementation
- **File upload/storage systems** with cloud providers (Google Cloud, AWS)
- **Authentication systems** including 2FA implementation
- **Encryption** implementation for data in transit and at rest
- **Healthcare/HIPAA** experience strongly preferred

### Preferred Skills
- **Google Cloud Storage** integration and object storage
- **Email service integration** (SendGrid, Gmail API, Microsoft Graph)
- **Real-time applications** with WebSocket/Socket.io
- **Image/file handling** with proper download functionality
- **Service Workers** and Push Notification APIs
- **Production database** setup and environment management
- **Healthcare compliance** (HIPAA, PHI handling)
- **Security auditing** and encryption best practices

### Soft Skills
- **Problem-solving approach** to complex data pipeline issues
- **Security-conscious** development practices
- **Documentation-focused** with clear communication
- **Healthcare domain** understanding preferred
- **Independent work style** with thorough implementation approach

## What We Offer
- **Cutting-edge technology stack** with modern frameworks
- **Meaningful impact** in healthcare communication
- **Well-documented codebase** with comprehensive guides
- **Production-ready platform** with real users
- **Security-first environment** with HIPAA compliance
- **Remote-friendly** development setup

## Project Scope
This is a **contract/freelance opportunity** for an experienced developer who can:
- **Debug and enhance** existing systems
- **Implement new features** with high-quality standards
- **Maintain security standards** in healthcare environment
- **Work independently** with comprehensive documentation
- **Deliver production-ready code** with proper testing

## Next Steps
If you're excited about building secure healthcare communication tools and have experience with our technology stack, we'd love to hear from you.

**Please include in your application:**
1. **File upload/storage experience** with Google Cloud or similar platforms
2. **Encryption implementation** examples (database, transit, authentication)
3. **2FA/authentication systems** you've built or integrated
4. **Healthcare/PHI compliance** experience in previous projects
5. **Image handling & download** functionality you've implemented
6. **Production database setup** and environment management experience
7. **Availability** and preferred working arrangement

## Technical Assessment
Qualified candidates will be given access to:
- **Full codebase** with comprehensive documentation
- **Development environment** for hands-on evaluation
- **Specific debugging challenge** related to our current needs
- **Code review session** to discuss approach and solutions

---

**SKRAM** represents the future of secure healthcare communication. Join us in building a platform that makes a real difference in how healthcare professionals collaborate while maintaining the highest standards of patient data protection.