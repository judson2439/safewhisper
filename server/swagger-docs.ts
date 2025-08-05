/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieves the currently authenticated user's profile information and effective role
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [member, moderator, master]
 *                       description: Effective role based on user role and workforce membership
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/demo-login:
 *   post:
 *     summary: Demo login endpoint
 *     description: Provides demo authentication for testing purposes
 *     tags: [Authentication, Demo]
 *     responses:
 *       200:
 *         description: Demo login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Custom username/password sign in
 *     description: Authenticates user with custom credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create new user account
 *     description: Registers new user with optional invitation token
 *     tags: [Authentication, User Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Desired username
 *               password:
 *                 type: string
 *                 description: User password
 *               email:
 *                 type: string
 *                 description: User email address
 *               role:
 *                 type: string
 *                 enum: [member, admin]
 *                 default: member
 *               invitationToken:
 *                 type: string
 *                 description: Optional workforce invitation token
 *     responses:
 *       200:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request data or invitation
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends password reset token via email or SMS
 *     tags: [Authentication, Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: User email or username
 *     responses:
 *       200:
 *         description: Reset instructions sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 methods:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     sms:
 *                       type: boolean
 *       400:
 *         description: Missing identifier
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/confirm-reset-password:
 *   post:
 *     summary: Confirm password reset
 *     description: Resets password using valid token
 *     tags: [Authentication, Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid or expired token, weak password
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{userId}/password:
 *   post:
 *     summary: Administrative password reset
 *     description: Allows admins and moderators to reset user passwords
 *     tags: [User Management, Password Management]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: New password (min 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Weak password
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/user/workforce-membership:
 *   get:
 *     summary: Get user's workforce membership
 *     description: Retrieves current user's workforce membership details
 *     tags: [User Management, Workforce Management]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Workforce membership retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     workforceId:
 *                       type: string
 *                     workforceName:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, moderator]
 *                     membershipId:
 *                       type: string
 *                 - type: null
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/auth/user/username:
 *   patch:
 *     summary: Update user username
 *     description: Updates the current user's username
 *     tags: [User Management]
 *     security:
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[a-zA-Z0-9_]+$"
 *                 description: New username (3-20 chars, alphanumeric + underscore)
 *     responses:
 *       200:
 *         description: Username updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid username or already taken
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get user conversations
 *     description: Retrieves all conversations for the authenticated user
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create new conversation
 *     description: Creates a new conversation with specified members
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - memberIds
 *             properties:
 *               name:
 *                 type: string
 *                 description: Conversation name
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to include
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *                 description: Whether conversation is private
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get conversation messages
 *     description: Retrieves all messages for a specific conversation
 *     tags: [Conversations, Messages]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied to conversation
 *       404:
 *         description: Conversation not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/demo/conversations/{id}/members:
 *   post:
 *     summary: Add member to conversation (Demo)
 *     description: Demo endpoint to add a member to a conversation by username
 *     tags: [Demo, Conversations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - inviterId
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username of user to add
 *               inviterId:
 *                 type: string
 *                 description: ID of user doing the inviting
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 member:
 *                   $ref: '#/components/schemas/ConversationMember'
 *       400:
 *         description: Invalid request or user already member
 *       401:
 *         description: Inviter not found
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/phi-access-logs:
 *   get:
 *     summary: Get PHI access audit logs
 *     description: Retrieves comprehensive PHI access logs with filtering (Master Admin only)
 *     tags: [PHI, Admin, Audit]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *       - in: query
 *         name: workforceId
 *         schema:
 *           type: string
 *         description: Filter by workforce
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (YYYY-MM-DD)
 *       - in: query
 *         name: accessType
 *         schema:
 *           type: string
 *           enum: [message, attachment]
 *         description: Filter by access type
 *     responses:
 *       200:
 *         description: PHI access logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PHIAccessLog'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/phi-access-logs/{logId}/content:
 *   get:
 *     summary: Get PHI log content details
 *     description: Retrieves detailed content of a specific PHI access log (Master Admin only)
 *     tags: [PHI, Admin, Audit]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: PHI access log ID
 *     responses:
 *       200:
 *         description: PHI log content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                   description: Message content or file details
 *                 phiTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Types of PHI in content
 *                 patientInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                   description: Patient identification information
 *                 metadata:
 *                   type: object
 *                   description: Additional content metadata
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       404:
 *         description: Log not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/messages/secure:
 *   post:
 *     summary: Create secure PHI message
 *     description: |
 *       Creates a secure message with PHI protection, encryption, and HIPAA compliance logging.
 *       
 *       **User Experience Flow:**
 *       1. User sends a message and confirms it contains PHI
 *       2. PHI categorization modal appears with patient identification fields
 *       3. Upon submission, modal shows loading state
 *       4. Success confirmation displays with automatic dismissal after 1.5 seconds
 *       5. Message appears in chat as encrypted/password-protected content
 *       
 *       **Security Features:**
 *       - End-to-end encryption with password protection
 *       - Automatic audit logging for HIPAA compliance
 *       - Patient identification tracking for forensic analysis
 *     tags: [Secure Messaging, PHI]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *                 description: Target conversation ID
 *               content:
 *                 type: string
 *                 description: Message content
 *               phiTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Types of PHI contained in message
 *               description:
 *                 type: string
 *                 description: PHI description for audit purposes
 *               patientFirstName:
 *                 type: string
 *                 description: Patient first name (for HIPAA tracking)
 *               patientLastName:
 *                 type: string
 *                 description: Patient last name (for HIPAA tracking)
 *               attachments:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Attachment'
 *                 description: File attachments
 *     responses:
 *       201:
 *         description: Secure message created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/SecureMessage'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/messages/authenticate-secure:
 *   post:
 *     summary: Authenticate secure PHI message access
 *     description: |
 *       Authenticates user access to secure PHI messages using password verification.
 *       
 *       **Authentication Flow:**
 *       1. User clicks on secure message (shows lock icon)
 *       2. Password authentication modal appears
 *       3. User enters system password with show/hide toggle
 *       4. Upon successful authentication, message content is revealed
 *       5. Failed attempts are logged and limited for security
 *       
 *       **Audit Features:**
 *       - All access attempts are logged for HIPAA compliance
 *       - Patient identification preserved for forensic analysis
 *       - Timestamp and user tracking for audit trails
 *     tags: [Secure Messaging, PHI]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *               - password
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the secure message to authenticate
 *               password:
 *                 type: string
 *                 description: User's authentication password
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/SecureMessage'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/phi-access-logs:
 *   get:
 *     summary: Get PHI access audit logs
 *     description: Retrieves comprehensive PHI access logs for HIPAA compliance (Admin only)
 *     tags: [PHI, Admin, Audit]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: PHI access logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PHIAccessLog'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/message-details/{messageId}:
 *   get:
 *     summary: Get detailed message information for audit
 *     description: Retrieves complete message details including PHI content for master admin audit (Master Admin only)
 *     tags: [Admin, Audit, PHI]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID to retrieve details for
 *     responses:
 *       200:
 *         description: Message details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageDetails'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/messages/{messageId}/audit-logs:
 *   get:
 *     summary: Get audit logs for specific secure message
 *     description: Retrieves comprehensive audit trail for a specific secure message (Admin only)
 *     tags: [Secure Messaging, Audit, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID to get audit logs for
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PHIAccessLog'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin privileges required
 *       404:
 *         description: Message not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get system-wide analytics
 *     description: Retrieves comprehensive system analytics for master admin dashboard
 *     tags: [Admin, Analytics]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalWorkforces:
 *                   type: integer
 *                   description: Total number of workforces
 *                 totalMembers:
 *                   type: integer
 *                   description: Total number of workforce members
 *                 totalMessages:
 *                   type: integer
 *                   description: Total messages sent
 *                 totalSecureMessages:
 *                   type: integer
 *                   description: Total secure/PHI messages
 *                 totalPHIAccess:
 *                   type: integer
 *                   description: Total PHI access events
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/workforces:
 *   get:
 *     summary: Get all workforces
 *     description: Retrieves list of all workforces (Master Admin only)
 *     tags: [Workforce Management, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Workforces retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workforce'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create new workforce
 *     description: Creates a new workforce with email configuration (Master Admin only)
 *     tags: [Workforce Management, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - emailDomain
 *               - emailProvider
 *             properties:
 *               name:
 *                 type: string
 *                 description: Workforce name
 *               description:
 *                 type: string
 *                 description: Optional workforce description
 *               emailDomain:
 *                 type: string
 *                 description: Email domain for workforce members
 *               emailProvider:
 *                 type: string
 *                 enum: [sendgrid, custom]
 *                 description: Email service provider
 *               emailSettings:
 *                 type: object
 *                 description: Provider-specific email settings
 *     responses:
 *       201:
 *         description: Workforce created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workforce'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/workforces/{workforceId}/members:
 *   get:
 *     summary: Get workforce members
 *     description: Retrieves all members of a specific workforce
 *     tags: [Workforce Management]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: workforceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workforce ID
 *     responses:
 *       200:
 *         description: Members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkforceMember'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Workforce not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/workforces/{workforceId}/status:
 *   patch:
 *     summary: Update workforce status
 *     description: Activates or deactivates a workforce (Master Admin only)
 *     tags: [Workforce Management, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: workforceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workforce ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New workforce status
 *     responses:
 *       200:
 *         description: Workforce status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workforce'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       404:
 *         description: Workforce not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/workforce-invitations:
 *   post:
 *     summary: Send workforce invitation
 *     description: Sends email or SMS invitation to join workforce (Admin/Moderator only)
 *     tags: [Workforce Management, Invitations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workforceId
 *               - method
 *             properties:
 *               workforceId:
 *                 type: string
 *                 description: Target workforce ID
 *               email:
 *                 type: string
 *                 description: Email address (for email invitations)
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number (for SMS invitations)
 *               method:
 *                 type: string
 *                 enum: [email, sms]
 *                 description: Invitation delivery method
 *               role:
 *                 type: string
 *                 enum: [user, moderator]
 *                 default: user
 *                 description: Role for new member
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 invitationToken:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin/Moderator privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/workforce-invitations/validate/{token}:
 *   get:
 *     summary: Validate invitation token
 *     description: Validates and retrieves invitation details using token
 *     tags: [Workforce Management, Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Invitation validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitation:
 *                   $ref: '#/components/schemas/WorkforceInvitation'
 *       400:
 *         description: Invitation expired
 *       404:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attachments/upload:
 *   post:
 *     summary: Get file upload URL
 *     description: Generates signed URL for direct file upload to object storage
 *     tags: [File Management, Attachments]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - contentType
 *               - size
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Original file name
 *               contentType:
 *                 type: string
 *                 description: MIME type of file
 *               size:
 *                 type: integer
 *                 description: File size in bytes
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadURL:
 *                   type: string
 *                   description: Signed URL for file upload
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attachments/serve/{attachmentId}:
 *   get:
 *     summary: Serve attachment file
 *     description: Securely serves attachment files with PHI access logging
 *     tags: [File Management, Attachments, PHI]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment identifier
 *     responses:
 *       200:
 *         description: File served successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all system users
 *     description: Retrieves all users in the system (Master Admin only)
 *     tags: [User Management, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     description: Updates a user's system role (Master Admin only)
 *     tags: [User Management, Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, moderator, master]
 *                 description: New user role
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Master admin privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/users/{userId}/password:
 *   post:
 *     summary: Reset user password (Admin)
 *     description: Allows admin/moderator to reset another user's password
 *     tags: [User Management, Admin, Security]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password (minimum 6 characters)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid password format
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin/Moderator privileges required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attachments/serve/{attachmentId}:
 *   get:
 *     summary: Serve attachment files with PHI logging
 *     description: Serves file attachments with automatic PHI download logging and signed URL generation
 *     tags: [Attachments, PHI, Files]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment ID to serve
 *     responses:
 *       200:
 *         description: File served successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Authentication required for file access
 *       404:
 *         description: Attachment not found
 *       500:
 *         description: Server error
 *       503:
 *         description: Object storage configuration error
 */

/**
 * @swagger
 * /api/attachments-proxy:
 *   get:
 *     summary: Legacy attachment proxy with PHI logging
 *     description: Legacy endpoint for serving attachments with PHI download logging (redirects to modern endpoint)
 *     tags: [Attachments, PHI, Legacy]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Original attachment URL to proxy
 *     responses:
 *       302:
 *         description: Redirect to modern attachment endpoint
 *       400:
 *         description: URL parameter required or invalid URL format
 *       401:
 *         description: Authentication required for file access
 *       404:
 *         description: User not found
 *       503:
 *         description: Google Cloud Storage not available
 */

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in with username and password
 *     description: Authenticate user with custom username/password credentials
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register new user account
 *     description: Create a new user account with optional workforce invitation token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[a-zA-Z0-9_]+$"
 *               password:
 *                 type: string
 *                 minLength: 6
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number for SMS notifications
 *               token:
 *                 type: string
 *                 description: Optional workforce invitation token
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or username already taken
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Request password reset
 *     description: Initiate password reset process via email and/or SMS
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or username
 *     responses:
 *       200:
 *         description: Reset instructions sent (always returns success for security)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 methods:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: boolean
 *                     sms:
 *                       type: boolean
 */

/**
 * @swagger
 * /api/auth/confirm-reset-password:
 *   post:
 *     summary: Confirm password reset
 *     description: Complete password reset using token from email/SMS
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email/SMS
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/logout:
 *   get:
 *     summary: Sign out user
 *     description: Destroy user session and redirect to login page
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirect to login page
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         firstName:
 *           type: string
 *           nullable: true
 *           description: User's first name
 *         lastName:
 *           type: string
 *           nullable: true
 *           description: User's last name
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [member, moderator, master]
 *           description: User's system role
 *         profileImageUrl:
 *           type: string
 *           nullable: true
 *           description: URL to user's profile image
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     Workforce:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique workforce identifier
 *         name:
 *           type: string
 *           description: Workforce name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Workforce description
 *         emailDomain:
 *           type: string
 *           description: Email domain for workforce members
 *         emailProvider:
 *           type: string
 *           enum: [sendgrid, custom]
 *           description: Email service provider
 *         emailSettings:
 *           type: object
 *           nullable: true
 *           description: Provider-specific email settings
 *         masterId:
 *           type: string
 *           description: Master admin user ID
 *         isActive:
 *           type: boolean
 *           description: Whether workforce is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     WorkforceMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique member identifier
 *         workforceId:
 *           type: string
 *           description: Associated workforce ID
 *         userId:
 *           type: string
 *           description: Associated user ID
 *         role:
 *           type: string
 *           enum: [user, moderator]
 *           description: Member's role within workforce
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Member's status
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     WorkforceInvitation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique invitation identifier
 *         token:
 *           type: string
 *           description: Invitation token
 *         workforceId:
 *           type: string
 *           description: Target workforce ID
 *         workforceName:
 *           type: string
 *           description: Target workforce name
 *         email:
 *           type: string
 *           nullable: true
 *           description: Email address (for email invitations)
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *           description: Phone number (for SMS invitations)
 *         role:
 *           type: string
 *           enum: [user, moderator]
 *           description: Role for new member
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     Conversation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique conversation identifier
 *         name:
 *           type: string
 *           nullable: true
 *           description: Conversation name (for group conversations)
 *         isGroup:
 *           type: boolean
 *           description: Whether this is a group conversation
 *         createdBy:
 *           type: string
 *           description: Creator user ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     ConversationMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique member identifier
 *         conversationId:
 *           type: string
 *           description: Associated conversation ID
 *         userId:
 *           type: string
 *           description: Associated user ID
 *         isAdmin:
 *           type: boolean
 *           description: Whether member has admin privileges
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 * 
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique message identifier
 *         conversationId:
 *           type: string
 *           description: Associated conversation ID
 *         senderId:
 *           type: string
 *           description: Sender user ID
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, image, file, system]
 *           description: Type of message
 *         securityLevel:
 *           type: string
 *           enum: [normal, confidential, restricted, classified]
 *           description: Security classification level
 *         accessPassword:
 *           type: string
 *           nullable: true
 *           description: Encrypted access password for secure messages
 *         requiresAuthentication:
 *           type: boolean
 *           description: Whether message requires authentication to view
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           description: Message priority level
 *         reactions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               emoji:
 *                 type: string
 *               userId:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of PHI contained in message
 *         phiDescription:
 *           type: string
 *           nullable: true
 *           description: Description of PHI content
 *         patientFirstName:
 *           type: string
 *           nullable: true
 *           description: Patient first name (for HIPAA tracking)
 *         patientLastName:
 *           type: string
 *           nullable: true
 *           description: Patient last name (for HIPAA tracking)
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Message expiration time (for auto-deletion)
 *         createdAt:
 *           type: string
 *           format: date-time
 *         sender:
 *           $ref: '#/components/schemas/User'
 * 
 *     SecureMessage:
 *       allOf:
 *         - $ref: '#/components/schemas/Message'
 *         - type: object
 *           properties:
 *             encryptionKey:
 *               type: string
 *               nullable: true
 *               description: Encryption key for message content
 *             authAttempts:
 *               type: integer
 *               description: Number of authentication attempts
 *             lastAccessedAt:
 *               type: string
 *               format: date-time
 *               nullable: true
 *               description: Last time message was accessed
 * 
 *     Attachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique attachment identifier
 *         url:
 *           type: string
 *           description: File URL or storage path
 *         name:
 *           type: string
 *           description: Original file name
 *         size:
 *           type: integer
 *           description: File size in bytes
 *         type:
 *           type: string
 *           description: MIME type
 *         uploadedAt:
 *           type: string
 *           format: date-time
 * 
 *     PHIAccessLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique log entry identifier
 *         messageId:
 *           type: string
 *           description: Associated message ID
 *         userId:
 *           type: string
 *           description: User who accessed PHI
 *         userEmail:
 *           type: string
 *           description: Email of user who accessed PHI
 *         workforceId:
 *           type: string
 *           description: User's workforce ID
 *         workforceName:
 *           type: string
 *           description: User's workforce name
 *         ipAddress:
 *           type: string
 *           description: IP address of access
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of PHI accessed
 *         success:
 *           type: boolean
 *           description: Whether access was successful
 *         authMethod:
 *           type: string
 *           enum: [system_password, user_password]
 *           description: Authentication method used
 *         activityType:
 *           type: string
 *           enum: [view, download, authenticate_success, authenticate_failure]
 *           description: Type of PHI access activity
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     MessageDetails:
 *       type: object
 *       properties:
 *         message:
 *           $ref: '#/components/schemas/Message'
 *         accessLogs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PHIAccessLog'
 *         attachmentLogs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PHIAccessLog'
 * 
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 *         details:
 *           type: object
 *           description: Additional error details
 * 
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Session-based authentication using Express sessions
 *     replitAuth:
 *       type: oauth2
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: https://replit.com/auth/openid/authorize
 *           tokenUrl: https://replit.com/auth/openid/token
 *           scopes:
 *             openid: OpenID Connect authentication
 *             profile: Access to user profile information
 *       description: Replit OAuth2 authentication
 */

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Get user's conversations
 *     description: Retrieve all conversations where the authenticated user is a member
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Authentication required
 *   post:
 *     summary: Create new conversation
 *     description: Create a new group conversation with optional initial members
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - isGroup
 *             properties:
 *               name:
 *                 type: string
 *                 description: Conversation name (required for group conversations)
 *               isGroup:
 *                 type: boolean
 *                 description: Whether this is a group conversation
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional list of initial member user IDs
 *     responses:
 *       200:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/conversations/direct:
 *   post:
 *     summary: Create or get direct conversation
 *     description: Create a new direct conversation between two users or return existing one
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: User ID of the other participant
 *     responses:
 *       200:
 *         description: Direct conversation created or retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Missing participantId
 *       403:
 *         description: Not authorized to message this user
 */

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Get conversation messages
 *     description: Retrieve all messages for a specific conversation
 *     tags: [Messages]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not authorized to view this conversation
 *       404:
 *         description: Conversation not found
 */

/**
 * @swagger
 * /api/conversations/{conversationId}/mark-read:
 *   post:
 *     summary: Mark conversation as read
 *     description: Mark all messages in a conversation as read for the current user
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/conversations/{id}/members:
 *   get:
 *     summary: Get conversation members
 *     description: Retrieve all members of a specific conversation
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: List of conversation members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConversationMember'
 *       403:
 *         description: Not authorized to view conversation members
 *   post:
 *     summary: Add member to conversation
 *     description: Add a new member to a conversation (moderator/master permissions required)
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username of user to add
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConversationMember'
 *       400:
 *         description: User already a member or not found
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/conversations/{id}:
 *   patch:
 *     summary: Update conversation
 *     description: Update conversation name (moderator/master permissions required)
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New conversation name
 *     responses:
 *       200:
 *         description: Conversation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Delete conversation
 *     description: Delete a conversation (permission-based access)
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Conversation not found
 */

/**
 * @swagger
 * /api/conversation-peers:
 *   get:
 *     summary: Get conversation peers
 *     description: Get users that share group conversations with the current user
 *     tags: [Conversations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: List of users who share group conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/user/workforce-membership:
 *   get:
 *     summary: Get user's workforce membership
 *     description: Retrieve the current user's workforce membership details
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Workforce membership details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workforceId:
 *                   type: string
 *                 workforceName:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [user, moderator]
 *                 membershipId:
 *                   type: string
 *       401:
 *         description: Authentication required
 */

/**
 * @swagger
 * /api/auth/user/username:
 *   patch:
 *     summary: Update username
 *     description: Update the current user's username
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: "^[a-zA-Z0-9_]+$"
 *     responses:
 *       200:
 *         description: Username updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid username or already taken
 */

/**
 * @swagger
 * /api/users/{userId}/password:
 *   post:
 *     summary: Reset user password (Admin/Moderator)
 *     description: Reset another user's password (admin/moderator permissions required)
 *     tags: [Users]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/workforces:
 *   get:
 *     summary: Get user workforces
 *     description: Retrieve workforces accessible to the current user (Master admin only)
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: List of workforces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workforce'
 *       403:
 *         description: Master privileges required
 *   post:
 *     summary: Create workforce
 *     description: Create a new workforce (Master admin only)
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - emailDomain
 *               - emailProvider
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               emailDomain:
 *                 type: string
 *               emailProvider:
 *                 type: string
 *               emailSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workforce created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workforce'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Master privileges required
 */

/**
 * @swagger
 * /api/workforces/{workforceId}:
 *   patch:
 *     summary: Update workforce name
 *     description: Update workforce name (Master admin or workforce moderator)
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: workforceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workforce ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: New workforce name
 *     responses:
 *       200:
 *         description: Workforce updated successfully
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Workforce not found
 *   delete:
 *     summary: Delete workforce
 *     description: Delete a workforce (Master admin only)
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: workforceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workforce ID
 *     responses:
 *       200:
 *         description: Workforce deleted successfully
 *       403:
 *         description: Master privileges required
 *       404:
 *         description: Workforce not found
 */

/**
 * @swagger
 * /api/workforces/{workforceId}/members:
 *   get:
 *     summary: Get workforce members
 *     description: Retrieve members of a specific workforce
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: workforceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workforce ID
 *     responses:
 *       200:
 *         description: List of workforce members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkforceMember'
 *       403:
 *         description: Access denied to this workforce
 */

/**
 * @swagger
 * /api/workforce-invitations:
 *   post:
 *     summary: Create workforce invitation
 *     description: Send an invitation to join a workforce via SMS
 *     tags: [Invitations]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workforceId
 *               - email
 *               - phoneNumber
 *               - role
 *             properties:
 *               workforceId:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, moderator]
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 invitation:
 *                   $ref: '#/components/schemas/WorkforceInvitation'
 *       400:
 *         description: Missing required fields or invalid role
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/workforce-invitations/validate/{token}:
 *   get:
 *     summary: Validate invitation token
 *     description: Validate a workforce invitation token
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token
 *     responses:
 *       200:
 *         description: Valid invitation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitation:
 *                   $ref: '#/components/schemas/WorkforceInvitation'
 *       400:
 *         description: Invitation has expired
 *       404:
 *         description: Invalid or expired invitation
 */

/**
 * @swagger
 * /api/workforce-members/{memberId}/status:
 *   patch:
 *     summary: Update workforce member status
 *     description: Activate or deactivate a workforce member
 *     tags: [Workforces]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Member ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Member status updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Member not found
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all system users
 *     description: Retrieve all users in the system (Master admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: List of all system users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Master privileges required
 */

/**
 * @swagger
 * /api/messages/{messageId}/authenticate:
 *   post:
 *     summary: Authenticate secure PHI message
 *     description: Authenticate access to a secure PHI message with password and comprehensive audit logging
 *     tags: [PHI & Security]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID to authenticate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: Authentication password for the secure message
 *     responses:
 *       200:
 *         description: Authentication successful with message content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     phiTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     attachments:
 *                       type: array
 *       401:
 *         description: Authentication failed - wrong password
 *       403:
 *         description: Not authorized to access this message
 *       404:
 *         description: Message not found
 */

/**
 * @swagger
 * /api/phi-access-logs:
 *   get:
 *     summary: Get PHI access audit logs
 *     description: Retrieve comprehensive PHI access logs for HIPAA compliance (Admin only)
 *     tags: [PHI & Security]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: PHI access logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       messageId:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       workforceId:
 *                         type: string
 *                       workforceName:
 *                         type: string
 *                       accessTime:
 *                         type: string
 *                         format: date-time
 *                       ipAddress:
 *                         type: string
 *                       phiTypes:
 *                         type: array
 *                         items:
 *                           type: string
 *                       authMethod:
 *                         type: string
 *                         enum: [system_password, attachment_download]
 *                       success:
 *                         type: boolean
 *       403:
 *         description: Admin privileges required
 */

/**
 * @swagger
 * /api/secure-messages/audit-logs:
 *   get:
 *     summary: Get all secure message audit logs
 *     description: Retrieve comprehensive audit logs for all secure message access attempts (Master admin only)
 *     tags: [PHI & Security]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   messageId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   workforceId:
 *                     type: string
 *                   accessAttemptTime:
 *                     type: string
 *                     format: date-time
 *                   authenticationResult:
 *                     type: boolean
 *                   messageViewed:
 *                     type: boolean
 *                   ipAddress:
 *                     type: string
 *                   userAgent:
 *                     type: string
 *       403:
 *         description: Master admin privileges required
 */

/**
 * @swagger
 * /api/attachments-proxy:
 *   get:
 *     summary: Download attachment with PHI audit logging
 *     description: Securely download message attachments with comprehensive PHI access logging
 *     tags: [PHI & Security]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment URL to download
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: URL parameter required
 *       401:
 *         description: Authentication required for file access
 *       404:
 *         description: File not found
 */

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     description: Update a user's system role (Master admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, moderator, master]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role
 *       403:
 *         description: Master privileges required
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get system analytics
 *     description: Retrieve system-wide analytics and statistics (Master admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - replitAuth: []
 *     responses:
 *       200:
 *         description: System analytics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analytics'
 *       403:
 *         description: Master privileges required
 */

/**
 * @swagger
 * /ws:
 *   get:
 *     summary: WebSocket connection
 *     description: Establish WebSocket connection for real-time messaging
 *     tags: [WebSocket]
 *     parameters:
 *       - in: header
 *         name: Upgrade
 *         required: true
 *         schema:
 *           type: string
 *           example: websocket
 *       - in: header
 *         name: Connection
 *         required: true
 *         schema:
 *           type: string
 *           example: Upgrade
 *     responses:
 *       101:
 *         description: WebSocket connection established
 *       400:
 *         description: Bad request
 *       401:
 *         description: Authentication required
 *     x-websocket-events:
 *       authenticate:
 *         description: Authenticate WebSocket connection
 *         payload:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: authenticate
 *             userId:
 *               type: string
 *               description: User ID for authentication
 *       join_conversation:
 *         description: Join a conversation room
 *         payload:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: join_conversation
 *             conversationId:
 *               type: string
 *               description: Conversation ID to join
 *       send_message:
 *         description: Send a message to a conversation
 *         payload:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: send_message
 *             conversationId:
 *               type: string
 *             content:
 *               type: string
 *               description: Message content (encrypted)
 *             messageType:
 *               type: string
 *               enum: [text, file, image]
 *               default: text
 *             encryptionKey:
 *               type: string
 *               description: Encryption key for message
 *       typing:
 *         description: Send typing indicator
 *         payload:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: typing
 *             isTyping:
 *               type: boolean
 *               description: Whether user is currently typing
 */

/**
 * Demo endpoints for testing and development
 */

/**
 * @swagger
 * /api/demo/workforce-members:
 *   get:
 *     summary: Get workforce members (Demo)
 *     description: Demo endpoint to get workforce members with role-based filtering
 *     tags: [Demo]
 *     responses:
 *       200:
 *         description: List of accessible workforce members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkforceMember'
 */

/**
 * @swagger
 * /api/demo/conversations/direct:
 *   post:
 *     summary: Create direct conversation (Demo)
 *     description: Demo endpoint to create or get direct conversation with workforce boundary enforcement
 *     tags: [Demo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *               - initiatorId
 *             properties:
 *               participantId:
 *                 type: string
 *               initiatorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Direct conversation created or retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       403:
 *         description: Not authorized to message this user
 */

/**
 * @swagger
 * /api/demo/conversations/{id}/members:
 *   get:
 *     summary: Get conversation members (Demo)
 *     description: Demo endpoint to get conversation members
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: List of conversation members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ConversationMember'
 *   post:
 *     summary: Add member to conversation (Demo)
 *     description: Demo endpoint to add member to conversation with workforce boundary enforcement
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - inviterId
 *             properties:
 *               username:
 *                 type: string
 *               inviterId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: User already a member or validation error
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Remove member from conversation (Demo)
 *     description: Demo endpoint to remove member from conversation
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/demo/conversations/{id}/name:
 *   patch:
 *     summary: Update conversation name (Demo)
 *     description: Demo endpoint to update conversation name
 *     tags: [Demo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Name is required
 */

/**
 * @swagger
 * /api/demo/conversations:
 *   post:
 *     summary: Create new group conversation (Demo)
 *     description: Demo endpoint to create a new group conversation
 *     tags: [Demo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Name is required
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     sessionAuth:
 *       type: apiKey
 *       in: cookie
 *       name: connect.sid
 *       description: Session-based authentication using Express sessions
 *     replitAuth:
 *       type: oauth2
 *       description: Replit OIDC authentication
 *       flows:
 *         authorizationCode:
 *           authorizationUrl: https://replit.com/auth/oauth2/auth
 *           tokenUrl: https://replit.com/auth/oauth2/token
 *           scopes: {}
 *   schemas:
 *     PHIAuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique audit log ID
 *         messageId:
 *           type: string
 *           description: ID of the PHI message accessed
 *         userId:
 *           type: string
 *           description: ID of the user who accessed the PHI
 *         userEmail:
 *           type: string
 *           description: Email of the user (required for HIPAA compliance)
 *         workforceId:
 *           type: string
 *           description: Workforce ID of the user
 *         workforceName:
 *           type: string
 *           description: Name of the workforce
 *         activityType:
 *           type: string
 *           enum: [authentication_attempt, message_view, attachment_download]
 *           description: Type of PHI access activity
 *         authMethod:
 *           type: string
 *           enum: [system_password, attachment_download]
 *           description: Authentication method used
 *         success:
 *           type: boolean
 *           description: Whether the access attempt was successful
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of PHI accessed (insurance_card, patient_name, medical_records, etc.)
 *         phiDescription:
 *           type: string
 *           description: Description of the PHI content
 *         messageContent:
 *           type: string
 *           description: Complete message content preserved for audit
 *         attachmentMetadata:
 *           type: object
 *           description: Complete file information for downloaded attachments
 *         attachmentData:
 *           type: string
 *           description: Base64 encoded file data for forensic preservation
 *         ipAddress:
 *           type: string
 *           description: IP address of the access attempt
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         accessTime:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the access attempt
 *     SecureMessageAuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique audit log ID
 *         messageId:
 *           type: string
 *           description: ID of the secure message
 *         userId:
 *           type: string
 *           description: User who attempted to access the message
 *         workforceId:
 *           type: string
 *           description: Workforce ID of the user
 *         accessAttemptTime:
 *           type: string
 *           format: date-time
 *           description: When the access attempt occurred
 *         authenticationResult:
 *           type: boolean
 *           description: Whether authentication was successful
 *         messageViewed:
 *           type: boolean
 *           description: Whether the message was successfully viewed
 *         ipAddress:
 *           type: string
 *           description: IP address of the access attempt
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         sessionId:
 *           type: string
 *           description: Session ID for the access attempt
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         error:
 *           type: string
 *           description: Error type or code
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         senderId:
 *           type: string
 *         conversationId:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [text, secure, phi]
 *         securityLevel:
 *           type: string
 *           enum: [confidential, restricted, classified]
 *         requiresAuthentication:
 *           type: boolean
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *         phiDescription:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *         reactions:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, moderator, master]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SecureMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         senderId:
 *           type: string
 *         conversationId:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [secure, phi]
 *         securityLevel:
 *           type: string
 *           enum: [confidential, restricted, classified]
 *         requiresAuthentication:
 *           type: boolean
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *         phiDescription:
 *           type: string
 *         patientFirstName:
 *           type: string
 *         patientLastName:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         expiresAt:
 *           type: string
 *           format: date-time
 *     PHIAccessLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         messageId:
 *           type: string
 *         userId:
 *           type: string
 *         userEmail:
 *           type: string
 *         workforceId:
 *           type: string
 *         workforceName:
 *           type: string
 *         accessTime:
 *           type: string
 *           format: date-time
 *         success:
 *           type: boolean
 *         authMethod:
 *           type: string
 *           enum: [phi_message_creation, attachment_download, message_authentication]
 *         activityType:
 *           type: string
 *           enum: [upload, download, authentication]
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *         patientFirstName:
 *           type: string
 *         patientLastName:
 *           type: string
 *         attachmentName:
 *           type: string
 *         fileSize:
 *           type: integer
 *         contentPreview:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         phiDescription:
 *           type: string
 *         ipAddress:
 *           type: string
 *         userAgent:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         message:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             content:
 *               type: string
 *             phiTypes:
 *               type: array
 *               items:
 *                 type: string
 *             phiDescription:
 *               type: string
 *             patientFirstName:
 *               type: string
 *             patientLastName:
 *               type: string
 *             createdAt:
 *               type: string
 *               format: date-time
 *     MessageDetails:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         phiTypes:
 *           type: array
 *           items:
 *             type: string
 *         phiDescription:
 *           type: string
 *         patientFirstName:
 *           type: string
 *         patientLastName:
 *           type: string
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         sender:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             username:
 *               type: string
 *     Attachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         url:
 *           type: string
 *         name:
 *           type: string
 *         size:
 *           type: integer
 *         type:
 *           type: string
 *         uploadedAt:
 *           type: string
 *           format: date-time
 */