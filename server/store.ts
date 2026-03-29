// In-memory data store for Cloudflare Workers
// This provides a working backend until D1 is properly configured

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  image?: string;
  stock: number;
  createdAt: number;
}

export interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  status: 'pending' | 'processing' | 'prepare' | 'given' | 'complete' | 'cancelled';
  total: number;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: number;
}

// In-memory storage
let products: Map<string, Product> = new Map();
let orders: Map<string, Order> = new Map();
let users: Map<string, User> = new Map();

// Initialize with sample data
function initializeStore() {
  // Sample products
  const sampleProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Black Stone',
      description: 'Premium black decorative stone',
      price: 29.99,
      cost: 15.00,
      category: 'Decorative',
      stock: 50,
      createdAt: Date.now(),
    },
    {
      id: 'prod-2',
      name: 'White Marble',
      description: 'Elegant white marble stone',
      price: 49.99,
      cost: 25.00,
      category: 'Marble',
      stock: 30,
      createdAt: Date.now(),
    },
    {
      id: 'prod-3',
      name: 'Grey Granite',
      description: 'Durable grey granite stone',
      price: 39.99,
      cost: 20.00,
      category: 'Granite',
      stock: 40,
      createdAt: Date.now(),
    },
  ];

  sampleProducts.forEach(p => products.set(p.id, p));

  // Sample admin user
  const adminUser: User = {
    id: 'user-1',
    username: 'admin',
    passwordHash: 'admin123', // In production, use bcrypt
    role: 'admin',
    createdAt: Date.now(),
  };

  users.set(adminUser.id, adminUser);
}

// Initialize on first load
initializeStore();

// Product operations
export const store = {
  // Products
  getProducts: () => Array.from(products.values()),
  getProduct: (id: string) => products.get(id),
  createProduct: (product: Omit<Product, 'id' | 'createdAt'>) => {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...product,
      id,
      createdAt: Date.now(),
    };
    products.set(id, newProduct);
    return newProduct;
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const product = products.get(id);
    if (!product) return null;
    const updated = { ...product, ...updates };
    products.set(id, updated);
    return updated;
  },
  deleteProduct: (id: string) => {
    return products.delete(id);
  },

  // Orders
  getOrders: () => Array.from(orders.values()),
  getOrder: (id: string) => orders.get(id),
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `order-${Date.now()}`;
    const newOrder: Order = {
      ...order,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    orders.set(id, newOrder);
    return newOrder;
  },
  updateOrder: (id: string, updates: Partial<Order>) => {
    const order = orders.get(id);
    if (!order) return null;
    const updated = { ...order, ...updates, updatedAt: Date.now() };
    orders.set(id, updated);
    return updated;
  },

  // Users
  getUser: (username: string) => {
    const userArray = Array.from(users.values());
    for (let i = 0; i < userArray.length; i++) {
      if (userArray[i].username === username) return userArray[i];
    }
    return null;
  },
  getUserById: (id: string) => users.get(id),
  createUser: (user: Omit<User, 'id' | 'createdAt'>) => {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      ...user,
      id,
      createdAt: Date.now(),
    };
    users.set(id, newUser);
    return newUser;
  },

  // Analytics
  getDailyProfit: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let profit = 0;
    orders.forEach(order => {
      if (order.createdAt >= todayTime && order.status === 'complete') {
        order.items.forEach(item => {
          const product = products.get(item.productId);
          if (product) {
            profit += (item.price - product.cost) * item.quantity;
          }
        });
      }
    });
    return profit;
  },

  getWeeklyProfit: () => {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    today.setHours(0, 0, 0, 0);
    const weekAgoTime = today.getTime();

    let profit = 0;
    orders.forEach(order => {
      if (order.createdAt >= weekAgoTime && order.status === 'complete') {
        order.items.forEach(item => {
          const product = products.get(item.productId);
          if (product) {
            profit += (item.price - product.cost) * item.quantity;
          }
        });
      }
    });
    return profit;
  },

  getMonthlyProfit: () => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    today.setHours(0, 0, 0, 0);
    const monthAgoTime = today.getTime();

    let profit = 0;
    orders.forEach(order => {
      if (order.createdAt >= monthAgoTime && order.status === 'complete') {
        order.items.forEach(item => {
          const product = products.get(item.productId);
          if (product) {
            profit += (item.price - product.cost) * item.quantity;
          }
        });
      }
    });
    return profit;
  },
};
