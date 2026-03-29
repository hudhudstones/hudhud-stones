import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Admin login endpoint
  app.post("/api/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username and password are required"
        });
      }
      
      const { authenticateAdminUser } = await import("../db_admin");
      const { SignJWT } = await import("jose");
      const { ENV } = await import("./env");
      const { ONE_YEAR_MS } = await import("@shared/const");
      
      const user = await authenticateAdminUser(username, password);
      
      // Generate token
      const issuedAt = Date.now();
      const expiresInMs = ONE_YEAR_MS;
      const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
      const secretKey = new TextEncoder().encode(ENV.cookieSecret);
      
      const token = await new SignJWT({
        adminId: user.id,
        role: "admin",
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setExpirationTime(expirationSeconds)
        .sign(secretKey);
      
      res.json({
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
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      res.status(401).json({
        success: false,
        error: errorMessage,
      });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  
  // Ensure default admin user exists
  const { ensureDefaultAdminExists } = await import("../db_admin");
  await ensureDefaultAdminExists();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
