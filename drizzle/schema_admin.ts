import { int, mysqlTable, varchar, timestamp, tinyint } from "drizzle-orm/mysql-core";

/**
 * Admin user accounts for dashboard access
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  is_active: tinyint("is_active").default(1),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
export type AdminUserUpdate = Partial<Omit<InsertAdminUser, 'id'>>;
