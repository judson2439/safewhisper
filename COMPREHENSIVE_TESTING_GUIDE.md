# SKRAM Application - Comprehensive Multi-Workforce Testing Guide (Updated August 2025)

## Test Environment Overview

### Current Test Data Setup
- **5 Workforces**: Demo Workforce, Test Company, Engineering Corp, Healthcare Inc, Finance Group
- **25+ Users**: Mix of master admins, moderators, and regular users across different workforces
- **40+ Conversations**: Including cross-workforce conversations for boundary testing
- **PHI Test Messages**: Secure messages with various PHI types and patient data
- **File Attachments**: Multiple file types with Google Cloud Storage integration
- **Comprehensive API**: 120+ documented endpoints with Swagger documentation

### Testing Scenarios

## 1. Master Admin Testing (`master_admin` / `admin123`)
**Role**: System-wide access and management

### Test Cases:
- [ ] **Workforce Management**: Create, edit, delete workforces
- [ ] **Cross-Workforce Visibility**: View all workforces and members
- [ ] **User Role Management**: Promote/demote users across the system
- [ ] **Analytics Dashboard**: View system-wide statistics
- [ ] **Conversation Access**: Can access conversations across all workforces
- [ ] **API Documentation**: Access comprehensive API docs at `/api-docs` with 120+ endpoints
- [ ] **PHI Audit Trail**: Access complete PHI access logs with patient data preservation
- [ ] **File Access Control**: View and audit all file downloads across workforces
- [ ] **Mobile Interface**: Test responsive design on mobile devices

### Expected Behavior:
- Master admin sees ALL workforces and members
- Can invite members to any workforce
- Can modify any conversation or user settings
- Has access to system-wide analytics
- Can view PHI audit logs with complete content details
- Has access to cross-workforce file downloads and audit trails

## 2. Moderator Testing by Workforce

### Engineering Corp Moderator (`alice_eng`)
**Workforce**: Engineering Corp (3 members total)
**Members**: alice_eng (moderator), bob_dev (user), carol_senior (user)

#### Test Cases:
- [ ] **Workforce Boundary**: Only see Engineering Corp members
- [ ] **Invitation Rights**: Can invite new members to Engineering Corp
- [ ] **Cross-Workforce Moderator Chat**: Can message other moderators from different workforces
- [ ] **Conversation Management**: Can create/edit/delete Group Skrams
- [ ] **Member Management**: Can reset passwords for workforce members
- [ ] **Restricted Access**: Cannot see members from other workforces (except other moderators)

### Healthcare Inc Moderator (`dr_smith`)
**Workforce**: Healthcare Inc (3 members total)
**Members**: dr_smith (moderator), nurse_jones (user), admin_brown (user)

#### Test Cases:
- [ ] **Medical Workforce Management**: Manage healthcare-specific conversations
- [ ] **Cross-Moderator Communication**: Chat with moderators from other workforces
- [ ] **User Privacy**: Cannot access Engineering Corp or Finance Group regular users
- [ ] **Invitation Control**: Can only invite to Healthcare Inc workforce

### Finance Group Moderator (`cfo_wilson`)
**Workforce**: Finance Group (3 members total)
**Members**: cfo_wilson (moderator), analyst_davis (user), clerk_martin (user)

#### Test Cases:
- [ ] **Financial Data Isolation**: Finance conversations stay within workforce
- [ ] **Moderator Network**: Access to all moderators across workforces
- [ ] **Workforce Autonomy**: Independent management of finance team

## 3. Regular User Testing

### Engineering Corp Users (`bob_dev`, `carol_senior`)
#### Test Cases:
- [ ] **Workforce Isolation**: Can only see Engineering Corp members
- [ ] **Private Skrams**: Can message other Engineering Corp members
- [ ] **Group Conversations**: Can participate in Engineering Group Skrams
- [ ] **Cross-Workforce Restriction**: Cannot message Healthcare/Finance users directly
- [ ] **Moderator Communication**: Can message alice_eng (their moderator)

### Healthcare Inc Users (`nurse_jones`, `admin_brown`)
#### Test Cases:
- [ ] **Healthcare Focus**: Only see healthcare workforce members
- [ ] **Medical Privacy**: Cannot access engineering or finance conversations
- [ ] **Internal Communication**: Can message within healthcare workforce
- [ ] **Supervisor Access**: Can communicate with dr_smith (their moderator)

### Finance Group Users (`analyst_davis`, `clerk_martin`)
#### Test Cases:
- [ ] **Financial Isolation**: Limited to finance workforce members
- [ ] **Sensitive Data Protection**: No access to other workforce data
- [ ] **Team Communication**: Internal finance team messaging
- [ ] **Management Contact**: Can reach cfo_wilson (their moderator)

## 4. Cross-Workforce Communication Testing

### Allowed Cross-Workforce Communications:
- [ ] **Master Admin ↔ Everyone**: Master can communicate with all users
- [ ] **Moderator ↔ Moderator**: All moderators can communicate across workforces
- [ ] **Group Conversation Members**: Users who share group conversations can start Private Skrams

### Restricted Communications:
- [ ] **User ↔ User (Different Workforces)**: Regular users cannot message across workforce boundaries
- [ ] **Data Isolation**: Users cannot see member lists from other workforces
- [ ] **Conversation Privacy**: Cannot join conversations from other workforces

## 5. Real-Time Messaging Testing

