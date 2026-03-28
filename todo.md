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

## New Features (Phase 2)

### Email Notifications
- [ ] Set up email service integration (using built-in notification system)
- [ ] Send order confirmation email when order is placed
- [ ] Send order status update emails (processing, completed, cancelled)
- [ ] Email template design with Hudhud branding

### Product Image Gallery Improvements
- [x] Add image zoom-on-hover functionality
- [x] Implement lightbox gallery for product images
- [ ] Add drag-to-reorder images in admin product form
- [x] Improve image preview UI
- [x] Create reusable ImageGallery component

### WhatsApp Product Sharing
- [x] Add WhatsApp share button on product detail page
- [x] Generate shareable product link with pre-filled message
- [x] Add WhatsApp share to product cards in shop
- [x] Create WhatsApp share utility function

### AI Stone Identifier
- [x] Create "Identify My Stone" page with AI analysis section
- [x] Image upload interface for stone photos
- [x] Integrate LLM for stone identification and analysis
- [x] Display identified stone type, properties, and recommendations
- [x] Link identified stones to shop products
- [x] Add navigation link to Stone Identifier in header


## Comprehensive Testing & Bug Fixes

### Admin Login System
- [ ] Fix admin login database query
- [ ] Test login with Tarek/Tarek123_ credentials
- [ ] Verify session persistence
- [ ] Test logout functionality

### Customer Shop Testing
- [ ] Test homepage loads with featured products
- [ ] Test product catalog with search and filtering
- [ ] Test product detail page and image gallery
- [ ] Test shopping cart add/remove/quantity update
- [ ] Test checkout form validation
- [ ] Test order confirmation page

### Admin Dashboard Testing
- [ ] Test admin login access
- [ ] Test dashboard overview stats
- [ ] Test product CRUD operations
- [ ] Test category management
- [ ] Test order list and status updates
- [ ] Test logout functionality

### AI & Social Features Testing
- [ ] Test stone identifier image upload
- [ ] Test WhatsApp share button on products
- [ ] Test image gallery zoom and lightbox

### Bug Fixes
- [ ] Fix any identified errors
- [ ] Verify all API endpoints working
- [ ] Check database connections
- [ ] Test responsive design on mobile


## Direct Image Upload Feature
- [ ] Create image upload API endpoint (tRPC procedure)
- [ ] Build ImageUpload component with file input and preview
- [ ] Integrate into admin ProductForm
- [ ] Test upload functionality on live site
- [ ] Verify S3 storage and CDN URLs work correctly


## Cost Field & Profit Report
- [x] Add cost column to products table
- [x] Update product create/update API to include cost
- [x] Add cost input field to ProductForm (admin-only)
- [x] Create profit report API endpoint with daily/weekly/monthly calculations
- [x] Build profit report UI with date range selector
- [x] Display orders count, revenue, cost, profit, and profit percentage
- [x] Add profit report page to admin dashboard
- [x] Test profit calculations with sample data
