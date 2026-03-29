import { getDb } from "./db";
import { adminUsers } from "../drizzle/schema_admin";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * Hash password using bcrypt
 */
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify password
 */
function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const users = await db.select().from(adminUsers);
  // Don't return password hashes
  return users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    is_active: u.is_active,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

/**
 * Get admin user by username
 */
export async function getAdminUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(adminUsers).where(eq(adminUsers.username, username));
}

/**
 * Create new admin user
 */
export async function createAdminUser(username: string, password: string, email?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already exists
  const existing = await getAdminUserByUsername(username);
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }
  
  const passwordHash = hashPassword(password);
  
  const result = await db.insert(adminUsers).values({
    username,
    password_hash: passwordHash,
    email: email || `${username.toLowerCase()}@hudhudstones.com`,
    is_active: 1,
  });
  
  return result;
}

/**
 * Update admin user password
 */
export async function updateAdminUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const passwordHash = hashPassword(newPassword);
  
  await db.update(adminUsers)
    .set({ password_hash: passwordHash })
    .where(eq(adminUsers.id, userId));
  
  return { success: true };
}

/**
 * Authenticate admin user
 */
export async function authenticateAdminUser(username: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const users = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  
  if (users.length === 0) {
    throw new Error("Invalid username or password");
  }
  
  const user = users[0];
  
  if (!user.is_active) {
    throw new Error("User account is disabled. Please contact an administrator.");
  }
  
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error("Invalid username or password");
  }
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/**
 * Delete admin user
 */
export async function deleteAdminUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(adminUsers).where(eq(adminUsers.id, userId));
  return { success: true };
}

/**
 * Change admin user username
 */
export async function changeAdminUsername(userId: number, newUsername: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if new username already exists
  const existing = await db.select().from(adminUsers).where(eq(adminUsers.username, newUsername));
  if (existing.length > 0) {
    throw new Error("Username already exists");
  }
  
  await db.update(adminUsers)
    .set({ username: newUsername })
    .where(eq(adminUsers.id, userId));
  
  return { success: true };
}

/**
 * Toggle admin user account status (enable/disable)
 */
export async function toggleAdminUserStatus(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current status
  const users = await db.select().from(adminUsers).where(eq(adminUsers.id, userId));
  if (users.length === 0) {
    throw new Error("User not found");
  }
  
  const currentStatus = users[0].is_active;
  const newStatus = currentStatus ? 0 : 1;
  
  await db.update(adminUsers)
    .set({ is_active: newStatus })
    .where(eq(adminUsers.id, userId));
  
  return { success: true, is_active: newStatus === 1 };
}
