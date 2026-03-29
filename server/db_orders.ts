import { getDb } from "./db";
import { orders, orderItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Delete an order and all its associated items
 */
export async function deleteOrderWithItems(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete order items first (foreign key constraint)
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  
  // Then delete the order
  await db.delete(orders).where(eq(orders.id, orderId));
}
