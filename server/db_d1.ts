import { drizzle } from "drizzle-orm/d1";
import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import * as schema from "../drizzle/schema_d1";

export function getDb(env: any) {
  return drizzle(env.DB, { schema });
}

// ============ CATEGORIES ============
export async function getCategories(db: any) {
  return db.select().from(schema.categories).orderBy(schema.categories.name);
}

export async function createCategory(db: any, data: any) {
  const now = new Date();
  const result = await db.insert(schema.categories).values({
    ...data,
    createdAt: now,
    updatedAt: now,
  }).returning();
  return result[0];
}

// ============ PRODUCTS ============
export async function getProducts(db: any, filters?: any) {
  const conditions: any[] = [];
  if (filters?.categoryId) conditions.push(eq(schema.products.categoryId, filters.categoryId));
  if (filters?.search) conditions.push(like(schema.products.name, `%${filters.search}%`));
  if (filters?.featured) conditions.push(eq(schema.products.featured, true));

  let query = db.select().from(schema.products);
  if (conditions.length > 0) query = query.where(and(...conditions));
  
  const results = await query.orderBy(desc(schema.products.createdAt));
  return results.map((p: any) => ({
    ...p,
    images: JSON.parse(p.images)
  }));
}

export async function createProduct(db: any, data: any) {
  const now = new Date();
  const result = await db.insert(schema.products).values({
    ...data,
    images: JSON.stringify(data.images || []),
    createdAt: now,
    updatedAt: now,
  }).returning();
  return {
    ...result[0],
    images: JSON.parse(result[0].images)
  };
}

// ============ AUTH ============
export async function authenticateAdmin(db: any, username: string, passwordHash: string) {
  // For now, we'll use a simple check. In a real app, you'd have an adminUsers table.
  // We can use the 'users' table with role='admin'
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.name, username), eq(schema.users.loginMethod, passwordHash), eq(schema.users.role, 'admin'))
  });
  return user;
}
