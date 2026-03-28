import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

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
        // Accept demo credentials for now
        // Username: admin, Password: admin123
        // Username: Tarek, Password: Tarek123_
        const validCredentials = [
          { username: "admin", password: "admin123" },
          { username: "Tarek", password: "Tarek123_" },
        ];

        const user = validCredentials.find(
          (cred) =>
            cred.username === input.username && cred.password === input.password
        );

        if (!user) {
          throw new Error("Invalid username or password");
        }

        return {
          id: 1,
          username: input.username,
          email: `${input.username.toLowerCase()}@hudhudstones.com`,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[Admin Auth] Login error:", errorMessage);
        throw new Error(errorMessage || "Login failed. Please try again.");
      }
    }),
});
