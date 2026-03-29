import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { authenticateAdminUser, getAllAdminUsers, createAdminUser, updateAdminUserPassword, deleteAdminUser } from "./db_admin";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

export const adminAuthRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await authenticateAdminUser(input.username, input.password);
        return user;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Admin Auth] Login error:", errorMessage);
        throw new Error(errorMessage || "Login failed. Please try again.");
      }
    }),

  listUsers: publicProcedure
    .query(async () => {
      return await getAllAdminUsers();
    }),

  createUser: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await createAdminUser(input.username, input.password, input.email);
        return { success: true, message: `User '${input.username}' created successfully` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
      }
    }),

  updatePassword: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await updateAdminUserPassword(input.userId, input.newPassword);
        return { success: true, message: "Password updated successfully" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
      }
    }),

  deleteUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        await deleteAdminUser(input.userId);
        return { success: true, message: "User deleted successfully" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
      }
    }),
});
