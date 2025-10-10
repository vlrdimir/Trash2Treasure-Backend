import { z } from "zod";
import {
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./user";

export const classesLabelEnum = [
  "battery",
  "biological",
  "brown-glass",
  "cardboard",
  "clothes",
  "green-glass",
  "metal",
  "paper",
  "plastic",
  "shoes",
  "trash",
  "white-glass",
] as const;

export const classesLabelSchema = z.enum(classesLabelEnum);
export type ClassesLabel = z.infer<typeof classesLabelSchema>;

export const probabilitiesSchema = z.object(
  Object.fromEntries(
    classesLabelEnum.map((label) => [label, z.number()])
  ) as Record<ClassesLabel, z.ZodNumber>
);

export type Probabilities = z.infer<typeof probabilitiesSchema>;

export const classes_label = pgEnum("classes_label", classesLabelEnum);

export const historyPredict = pgTable("history_predict", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 30 }).references(() => user.email, {
    onDelete: "cascade",
  }),
  imageUrl: varchar("image_url", { length: 255 }),
  imageUrlRemoveBg: varchar("image_url_remove_bg", { length: 255 }),
  label: classes_label("label"),
  percentage: decimal("percentage"),
  probabilities: jsonb("probabilities").$type<Probabilities>(),
  createdAt: timestamp("created_at").defaultNow(),
});
