// Cloudflare Workers tRPC-like router with D1 support
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, like, and, gte, lte } from "drizzle-orm";
import * as schema from "../drizzle/schema_d1";

export interface ApiRequest {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
  env: any;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// In-memory session store (in production, use Cloudflare KV)
const sessions = new Map<string, { userId: string; username: string; role: string; expiresAt: number }>();

// Generate a simple session token
const generateToken = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validate session token
const getSession = (token?: string) => {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
};

export async function handleApiRequest(req: ApiRequest): Promise<ApiResponse> {
  const { method, path, body, headers, env } = req;
  const token = headers?.['authorization']?.replace('Bearer ', '');
  const db = drizzle(env.DB, { schema });

  try {
    // Products endpoints
    if (path === 'products.list' && method === 'GET') {
      const products = await db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
      return {
        success: true,
        data: products.map(p => ({ ...p, images: JSON.parse(p.images) })),
      };
    }

    if (path === 'products.get' && method === 'POST') {
      const product = await db.query.products.findFirst({
        where: eq(schema.products.id, body.id)
      });
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, data: { ...product, images: JSON.parse(product.images) } };
    }

    if (path === 'products.create' && method === 'POST') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      const now = new Date();
      const result = await db.insert(schema.products).values({
        ...body,
        images: JSON.stringify(body.images || []),
        createdAt: now,
        updatedAt: now,
      }).returning();
      return { success: true, data: { ...result[0], images: JSON.parse(result[0].images) } };
    }

    // Auth endpoints
    if (path === 'auth.login' && method === 'POST') {
      // For now, allow admin/admin123 or check users table
      let user;
      if (body.username === 'admin' && body.password === 'admin123') {
        user = { id: 'admin-1', username: 'admin', role: 'admin' };
      } else {
        const dbUser = await db.query.users.findFirst({
          where: and(eq(schema.users.name, body.username), eq(schema.users.role, 'admin'))
        });
        // In a real app, verify password hash here
        if (dbUser) {
          user = { id: dbUser.id.toString(), username: dbUser.name, role: dbUser.role };
        }
      }

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Create session
      const sessionToken = generateToken();
      sessions.set(sessionToken, {
        userId: user.id,
        username: user.username!,
        role: user.role,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });

      return {
        success: true,
        data: {
          user: { id: user.id, username: user.username, role: user.role },
          token: sessionToken,
        },
      };
    }

    if (path === 'auth.me' && method === 'GET') {
      const session = getSession(token);
      if (!session) {
        return { success: false, error: 'Unauthorized' };
      }
      return {
        success: true,
        data: {
          user: { id: session.userId, username: session.username, role: session.role },
        },
      };
    }

    // Default 404
    return {
      success: false,
      error: `Endpoint not found: ${path}`,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
  }
}
