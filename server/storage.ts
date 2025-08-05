import {
  users,
  conversations,
  conversationMembers,
  messages,
  messageReactions,
  workforces,
  workforceMembers,
  workforceInvitations,
  passwordResetTokens,
  secureMessageAuditLog,
  phiAccessLogs,
  phiAuditLog,
  type User,
  type UpsertUser,
  type Conversation,
  type ConversationMember,
  type Message,
  type MessageReaction,
  type Workforce,
  type WorkforceMember,
  type WorkforceInvitation,
  type InsertConversation,
  type InsertMessage,
  type InsertMessageReaction,
  type InsertConversationMember,
  type InsertWorkforce,
  type InsertWorkforceMember,
  type InsertWorkforceInvitation,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type SecureMessageAuditLog,
  type InsertSecureMessageAuditLog,
  type PHIAccessLog,
  type InsertPHIAccessLog,
  type PHIAuditLog,
  type InsertPHIAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, gt, ne, sql, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserUsername(userId: string, username: string): Promise<User | undefined>;
  updateUserPassword(userId: string, password: string): Promise<User | undefined>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getUserConversations(userId: string): Promise<(Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number })[]>;
  getAllConversations(): Promise<(Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number })[]>;
  getDirectConversation(userId1: string, userId2: string): Promise<Conversation | undefined>;
  createDirectConversation(userId1: string, userId2: string): Promise<Conversation>;
  deleteConversation(conversationId: string): Promise<void>;
  
  // Conversation member operations
  addConversationMember(member: InsertConversationMember): Promise<ConversationMember>;
  removeConversationMember(conversationId: string, userId: string): Promise<void>;
  getConversationMembers(conversationId: string): Promise<(ConversationMember & { user: User })[]>;
  getVisibleConversationMembers(conversationId: string): Promise<(ConversationMember & { user: User })[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateConversationName(conversationId: string, name: string): Promise<Conversation | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageById(messageId: string): Promise<Message | undefined>;
  getConversationMessages(conversationId: string, limit?: number): Promise<(Message & { sender: User, reactions?: MessageReaction[] })[]>;
  deleteExpiredMessages(): Promise<void>;

  // Message reaction operations
  addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]>;

  // Secure message operations
  authenticateSecureMessage(messageId: string, password: string): Promise<boolean>;
  logSecureMessageAccess(audit: InsertSecureMessageAuditLog): Promise<SecureMessageAuditLog>;
  getSecureMessageAuditLogs(messageId: string): Promise<(SecureMessageAuditLog & { user: User, workforce?: Workforce })[]>;
  getAllSecureMessageAuditLogs(): Promise<(SecureMessageAuditLog & { user: User, message: Message, workforce?: Workforce })[]>;

  // Workforce operations
  createWorkforce(workforce: InsertWorkforce): Promise<Workforce>;
  getWorkforce(id: string): Promise<Workforce | undefined>;
  getAllWorkforces(): Promise<Workforce[]>;
  getUserWorkforces(userId: string): Promise<Workforce[]>;
  updateWorkforce(id: string, updates: Partial<InsertWorkforce>): Promise<Workforce | undefined>;
  updateWorkforceName(id: string, name: string): Promise<Workforce | undefined>;
  deleteWorkforce(id: string): Promise<void>;

  // Workforce member operations
  addWorkforceMember(member: InsertWorkforceMember): Promise<WorkforceMember>;
  removeWorkforceMember(workforceId: string, userId: string): Promise<void>;
  getWorkforceMember(id: string): Promise<WorkforceMember | undefined>;
  getWorkforceMembers(workforceId: string): Promise<(WorkforceMember & { user: User })[]>;
  getUserWorkforceMembership(userId: string): Promise<WorkforceMember | undefined>;
  updateWorkforceMemberRole(workforceId: string, userId: string, role: string): Promise<WorkforceMember | undefined>;

  // Workforce invitation operations
  createWorkforceInvitation(invitation: InsertWorkforceInvitation): Promise<WorkforceInvitation>;
  
  // Password reset token operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  getWorkforceInvitation(token: string): Promise<WorkforceInvitation | undefined>;
  acceptWorkforceInvitation(token: string, userId: string): Promise<{ invitation: WorkforceInvitation; member: WorkforceMember }>;
  getWorkforceInvitations(workforceId: string): Promise<WorkforceInvitation[]>;

  // Analytics operations
  getAdminAnalytics(masterId: string): Promise<{
    totalWorkforces: number;
    totalMembers: number;
    totalMessages: number;
    messagesThisYear: number;
    messagesThisMonth: number;
    messagesThisWeek: number;
    messagesToday: number;
  }>;

  // Get all workforce members across all workforces
  getAllWorkforceMembers(): Promise<(WorkforceMember & { user: User })[]>;

  // Deactivation operations
  updateWorkforceStatus(workforceId: string, isActive: boolean): Promise<Workforce>;
  updateWorkforceMemberStatus(memberId: string, status: string): Promise<WorkforceMember>;
  deleteWorkforceMember(memberId: string): Promise<WorkforceMember>;

  // Conversation peer operations
  getConversationPeers(userId: string): Promise<User[]>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;

  // PHI Access Audit Logging operations
  createPHIAccessLog(logData: {
    messageId: string;
    userId: string;
    userEmail: string;
    workforceId: string;
    workforceName: string;
    ipAddress?: string;
    userAgent?: string;
    phiTypes: string[];
    success: boolean;
    authMethod: string;
  }): Promise<PHIAccessLog>;
  getPHIAccessLogs(messageId: string): Promise<PHIAccessLog[]>;
  getAllPHIAccessLogsWithMessages(): Promise<Array<PHIAccessLog & { message_content?: string; message_attachments?: any; phi_description?: string }>>;
  authenticatePHIMessage(userId: string, password: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number })[]> {
    const userConversations = await db
      .select({
        conversation: conversations,
        member: conversationMembers,
        user: users,
      })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversationMembers.conversationId, conversations.id))
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(eq(conversationMembers.userId, userId));

    const conversationMap = new Map<string, Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number, lastMessageAt?: Date }>();
    
    for (const row of userConversations) {
      if (!conversationMap.has(row.conversation.id)) {
        conversationMap.set(row.conversation.id, {
          ...row.conversation,
          members: [],
          unreadCount: 0,
        });
      }
    }

    // Get all members, unread count, and last message time for each conversation
    for (const [conversationId, conversation] of Array.from(conversationMap.entries())) {
      const members = await db
        .select({
          member: conversationMembers,
          user: users,
        })
        .from(conversationMembers)
        .innerJoin(users, eq(conversationMembers.userId, users.id))
        .where(eq(conversationMembers.conversationId, conversationId));
      
      conversation.members = members.map(m => ({ ...m.member, user: m.user }));
      
      // Calculate unread messages for this user in this conversation
      const userMember = conversation.members.find(m => m.userId === userId);
      if (userMember && userMember.lastReadAt) {
        const unreadMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversationId),
              gt(messages.createdAt, userMember.lastReadAt),
              ne(messages.senderId, userId) // Don't count own messages
            )
          );
        conversation.unreadCount = Number(unreadMessages[0]?.count) || 0;
      } else {
        // If no lastReadAt, count all messages except own
        const unreadMessages = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversationId),
              ne(messages.senderId, userId)
            )
          );
        conversation.unreadCount = Number(unreadMessages[0]?.count) || 0;
      }

      // Get last message time for sorting
      const lastMessage = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      if (lastMessage.length > 0) {
        conversation.lastMessageAt = lastMessage[0].createdAt || undefined;
      }
    }

    // Sort by most recent activity (last message time, then creation time)
    const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA; // Most recent first
    });

    return sortedConversations;
  }

  async getAllConversations(): Promise<(Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number })[]> {
    // Get all conversations in the system
    const allConversations = await db.select().from(conversations);
    
    const conversationMap = new Map<string, Conversation & { members: (ConversationMember & { user: User })[], unreadCount: number, lastMessageAt?: Date }>();
    
    for (const conversation of allConversations) {
      conversationMap.set(conversation.id, {
        ...conversation,
        members: [],
        unreadCount: 0,
      });
    }

    // Get all members, and last message time for each conversation
    for (const [conversationId, conversation] of Array.from(conversationMap.entries())) {
      const members = await db
        .select({
          member: conversationMembers,
          user: users,
        })
        .from(conversationMembers)
        .innerJoin(users, eq(conversationMembers.userId, users.id))
        .where(eq(conversationMembers.conversationId, conversationId));
      
      conversation.members = members.map(m => ({ ...m.member, user: m.user }));
      
      // Set unreadCount to 0 for system-wide view (master admins don't get personal unread counts for conversations they're not in)
      conversation.unreadCount = 0;

      // Get last message time for sorting
      const lastMessage = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      if (lastMessage.length > 0) {
        conversation.lastMessageAt = lastMessage[0].createdAt || undefined;
      }
    }

    // Sort by most recent activity (last message time, then creation time)
    const sortedConversations = Array.from(conversationMap.values()).sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA; // Most recent first
    });

    return sortedConversations;
  }



  // Conversation member operations
  async addConversationMember(member: InsertConversationMember): Promise<ConversationMember> {
    // Check if member already exists to prevent duplicates
    const existingMember = await db
      .select()
      .from(conversationMembers)
      .where(sql`${conversationMembers.conversationId} = ${member.conversationId} AND ${conversationMembers.userId} = ${member.userId}`)
      .limit(1);
    
    if (existingMember.length > 0) {
      return existingMember[0];
    }
    
    const [newMember] = await db
      .insert(conversationMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async removeConversationMember(conversationId: string, userId: string): Promise<void> {
    await db
      .delete(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId)
        )
      );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getConversationMembers(conversationId: string): Promise<(ConversationMember & { user: User; workforceMembership?: { workforceName: string; role: string } })[]> {
    const members = await db
      .select({
        member: conversationMembers,
        user: users,
        workforceMember: workforceMembers,
        workforce: workforces,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .leftJoin(workforceMembers, eq(users.id, workforceMembers.userId))
      .leftJoin(workforces, eq(workforceMembers.workforceId, workforces.id))
      .where(eq(conversationMembers.conversationId, conversationId));
    
    // Deduplicate by userId to ensure no duplicate members are returned
    const uniqueMembers = members.filter((member, index, self) => 
      self.findIndex(m => m.member.userId === member.member.userId) === index
    );
    
    return uniqueMembers.map(m => ({ 
      ...m.member, 
      user: m.user,
      workforceMembership: m.workforce && m.workforceMember ? {
        workforceName: m.workforce.name,
        role: m.workforceMember.role || 'member'
      } : undefined
    }));
  }

  // Get visible conversation members (excludes hidden system users)
  async getVisibleConversationMembers(conversationId: string): Promise<(ConversationMember & { user: User })[]> {
    const members = await db
      .select({
        member: conversationMembers,
        user: users,
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(users.role, 'member') // Only show regular members to users
        )
      );
    
    return members.map(m => ({ ...m.member, user: m.user }));
  }

  // Message operations
  async createMessage(message: InsertMessage & { attachments?: any[] }): Promise<Message> {
    console.log('🗄️ Storage - Creating message with patient names:', {
      patientFirstName: message.patientFirstName,
      patientLastName: message.patientLastName,
      content: message.content
    });
    
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        attachments: message.attachments || []
      })
      .returning();
      
    console.log('✅ Storage - Message created with patient names:', {
      id: newMessage.id,
      patientFirstName: newMessage.patientFirstName,
      patientLastName: newMessage.patientLastName
    });
    
    // Update sender's last_read_at timestamp so they don't see their own message as unread
    if (message.senderId) {
      await db
        .update(conversationMembers)
        .set({ lastReadAt: new Date() })
        .where(
          and(
            eq(conversationMembers.conversationId, message.conversationId),
            eq(conversationMembers.userId, message.senderId)
          )
        );
    }
    
    return newMessage;
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    
    return message;
  }

  async getConversationMessages(conversationId: string, limit = 50): Promise<(Message & { sender: User; senderWorkforce?: any; reactions?: MessageReaction[] })[]> {
    console.log('=== GET CONVERSATION MESSAGES DEBUG ===');
    console.log('Conversation ID:', conversationId);
    
    // First, let's check what's in the database directly
    const directQuery = await db
      .select({ id: messages.id, messageType: messages.messageType, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt));
    
    console.log('Direct DB query results count:', directQuery.length);
    console.log('PHI message in direct query:', directQuery.find(m => m.id === '4af151a2-b6ed-457b-927e-9d8cafc1510a'));
    
    const messageList = await db
      .select({
        message: messages,
        sender: users,
        senderWorkforce: workforceMembers,
        workforce: workforces,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(workforceMembers, eq(users.id, workforceMembers.userId))
      .leftJoin(workforces, eq(workforceMembers.workforceId, workforces.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(100); // Increased limit to ensure all messages are retrieved
    
    console.log('Joined query results count:', messageList.length);
    console.log('PHI message in joined query:', messageList.find(m => m.message.id === '4af151a2-b6ed-457b-927e-9d8cafc1510a'));

    const processedMessages = messageList.map(m => {
      console.log(`Message ${m.message.id} attachments:`, m.message.attachments, 'Type:', typeof m.message.attachments);
      
      // Check if this is the PHI message we're tracking
      if (m.message.id === '4af151a2-b6ed-457b-927e-9d8cafc1510a') {
        console.log('=== FOUND PHI MESSAGE IN QUERY ===');
        console.log('Message data:', JSON.stringify(m.message, null, 2));
        console.log('=================================');
      }
      
      // Ensure attachments is properly parsed as an array
      let attachments = m.message.attachments;
      if (typeof attachments === 'string') {
        try {
          attachments = JSON.parse(attachments);
        } catch (e) {
          console.error('Error parsing attachments JSON:', e);
          attachments = [];
        }
      }
      if (!Array.isArray(attachments)) {
        attachments = [];
      }
      
      console.log(`Message ${m.message.id} processed attachments:`, attachments);
      
      // Special debug for the PHI message
      if (m.message.id === '4af151a2-b6ed-457b-927e-9d8cafc1510a') {
        console.log('=== PHI MESSAGE DEBUG ===');
        console.log('Raw attachments from DB:', m.message.attachments);
        console.log('Processed attachments:', attachments);
        console.log('========================');
      }
      
      return { 
        ...m.message,
        attachments, // Use processed attachments
        sender: m.sender,
        senderWorkforce: m.senderWorkforce ? {
          workforceId: m.senderWorkforce.workforceId,
          workforceName: m.workforce?.name || m.senderWorkforce.workforceId,
          role: m.senderWorkforce.role
        } : undefined
      };
    }).reverse();

    // Get reactions for all messages (only if table exists)
    const messageIds = processedMessages.map(m => m.id);
    if (messageIds.length > 0) {
      try {
        const reactions = await db
          .select({
            reaction: messageReactions,
            user: users,
          })
          .from(messageReactions)
          .innerJoin(users, eq(messageReactions.userId, users.id))
          .where(inArray(messageReactions.messageId, messageIds));

        // Group reactions by message ID
        const reactionsByMessage = reactions.reduce((acc, { reaction, user }) => {
          const messageId = reaction.messageId;
          if (messageId && !acc[messageId]) {
            acc[messageId] = [];
          }
          if (messageId) {
            acc[messageId].push({ ...reaction, user });
          }
          return acc;
        }, {} as Record<string, (MessageReaction & { user: User })[]>);

        // Add reactions to messages
        return processedMessages.map(message => ({
          ...message,
          reactions: reactionsByMessage[message.id] || [],
        }));
      } catch (error) {
        console.log("Reactions table not available yet, returning messages without reactions");
        // Return messages without reactions if table doesn't exist
        return processedMessages.map(message => ({
          ...message,
          reactions: [],
        }));
      }
    }

    return processedMessages;
  }

  // Get conversation messages with sender visibility filtering
  async getVisibleConversationMessages(conversationId: string, requestingUserId: string, limit = 50): Promise<(Message & { sender: User })[]> {
    const messageList = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(100); // Increased limit for debugging
    
    // Filter sender information based on visibility rules
    return messageList.map(m => {
      const message = { ...m.message, sender: m.sender };
      
      // Hide admin/system user details from regular users
      if (m.sender.role !== 'member' && m.sender.id !== requestingUserId) {
        message.sender = {
          ...m.sender,
          firstName: 'System',
          lastName: null,
          username: 'system',
          email: null,
          profileImageUrl: null
        };
      }
      
      return message;
    }); // Removed .reverse() to maintain newest-first order
  }

  async deleteExpiredMessages(): Promise<void> {
    await db
      .delete(messages)
      .where(lt(messages.expiresAt, new Date()));
  }

  // Message reaction operations
  async addMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    // Check if user already reacted with this emoji to this message
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, reaction.messageId),
          eq(messageReactions.userId, reaction.userId),
          eq(messageReactions.emoji, reaction.emoji)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [newReaction] = await db
      .insert(messageReactions)
      .values(reaction)
      .returning();

    return newReaction;
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: string): Promise<(MessageReaction & { user: User })[]> {
    const result = await db
      .select({
        reaction: messageReactions,
        user: users,
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, messageId));

    return result.map(row => ({ ...row.reaction, user: row.user }));
  }

  async updateConversationName(conversationId: string, name: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ name, updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))
      .returning();
    return conversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    // Delete all messages in the conversation first (foreign key constraint)
    await db
      .delete(messages)
      .where(eq(messages.conversationId, conversationId));
    
    // Delete all conversation members
    await db
      .delete(conversationMembers)
      .where(eq(conversationMembers.conversationId, conversationId));
    
    // Finally delete the conversation itself
    await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId));
  }

  async getDirectConversation(userId1: string, userId2: string): Promise<Conversation | undefined> {
    // Find a direct conversation between two users
    const result = await db
      .select({
        conversation: conversations,
      })
      .from(conversations)
      .innerJoin(conversationMembers, eq(conversations.id, conversationMembers.conversationId))
      .where(
        and(
          eq(conversations.isGroup, false),
          eq(conversationMembers.userId, userId1)
        )
      );

    // Check if any of these conversations also contains userId2
    for (const conv of result) {
      const members = await this.getConversationMembers(conv.conversation.id);
      const memberIds = members.map(m => m.userId);
      if (memberIds.includes(userId2) && memberIds.length === 2) {
        return conv.conversation;
      }
    }

    return undefined;
  }

  async createDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Get user details for naming
    const user1 = await this.getUser(userId1);
    const user2 = await this.getUser(userId2);
    
    const name = `Direct: ${user1?.username || user1?.email || userId1} & ${user2?.username || user2?.email || userId2}`;
    
    // Create conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        name,
        isGroup: false,
        createdBy: userId1,
      })
      .returning();

    // Add both users as members
    await db.insert(conversationMembers).values([
      {
        conversationId: conversation.id,
        userId: userId1,
        isAdmin: false,
      },
      {
        conversationId: conversation.id,
        userId: userId2,
        isAdmin: false,
      },
    ]);

    return conversation;
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserUsername(userId: string, username: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ username, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Mark messages as read for a user in a conversation
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(conversationMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationMembers.conversationId, conversationId),
          eq(conversationMembers.userId, userId)
        )
      );
  }

  // PHI Access Audit Logging operations
  async createPHIAccessLog(logData: {
    messageId: string;
    userId: string;
    userEmail: string;
    workforceId: string;
    workforceName: string;
    ipAddress?: string;
    userAgent?: string;
    phiTypes: string[];
    patientFirstName?: string;
    patientLastName?: string;
    success: boolean;
    authMethod: string;
    activityType: string;
  }): Promise<PHIAccessLog> {
    const [log] = await db
      .insert(phiAccessLogs)
      .values({
        ...logData,
        phiTypes: logData.phiTypes,
        patientFirstName: logData.patientFirstName,
        patientLastName: logData.patientLastName,
      })
      .returning();
    return log;
  }

  async getPHIAccessLogs(messageId: string): Promise<PHIAccessLog[]> {
    return await db
      .select()
      .from(phiAccessLogs)
      .where(eq(phiAccessLogs.messageId, messageId))
      .orderBy(desc(phiAccessLogs.accessTime));
  }

  async getAllPHIAccessLogsWithMessages(): Promise<Array<PHIAccessLog & { message_content?: string; message_attachments?: any; phi_description?: string }>> {
    const result = await db
      .select({
        id: phiAccessLogs.id,
        messageId: phiAccessLogs.messageId,
        userId: phiAccessLogs.userId,
        userEmail: phiAccessLogs.userEmail,
        workforceId: phiAccessLogs.workforceId,
        workforceName: phiAccessLogs.workforceName,
        accessTime: phiAccessLogs.accessTime,
        success: phiAccessLogs.success,
        authMethod: phiAccessLogs.authMethod,
        activityType: phiAccessLogs.activityType,
        phiTypes: phiAccessLogs.phiTypes,
        patientFirstName: phiAccessLogs.patientFirstName,
        patientLastName: phiAccessLogs.patientLastName,
        message_content: messages.content,
        message_attachments: messages.attachments,
        phi_description: messages.phiDescription,
      })
      .from(phiAccessLogs)
      .leftJoin(messages, eq(phiAccessLogs.messageId, messages.id))
      .orderBy(desc(phiAccessLogs.accessTime))
      .limit(100);

    return result as Array<PHIAccessLog & { message_content?: string; message_attachments?: any; phi_description?: string }>;
  }

  async authenticatePHIMessage(userId: string, password: string): Promise<boolean> {
    // Authenticate using the user's system password (stored in the users table)
    const [user] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user?.password) {
      return false;
    }
    
    return await bcrypt.compare(password, user.password);
  }

  // Workforce operations
  async createWorkforce(workforce: InsertWorkforce): Promise<Workforce> {
    const [newWorkforce] = await db.insert(workforces).values(workforce).returning();
    return newWorkforce;
  }

  async getWorkforce(id: string): Promise<Workforce | undefined> {
    const [workforce] = await db.select().from(workforces).where(eq(workforces.id, id));
    return workforce;
  }

  async getUserWorkforces(userId: string): Promise<Workforce[]> {
    return await db.select().from(workforces).where(eq(workforces.masterId, userId));
  }

  async getAllWorkforces(): Promise<Workforce[]> {
    return await db.select().from(workforces);
  }

  async updateWorkforce(id: string, updates: Partial<InsertWorkforce>): Promise<Workforce | undefined> {
    const [workforce] = await db
      .update(workforces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workforces.id, id))
      .returning();
    return workforce;
  }

  async updateWorkforceName(id: string, name: string): Promise<Workforce | undefined> {
    const [workforce] = await db
      .update(workforces)
      .set({ name, updatedAt: new Date() })
      .where(eq(workforces.id, id))
      .returning();
    return workforce;
  }

  async deleteWorkforce(id: string): Promise<void> {
    // First, delete all workforce members to avoid foreign key constraint issues
    await db.delete(workforceMembers).where(eq(workforceMembers.workforceId, id));
    
    // Then delete any pending invitations for this workforce
    await db.delete(workforceInvitations).where(eq(workforceInvitations.workforceId, id));
    
    // Finally, delete the workforce itself
    await db.delete(workforces).where(eq(workforces.id, id));
  }

  // Workforce member operations
  async addWorkforceMember(member: InsertWorkforceMember): Promise<WorkforceMember> {
    // Check if member already exists to prevent duplicates
    const existingMember = await db
      .select()
      .from(workforceMembers)
      .where(
        and(
          eq(workforceMembers.workforceId, member.workforceId),
          eq(workforceMembers.userId, member.userId)
        )
      )
      .limit(1);
    
    if (existingMember.length > 0) {
      return existingMember[0];
    }
    
    const [newMember] = await db.insert(workforceMembers).values(member).returning();
    return newMember;
  }

  async removeWorkforceMember(workforceId: string, userId: string): Promise<void> {
    await db.delete(workforceMembers).where(
      and(
        eq(workforceMembers.workforceId, workforceId),
        eq(workforceMembers.userId, userId)
      )
    );
  }

  async getWorkforceMember(id: string): Promise<WorkforceMember | undefined> {
    const [member] = await db
      .select()
      .from(workforceMembers)
      .where(eq(workforceMembers.id, id));
    return member;
  }

  async getWorkforceMembers(workforceId: string): Promise<(WorkforceMember & { user: User })[]> {
    const members = await db
      .select({
        member: workforceMembers,
        user: users,
      })
      .from(workforceMembers)
      .innerJoin(users, eq(workforceMembers.userId, users.id))
      .where(eq(workforceMembers.workforceId, workforceId));
    
    // Deduplicate by userId to ensure no duplicate members are returned
    const uniqueMembers = members.filter((member, index, self) => 
      self.findIndex(m => m.member.userId === member.member.userId) === index
    );
    
    return uniqueMembers.map(m => ({ ...m.member, user: m.user }));
  }

  async getUserWorkforceMembership(userId: string): Promise<WorkforceMember | undefined> {
    const members = await db
      .select()
      .from(workforceMembers) 
      .where(eq(workforceMembers.userId, userId))
      .limit(1);
    return members[0];
  }

  async updateWorkforceMemberRole(workforceId: string, userId: string, role: string): Promise<WorkforceMember | undefined> {
    const [member] = await db
      .update(workforceMembers)
      .set({ role })
      .where(
        and(
          eq(workforceMembers.workforceId, workforceId),
          eq(workforceMembers.userId, userId)
        )
      )
      .returning();
    return member;
  }

  // Workforce invitation operations
  async createWorkforceInvitation(invitation: InsertWorkforceInvitation): Promise<WorkforceInvitation> {
    const [newInvitation] = await db.insert(workforceInvitations).values(invitation).returning();
    return newInvitation;
  }

  async getWorkforceInvitation(token: string): Promise<WorkforceInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(workforceInvitations)
      .where(eq(workforceInvitations.token, token));
    return invitation;
  }

  async acceptWorkforceInvitation(token: string, userId: string): Promise<{ invitation: WorkforceInvitation; member: WorkforceMember }> {
    const invitation = await this.getWorkforceInvitation(token);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      throw new Error('Invitation has expired');
    }

    // Update invitation status
    const [updatedInvitation] = await db
      .update(workforceInvitations)
      .set({ status: 'accepted' })
      .where(eq(workforceInvitations.token, token))
      .returning();

    // Add user to workforce
    const member = await this.addWorkforceMember({
      workforceId: invitation.workforceId,
      userId,
      role: invitation.role,
      status: 'active',
    });

    return { invitation: updatedInvitation, member };
  }

  async getWorkforceInvitations(workforceId: string): Promise<WorkforceInvitation[]> {
    return await db
      .select()
      .from(workforceInvitations)
      .where(eq(workforceInvitations.workforceId, workforceId));
  }

  // Analytics operations - System-wide analytics for master users
  async getAdminAnalytics(masterId: string): Promise<{
    totalWorkforces: number;
    totalMembers: number;
    totalMessages: number;
    messagesThisYear: number;
    messagesThisMonth: number;
    messagesThisWeek: number;
    messagesToday: number;
  }> {
    // Get ALL workforces in the system (system-wide view for master)
    const allWorkforces = await db.select().from(workforces);
    const totalWorkforces = allWorkforces.length;

    // Get ALL members across all workforces in the system
    const allMembers = await db.select().from(workforceMembers);
    const totalMembers = allMembers.length;

    // Message statistics - ALL messages in the system
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get ALL messages in the system
    const allMessages = await db.select().from(messages);
    
    const totalMessages = allMessages.length;
    const messagesToday = allMessages.filter(m => m.createdAt && m.createdAt >= startOfDay).length;
    const messagesThisWeek = allMessages.filter(m => m.createdAt && m.createdAt >= startOfWeek).length;
    const messagesThisMonth = allMessages.filter(m => m.createdAt && m.createdAt >= startOfMonth).length;
    const messagesThisYear = allMessages.filter(m => m.createdAt && m.createdAt >= startOfYear).length;

    return {
      totalWorkforces,
      totalMembers,
      totalMessages,
      messagesThisYear,
      messagesThisMonth,
      messagesThisWeek,
      messagesToday,
    };
  }

  async getAllWorkforceMembers(): Promise<(WorkforceMember & { user: User })[]> {
    const members = await db
      .select({
        member: workforceMembers,
        user: users,
      })
      .from(workforceMembers)
      .innerJoin(users, eq(workforceMembers.userId, users.id));
    
    // Deduplicate by userId and workforceId combination to prevent duplicates
    const uniqueMembers = members.filter((member, index, self) => 
      self.findIndex(m => 
        m.member.userId === member.member.userId && 
        m.member.workforceId === member.member.workforceId
      ) === index
    );
    
    return uniqueMembers.map(m => ({ ...m.member, user: m.user }));
  }

  // Deactivation operations
  async updateWorkforceStatus(workforceId: string, isActive: boolean): Promise<Workforce> {
    const [workforce] = await db
      .update(workforces)
      .set({ 
        isActive,
        updatedAt: new Date()
      })
      .where(eq(workforces.id, workforceId))
      .returning();
    return workforce;
  }

  async updateWorkforceMemberStatus(memberId: string, status: string): Promise<WorkforceMember> {
    // If deactivating, completely delete the user and their data
    if (status === 'inactive') {
      return await this.deleteWorkforceMember(memberId);
    }
    
    const [member] = await db
      .update(workforceMembers)
      .set({ status })
      .where(eq(workforceMembers.id, memberId))
      .returning();
    return member;
  }

  async deleteWorkforceMember(memberId: string): Promise<WorkforceMember> {
    // Get member info before deletion
    const member = await this.getWorkforceMember(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Get the user to delete their account as well
    const user = await this.getUser(member.userId);
    
    // Delete in correct order to avoid foreign key constraints
    if (user) {
      // 1. Delete all user's messages first
      await db.delete(messages).where(eq(messages.senderId, member.userId));
      
      // 2. Remove user from all conversations
      await db.delete(conversationMembers).where(eq(conversationMembers.userId, member.userId));
      
      // 3. Delete ALL workforce member records for this user (not just this one)
      await db.delete(workforceMembers).where(eq(workforceMembers.userId, member.userId));
      
      // 4. Finally delete the user account (no more FK references)
      await db.delete(users).where(eq(users.id, member.userId));
    }
    
    // Return the deleted member info
    return member;
  }

  // Password reset token operations
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()));
  }

  // Get all users that share group conversations with the current user
  async getConversationPeers(userId: string): Promise<User[]> {
    // Get all conversations the user is in
    const userConversations = await db
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));

    if (userConversations.length === 0) {
      return [];
    }

    const conversationIds = userConversations.map(c => c.conversationId);

    // Get all distinct users in those conversations (excluding the current user)
    const peerIds = new Set<string>();
    for (const convId of conversationIds) {
      const members = await db
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, convId));
      
      members.forEach(member => {
        if (member.userId && member.userId !== userId) {
          peerIds.add(member.userId);
        }
      });
    }

    // Get user details for all peer IDs
    const peers: User[] = [];
    for (const peerId of Array.from(peerIds)) {
      const user = await this.getUser(peerId);
      if (user) {
        peers.push(user);
      }
    }

    return peers;
  }

  // Secure message operations
  async authenticateSecureMessage(messageId: string, password: string): Promise<boolean> {
    const [message] = await db
      .select({ accessPassword: messages.accessPassword })
      .from(messages)
      .where(eq(messages.id, messageId));
    
    if (!message?.accessPassword) {
      return false;
    }
    
    return await bcrypt.compare(password, message.accessPassword);
  }

  async logSecureMessageAccess(auditData: InsertSecureMessageAuditLog): Promise<SecureMessageAuditLog> {
    const [auditLog] = await db
      .insert(secureMessageAuditLog)
      .values(auditData)
      .returning();
    return auditLog;
  }

  async createSecureMessageAuditLog(auditData: InsertSecureMessageAuditLog): Promise<SecureMessageAuditLog> {
    const [auditLog] = await db
      .insert(secureMessageAuditLog)
      .values(auditData)
      .returning();
    return auditLog;
  }

  async getSecureMessageAuditLogs(messageId: string): Promise<(SecureMessageAuditLog & { user: User, workforce?: Workforce })[]> {
    const logs = await db
      .select({
        auditLog: secureMessageAuditLog,
        user: users,
        workforce: workforces,
      })
      .from(secureMessageAuditLog)
      .innerJoin(users, eq(secureMessageAuditLog.userId, users.id))
      .leftJoin(workforces, eq(secureMessageAuditLog.workforceId, workforces.id))
      .where(eq(secureMessageAuditLog.messageId, messageId))
      .orderBy(desc(secureMessageAuditLog.accessAttemptTime));

    return logs.map(log => ({
      ...log.auditLog,
      user: log.user,
      workforce: log.workforce || undefined,
    }));
  }

  async getAllSecureMessageAuditLogs(): Promise<(SecureMessageAuditLog & { user: User, message: Message, workforce?: Workforce })[]> {
    const logs = await db
      .select({
        auditLog: secureMessageAuditLog,
        user: users,
        message: messages,
        workforce: workforces,
      })
      .from(secureMessageAuditLog)
      .innerJoin(users, eq(secureMessageAuditLog.userId, users.id))
      .innerJoin(messages, eq(secureMessageAuditLog.messageId, messages.id))
      .leftJoin(workforces, eq(secureMessageAuditLog.workforceId, workforces.id))
      .orderBy(desc(secureMessageAuditLog.accessAttemptTime));

    return logs.map(log => ({
      ...log.auditLog,
      user: log.user,
      message: log.message,
      workforce: log.workforce || undefined,
    }));
  }

  // Unified PHI Audit Logging for comprehensive HIPAA compliance with full content preservation
  async logPHIActivity(logData: InsertPHIAuditLog): Promise<PHIAuditLog> {
    const [log] = await db
      .insert(phiAuditLog)
      .values(logData)
      .returning();
    return log;
  }

  // Enhanced method to get full message details for audit logging
  async getMessageForAudit(messageId: string): Promise<any> {
    const [message] = await db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        phiTypes: messages.phiTypes,
        phiDescription: messages.phiDescription,
        attachments: messages.attachments,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        conversationId: messages.conversationId
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);
    
    return message;
  }

  async getPHIAuditLogs(messageId?: string): Promise<PHIAuditLog[]> {
    const query = db
      .select()
      .from(phiAuditLog)
      .orderBy(desc(phiAuditLog.accessTime));

    if (messageId) {
      query.where(eq(phiAuditLog.messageId, messageId));
    }

    return await query;
  }

  // Keep old method for backward compatibility during migration
  async logPHIAccess(logData: InsertPHIAccessLog): Promise<PHIAccessLog> {
    const [log] = await db
      .insert(phiAccessLogs)
      .values(logData)
      .returning();
    return log;
  }

}

export const storage = new DatabaseStorage();
