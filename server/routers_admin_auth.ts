import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { authenticateAdminUser, getAllAdminUsers, createAdminUser, updateAdminUserPassword, deleteAdminUser, changeAdminUsername, toggleAdminUserStatus } from "./db_admin";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { ONE_YEAR_MS } from "@shared/const";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

async function generateAdminToken(adminId: string): Promise<string> {
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  return new SignJWT({
    adminId,
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

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
        const token = await generateAdminToken(user.id);
        return {
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: "admin",
            },
            token,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Admin Auth] Login error:", errorMessage);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage || "Login failed. Please try again.",
        });
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

  changeUsername: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        newUsername: z.string().min(1, "Username is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await changeAdminUsername(input.userId, input.newUsername);
        return { success: true, message: "Username changed successfully" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
      }
    }),

  toggleStatus: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await toggleAdminUserStatus(input.userId);
        return {
          success: true,
          message: result.is_active ? "User account enabled" : "User account disabled",
          is_active: result.is_active,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(errorMessage);
      }
    }),
});
