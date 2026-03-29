// Simplified tRPC-like router for Cloudflare Workers
import { store } from './store';

export interface ApiRequest {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
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
  const { method, path, body, headers } = req;
  const token = headers?.['authorization']?.replace('Bearer ', '');

  try {
    // Products endpoints
    if (path === 'products.list' && method === 'GET') {
      return {
        success: true,
        data: store.getProducts(),
      };
    }

    if (path === 'products.get' && method === 'POST') {
      const product = store.getProduct(body.id);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, data: product };
    }

    if (path === 'products.create' && method === 'POST') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      const product = store.createProduct(body);
      return { success: true, data: product };
    }

    if (path === 'products.update' && method === 'POST') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      const product = store.updateProduct(body.id, body.updates);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, data: product };
    }

    if (path === 'products.delete' && method === 'POST') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      const deleted = store.deleteProduct(body.id);
      return { success: deleted, message: deleted ? 'Product deleted' : 'Product not found' };
    }

    // Orders endpoints
    if (path === 'orders.list' && method === 'GET') {
      return {
        success: true,
        data: store.getOrders(),
      };
    }

    if (path === 'orders.get' && method === 'POST') {
      const order = store.getOrder(body.id);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, data: order };
    }

    if (path === 'orders.create' && method === 'POST') {
      const order = store.createOrder(body);
      return { success: true, data: order };
    }

    if (path === 'orders.updateStatus' && method === 'POST') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      const order = store.updateOrder(body.id, { status: body.status });
      if (!order) {
        return { success: false, error: 'Order not found' };
      }
      return { success: true, data: order };
    }

    // Auth endpoints
    if (path === 'auth.login' && method === 'POST') {
      const user = store.getUser(body.username);
      if (!user || user.passwordHash !== body.password) {
        return { success: false, error: 'Invalid credentials' };
      }
      
      // Create session
      const sessionToken = generateToken();
      sessions.set(sessionToken, {
        userId: user.id,
        username: user.username,
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

    if (path === 'auth.logout' && method === 'POST') {
      if (token) {
        sessions.delete(token);
      }
      return { success: true, message: 'Logged out' };
    }

    // Analytics endpoints
    if (path === 'analytics.dailyProfit' && method === 'GET') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      return {
        success: true,
        data: { profit: store.getDailyProfit() },
      };
    }

    if (path === 'analytics.weeklyProfit' && method === 'GET') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      return {
        success: true,
        data: { profit: store.getWeeklyProfit() },
      };
    }

    if (path === 'analytics.monthlyProfit' && method === 'GET') {
      const session = getSession(token);
      if (!session || session.role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }
      return {
        success: true,
        data: { profit: store.getMonthlyProfit() },
      };
    }

    // System endpoints
    if (path === 'system.notifyOwner' && method === 'POST') {
      console.log('Owner notification:', body);
      return {
        success: true,
        message: 'Notification sent',
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
