import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { historyPredict } from "./history-predict";
import { savedTutorial } from "./saved-tutorial";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 25 }),
  email: varchar("email", { length: 30 }).unique("email_unique"),
  image: text("image"),
});

export const userRelations = relations(user, ({ many }) => ({
  historyPredict: many(historyPredict),
  savedTutorial: many(savedTutorial),
}));
