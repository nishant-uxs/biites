# Campus Biites Design Guidelines

## Design Approach

**Hybrid Strategy**: Modern utility-focused design system inspired by leading food delivery platforms (Swiggy, Zomato, DoorDash) with gamification elements from Duolingo. Prioritize efficiency and clarity while maintaining visual appeal for student users.

**Core Principles**:
- Mobile-first, thumb-friendly interactions
- Fast visual scanning for busy students
- Clear information hierarchy for menus and prices
- Playful gamification without compromising usability

## Typography

**Font System** (Google Fonts via CDN):
- Primary: Inter (headings, UI elements) - clean, modern, highly legible
- Secondary: Poppins (accent text, badges, gamification) - friendly, rounded

**Hierarchy**:
- Page Titles: text-4xl font-bold (Inter)
- Section Headers: text-2xl font-semibold (Inter)
- Card Titles: text-lg font-medium (Inter)
- Body Text: text-base font-normal (Inter)
- Price Tags: text-xl font-bold (Poppins) - standout pricing
- Badges/Tokens: text-sm font-semibold (Poppins)
- Microcopy: text-xs (Inter)

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Card gaps: gap-4, gap-6
- Button padding: px-6 py-3

**Grid System**:
- Mobile: Single column, full-width cards
- Tablet: 2-column for outlet cards, features
- Desktop: 3-4 column grid for menu items, max-w-7xl container

## Component Library

### Navigation
- **Bottom Navigation Bar** (mobile-first): 5 icons (Home, Budget, Orders, Rewards, Profile)
- **Top App Bar**: Logo, search, cart badge, notification bell
- Sticky positioning for both bars

### Hero Section
- **Budget Hero Banner**: Full-width, gradient background, prominent budget input field with emoji icon (💰)
- Quick-access chips: "Trending", "Under ₹50", "Comfort Food"
- No large hero image - focus on functional entry point

### Cards & Lists

**Outlet Cards**:
- Horizontal scrollable carousel on home
- Image thumbnail (rounded-lg), outlet name, rating stars, average price, ETA badge
- "Chill Period" overlay when outlet paused (semi-transparent with countdown)

**Menu Item Cards**:
- Grid layout with food image, dish name, nutrition icons, price
- Quick-add (+) button with quantity stepper
- Special instruction badge if customizable

**Order Cards**:
- Timeline view: Order status progress bar (Placed → Preparing → Ready)
- QR code display for pickup
- Clear split payment breakdown (40% paid / 60% pending)

**Group Order Interface**:
- Collaborative list showing all participants' items
- Avatar circles with names
- Bill split visualization

### Interactive Elements

**Budget Filter**:
- Large number input with ₹ prefix
- Instant filtering with smooth transitions
- "Within Budget" badge on qualifying items

**Nutrition Meter**:
- Horizontal bar chart icons for calories, protein, carbs, sugar
- Color-coded: green (low), yellow (medium), red (high)
- Expandable detail view

**Reward Wheel**:
- Circular spinning wheel with prize segments
- Token count display at center
- Confetti animation on win (CSS-only)

**Achievement Badges**:
- Circular icons with gradient fills
- Badge collection grid
- Progress bars for incomplete achievements

### Forms
- Clean, minimal input fields with floating labels
- Special instructions: textarea with character counter
- Payment method selector: radio cards with icons
- Split payment toggle with clear 40/60 visualization

### Outlet Dashboard
- **Order Queue**: Kanban-style columns (New, Preparing, Ready)
- **Chill Period Control**: Toggle switch with countdown timer
- **Analytics**: Simple stat cards (daily orders, revenue, top dishes)

### Gamification UI
- **Leaderboard**: Numbered list with rank medals (🥇🥈🥉)
- **Token Display**: Floating counter with coin icon
- **Challenge Cards**: Progress ring with day/week labels

## Images

**Placement Strategy**:
- **Food Item Images**: Square thumbnails (1:1 ratio) for all menu items - essential for food ordering
- **Outlet Logos**: Circular or rounded square badges
- **Profile Pictures**: Circular avatars for group orders and leaderboard
- **No Large Hero Image**: App prioritizes functional budget filter over decorative hero

**Image Treatment**:
- Rounded corners (rounded-lg) for all food images
- Subtle shadow for depth (shadow-sm)
- Lazy loading for performance

## Animations

**Minimal & Purposeful**:
- Page transitions: fade in/out only
- Cart add: scale bounce (scale-105) on item added
- Reward wheel: CSS rotate animation
- Loading states: simple spinner, skeleton screens for cards
- **No** hover effects on food cards (tap-focused mobile design)

## Accessibility
- High contrast text (WCAG AA minimum)
- Touch targets: minimum 44x44px for all buttons
- Clear focus states for keyboard navigation
- Screen reader labels for all icons

This design creates a fast, intuitive, student-friendly food ordering experience that balances efficiency with engaging gamification.