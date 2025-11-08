# Campus Biites - Smart Campus Food Ordering Platform

## Overview

Campus Biites is a **multi-tenant** mobile-first food ordering application designed specifically for campus environments across multiple Indian universities. The platform connects students with their campus food outlets, featuring budget-aware filtering, personalized recommendations, gamification elements (reward tokens, badges, leaderboards), and smart operational features like order queue management with "chill periods" for outlets.

The application emphasizes a modern, playful design inspired by leading food delivery platforms (Swiggy, Zomato, DoorDash) with gamification elements from Duolingo, prioritizing mobile-first interactions and fast visual scanning for busy students.

### Multi-Tenancy Architecture

**Four User Roles:**
1. **App Admin** - Manages universities across the platform (`/admin` dashboard)
2. **University Admin** - Manages outlets for their specific campus (`/university-dashboard`)
3. **Outlet Owner** - Manages menu and orders for their outlet
4. **Student** - Orders food from their university's outlets only

**Key Security Features:**
- Students select their university ONCE during first login (immutable selection)
- All data is university-scoped - students see ONLY their campus outlets
- Cross-tenant data leakage prevented at backend API level
- Role-based access control on all administrative endpoints

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theme system supporting light/dark modes via CSS variables
- Typography: Inter (primary) and Poppins (accent) fonts from Google Fonts
- Mobile-first responsive design with bottom navigation pattern

**State Management:**
- React Query for server state (outlets, dishes, orders, rewards, challenges)
- React hooks for local component state
- No global state management library (relies on React Query cache)

**Design System:**
- Custom Tailwind configuration with extended colors, borders, and spacing
- Consistent spacing primitives (2, 4, 6, 8, 12, 16 units)
- Custom CSS elevation system (hover-elevate, active-elevate-2)
- Badge and button variants with outline styles

### Backend Architecture

**Framework:**
- Express.js server with TypeScript
- RESTful API design pattern
- Session-based authentication via Replit Auth (OpenID Connect)

**API Structure:**
- `/api/auth/*` - Authentication endpoints (user session, login/logout, university selection)
- `/api/universities` - University listing (public for student selection dialog)
- `/api/outlets` - Outlet management (list, detail, dishes) - **university-scoped**
- `/api/orders` - Order placement and tracking
- `/api/rewards` - Reward wheel spinning and claims
- `/api/challenges` - Challenge tracking and progress
- `/api/badges` - Badge system and user achievements
- `/api/leaderboard` - User rankings

**Key Backend Features:**
- **Multi-tenancy**: University-scoped data access with role-based permissions
- **Payment**: Cash/UPI-on-pickup (NO payment gateway) with payment method selection
- QR code generation for pickup verification
- Outlet "chill period" management (automatic cooldown when order threshold reached)
- Real-time order status tracking (placed → preparing → ready → completed)
- Token-based reward system integrated with user actions

**Security Middleware:**
- `isAuthenticated` - Verifies user session exists
- `isAppAdmin` - Restricts to app_admin role only
- `isUniversityAdmin` - Restricts to university_admin or app_admin roles
- `isOutletOwner` - Restricts to outlet_owner role
- All outlet/dish endpoints enforce university-scoped access control

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and schema management
- Schema-first approach with shared TypeScript types

**Schema Design:**
- `universities` - University master table (id, name, location, code)
- `users` - Multi-role accounts (app_admin, university_admin, outlet_owner, student) with universityId FK
- `outlets` - Food outlet information with universityId FK and chill period tracking
- `dishes` - Menu items with nutrition data (calories, protein, carbs, sugar)
- `orders` & `order_items` - Order management with paymentMethod, paymentStatus, and QR code
- `group_orders` - Shared orders for team purchases
- `ratings` - Dish and outlet reviews with token rewards
- `rewards` - Prize pool for reward wheel
- `reward_claims` - User reward history
- `challenges` - Daily/weekly challenges for engagement
- `badges` & `user_badges` - Achievement system
- `sessions` - Express session storage for Replit Auth

**Multi-Tenancy Schema Details:**
- All outlets MUST have universityId (NOT NULL constraint)
- Students have optional universityId (set once during first login)
- App admin has NULL universityId (global access)
- University admin must have universityId (restricted to their campus)
- Indexes on foreign keys (users.universityId, outlets.universityId) for performance

**Data Access Pattern:**
- Storage abstraction layer (`server/storage.ts`) providing clean interface
- Prepared statements via Drizzle for SQL injection prevention
- Transaction support for operations like order placement with multiple items

### Authentication & Authorization

**Authentication Provider:**
- Local username/password authentication (replaced Replit Auth)
- Passport.js with passport-local strategy
- bcrypt password hashing (10 salt rounds)
- Session management via connect-pg-simple (PostgreSQL session store)

**Session Management:**
- 7-day session TTL with secure HTTP-only cookies
- Session data stored in PostgreSQL `sessions` table
- User password stored as bcrypt hash in users.password field

**Authorization:**
- **Multi-role access control**: app_admin, university_admin, outlet_owner, student
- **Middleware guards**: isAuthenticated, isAppAdmin, isUniversityAdmin, isOutletOwner
- **University-scoped queries**: All outlet/dish endpoints filter by user's universityId
- **Immutable student university**: Once set, students cannot change their university
- User context attached to requests via Passport serialization

**Access Control Matrix:**
| Role | University CRUD | Outlet CRUD | See All Universities | Cross-Campus Access |
|------|----------------|-------------|---------------------|---------------------|
| app_admin | Full | Full | Yes | Yes |
| university_admin | Read only | Own university only | Yes | No |
| outlet_owner | No | Own outlet only | No | No |
| student | No | Read only | Yes (selection dialog) | No |

