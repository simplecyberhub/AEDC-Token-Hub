import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { metersTable } from "./meters";

export const tokenTransactionsTable = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  meterId: integer("meter_id").notNull().references(() => metersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  token: text("token"),
  units: numeric("units", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  reference: text("reference").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTokenTransactionSchema = createInsertSchema(tokenTransactionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type TokenTransaction = typeof tokenTransactionsTable.$inferSelect;
