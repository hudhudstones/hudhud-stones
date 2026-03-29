import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
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
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Health check function to verify DB is working
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Database] Database not initialized");
      return false;
    }
    await db.select().from(categories).limit(1);
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
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
  
  try {
    const result = await db.insert(categories).values(data);
    const id = (result as any).insertId;
    
    // Fetch the created record to get actual timestamps from DB
    const created = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!created[0]) {
      throw new Error("Failed to retrieve created category");
    }
    
    return created[0];
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Category slug already exists");
    }
    console.error("[Database] Failed to create category:", error);
    throw error;
  }
}

export async function updateCategory(
  id: number,
  data: Partial<{ name: string; slug: string; description: string }>
): Promise<{ success: boolean; updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.update(categories).set(data).where(eq(categories.id, id));
    const affectedRows = (result as any).affectedRows || 0;
    
    if (affectedRows === 0) {
      throw new Error(`Category with id ${id} not found`);
    }
    
    return { success: true, updated: affectedRows };
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Category slug already exists");
    }
    console.error("[Database] Failed to update category:", error);
    throw error;
  }
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
  
  try {
    // Validate category exists
    const category = await db.select().from(categories).where(eq(categories.id, data.categoryId)).limit(1);
    if (!category[0]) {
      throw new Error(`Category with id ${data.categoryId} not found`);
    }
    
    // Validate price and stock
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      throw new Error("Price must be a positive number");
    }
    
    if (data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
    
    const result = await db.insert(products).values(data);
    const id = (result as any).insertId;
    
    // Fetch the created record to get actual timestamps
    const created = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!created[0]) {
      throw new Error("Failed to retrieve created product");
    }
    
    return created[0];
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Product slug already exists");
    }
    if (error.code === "ER_NO_REFERENCED_ROW") {
      throw new Error("Invalid category reference");
    }
    console.error("[Database] Failed to create product:", error);
    throw error;
  }
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
): Promise<{ success: boolean; updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Validate category if being updated
    if (data.categoryId !== undefined) {
      const category = await db.select().from(categories).where(eq(categories.id, data.categoryId)).limit(1);
      if (!category[0]) {
        throw new Error(`Category with id ${data.categoryId} not found`);
      }
    }
    
    // Validate price if being updated
    if (data.price !== undefined) {
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0) {
        throw new Error("Price must be a positive number");
      }
    }
    
    // Validate stock if being updated
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
    
    const result = await db.update(products).set(data).where(eq(products.id, id));
    const affectedRows = (result as any).affectedRows || 0;
    
    if (affectedRows === 0) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    return { success: true, updated: affectedRows };
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Product slug already exists");
    }
    if (error.code === "ER_NO_REFERENCED_ROW") {
      throw new Error("Invalid category reference");
    }
    console.error("[Database] Failed to update product:", error);
    throw error;
  }
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
  
  try {
    // Validate total
    const total = parseFloat(data.total);
    if (isNaN(total) || total < 0) {
      throw new Error("Total must be a positive number");
    }
    
    const result = await db.insert(orders).values(data);
    const id = (result as any).insertId;
    
    // Fetch the created record to get actual timestamps
    const created = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!created[0]) {
      throw new Error("Failed to retrieve created order");
    }
    
    return created[0];
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Order number already exists");
    }
    console.error("[Database] Failed to create order:", error);
    throw error;
  }
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "processing" | "prepare" | "given" | "complete" | "cancelled"
): Promise<{ success: boolean; updated: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id));
    const affectedRows = (result as any).affectedRows || 0;
    
    if (affectedRows === 0) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    return { success: true, updated: affectedRows };
  } catch (error: any) {
    console.error("[Database] Failed to update order status:", error);
    throw error;
  }
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
  
  try {
    // Validate quantity
    if (data.quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }
    
    // Validate price
    const price = parseFloat(data.priceAtPurchase);
    if (isNaN(price) || price < 0) {
      throw new Error("Price must be a positive number");
    }
    
    const result = await db.insert(orderItems).values(data);
    const id = (result as any).insertId;
    
    // Fetch the created record to get actual timestamp
    const created = await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1);
    if (!created[0]) {
      throw new Error("Failed to retrieve created order item");
    }
    
    return created[0];
  } catch (error: any) {
    if (error.code === "ER_NO_REFERENCED_ROW") {
      throw new Error("Invalid order or product reference");
    }
    console.error("[Database] Failed to create order item:", error);
    throw error;
  }
}

/**
 * Create multiple order items with transaction-like safety.
 * Validates all items first before creating any to prevent partial saves.
 */
export async function createOrderItemBatch(
  items: Array<{
    orderId: number;
    productId: number;
    productName: string;
    quantity: number;
    priceAtPurchase: string;
  }>
): Promise<OrderItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Pre-validate all items before creating any
    for (const item of items) {
      if (item.quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }
      const price = parseFloat(item.priceAtPurchase);
      if (isNaN(price) || price < 0) {
        throw new Error("Price must be a positive number");
      }
    }

    // Create all items
    const createdItems: OrderItem[] = [];
    for (const item of items) {
      const result = await db.insert(orderItems).values(item);
      const id = (result as any).insertId;
      
      const created = await db.select().from(orderItems).where(eq(orderItems.id, id)).limit(1);
      if (!created[0]) {
        throw new Error("Failed to retrieve created order item");
      }
      createdItems.push(created[0]);
    }

    return createdItems;
  } catch (error: any) {
    if (error.code === "ER_NO_REFERENCED_ROW") {
      throw new Error("Invalid order or product reference");
    }
    console.error("[Database] Failed to create order items batch:", error);
    throw error;
  }
}