### External Dependencies

**Third-Party Services:**
- **Replit Auth** - Primary authentication provider (OpenID Connect)
- **Neon Database** - Serverless PostgreSQL hosting
- **Google Fonts CDN** - Web fonts (Inter, Poppins)
- **NO Payment Gateway** - Cash/UPI-on-pickup only (per requirements)

**Development Tools:**
- **Replit Vite Plugins** - Runtime error modal, cartographer, dev banner
- **Drizzle Kit** - Database migrations and schema management
- **esbuild** - Backend bundling for production
- **tsx** - TypeScript execution for development

**Key Libraries:**
- **qrcode.react** - QR code generation for order pickup
- **date-fns** - Date formatting and manipulation
- **zod** - Runtime schema validation (Drizzle integration)
- **react-hook-form** - Form state management with validation
- **vaul** - Drawer component (mobile sheets)
- **embla-carousel-react** - Carousel/slider functionality
- **recharts** - Potential charting (imported but not actively used in current pages)

**WebSocket:**
- WebSocket support configured for Neon serverless via `ws` package
- Enables real-time database connections

## Recent Changes (Nov 7, 2025)

### Authentication System Migration ✅
- Replaced Replit Auth with local username/password authentication
- Added passport-local strategy with bcrypt password hashing
- Created server/localAuth.ts with authentication middleware
- Updated all route handlers to work with new auth structure (req.user.id instead of req.user.claims.sub)
- Seeded test accounts for all 4 roles:
  - admin@test.com (App Admin) - password: password123
  - universityadmin@test.com (University Admin for IIT Delhi) - password: password123
  - outletowner@test.com (Outlet Owner) - password: password123
  - student@test.com (Student - no university selected) - password: password123
- Created frontend login page at /login with email/password form
- Updated Landing page to redirect to /login instead of /api/login
- Added logout button to Profile page

### Multi-Tenancy Implementation ✅
- Added `universities` table with id, name, location, code fields
- Updated `users` table with role (app_admin, university_admin, outlet_owner, student) and universityId FK
- Updated `outlets` table with universityId FK (NOT NULL)
- Created `/admin` dashboard for app admin to manage universities
- Created `/university-dashboard` for university admin to manage campus outlets
- Implemented university selection dialog for students (one-time, immutable)
- Added role-based middleware: isAppAdmin, isUniversityAdmin, isOutletOwner
- Implemented university-scoped access control on all outlet/dish endpoints
- Seeded database with 3 universities (IIT Delhi, BITS Pilani, DU North Campus)

### Payment System ✅
- Updated `orders` table with paymentMethod (cash/upi) and paymentStatus (pending/completed)
- NO payment gateway integration (per requirements)
- Students select payment method during checkout
- Payment happens at outlet during pickup
- QR code used for pickup verification only (not payment)

### Security Hardening ✅
- Students without university get empty outlets array (not all outlets)
- University selection validated server-side (exists in DB, one-time only, students only)
- Outlet creation validates university ownership (university_admin restricted to their campus)
- All outlet detail and dish endpoints require authentication and university-scope verification
- Cross-tenant data leakage prevented at API level

### Auto-Credential Generation System ✅
- **University Creation**: App admin creates university → auto-generates unique email/password for university admin
  - Email format: `admin.{code}.{uniqueId}@campus.edu`
  - Password: Randomly generated 16-character secure password
  - Credentials displayed in modal with copy-to-clipboard functionality
- **Outlet Creation**: University admin creates outlet → auto-generates unique email/password for outlet owner
  - Email format: `owner.{outletname}.{uniqueId}@campus.edu`
  - Password: Randomly generated 16-character secure password
  - Credentials displayed in modal with copy-to-clipboard functionality
- **Security**: Passwords bcrypt-hashed before storage, plain password shown only once in creation modal
- **Data Flow**: University admin automatically assigned universityId, outlet owner inherits universityId from university admin
- **JSON Parsing Fix**: All apiRequest responses properly parsed with .json() before accessing properties
- **Menu Extraction**: Photo-based menu extraction with Gemini Vision API integrated into outlet creation flow

## Recent Changes (Nov 8, 2025)

### Data Cleanup & UI Improvements ✅
- **Complete Database Cleanup**:
  - Deleted ALL mock universities from database (Bennett University, IIT Delhi, BITS Pilani, DU North Campus)
  - Cleared all dependent data: outlets, dishes, orders, ratings, reward claims
  - Reset all user accounts to NULL university (except app_admin)
  - Database now has 0 universities - ready for real campus data
  - Only 4 test user accounts remain: admin@test.com, universityadmin@test.com, outletowner@test.com, student@test.com (all password: password123)
  - Profile page leaderboard uses only real API data (no hardcoded mock entries)
  
- **Admin Dashboard Enhancements**:
  - Removed hardcoded Platform Status section with fake metrics (Response Time, Uptime, Active Sessions)
  - Simplified University Cards - clean view with summary stats only (outlets, students, orders counts)
  
- **Security & Authentication Fixes**:
  - Fixed session deserialization error handling - gracefully clears invalid sessions instead of crashing
  - All gamification endpoints now require authentication (/api/rewards, /api/challenges, /api/badges, /api/leaderboard)
  
- **UI Bug Fixes**:
  - Fixed DOM nesting error in Profile page (Badge component inside <p> tag)
  - Fixed CSS @import error by moving Uppy stylesheet import to top of file