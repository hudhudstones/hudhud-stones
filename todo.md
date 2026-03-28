# Hudhud Stones — Project TODO

## Database & Backend
- [x] Products table (name, description, price, category, images, stock, featured)
- [x] Categories table (name, slug, description)
- [x] Orders table (customer info, status, total)
- [x] Order items table (product, quantity, price snapshot)
- [x] Run DB migrations
- [x] tRPC: categories CRUD (admin)
- [x] tRPC: products CRUD (admin) with image upload to S3
- [x] tRPC: public product listing with search & category filter
- [x] tRPC: product detail by id/slug
- [x] tRPC: order creation (checkout)
- [x] tRPC: admin order listing & status update
- [x] Admin middleware (role guard)

## Customer Shop
- [x] Global layout: top nav with logo, cart icon, search
- [x] Home page: hero, featured products, categories
- [x] Product catalog page with search, category filter, price range filter
- [x] Product detail page with image gallery & add-to-cart
- [x] Shopping cart (session/localStorage) with quantity management
- [x] Checkout page: customer info form + order summary
- [x] Order confirmation page

## Admin Dashboard
- [x] Admin route guard (role=admin only)
- [x] Admin layout with sidebar navigation
- [x] Dashboard overview (stats: products, orders, revenue)
- [x] Product list with edit/delete actions
- [x] Create/edit product form with multi-image upload
- [x] Category management (create, edit, delete)
- [x] Order list with status management
- [x] Order detail view

## Branding & Styling
- [x] Upload Hudhud logo to CDN
- [x] Apply brand colors (warm stone tones)
- [x] Google Font (Cormorant Garamond + Inter)
- [x] Responsive design (mobile-first)
- [x] Minimalist aesthetic throughout
- [x] Add Facebook and Instagram links in footer
- [x] Add social media icons to header/navigation

## Tests
- [x] Products router unit tests
- [x] Orders router unit tests
- [ ] Cart context unit tests
