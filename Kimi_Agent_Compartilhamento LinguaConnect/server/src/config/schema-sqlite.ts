import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  age: integer('age'),
  gender: text('gender'),
  country: text('country'),
  nativeLanguage: text('native_language'),
  learningLanguages: text('learning_languages', { mode: 'json' }).$type<{ language: string; level: string }[]>(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  isOnline: integer('is_online', { mode: 'boolean' }).default(false),
  lastSeen: text('last_seen'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  userOneId: text('user_one_id').notNull(),
  userTwoId: text('user_two_id').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  senderId: text('sender_id').notNull(),
  content: text('content').notNull(),
  type: text('type').default('text'),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export const calls = sqliteTable('calls', {
  id: text('id').primaryKey(),
  callerId: text('caller_id').notNull(),
  receiverId: text('receiver_id').notNull(),
  status: text('status').default('ringing'),
  startedAt: text('started_at'),
  endedAt: text('ended_at'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Call = typeof calls.$inferSelect;
