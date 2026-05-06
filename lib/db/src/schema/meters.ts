import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const metersTable = pgTable("meters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  meterNumber: text("meter_number").notNull(),
  meterName: text("meter_name").notNull(),
  address: text("address").notNull(),
  tariffType: text("tariff_type").notNull().default("prepaid"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMeterSchema = createInsertSchema(metersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMeter = z.infer<typeof insertMeterSchema>;
export type Meter = typeof metersTable.$inferSelect;
