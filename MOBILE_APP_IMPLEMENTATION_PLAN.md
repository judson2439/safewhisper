# SKRAM Native Mobile App Implementation Plan

## Overview
This document outlines the complete implementation plan for developing native iOS and Android applications that integrate with the existing SKRAM API endpoints. The mobile app will provide secure, HIPAA-compliant messaging with PHI handling capabilities.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication Implementation](#authentication-implementation)
3. [Core Features Implementation](#core-features-implementation)
4. [PHI & Security Implementation](#phi--security-implementation)
5. [File Management & Attachments](#file-management--attachments)
6. [Real-time Communication](#real-time-communication)
7. [Offline Capabilities](#offline-capabilities)
8. [Platform-Specific Considerations](#platform-specific-considerations)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Distribution](#deployment--distribution)

## Architecture Overview

### Technology Stack Recommendations

#### iOS
- **Language**: Swift 5.8+
- **Minimum iOS Version**: iOS 14.0+
- **Networking**: URLSession with async/await
- **WebSocket**: URLSessionWebSocketTask or Starscream
- **Database**: Core Data or SQLite
- **Security**: Keychain Services, CryptoKit
- **UI Framework**: SwiftUI with UIKit fallbacks

#### Android
- **Language**: Kotlin
- **Minimum SDK**: API 24 (Android 7.0)
- **Networking**: Retrofit + OkHttp
- **WebSocket**: OkHttp WebSocket
- **Database**: Room (SQLite)
- **Security**: Android Keystore, androidx.security
- **UI Framework**: Jetpack Compose

#### Cross-Platform Alternative
- **Framework**: React Native or Flutter
- **Pros**: Code reuse, faster development
- **Cons**: Potential security limitations for HIPAA compliance

### API Base Configuration
```
Base URL: https://your-replit-deployment.replit.app
WebSocket: wss://your-replit-deployment.replit.app
```

## Authentication Implementation

### 1. Session-Based Authentication Flow

#### Initial Setup
```http
POST /api/auth/signin
Content-Type: application/json

{
  "username": "user_username",
  "password": "user_password"
}
```

#### Response Handling
- Store session cookies securely
- Handle authentication state management
- Implement auto-logout on session expiry

#### Key Implementation Points:
- **Cookie Management**: Use HTTPCookieStorage (iOS) or CookieManager (Android)
- **Secure Storage**: Store credentials in Keychain (iOS) or EncryptedSharedPreferences (Android)
- **Biometric Authentication**: Face ID/Touch ID (iOS) or Biometric Prompt (Android)

### 2. User State Management

#### Get Current User
```http
GET /api/auth/user
```

#### Implementation:
```swift
// iOS - Swift
class AuthenticationManager: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    
    func getCurrentUser() async throws {
        let request = URLRequest(url: URL(string: "\(baseURL)/api/auth/user")!)
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw AuthError.unauthorized
        }
        
        self.currentUser = try JSONDecoder().decode(User.self, from: data)
        self.isAuthenticated = true
    }
}
```

```kotlin
// Android - Kotlin
class AuthRepository @Inject constructor(
    private val apiService: ApiService,
    private val tokenStorage: TokenStorage
) {
    suspend fun getCurrentUser(): Result<User> {
        return try {
            val response = apiService.getCurrentUser()
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Unauthorized"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

## Core Features Implementation

### 1. Conversations Management

#### Get User Conversations
```http
GET /api/conversations
```

#### Create New Conversation
```http
POST /api/conversations
Content-Type: application/json

{
  "name": "Group Name",
  "isGroup": true,
  "memberIds": ["user1", "user2"]
}
```

#### Implementation Structure:
```swift
// iOS - SwiftUI View Model
class ConversationsViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var isLoading = false
    
    func loadConversations() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            conversations = try await conversationService.getConversations()
        } catch {
            // Handle error
        }
    }
    
    func createConversation(name: String, isGroup: Bool) async {
        // Implementation
    }
}
```

### 2. Messaging System

#### Get Messages
```http
GET /api/conversations/{id}/messages
```

#### Send Regular Message
```http
POST /api/messages
Content-Type: application/json

{
  "conversationId": "conversation_id",
  "content": "Message content",
  "messageType": "text"
}
```

#### Message UI Components:
- Message bubbles with sender identification
- Timestamp display
- Read receipts
- Message status indicators (sending, sent, delivered)
- Reaction support

### 3. Secure PHI Messaging

#### Create Secure PHI Message
```http
POST /api/messages/secure
Content-Type: application/json

{
  "conversationId": "conversation_id",
  "content": "PHI message content",
  "phiTypes": ["patient_name", "diagnosis"],
  "description": "Patient consultation notes",
  "patientFirstName": "John",
  "patientLastName": "Doe"
}
```

#### PHI Modal Implementation:
```swift
// iOS - PHI Detection Modal
struct PHIDetectionModal: View {
    @State private var containsPHI = false
    @State private var selectedPHITypes: Set<String> = []
    @State private var phiDescription = ""
    @State private var patientFirstName = ""
    @State private var patientLastName = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section("PHI Detection") {
                    Toggle("Contains Protected Health Information", isOn: $containsPHI)
                }
                
                if containsPHI {
                    Section("PHI Types") {
                        ForEach(PHIType.allCases, id: \.self) { type in
                            MultipleSelectionRow(
                                title: type.displayName,
                                isSelected: selectedPHITypes.contains(type.rawValue)
                            ) {
                                if selectedPHITypes.contains(type.rawValue) {
                                    selectedPHITypes.remove(type.rawValue)
                                } else {
                                    selectedPHITypes.insert(type.rawValue)
                                }
                            }
                        }
                    }
                    
                    Section("Patient Information") {
                        TextField("Patient First Name", text: $patientFirstName)
                        TextField("Patient Last Name", text: $patientLastName)
                        TextField("PHI Description", text: $phiDescription)
                    }
                }
            }
        }
    }
}
```

#### Authenticate Secure Message
```http
POST /api/messages/authenticate-secure
Content-Type: application/json

{
  "messageId": "secure_message_id",
  "password": "system_password"
}
```

## PHI & Security Implementation

### 1. Secure Message Authentication

#### Password Protection Flow:
1. User attempts to view secure message
2. App prompts for system password
3. API call to authenticate access
4. Display message content on success
5. Log access attempt (automatic via API)

### 2. Screenshot Protection

#### iOS Implementation:
```swift
// Prevent screenshots for secure content
extension UIView {
    func preventScreenCapture() {
        DispatchQueue.main.async {
            let field = UITextField()
            field.isSecureTextEntry = true
            self.addSubview(field)
            field.centerYAnchor.constraint(equalTo: self.centerYAnchor).isActive = true
            field.centerXAnchor.constraint(equalTo: self.centerXAnchor).isActive = true
            field.alpha = 0
            self.layer.superlayer?.addSublayer(field.layer)
            field.layer.sublayers?.first?.addSublayer(self.layer)
        }
    }
}
```

#### Android Implementation:
```kotlin
// Prevent screenshots
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    )
}
```

### 3. Audit Logging

#### PHI Access Logs
```http
GET /api/phi-access-logs
```

All PHI access is automatically logged by the API. The mobile app should:
- Display audit trails for administrators
- Show access history for secure messages
- Provide export functionality for compliance

## File Management & Attachments

### 1. File Upload Process

#### Step 1: Request Upload URL
```http
POST /api/attachments/upload
Content-Type: application/json

