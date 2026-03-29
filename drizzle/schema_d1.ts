import {
  integer,
  text,
  sqliteTable,
  foreignKey,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    categoryId: integer("categoryId").notNull(),
    price: text("price").notNull(),
    cost: text("cost").default("0").notNull(),
    stock: integer("stock").default(0).notNull(),
    featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
    images: text("images").notNull(), // JSON string
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    categoryFk: foreignKey({
      columns: [t.categoryId],
      foreignColumns: [categories.id],
      name: "fk_products_categoryId",
    }),
  })
);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("orderNumber").notNull().unique(),
  customerName: text("customerName").notNull(),
  customerEmail: text("customerEmail").notNull(),
  customerPhone: text("customerPhone").notNull(),
  customerAddress: text("customerAddress").notNull(),
  status: text("status").default("pending").notNull(),
  total: text("total").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const orderItems = sqliteTable(
  "orderItems",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("orderId").notNull(),
    productId: integer("productId").notNull(),
    productName: text("productName").notNull(),
    quantity: integer("quantity").notNull(),
    priceAtPurchase: text("priceAtPurchase").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  },
  (t) => ({
    orderFk: foreignKey({
      columns: [t.orderId],
      foreignColumns: [orders.id],
      name: "fk_orderItems_orderId",
    }),
    productFk: foreignKey({
      columns: [t.productId],
      foreignColumns: [products.id],
      name: "fk_orderItems_productId",
    }),
  })
);
