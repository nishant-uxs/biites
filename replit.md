# Campus Biites - Smart Campus Food Ordering Platform

## Overview
Campus Biites is a multi-tenant, mobile-first food ordering application designed for campus environments in India. It connects students with campus food outlets, offering features like budget-aware filtering, personalized recommendations, and gamification (reward tokens, badges, leaderboards). The platform also includes smart operational tools for outlets, such as order queue management with "chill periods." The application targets a modern, playful design inspired by popular food delivery and gamification platforms, focusing on mobile-first interactions and efficient visual scanning for students.

**Business Vision & Market Potential:** To revolutionize campus food ordering by providing a seamless, engaging, and efficient platform for university students and food outlets, addressing the specific needs of the Indian higher education market.

**Project Ambition:** To become the leading campus food ordering platform across Indian universities, fostering a vibrant food culture and enhancing the daily lives of students and food vendors.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Tenancy
The system supports four distinct user roles: App Admin, University Admin, Outlet Owner, and Student. Each role has specific access levels, and data is strictly university-scoped to prevent cross-tenant leakage. Students select their university once upon first login, and this selection is immutable.

### Frontend
- **Frameworks**: React with TypeScript, Vite for tooling, Wouter for routing, TanStack Query for server state.
- **UI/UX**: shadcn/ui components (Radix UI), Tailwind CSS for styling, custom theme with light/dark modes, Inter and Poppins fonts, mobile-first responsive design with bottom navigation.
- **State Management**: Primarily TanStack Query for server state; local component state via React hooks.

### Backend
- **Framework**: Express.js with TypeScript, RESTful API design.
- **Authentication**: Local username/password authentication using Passport.js (passport-local strategy) and bcrypt hashing. Session management via `connect-pg-simple` with a 7-day TTL.
- **Authorization**: Role-based access control (`app_admin`, `university_admin`, `outlet_owner`, `student`) enforced via middleware (`isAuthenticated`, `isAppAdmin`, `isUniversityAdmin`, `isOutletOwner`). All data access is university-scoped.
- **Key Features**: Multi-tenancy, cash/UPI-on-pickup payment method selection (no gateway), QR code generation for pickup, outlet "chill period" management, real-time order status, token-based rewards.
- **API Endpoints**: Structured for auth, university management, outlet/dish management, orders, rewards, challenges, badges, and leaderboards.
- **Auto-Credential Generation**: For University Admins (upon university creation) and Outlet Owners (upon outlet creation), with secure, randomly generated passwords.
- **Menu Extraction**: Photo-based menu extraction using Gemini Vision API.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe queries and schema management.
- **Schema Design**: Includes `universities`, `users`, `outlets`, `dishes`, `orders`, `order_items`, `group_orders`, `ratings`, `rewards`, `reward_claims`, `challenges`, `badges`, `user_badges`, and `sessions` tables. Foreign keys and indexes enforce multi-tenancy and optimize performance.
- **Data Access**: Storage abstraction layer (`server/storage.ts`) and prepared statements for security.

## External Dependencies

### Third-Party Services
- **Replit Auth**: Primary authentication provider (OpenID Connect).
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts CDN**: Web fonts (Inter, Poppins).
- **Gemini Vision API**: For photo-based menu extraction.

### Libraries & Tools
- **Vite**: Build tool and dev server.
- **Wouter**: Lightweight client-side routing.
- **TanStack Query (React Query)**: Server state management.
- **shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first styling.
- **Passport.js**: Authentication middleware.
- **bcrypt**: Password hashing.
- **Drizzle ORM & Drizzle Kit**: Database queries, schema, and migrations.
- **qrcode.react**: QR code generation.
- **date-fns**: Date manipulation.
- **zod**: Runtime schema validation.
- **react-hook-form**: Form management.
- **vaul**: Drawer component.
- **embla-carousel-react**: Carousel functionality.
- **ws**: WebSocket support for real-time connections.
- **tsx**: TypeScript execution for development.
- **esbuild**: Backend bundling for production.