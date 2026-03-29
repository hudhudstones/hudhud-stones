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
  createOrderItemBatch,
  getOrderItems,
  checkDatabaseHealth,
} from "./db";
import { storagePut } from "./storage";
import { aiRouter } from "./routers_ai";
import { adminAuthRouter } from "./routers_admin_auth";
import { getDailyProfitReport, getWeeklyProfitReport, getMonthlyProfitReport } from "./db_profit";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  health: publicProcedure.query(async () => {
    const dbHealthy = await checkDatabaseHealth();
    return {
      status: dbHealthy ? "healthy" : "unhealthy",
      database: dbHealthy ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    };
  }),
  
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
        try {
          return await createCategory(input);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to create category",
          });
        }
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
        try {
          const { id, ...data } = input;
          const result = await updateCategory(id, data);
          if (!result.success) {
            throw new Error("Failed to update category");
          }
          return result;
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to update category",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteCategory(input.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to delete category",
          });
        }
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
          categoryId: z.number().min(1, "Category is required"),
          price: z.string().min(1, "Price is required").refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num > 0;
            },
            "Price must be a positive number"
          ),
          cost: z.string().optional().refine(
            (val) => {
              if (!val) return true;
              const num = parseFloat(val);
              return !isNaN(num) && num >= 0;
            },
            "Cost must be a positive number or zero"
          ),
          stock: z.number().min(0, "Stock cannot be negative").default(0),
          featured: z.boolean().default(false),
          images: z.array(z.string()).default([]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return await createProduct(input);
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to create product",
          });
        }
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          categoryId: z.number().min(1).optional(),
          price: z.string().refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num > 0;
            },
            "Price must be a positive number"
          ).optional(),
          cost: z.string().refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num >= 0;
            },
            "Cost must be a positive number or zero"
          ).optional(),
          stock: z.number().min(0).optional(),
          featured: z.boolean().optional(),
          images: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          const result = await updateProduct(id, data);
          if (!result.success) {
            throw new Error("Failed to update product");
          }
          return result;
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to update product",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteProduct(input.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to delete product",
          });
        }
      }),

    uploadImage: adminProcedure
      .input(
        z.object({
          file: z.string(), // base64 encoded file data
          filename: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(input.file, 'base64');
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomId = nanoid(8);
          const ext = input.filename.split('.').pop() || 'jpg';
          const key = `products/${timestamp}-${randomId}.${ext}`;
          
          // Upload to S3
          const result = await storagePut(key, buffer, input.mimeType);
          
          return {
            url: result.url,
            key: result.key,
          };
        } catch (error) {
          console.error('[Upload Error]', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload image',
          });
        }
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
          customerName: z.string().min(1, "Customer name is required"),
          customerEmail: z.string().email("Invalid email address"),
          customerPhone: z.string().min(1, "Phone is required"),
          customerAddress: z.string().min(1, "Address is required"),
          items: z.array(
            z.object({
              productId: z.number().min(1, "Product ID is required"),
              productName: z.string().min(1),
              quantity: z.number().min(1, "Quantity must be at least 1"),
              priceAtPurchase: z.string().min(1, "Price is required").refine(
                (val) => {
                  const num = parseFloat(val);
                  return !isNaN(num) && num > 0;
                },
                "Price must be a positive number"
              ),
            })
          ).min(1, "At least one item is required"),
          total: z.string().min(1, "Total is required").refine(
            (val) => {
              const num = parseFloat(val);
              return !isNaN(num) && num > 0;
            },
            "Total must be a positive number"
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const orderNumber = `ORD-${nanoid(12).toUpperCase()}`;

          const order = await createOrder({
            orderNumber,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            customerAddress: input.customerAddress,
            total: input.total,
          });

          // Use batch create for better atomicity
          try {
            const orderItemsData = input.items.map(item => ({
              orderId: order.id,
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            }));
            
            await createOrderItemBatch(orderItemsData);
          } catch (error) {
            console.error("[Orders] Failed to create order items:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: error instanceof Error ? error.message : "Failed to add items to order",
            });
          }

          return order;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to create order",
          });
        }
      }),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "processing", "prepare", "given", "complete", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await updateOrderStatus(input.id, input.status);
          return result;
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Failed to update order status",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteOrderWithItems } = await import("./db_orders");
        await deleteOrderWithItems(input.id);
        return { success: true };
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    daily: adminProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getDailyProfitReport(input.startDate, input.endDate);
      }),

    weekly: adminProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getWeeklyProfitReport(input.startDate, input.endDate);
      }),

    monthly: adminProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getMonthlyProfitReport(input.startDate, input.endDate);
      }),
  }),

  // ============ AI FEATURES ============
  ai: aiRouter,
  // ============ ADMIN AUTH ============
  admin: adminAuthRouter,
});

export type AppRouter = typeof appRouter;
