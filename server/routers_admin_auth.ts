import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";

export const adminAuthRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // For now, accept demo credentials
      // In production, you'd query the database for admin users
      if (input.username === "admin" && input.password === "admin123") {
        return {
          id: 1,
          username: "admin",
          email: "admin@hudhudstones.com",
        };
      }

      throw new Error("Invalid username or password");
    }),
});
