import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { user } from "./user";

export const savedTutorial = pgTable("saved_tutorial", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 30 }).references(() => user.email, {
    onDelete: "cascade",
  }),
  slugContent: varchar("slug_content", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});
