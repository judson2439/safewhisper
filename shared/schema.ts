import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(), // user's chosen screen name for privacy
  password: varchar("password"), // In production, this should be hashed
  phoneNumber: varchar("phone_number"), // For SMS notifications
  role: varchar("role").default("member"), // member, admin, master
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  isGroup: boolean("is_group").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationMembers = pgTable("conversation_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  userId: varchar("user_id").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
  lastReadAt: timestamp("last_read_at").defaultNow(), // Track when user last read messages
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  senderId: varchar("sender_id").references(() => users.id),
  content: text("content").notNull(), // encrypted content
  messageType: varchar("message_type").default("text"), // text, file, image, secure
  securityLevel: varchar("security_level").default("normal"), // normal, confidential, restricted, classified
  accessPassword: varchar("access_password"), // hashed password for secure messages
  requiresAuthentication: boolean("requires_authentication").default(false),
  encryptionKey: text("encryption_key"), // encrypted with recipient's public key
  priority: varchar("priority").default("normal"), // normal, high, urgent
  reactions: jsonb("reactions").default('[]'), // Array of reaction objects
  phiTypes: jsonb("phi_types").default('[]'), // Array of PHI types for compliance tracking
  phiDescription: text("phi_description"), // Additional description for PHI content
  patientFirstName: text("patient_first_name"), // Patient first name for PHI tracking
  patientLastName: text("patient_last_name"), // Patient last name for PHI tracking
  attachments: jsonb("attachments").default('[]'), // Array of file attachments
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workforces table - created and managed by master users
export const workforces = pgTable("workforces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: varchar("description"),
  emailDomain: varchar("email_domain").notNull(), // e.g., "@company.com"
  emailProvider: varchar("email_provider").notNull(), // microsoft, google, godaddy
  emailSettings: jsonb("email_settings"), // provider-specific config
  masterId: varchar("master_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workforce members table - links users to workforces
export const workforceMembers = pgTable("workforce_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workforceId: varchar("workforce_id").notNull().references(() => workforces.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role").default("user"), // user, moderator
  joinedAt: timestamp("joined_at").defaultNow(),
  status: varchar("status").default("active"), // active, inactive, pending
});

// Email invitations for workforce members
export const workforceInvitations = pgTable("workforce_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workforceId: varchar("workforce_id").notNull().references(() => workforces.id),
  email: varchar("email").notNull(),
  phoneNumber: varchar("phone_number"), // For SMS invitations
  role: varchar("role").default("user"),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").default("pending"), // pending, accepted, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Secure message access audit log
// Unified PHI Access Audit Log - comprehensive HIPAA-compliant logging
export const phiAuditLog = pgTable("phi_audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").notNull().references(() => messages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  userEmail: varchar("user_email").notNull(),
  workforceId: varchar("workforce_id").references(() => workforces.id),
  workforceName: varchar("workforce_name"),
  
  // Activity details
  activityType: varchar("activity_type").notNull(), // 'authentication_attempt', 'message_view', 'attachment_download'
  activityResult: varchar("activity_result").notNull(), // 'success', 'failed'
  
  // Authentication details
  passwordProvided: varchar("password_provided"), // hashed version for failed attempts
  authenticationSuccessful: boolean("authentication_successful").default(false),
  
  // PHI content details - full content preservation for HIPAA compliance
  phiTypes: jsonb("phi_types"), // Array of PHI types accessed
  phiDescription: text("phi_description"),
  patientFirstName: text("patient_first_name"), // Patient first name for tracking
  patientLastName: text("patient_last_name"), // Patient last name for tracking
  messageContent: text("message_content"), // Full message content for audit trail
  attachmentMetadata: jsonb("attachment_metadata"), // Complete file information including name, size, type, URL
  attachmentData: text("attachment_data"), // Base64 encoded file data for forensic preservation
  
  // Technical details
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  accessTime: timestamp("access_time").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Keep original table for backward compatibility during migration
export const secureMessageAuditLog = pgTable("secure_message_audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").notNull().references(() => messages.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  workforceId: varchar("workforce_id").references(() => workforces.id),
  accessAttemptTime: timestamp("access_attempt_time").defaultNow(),
  passwordProvided: varchar("password_provided"), // hashed version of what user entered
  authenticationResult: boolean("authentication_result").notNull(), // true = success, false = failed
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  messageViewed: boolean("message_viewed").default(false), // true if auth succeeded and message was displayed
  sessionId: varchar("session_id"), // link to user session
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversationMembers),
  messages: many(messages),
  ownedWorkforces: many(workforces),
  workforceMemberships: many(workforceMembers),
}));

