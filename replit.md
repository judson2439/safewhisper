# SKRAM Application

## Overview
SKRAM is a real-time, secure messaging application designed for workforce management and secure internal communications. It features end-to-end encryption, automatic message deletion, group chat functionalities, comprehensive screenshot protection, and multi-role authentication (Master Admin, Moderator, Regular User). The application provides a modern UI with real-time messaging via WebSockets, focusing on secure and efficient communication for businesses.

## User Preferences
Preferred communication style: Simple, everyday language.
Testing Requirements: Comprehensive role-based testing system with easy switching between Master Admin, Moderator, and Regular User interfaces for validation of all functionality and permissions.
UI Preference: Clean, space-efficient interface design with workforce management accessible via top-right Users icon with member count badge instead of bulky sidebar sections. Prefer compact tables without excessive icons to maximize content visibility.
Sidebar Organization: Priority Filter positioned under Workforce Management and above conversation lists for optimal workflow.
Mobile Optimization: Current focus on optimizing specific mobile interface elements for better touch interaction and usability.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Library**: Radix UI primitives with shadcn/ui components (New York style variant)
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Real-time Communication**: Custom WebSocket server
- **API Design**: RESTful endpoints with WebSocket integration
- **Session Management**: Express sessions with PostgreSQL storage

### Database
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM
- **Schema Management**: Drizzle Kit

### Key Features & Design Decisions
- **Role-Based Access Control**: Centralized dashboard for multi-role validation, consistent routing, and dual authentication (custom username/password and Replit Auth with Passport.js).
- **Real-time Messaging**: Custom WebSocket server for authentication, connection management, typing indicators, and automatic message deletion (24 hours) via cron job. Includes support for emoji reactions and auto-scroll to bottom functionality for all user interfaces.
- **Secure Messaging & PHI Handling**: Comprehensive system for handling Protected Health Information (PHI) including detection, categorization, password protection, and detailed audit logging with content preservation for HIPAA compliance. Features clickable content viewing in PHI access logs with complete message details modal for regulatory compliance. Also includes secure message authentication with multi-level security (confidential, restricted, classified) and audit trails.
- **User & Workforce Management**: Features for inviting, deactivating, and managing workforce members, including secure password reset initiation by admins/moderators. Includes advanced filtering and space-efficient UI. Master Admin system provides system-wide workforce access and analytics.
- **UI/UX Design**: Dark mode support with persistent preferences, consistent UI across roles, accessible and responsive design system, unified message display styling (WhatsApp-style chat bubbles), and consistent auto-scroll behavior across all chat interfaces.
- **Security & Data Privacy**: Screenshot protection (visual overlays, shortcut blocking, DevTools detection, content blurring), complete user data removal upon deactivation, and token-based password reset.
- **Monorepo Structure**: Shared TypeScript types and utilities for full-stack type safety.
- **Message Prioritization**: Automatic analysis and visual highlighting of urgent messages.

