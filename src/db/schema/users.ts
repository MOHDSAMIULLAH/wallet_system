import { pgTable, serial, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clientId: varchar("client_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  orders: many(orders),
  ledgerEntries: many(ledgerEntries),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Import for relations (will be defined in other files)
import { wallets } from "./wallets";
import { orders } from "./orders";
import { ledgerEntries } from "./ledger";