### WebSocket Functionality:
- [ ] **Live Messaging**: Test real-time message delivery
- [ ] **Typing Indicators**: Verify typing status across different user types
- [ ] **Message Encryption**: Ensure end-to-end encryption works
- [ ] **Auto-Delete**: Verify 24-hour message expiration
- [ ] **Priority Highlighting**: Test urgent/high priority message detection

## 6. Security Boundary Testing

### Workforce Isolation:
- [ ] **Data Leakage Prevention**: Ensure no cross-workforce data exposure
- [ ] **Role-Based Access**: Verify permissions are strictly enforced
- [ ] **Session Security**: Test session management across different roles
- [ ] **API Security**: Verify API endpoints respect role boundaries

### Authentication Testing:
- [ ] **Multi-User Sessions**: Test multiple users signed in simultaneously
- [ ] **Role Switching**: Use Role Test Dashboard to verify different interfaces
- [ ] **Session Persistence**: Verify sessions maintain proper user context

## 7. PHI Message and Compliance Testing

### PHI Message Creation:
- [ ] **PHI Modal Functionality**: Test PHI message creation with various PHI types
- [ ] **Patient Name Capture**: Verify patient first/last name tracking
- [ ] **Password Authentication**: Test user password verification for PHI access
- [ ] **Security Level Assignment**: Test Confidential, Restricted, Classified levels
- [ ] **Automatic Expiration**: Verify 24-hour message deletion
- [ ] **File Attachment PHI**: Test PHI messages with file attachments

### PHI Audit and Compliance:
- [ ] **PHI Access Logging**: Verify all PHI access is logged with complete details
- [ ] **Content Preservation**: Test message content preservation in audit logs
- [ ] **Organization Filtering**: Test dropdown filtering by workforce names
- [ ] **Patient Data Tracking**: Verify patient name persistence in audit logs
- [ ] **File Download Audit**: Test attachment download logging
- [ ] **HIPAA Compliance Reports**: Generate and verify compliance reporting

## 8. User Interface Consistency Testing

### Interface Verification:
- [ ] **Regular User Interface**: Clean, simple workforce-focused view
- [ ] **Moderator Interface**: Enhanced with workforce management tools
- [ ] **Master Admin Interface**: Complete system-wide management capabilities
- [ ] **Theme Consistency**: Verify light/dark mode across all interfaces
- [ ] **Responsive Design**: Test on different screen sizes (44px touch targets)
- [ ] **Mobile Chat Optimization**: Test mobile-specific chat interface improvements

## 9. Advanced Feature Testing

### Invitation System:
- [ ] **SMS Invitations**: Test workforce invitation via SMS
- [ ] **Email Invitations**: Verify email-based invitations
- [ ] **Token Validation**: Test invitation token security
- [ ] **Role Assignment**: Verify invited users get correct workforce roles

### Analytics and Reporting:
- [ ] **System Analytics**: Master admin dashboard statistics
- [ ] **Workforce Analytics**: Moderator-level reporting
- [ ] **Message Statistics**: Usage patterns and trends

## Expected Test Results

### Successful Boundaries:
1. **Engineering Corp** users can only communicate within their workforce + their moderator can talk to other moderators
2. **Healthcare Inc** maintains complete privacy for medical communications
3. **Finance Group** keeps financial data isolated and secure
4. **Master Admin** has complete system oversight and control
5. **Cross-Moderator Network** allows coordination while maintaining workforce boundaries

### Security Validations:
- No data leakage between workforces
- Proper role-based access control enforcement
- Secure real-time messaging with encryption
- Automatic message expiration for privacy

## Login Credentials for Testing

### Master Admin:
- Username: `master_admin` / Password: `admin123`

### Moderators:
- Engineering: `alice_eng` (password to be set)
- Healthcare: `dr_smith` (password to be set)  
- Finance: `cfo_wilson` (password to be set)

### Regular Users:
- Engineering: `bob_dev`, `carol_senior`
- Healthcare: `nurse_jones`, `admin_brown`
- Finance: `analyst_davis`, `clerk_martin`

## API Testing and Documentation Verification
- [ ] **Access API Documentation**: Navigate to `/api-docs` (Swagger UI with 120+ endpoints)
- [ ] **Authentication Endpoints**: Test signin, signup, password reset flows
- [ ] **Workforce Management**: Test invitation, role management APIs
- [ ] **PHI Access Logs**: Test PHI audit log APIs with filtering parameters
- [ ] **File Upload/Download**: Test attachment endpoints with various file types
- [ ] **Security Boundaries**: Verify API endpoints respect role-based access
- [ ] **Cross-Workforce APIs**: Test admin-level cross-workforce endpoints
- [ ] **Demo Endpoints**: Test demo login and testing utilities

## File Storage and Google Cloud Integration Testing
- [ ] **File Upload Process**: Test end-to-end file upload to Google Cloud Storage
- [ ] **Signed URL Access**: Verify secure file access via signed URLs
- [ ] **PHI File Logging**: Test automatic logging when accessing PHI file attachments
- [ ] **File Type Support**: Test various file types (images, documents, PDFs)
- [ ] **Access Control**: Verify file access respects workforce boundaries
- [ ] **Legacy File Detection**: Test old vs new file URL handling
- [ ] **Error Handling**: Test file not found and access denied scenarios
- Test WebSocket connections for real-time features

---

**Note**: This testing guide ensures comprehensive validation of the multi-workforce, role-based secure messaging platform with proper isolation and security boundaries.