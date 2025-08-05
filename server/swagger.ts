import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SKRAM API',
      version: '1.0.0',
      description: 'Secure real-time messaging platform with role-based access control and workforce management',
      contact: {
        name: 'SKRAM API Support',
        email: 'support@skram.app'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'skram.replit.app'}`
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication via express-session'
        },
        replitAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: '/api/login',
              tokenUrl: '/api/callback',
              scopes: {}
            }
          },
          description: 'Replit OIDC authentication'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique user identifier' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            username: { type: 'string', description: 'Unique username' },
            firstName: { type: 'string', nullable: true, description: 'First name' },
            lastName: { type: 'string', nullable: true, description: 'Last name' },
            profileImageUrl: { type: 'string', nullable: true, description: 'Profile image URL' },
            phoneNumber: { type: 'string', nullable: true, description: 'Phone number for SMS notifications' },
            role: { 
              type: 'string', 
              enum: ['member', 'moderator', 'master'], 
              description: 'User role in the system' 
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique conversation identifier' },
            name: { type: 'string', description: 'Conversation name (Group Skrams only)' },
            isGroup: { type: 'boolean', description: 'Whether this is a group conversation' },
            createdBy: { type: 'string', description: 'User ID who created the conversation' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            members: {
              type: 'array',
              items: { $ref: '#/components/schemas/ConversationMember' },
              description: 'List of conversation members'
            },
            unreadCount: { type: 'integer', description: 'Number of unread messages for the current user' }
          }
        },
        ConversationMember: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Membership ID' },
            conversationId: { type: 'string', description: 'Conversation ID' },
            userId: { type: 'string', description: 'User ID' },
            isAdmin: { type: 'boolean', description: 'Whether user is admin of this conversation' },
            joinedAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User', description: 'User details' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique message identifier' },
            conversationId: { type: 'string', description: 'Conversation this message belongs to' },
            senderId: { type: 'string', description: 'User ID of message sender' },
            content: { type: 'string', description: 'Message content (encrypted)' },
            messageType: { 
              type: 'string', 
              enum: ['text', 'file', 'image'], 
              default: 'text',
              description: 'Type of message content' 
            },
            encryptionKey: { type: 'string', nullable: true, description: 'Encryption key for message content' },
            priority: {
              type: 'string',
              enum: ['low', 'normal', 'high', 'urgent'],
              default: 'normal',
              description: 'Message priority level'
            },
            highlightReason: { type: 'string', nullable: true, description: 'Reason for priority highlighting' },
            createdAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', description: 'When message expires (24h auto-delete)' },
            sender: { $ref: '#/components/schemas/User', description: 'Message sender details' }
          }
        },
        Workforce: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique workforce identifier' },
            name: { type: 'string', description: 'Workforce name' },
            description: { type: 'string', nullable: true, description: 'Workforce description' },
            emailDomain: { type: 'string', description: 'Email domain for workforce members' },
            emailProvider: { type: 'string', description: 'Email service provider' },
            emailSettings: { type: 'object', nullable: true, description: 'Email configuration settings' },
            masterId: { type: 'string', description: 'Master admin user ID for this workforce' },
            isActive: { type: 'boolean', default: true, description: 'Whether workforce is active' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        WorkforceMember: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Membership ID' },
            workforceId: { type: 'string', description: 'Workforce ID' },
            userId: { type: 'string', description: 'User ID' },
            role: { 
              type: 'string', 
              enum: ['user', 'moderator'], 
              description: 'User role within the workforce' 
            },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive'], 
              default: 'active',
              description: 'Member status in workforce' 
            },
            joinedAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User', description: 'User details' }
          }
        },
        WorkforceInvitation: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Invitation ID' },
            workforceId: { type: 'string', description: 'Workforce ID' },
            email: { type: 'string', format: 'email', description: 'Invited user email' },
            phoneNumber: { type: 'string', description: 'Invited user phone number' },
            role: { 
              type: 'string', 
              enum: ['user', 'moderator'], 
              description: 'Assigned role for invited user' 
            },
            token: { type: 'string', description: 'Unique invitation token' },
            expiresAt: { type: 'string', format: 'date-time' },
            invitedBy: { type: 'string', description: 'User ID who sent the invitation' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            totalWorkforces: { type: 'integer', description: 'Total number of workforces' },
            totalUsers: { type: 'integer', description: 'Total number of users' },
            totalConversations: { type: 'integer', description: 'Total number of conversations' },
            totalMessages: { type: 'integer', description: 'Total number of messages' },
            activeUsers24h: { type: 'integer', description: 'Users active in last 24 hours' },
            messagesLast24h: { type: 'integer', description: 'Messages sent in last 24 hours' },
            averageWorkforceSize: { type: 'number', description: 'Average number of members per workforce' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Error message' },
            error: { type: 'string', description: 'Additional error details' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', description: 'Operation success status' },
            message: { type: 'string', description: 'Success message' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and session management' },
      { name: 'Users', description: 'User management operations' },
      { name: 'Conversations', description: 'Chat conversations and messaging' },
      { name: 'Messages', description: 'Message operations' },
      { name: 'Workforces', description: 'Workforce management' },
      { name: 'Invitations', description: 'Workforce invitation system' },
      { name: 'Admin', description: 'Administrative operations (Master Admin only)' },
      { name: 'Demo', description: 'Demo and testing endpoints' },
      { name: 'WebSocket', description: 'Real-time messaging via WebSocket' }
    ]
  },
  apis: ['./server/routes.ts', './server/swagger-docs.ts'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customSiteTitle: 'SKRAM API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { background-color: #2563eb; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      persistAuthorization: true
    }
  }));

  // Serve the swagger.json at /api-docs/swagger.json
  app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger API documentation available at /api-docs');
}