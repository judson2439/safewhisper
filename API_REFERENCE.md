# SKRAM API Reference Guide (Updated August 2025)

## Overview
The SKRAM API provides comprehensive endpoints for secure healthcare messaging, workforce management, and PHI compliance. All endpoints follow RESTful conventions with robust authentication and role-based access control.

## Base URL
```
https://your-app.replit.app/api
```

## Authentication

### Dual Authentication System
SKRAM supports two authentication methods:

1. **Custom Username/Password** (Regular users and moderators)
2. **Replit Auth (OIDC)** (Master admin access)

### Security Headers
```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Core API Endpoints

### Authentication Endpoints

#### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
```

#### Password Reset
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "string"
}
```

#### Get Current User
```http
GET /api/auth/user
Authorization: Bearer <token>
```

### Messaging Endpoints

#### Get Conversations
```http
GET /api/conversations
Authorization: Bearer <token>
```

#### Send Regular Message
```http
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "string",
  "content": "string",
  "attachments": [
    {
      "id": "string",
      "name": "string",
      "size": "number",
      "type": "string"
    }
  ]
}
```

#### Send Secure PHI Message
```http
POST /api/messages/secure
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "string",
  "content": "string",
  "securityLevel": "confidential|restricted|classified",
  "phiTypes": ["insurance_card", "lab_results", "medical_records"],
  "phiDescription": "string",
  "patientFirstName": "string",
  "patientLastName": "string",
  "attachments": [
    {
      "id": "string",
      "name": "string",
      "size": "number",
      "type": "string"
    }
  ]
}
```

### File Management

#### Upload File
```http
POST /api/attachments/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```

#### Serve File
```http
GET /api/attachments/serve/{fileId}
Authorization: Bearer <token>
```

### Workforce Management

#### Get Workforces
```http
GET /api/workforces
Authorization: Bearer <token>
```

#### Invite Member
```http
POST /api/workforces/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "string",
  "workforceId": "string",
  "role": "user|moderator",
  "inviteMethod": "email|sms"
}
```

#### Reset User Password (Admin)
```http
PUT /api/admin/reset-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "string"
}
```

### PHI Compliance and Audit

#### Get PHI Access Logs
```http
GET /api/phi-access-logs
Authorization: Bearer <token>
Query Parameters:
  - organization: string (workforce filter)
  - startDate: ISO date string
  - endDate: ISO date string
  - limit: number
  - offset: number
```

#### Get PHI Access Log Details
```http
GET /api/phi-access-logs/{logId}
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get System Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <token> (Master Admin only)
```

#### Cross-Workforce Management
```http
GET /api/admin/cross-workforce
Authorization: Bearer <token> (Master Admin only)
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 409  | Conflict |
| 422  | Validation Error |
| 500  | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication**: 5 requests per minute
- **Messaging**: 100 requests per minute
- **File Upload**: 10 requests per minute
- **Other Endpoints**: 60 requests per minute

## Data Models

### User
```json
{
  "id": "string",
  "username": "string", 
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "member|moderator|master",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### Message
```json
{
  "id": "string",
  "conversationId": "string",
  "senderId": "string",
  "content": "string",
  "messageType": "regular|secure",
  "securityLevel": "confidential|restricted|classified",
  "attachments": [
    {
      "id": "string",
      "name": "string", 
      "size": "number",
      "type": "string",
      "url": "string"
    }
  ],
  "createdAt": "ISO date",
  "expiresAt": "ISO date"
}
```

### PHI Access Log
```json
{
  "id": "string",
  "userId": "string",
  "messageId": "string",
  "accessType": "view|download",
  "ipAddress": "string",
  "userAgent": "string",
  "organization": "string",
  "patientFirstName": "string",
  "patientLastName": "string",
  "messageContent": "string",
  "accessedAt": "ISO date"
}
```

## WebSocket Events

### Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://your-app.replit.app/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'your-auth-token'
}));
```

### Message Events
```javascript
// Send message
ws.send(JSON.stringify({
  type: 'send_message',
  conversationId: 'conv-id',
  content: 'Hello world'
}));

// Receive message
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'new_message') {
    // Handle new message
  }
};
```

### Typing Indicators
```javascript
// Start typing
ws.send(JSON.stringify({
  type: 'typing_start',
  conversationId: 'conv-id'
}));

// Stop typing
ws.send(JSON.stringify({
  type: 'typing_stop', 
  conversationId: 'conv-id'
}));
```

## Error Handling

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_CREDENTIALS`: Invalid username/password
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMITED`: Too many requests
- `PHI_ACCESS_DENIED`: PHI access requires additional authentication
- `FILE_NOT_FOUND`: Requested file not found
- `WORKFORCE_BOUNDARY_VIOLATION`: Cross-workforce access denied

### Best Practices
1. Always check response status codes
2. Implement proper error handling for each endpoint
3. Use exponential backoff for rate-limited requests
4. Validate input data before sending requests
5. Handle authentication errors gracefully
6. Log errors for debugging purposes

## Testing

### Interactive API Documentation
Access the full interactive API documentation at:
```
https://your-app.replit.app/api-docs
```

The Swagger UI provides:
- Complete endpoint documentation
- Interactive testing interface
- Request/response examples
- Schema definitions
- Authentication testing

### Demo Endpoints
For testing purposes, use the demo login endpoint:
```http
POST /api/auth/demo-login
```

This provides test credentials for different user roles without requiring full registration.