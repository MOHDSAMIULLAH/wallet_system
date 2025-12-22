import { pgTable, serial, integer, decimal, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"), // PENDING, COMPLETED, FAILED
  fulfillmentId: varchar("fulfillment_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    userIdIdx: index("order_user_id_idx").on(table.userId),
    orderIdIdx: index("order_id_idx").on(table.orderId),
    statusIdx: index("order_status_idx").on(table.status),
  };
});

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