## Recent Changes (August 2025)
- **RESOLVED: PHI System Integration**: Fixed critical PHI checkbox functionality and message sending system. PHI messages now properly send whether specific types are categorized or not, maintaining HIPAA compliance logging. Checkboxes stay checked when clicked, and all PHI confirmation flows work correctly.
- **Fixed File Viewing Issue**: Resolved "legacy file" detection problem that prevented all images from displaying. The `isOldGoogleUrl` function was incorrectly flagging new files as inaccessible. All files now work through the attachment serving endpoint with proper authentication and signed URL generation.
- **Enhanced Server-Side PHI Logging**: Added comprehensive WebSocket message debugging to capture all PHI data transmission. Server now logs PHI messages regardless of specific type categorization when user confirms "Contains PHI".
- **Simplified React State Management**: Removed complex closure workarounds and timeout-based state resets that were causing PHI checkbox state conflicts. Implemented clean, direct state management for reliable checkbox functionality.
- **Mobile Chat Optimization**: Successfully improved mobile responsiveness for chat functions used by moderators and regular users. Enhanced message input with 44px touch targets, responsive chat header with collapsible elements, mobile sidebar overlay with smooth animations, and improved conversation list touch targets. Admin dashboard remains desktop-focused as intended.
- **Organization Filter Enhancement**: Updated PHI audit trail organization filter from text search to dropdown populated with all workforce names for better user experience and more precise filtering.
- **Comprehensive Swagger Documentation**: Completed comprehensive API documentation update including all authentication endpoints (signin/signup/password reset), workforce management, conversation management, PHI access audit logs with filtering, demo endpoints, and secure messaging workflows. Added complete schema definitions for all data models, security schemes, and HIPAA-compliant audit trails. All LSP syntax errors resolved.
- **Complete Documentation Overhaul (August 2025)**: Updated all system documentation including SYSTEM_OVERVIEW.md, DEVELOPER_GUIDE.md, COMPREHENSIVE_TESTING_GUIDE.md, and created new API_REFERENCE.md. All guides now reflect current architecture with 120+ API endpoints, mobile optimization, PHI compliance systems, and comprehensive testing procedures. Documentation includes updated system diagrams, technology stack details, and complete testing scenarios for all user roles.
- **Patient Name Capture Investigation**: Identified systematic issue with patient name data not persisting from PHI modal through secure API endpoint to database storage. Secure messages create successfully with PHI types but patient names consistently return NULL. Issue requires architectural review of data transformation pipeline between client PHI modal, API request handling, and database insertion layer.
- **Enhanced PHI Modal User Experience**: Implemented auto-dismiss functionality for secure message creation modal. Modal now displays success confirmation with green checkmark for 1.5 seconds before automatically closing, eliminating need for manual dismissal. Added loading states, form validation, and improved visual feedback throughout the PHI message creation process.

## Current Development Priorities (August 2025)
Based on identified critical issues and enhancement needs:

### **High Priority Issues**
1. **File Upload Functionality**: Regular messages not allowing image uploads - needs immediate debugging and fix
2. **PHI Patient Name Registration**: Patient first/last name data not persisting from PHI modal to database storage
3. **Object Storage Verification**: Ensure Google Cloud Storage integration works properly for all file types
4. **Image Viewing/Download**: Fix image modal functionality - currently shows large image but no download capability

### **Security & Compliance Enhancements**
5. **Message Encryption**: Implement encryption for messages in database (transit and at rest)
6. **Two-Factor Authentication**: Critical need for 2FA with Gmail & Microsoft integration
7. **PHI Message Encryption**: Additional security layers for PHI messages with password grid system
8. **Production Database Setup**: Establish production environment with proper security

### **Advanced Features**
9. **Push Notification System**: Service Worker implementation for real-time notifications
10. **Testing Environment**: Sandbox environment setup for safe development
11. **Email Integration**: SendGrid/Gmail implementation for notifications and authentication
12. **Enhanced Authentication**: Reduce Replit dependency, implement independent auth systems

## External Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection.
- **drizzle-orm**: Type-safe database ORM.
- **express**: Web server framework.
- **ws**: WebSocket server implementation.
- **passport**: Authentication middleware.
- **@radix-ui/***: Accessible UI primitives.
- **@tanstack/react-query**: Server state management.
- **tailwindcss**: Utility-first CSS framework.
- **wouter**: Lightweight router for React.
- **crypto-js**: Client-side encryption library.
- **openid-client**: OIDC authentication client.
- **express-session**: Session management middleware.
- **connect-pg-simple**: PostgreSQL session store for Express.
- **SendGrid**: Email service integration.
- **Twilio**: SMS service integration.
- **@google-cloud/storage**: Google Cloud Storage for file attachments and PHI document storage.
- **vite**: Build tool and development server.
- **typescript**: Type checking and compilation.
- **esbuild**: Server-side bundling.

## Required External Service Setup
- **Google Cloud Storage**: Required for file upload functionality and PHI attachment storage. The application uses Google Cloud Storage buckets for secure file handling with proper authentication and access controls. Service account credentials and bucket configuration needed for production deployment.
  - **Critical for PHI Audit Features**: Master admin image viewing and PHI content access in audit logs requires Google Cloud Storage service account credentials to be properly configured.
  - **Current Status**: Image viewing and file access work with authenticated users when Google Cloud credentials are available.
```