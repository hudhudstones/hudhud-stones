import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  categories,
  products,
  orders,
  orderItems,
  type Category,
  type Product,
  type Order,
  type OrderItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CATEGORIES ============

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return result[0];
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  const id = (result as any).insertId;
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; slug: string; description: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ============ PRODUCTS ============

export async function getProducts(filters?: {
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  if (filters?.search) {
    conditions.push(
      like(products.name, `%${filters.search}%`)
    );
  }

  if (filters?.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice.toString()));
  }

  if (filters?.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice.toString()));
  }

  if (filters?.featured) {
    conditions.push(eq(products.featured, true));
  }

  let query: any = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(products.createdAt));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return result[0];
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: {
  name: string;
  slug: string;
  description?: string;
  categoryId: number;
  price: string;
  cost?: string;
  stock: number;
  images: string[];
  featured?: boolean;
}): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  const id = (result as any).insertId;
  return {
    id,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    categoryId: data.categoryId,
    price: data.price,
    cost: data.cost ?? "0",
    stock: data.stock,
    images: data.images,
    featured: data.featured ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    categoryId: number;
    price: string;
    cost: string;
    stock: number;
    images: string[];
    featured: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

// ============ ORDERS ============

export async function getOrders(): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function createOrder(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  total: string;
}): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  const id = (result as any).insertId;
  return {
    id,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    customerAddress: data.customerAddress,
    total: data.total,
    status: "pending",
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "processing" | "prepare" | "given" | "complete" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, id));
}

// ============ ORDER ITEMS ============

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrderItem(data: {
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtPurchase: string;
}): Promise<OrderItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orderItems).values(data);
  const id = (result as any).insertId;
  return {
    ...data,
    id,
    createdAt: new Date(),
  };
}
