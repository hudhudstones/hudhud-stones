import { getDb } from "./db";
import { orders, orderItems, products } from "../drizzle/schema";
import { eq, gte, lt, and, sql } from "drizzle-orm";

export interface ProfitReport {
  date: string;
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
}

/**
 * Get daily profit report for a date range
 */
export async function getDailyProfitReport(
  startDate: Date,
  endDate: Date
): Promise<ProfitReport[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`.as("orderCount"),
      totalRevenue: sql<number>`SUM(${orders.total})`.as("totalRevenue"),
      totalCost: sql<number>`SUM(${orderItems.quantity} * CAST(${products.cost} AS DECIMAL(10,2)))`.as("totalCost"),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt}) DESC`);

  return results.map((row: any) => {
    const revenue = Number(row.totalRevenue) || 0;
    const cost = Number(row.totalCost) || 0;
    const profit = revenue - cost;
    const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      date: row.date || new Date().toISOString().split("T")[0],
      orderCount: row.orderCount || 0,
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
    };
  });
}

/**
 * Get weekly profit report for a date range
 */
export async function getWeeklyProfitReport(
  startDate: Date,
  endDate: Date
): Promise<ProfitReport[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      weekStart: sql<string>`DATE(${orders.createdAt} - INTERVAL DAYOFWEEK(${orders.createdAt}) - 1 DAY)`.as("weekStart"),
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`.as("orderCount"),
      totalRevenue: sql<number>`SUM(${orders.total})`.as("totalRevenue"),
      totalCost: sql<number>`SUM(${orderItems.quantity} * CAST(${products.cost} AS DECIMAL(10,2)))`.as("totalCost"),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${orders.createdAt} - INTERVAL DAYOFWEEK(${orders.createdAt}) - 1 DAY)`)
    .orderBy(sql`DATE(${orders.createdAt} - INTERVAL DAYOFWEEK(${orders.createdAt}) - 1 DAY) DESC`);

  return results.map((row: any) => {
    const revenue = Number(row.totalRevenue) || 0;
    const cost = Number(row.totalCost) || 0;
    const profit = revenue - cost;
    const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      date: row.weekStart || new Date().toISOString().split("T")[0],
      orderCount: row.orderCount || 0,
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
    };
  });
}

/**
 * Get monthly profit report for a date range
 */
export async function getMonthlyProfitReport(
  startDate: Date,
  endDate: Date
): Promise<ProfitReport[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      month: sql<string>`DATE_FORMAT(${orders.createdAt}, '%Y-%m-01')`.as("month"),
      orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`.as("orderCount"),
      totalRevenue: sql<number>`SUM(${orders.total})`.as("totalRevenue"),
      totalCost: sql<number>`SUM(${orderItems.quantity} * CAST(${products.cost} AS DECIMAL(10,2)))`.as("totalCost"),
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        gte(orders.createdAt, startDate),
        lt(orders.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m-01')`)
    .orderBy(sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m-01') DESC`);

  return results.map((row: any) => {
    const revenue = Number(row.totalRevenue) || 0;
    const cost = Number(row.totalCost) || 0;
    const profit = revenue - cost;
    const profitPercentage = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      date: row.month || new Date().toISOString().split("T")[0],
      orderCount: row.orderCount || 0,
      totalRevenue: revenue,
      totalCost: cost,
      totalProfit: profit,
      profitPercentage: Math.round(profitPercentage * 100) / 100,
    };
  });
}