export const workforcesRelations = relations(workforces, ({ one, many }) => ({
  master: one(users, {
    fields: [workforces.masterId],
    references: [users.id],
  }),
  members: many(workforceMembers),
  invitations: many(workforceInvitations),
}));

export const workforceMembersRelations = relations(workforceMembers, ({ one }) => ({
  workforce: one(workforces, {
    fields: [workforceMembers.workforceId],
    references: [workforces.id],
  }),
  user: one(users, {
    fields: [workforceMembers.userId],
    references: [users.id],
  }),
}));

export const workforceInvitationsRelations = relations(workforceInvitations, ({ one }) => ({
  workforce: one(workforces, {
    fields: [workforceInvitations.workforceId],
    references: [workforces.id],
  }),
  inviter: one(users, {
    fields: [workforceInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  creator: one(users, {
    fields: [conversations.createdBy],
    references: [users.id],
  }),
  members: many(conversationMembers),
  messages: many(messages),
}));

export const conversationMembersRelations = relations(conversationMembers, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationMembers.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [conversationMembers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  reactions: many(messageReactions),
}));

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

export const secureMessageAuditLogRelations = relations(secureMessageAuditLog, ({ one }) => ({
  message: one(messages, {
    fields: [secureMessageAuditLog.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [secureMessageAuditLog.userId],
    references: [users.id],
  }),
  workforce: one(workforces, {
    fields: [secureMessageAuditLog.workforceId],
    references: [workforces.id],
  }),
}));

// Insert schemas
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertConversationMemberSchema = createInsertSchema(conversationMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertWorkforceSchema = createInsertSchema(workforces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkforceMemberSchema = createInsertSchema(workforceMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertWorkforceInvitationSchema = createInsertSchema(workforceInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertSecureMessageAuditLogSchema = createInsertSchema(secureMessageAuditLog).omit({
  id: true,
  accessAttemptTime: true,
  createdAt: true,
});

export const insertPHIAuditLogSchema = createInsertSchema(phiAuditLog).omit({
  id: true,
  accessTime: true,
  createdAt: true,
});

// Keep old PHI access logs table for backward compatibility during migration
export const phiAccessLogs = pgTable('phi_access_logs', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar('message_id').references(() => messages.id).notNull(),
  userId: varchar('user_id').references(() => users.id).notNull(),
  userEmail: varchar('user_email').notNull(), // Required for HIPAA compliance
  workforceId: varchar('workforce_id').references(() => workforces.id).notNull(),
  workforceName: varchar('workforce_name').notNull(),
  accessTime: timestamp('access_time').defaultNow().notNull(),
  ipAddress: varchar('ip_address'),
  userAgent: varchar('user_agent'),
  phiTypes: jsonb('phi_types'), // Array of PHI types accessed
  patientFirstName: varchar('patient_first_name'), // Patient first name for tracking
  patientLastName: varchar('patient_last_name'), // Patient last name for tracking
  success: boolean('success').default(true).notNull(),
  authMethod: varchar('auth_method').default('system_password').notNull(),
  activityType: varchar('activity_type').default('view').notNull(), // 'upload', 'view', 'authenticate_success', 'authenticate_failure', 'download'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertPHIAccessLogSchema = createInsertSchema(phiAccessLogs).omit({
  id: true,
  accessTime: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMember = typeof conversationMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Workforce = typeof workforces.$inferSelect;
export type WorkforceMember = typeof workforceMembers.$inferSelect;
export type WorkforceInvitation = typeof workforceInvitations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertConversationMember = z.infer<typeof insertConversationMemberSchema>;
export type InsertWorkforce = z.infer<typeof insertWorkforceSchema>;
export type InsertWorkforceMember = z.infer<typeof insertWorkforceMemberSchema>;
export type InsertWorkforceInvitation = z.infer<typeof insertWorkforceInvitationSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;
export type SecureMessageAuditLog = typeof secureMessageAuditLog.$inferSelect;
export type InsertSecureMessageAuditLog = z.infer<typeof insertSecureMessageAuditLogSchema>;
export type PHIAuditLog = typeof phiAuditLog.$inferSelect;
export type InsertPHIAuditLog = z.infer<typeof insertPHIAuditLogSchema>;
export type PHIAccessLog = typeof phiAccessLogs.$inferSelect;
export type InsertPHIAccessLog = z.infer<typeof insertPHIAccessLogSchema>;