{
  "fileName": "document.pdf",
  "contentType": "application/pdf",
  "size": 1024000
}
```

#### Step 2: Upload to Signed URL
```swift
// iOS - File Upload
func uploadFile(data: Data, to signedURL: URL) async throws {
    var request = URLRequest(url: signedURL)
    request.httpMethod = "PUT"
    request.setValue("application/pdf", forHTTPHeaderField: "Content-Type")
    
    let (_, response) = try await URLSession.shared.upload(for: request, from: data)
    
    guard let httpResponse = response as? HTTPURLResponse,
          httpResponse.statusCode == 200 else {
        throw UploadError.failed
    }
}
```

#### Step 3: Send Message with Attachment
Include attachment metadata in message payload.

### 2. File Viewing & Download

#### Secure File Serving
```http
GET /api/attachments/serve/{attachmentId}
```

#### Implementation:
- Use URLSession.downloadTask for large files
- Implement progress tracking
- Cache files securely with encryption
- Auto-delete expired files

## Real-time Communication

### 1. WebSocket Implementation

#### iOS WebSocket:
```swift
class WebSocketManager: ObservableObject {
    private var webSocketTask: URLSessionWebSocketTask?
    @Published var connectionState: ConnectionState = .disconnected
    
    func connect() {
        guard let url = URL(string: "wss://your-app.replit.app") else { return }
        
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                self?.handleMessage(message)
                self?.receiveMessage() // Continue listening
            case .failure(let error):
                self?.handleError(error)
            }
        }
    }
}
```

#### Android WebSocket:
```kotlin
class WebSocketManager @Inject constructor() {
    private var webSocket: WebSocket? = null
    private val client = OkHttpClient()
    
