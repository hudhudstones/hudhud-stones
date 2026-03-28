import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const bcrypt = await import("bcryptjs");
        const mysql = await import("mysql2/promise");

        // Create connection to database
        const connection = await mysql.createConnection({
          host: process.env.DB_HOST || "localhost",
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          database: process.env.DB_NAME || "hudhud",
        });

        // Query admin user
        const [rows] = await connection.execute(
          "SELECT * FROM admin_users WHERE username = ? AND is_active = true LIMIT 1",
          [input.username]
        );

        await connection.end();

        if (!Array.isArray(rows) || rows.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        const user = rows[0] as any;

        // Verify password
        const isPasswordValid = bcrypt.compareSync(
          input.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid credentials",
          });
        }

        // Generate token
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString(
          "base64"
        );

        // Set cookie
        ctx.res.setHeader(
          "Set-Cookie",
          `admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
        );

        return {
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Login error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed",
        });
      }
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.setHeader(
      "Set-Cookie",
      "admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
    );
    return { success: true };
  }),
});
