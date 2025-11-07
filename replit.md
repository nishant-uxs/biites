# Campus Biites - Smart Campus Food Ordering Platform

## Overview

Campus Biites is a mobile-first food ordering application designed specifically for campus environments. The platform connects students with campus food outlets, featuring budget-aware filtering, personalized recommendations, gamification elements (reward tokens, badges, leaderboards), and smart operational features like order queue management with "chill periods" for outlets.

The application emphasizes a modern, playful design inspired by leading food delivery platforms (Swiggy, Zomato, DoorDash) with gamification elements from Duolingo, prioritizing mobile-first interactions and fast visual scanning for busy students.

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
- `/api/auth/*` - Authentication endpoints (user session, login/logout)
- `/api/outlets` - Outlet management (list, detail, dishes)
- `/api/orders` - Order placement and tracking
- `/api/rewards` - Reward wheel spinning and claims
- `/api/challenges` - Challenge tracking and progress
- `/api/badges` - Badge system and user achievements
- `/api/leaderboard` - User rankings

**Key Backend Features:**
- Order flow with split payment system (40% prepaid, 60% on pickup)
- QR code generation for pickup verification
- Outlet "chill period" management (automatic cooldown when order threshold reached)
- Real-time order status tracking (placed → preparing → ready → completed)
- Token-based reward system integrated with user actions

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and schema management
- Schema-first approach with shared TypeScript types

**Schema Design:**
- `users` - Student and outlet owner accounts with role-based access
- `outlets` - Food outlet information with chill period tracking
- `dishes` - Menu items with nutrition data (calories, protein, carbs, sugar)
- `orders` & `order_items` - Order management with status workflow
- `group_orders` - Shared orders for team purchases
- `ratings` - Dish and outlet reviews with token rewards
- `rewards` - Prize pool for reward wheel
- `reward_claims` - User reward history
- `challenges` - Daily/weekly challenges for engagement
- `badges` & `user_badges` - Achievement system
- `sessions` - Express session storage for Replit Auth

**Data Access Pattern:**
- Storage abstraction layer (`server/storage.ts`) providing clean interface
- Prepared statements via Drizzle for SQL injection prevention
- Transaction support for operations like order placement with multiple items

### Authentication & Authorization

**Authentication Provider:**
- Replit Auth (OpenID Connect) for seamless user authentication
- Passport.js strategy for OAuth2/OIDC integration
- Session management via connect-pg-simple (PostgreSQL session store)

**Session Management:**
- 7-day session TTL with secure HTTP-only cookies
- Automatic token refresh for Replit Auth
- Session data stored in PostgreSQL `sessions` table

**Authorization:**
- Role-based access control (student vs. outlet_owner)
- Middleware: `isAuthenticated` guard for protected routes
- User context attached to requests via Passport serialization

### External Dependencies

**Third-Party Services:**
- **Replit Auth** - Primary authentication provider (OpenID Connect)
- **Neon Database** - Serverless PostgreSQL hosting
- **Google Fonts CDN** - Web fonts (Inter, Poppins)
- **Stripe** (partially integrated) - Payment processing infrastructure (@stripe/stripe-js, @stripe/react-stripe-js)

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