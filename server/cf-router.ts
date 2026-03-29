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

// Simple authentication
const validateAuth = (token?: string): boolean => {
  // In production, validate JWT or session token
  return !!token;
};

export async function handleApiRequest(req: ApiRequest): Promise<ApiResponse> {
  const { method, path, body } = req;

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
      const product = store.createProduct(body);
      return { success: true, data: product };
    }

    if (path === 'products.update' && method === 'POST') {
      const product = store.updateProduct(body.id, body.updates);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      return { success: true, data: product };
    }

    if (path === 'products.delete' && method === 'POST') {
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
      return {
        success: true,
        data: {
          user: { id: user.id, username: user.username, role: user.role },
          token: `token-${user.id}`,
        },
      };
    }

    if (path === 'auth.me' && method === 'GET') {
      // In production, validate token from headers
      return {
        success: true,
        data: {
          user: { id: 'user-1', username: 'admin', role: 'admin' },
        },
      };
    }

    // Analytics endpoints
    if (path === 'analytics.dailyProfit' && method === 'GET') {
      return {
        success: true,
        data: { profit: store.getDailyProfit() },
      };
    }

    if (path === 'analytics.weeklyProfit' && method === 'GET') {
      return {
        success: true,
        data: { profit: store.getWeeklyProfit() },
      };
    }

    if (path === 'analytics.monthlyProfit' && method === 'GET') {
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
