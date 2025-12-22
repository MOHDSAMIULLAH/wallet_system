import { pgTable, serial, integer, decimal, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // CREDIT, DEBIT, ORDER_DEDUCTION
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  referenceId: varchar("reference_id", { length: 255 }), // order_id or admin transaction ref
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("ledger_user_id_idx").on(table.userId),
    createdAtIdx: index("ledger_created_at_idx").on(table.createdAt),
    referenceIdIdx: index("ledger_reference_id_idx").on(table.referenceId),
  };
});

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  user: one(users, {
    fields: [ledgerEntries.userId],
    references: [users.id],
  }),
}));

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