    fun connect() {
        val request = Request.Builder()
            .url("wss://your-app.replit.app")
            .build()
        
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                handleError(t)
            }
        })
    }
}
```

### 2. Real-time Features
- Live message delivery
- Typing indicators
- Online/offline status
- Message reactions
- Read receipts

## Offline Capabilities

### 1. Local Database Schema

#### Core Data (iOS) / Room (Android)
```swift
// iOS - Core Data Model
@Model
class LocalMessage {
    var id: String
    var conversationId: String
    var content: String
    var senderId: String
    var timestamp: Date
    var syncStatus: SyncStatus
    var isSecure: Bool
}
```

### 2. Sync Strategy
- Queue messages when offline
- Sync on connection restore
- Handle conflicts gracefully
- Maintain message order

## Platform-Specific Considerations

### iOS Specific

#### 1. Push Notifications
```swift
// AppDelegate
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        if granted {
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }
    }
    return true
}
```

#### 2. Background App Refresh
- Implement background sync for messages
- Use Background App Refresh for periodic updates
- Handle app lifecycle transitions

### Android Specific

#### 1. Foreground Services
```kotlin
// For maintaining WebSocket connection
class MessagingService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        // Initialize WebSocket connection
        return START_STICKY
    }
}
```

#### 2. Work Manager
```kotlin
// For background sync
class MessageSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            messageRepository.syncMessages()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

## Testing Strategy

### 1. Unit Testing
- Authentication flows
- Message encryption/decryption
- PHI detection logic
- File upload/download

### 2. Integration Testing
- API endpoint integration
- WebSocket connectivity
- Database operations
- Push notifications

### 3. Security Testing
- Penetration testing
- HIPAA compliance validation
- Data encryption verification
- Access control testing

### 4. User Acceptance Testing
- Role-based testing (Regular User, Moderator, Master Admin)
- PHI workflow validation
- Cross-platform compatibility
- Performance testing

## Deployment & Distribution

### 1. iOS App Store

#### Requirements:
- Apple Developer Account
- App Store Review Guidelines compliance
- Privacy Policy for health data
- HIPAA compliance documentation

#### Build Configuration:
```swift
// Release configuration
#if RELEASE
let baseURL = "https://your-production-app.replit.app"
#else
let baseURL = "https://your-staging-app.replit.app"
#endif
```

### 2. Google Play Store

#### Requirements:
- Google Play Console account
- Target API level compliance
- Data safety section completion
- HIPAA compliance documentation

### 3. Enterprise Distribution

#### For Healthcare Organizations:
- iOS: Enterprise Developer Program
- Android: Private app publishing
- Mobile Device Management (MDM) integration
- Custom branding options

## Security & Compliance Considerations

### 1. HIPAA Compliance
- End-to-end encryption for PHI
- Secure local storage
- Audit logging integration
- User access controls
- Data retention policies

### 2. Data Protection
- AES-256 encryption for local storage
- TLS 1.3 for network communication
- Certificate pinning
- Secure key management

### 3. Access Controls
- Role-based permissions
- Session management
- Multi-factor authentication support
- Automatic logout on timeout

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- Project setup and architecture
- Authentication implementation
- Basic UI framework
- API integration layer

### Phase 2: Core Features (Weeks 5-8)
- Messaging system
- Conversation management
- Real-time communication
- File handling

### Phase 3: Security & PHI (Weeks 9-12)
- PHI detection and handling
- Secure messaging
- Audit logging integration
- Screenshot protection

### Phase 4: Polish & Testing (Weeks 13-16)
- UI/UX refinement
- Performance optimization
- Security testing
- App store preparation

## API Integration Checklist

