CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  loginMethod TEXT,
  role TEXT DEFAULT 'user' NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastSignedIn INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  categoryId INTEGER NOT NULL,
  price TEXT NOT NULL,
  cost TEXT DEFAULT '0' NOT NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  featured INTEGER DEFAULT 0 NOT NULL,
  images TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  CONSTRAINT fk_products_categoryId FOREIGN KEY (categoryId) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderNumber TEXT NOT NULL UNIQUE,
  customerName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerPhone TEXT NOT NULL,
  customerAddress TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  total TEXT NOT NULL,
  notes TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orderItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  productId INTEGER NOT NULL,
  productName TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  priceAtPurchase TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  CONSTRAINT fk_orderItems_orderId FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_orderItems_productId FOREIGN KEY (productId) REFERENCES products(id)
);

-- Insert sample data
INSERT INTO categories (name, slug, description, createdAt, updatedAt) VALUES 
('Decorative', 'decorative', 'Premium decorative stones', 1711670400000, 1711670400000);

INSERT INTO products (name, slug, description, categoryId, price, cost, stock, featured, images, createdAt, updatedAt) VALUES 
('Black Stone', 'black-stone', 'Premium black decorative stone', 1, '29.99', '15.00', 50, 1, '[]', 1711670400000, 1711670400000),
('White Marble', 'white-marble', 'Elegant white marble stone', 1, '49.99', '25.00', 30, 1, '[]', 1711670400000, 1711670400000);
