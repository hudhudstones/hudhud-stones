import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  createOrderItem,
  getOrderItems,
} from "./db";
import { storagePut } from "./storage";
import { aiRouter } from "./routers_ai";
import { adminAuthRouter } from "./routers_admin_auth";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CATEGORIES ============
  categories: router({
    list: publicProcedure.query(async () => {
      return await getCategories();
    }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getCategoryBySlug(input.slug);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await createCategory(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateCategory(input.id, input);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ============ PRODUCTS ============
  products: router({
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          categoryId: z.number().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return await getProducts(input);
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getProductBySlug(input.slug);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProductById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          categoryId: z.number(),
          price: z.string(),
          stock: z.number().default(0),
          featured: z.boolean().default(false),
          images: z.array(z.string()).default([]),
        })
      )
      .mutation(async ({ input }) => {
        return await createProduct(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          price: z.string().optional(),
          stock: z.number().optional(),
          featured: z.boolean().optional(),
          images: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateProduct(input.id, input);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),

    uploadImage: adminProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const key = `products/${Date.now()}-${input.fileName}`;
        const result = await storagePut(key, buffer, "image/jpeg");
        return result;
      }),
  }),

  // ============ ORDERS ============
  orders: router({
    list: adminProcedure.query(async () => {
      return await getOrders();
    }),

    byId: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.id);
      }),

    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(1),
          customerAddress: z.string().min(1),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number().min(1),
              priceAtPurchase: z.string(),
            })
          ),
          total: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const orderNumber = `ORD-${nanoid(12).toUpperCase()}`;

        const order = await createOrder({
          orderNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          total: input.total,
        });

        for (const item of input.items) {
          await createOrderItem({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          });
        }

        return order;
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "processing", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============ AI FEATURES ============
  ai: aiRouter,
  // ============ ADMIN AUTH ============
  admin: adminAuthRouter,
});

export type AppRouter = typeof appRouter;