### Authentication Endpoints (6 endpoints)
- [ ] POST /api/auth/signin - User login with username/password
- [ ] POST /api/auth/signup - User registration with optional workforce invitation
- [ ] GET /api/auth/user - Get current authenticated user details
- [ ] POST /api/auth/reset-password - Request password reset via email/SMS
- [ ] POST /api/auth/confirm-reset-password - Complete password reset with token
- [ ] GET /api/logout - Sign out and destroy session

### Messaging & Conversations (8 endpoints)
- [ ] GET /api/conversations - Get user's conversations list
- [ ] POST /api/conversations - Create new group conversation
- [ ] POST /api/conversations/direct - Create/get direct conversation with user
- [ ] GET /api/conversations/{id}/messages - Get messages for conversation
- [ ] POST /api/conversations/{conversationId}/mark-read - Mark conversation as read
- [ ] GET /api/conversations/{id}/members - Get conversation members
- [ ] POST /api/conversations/{id}/members - Add member to conversation
- [ ] DELETE /api/conversations/{id}/members/{userId} - Remove member from conversation

### Secure Messaging & PHI (4 endpoints)
- [ ] POST /api/messages - Send regular message
- [ ] POST /api/messages/secure - Send secure PHI message
- [ ] POST /api/messages/authenticate-secure - Authenticate access to secure message
- [ ] GET /api/messages/{messageId}/audit-logs - Get audit logs for specific message

### File Management & Attachments (3 endpoints)
- [ ] POST /api/attachments/upload - Get signed URL for file upload
- [ ] GET /api/attachments/serve/{attachmentId} - Serve attachment with PHI logging
- [ ] GET /api/attachments-proxy - Legacy attachment proxy with PHI logging

### PHI Access & Audit Logging (2 endpoints)
- [ ] GET /api/phi-access-logs - Get PHI access audit trail (Admin only)
- [ ] GET /api/admin/message-details/{messageId} - Get detailed message info with audit logs

### Workforce Management (5 endpoints)
- [ ] GET /api/workforces - Get all workforces (Master Admin only)
- [ ] POST /api/workforces - Create new workforce (Master Admin only)
- [ ] GET /api/workforces/{workforceId}/members - Get workforce members
- [ ] PATCH /api/workforces/{workforceId}/status - Update workforce status (Master Admin)
- [ ] POST /api/workforce-invitations - Send workforce invitation (Admin/Moderator)
- [ ] GET /api/workforce-invitations/validate/{token} - Validate invitation token

### User Management & Administration (3 endpoints)
- [ ] GET /api/admin/users - Get all system users (Master Admin only)
- [ ] PATCH /api/admin/users/{userId}/role - Update user role (Master Admin only)
- [ ] POST /api/users/{userId}/password - Reset user password (Admin/Moderator)

### System Analytics (1 endpoint)
- [ ] GET /api/admin/analytics - Get system-wide analytics (Master Admin only)

### **Total: 32 API Endpoints**

### Implementation Priority Levels

#### Phase 1 - Essential (Core functionality)
- Authentication endpoints (all 6)
- Basic messaging (4 core endpoints)
- File attachments (2 core endpoints)

#### Phase 2 - Standard Features
- Conversation management (remaining 4 endpoints)
- Secure PHI messaging (4 endpoints)
- Basic workforce features (2 endpoints)

#### Phase 3 - Advanced Features
- Full workforce management (remaining 4 endpoints)
- User administration (3 endpoints)
- Advanced audit features (2 endpoints)

#### Phase 4 - Administrative Features
- System analytics (1 endpoint)
- Legacy support (1 endpoint)

## Conclusion

This implementation plan provides a comprehensive roadmap for developing native mobile applications that integrate with the SKRAM API. The plan prioritizes security, HIPAA compliance, and user experience while leveraging the existing robust API infrastructure.

Key success factors:
1. **Security First**: All implementations must prioritize data protection and compliance
2. **User Experience**: Intuitive interfaces that don't compromise security
3. **Platform Optimization**: Leverage native capabilities for best performance
4. **Thorough Testing**: Comprehensive testing strategy covering all use cases
5. **Compliance**: Maintain HIPAA compliance throughout development and deployment

The modular approach allows for iterative development and testing, ensuring a robust and compliant mobile solution for secure healthcare communication.