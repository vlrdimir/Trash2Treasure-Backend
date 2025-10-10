import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { relations } from "drizzle-orm";

// Tabel untuk setiap sesi percakapan
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", {
    length: 30,
  }).references(() => user.email, {
    onDelete: "cascade",
  }), // Relasi ke user
  title: varchar("title", { length: 255 }), // Judul chat, bisa dibuat dari pesan pertama
  initialLabel: text("initial_label"), // 'shoes' dari contoh Anda
  initialImageUrl: text("initial_image_url"), // URL gambar awal
  tokenUsage: integer("token_usage"), // Token usage
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enum untuk role, sesuai dengan yang digunakan AI SDK
export const messageRole = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
  "data",
]);

// Tabel untuk setiap pesan dalam percakapan
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }), // Relasi ke conversation
  role: messageRole("role").notNull(), // 'user' atau 'assistant'
  content: jsonb("content").notNull(), // Isi dari pesan
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -- Create messages table to store UIMessage format
// CREATE TABLE messages (
//   id TEXT PRIMARY KEY, -- Use text to match AI SDK message IDs
//   conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
//   role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'data')),
//   content JSONB NOT NULL, -- Store the full UIMessage content structure
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
//   message_index INTEGER NOT NULL -- To maintain message order
// );

export const conversationRelations = relations(
  conversations,
  ({ many, one }) => ({
    messages: many(messages),
    user: one(user, {
      fields: [conversations.email],
      references: [user.email],
    }),
  })
);

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
