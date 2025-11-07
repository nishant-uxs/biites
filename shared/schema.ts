import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== AUTH TABLES (Required for Replit Auth) =====

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// ===== UNIVERSITY TABLES (Multi-tenancy) =====

export const universities = pgTable("universities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  location: varchar("location").notNull(),
  code: varchar("code").unique().notNull(), // e.g., "IIT-DEL", "BITS-PIL"
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUniversitySchema = createInsertSchema(universities).omit({
  id: true,
  createdAt: true,
});

export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universities.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // bcrypt hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  tokens: integer("tokens").default(0).notNull(), // Reward tokens
  role: varchar("role").default("student").notNull(), // "app_admin", "university_admin", "outlet_owner", "student"
  universityId: varchar("university_id").references(() => universities.id), // null for app_admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_users_university").on(table.universityId),
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ===== OUTLET TABLES =====

export const outlets = pgTable("outlets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  universityId: varchar("university_id").notNull().references(() => universities.id),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  averagePrice: integer("average_price").notNull(), // in rupees
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0).notNull(),
  isChillPeriod: boolean("is_chill_period").default(false).notNull(),
  chillPeriodEndsAt: timestamp("chill_period_ends_at"),
  activeOrdersCount: integer("active_orders_count").default(0).notNull(),
  maxActiveOrders: integer("max_active_orders").default(10).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_outlets_university").on(table.universityId),
]);

export const insertOutletSchema = createInsertSchema(outlets).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalRatings: true,
  isChillPeriod: true,
  chillPeriodEndsAt: true,
  activeOrdersCount: true,
});

export type InsertOutlet = z.infer<typeof insertOutletSchema>;
export type Outlet = typeof outlets.$inferSelect;

// ===== DISH TABLES =====

export const dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  outletId: varchar("outlet_id").notNull().references(() => outlets.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  price: integer("price").notNull(), // in rupees
  category: varchar("category").notNull(), // "main", "beverage", "side", "dessert"
  calories: integer("calories"),
  protein: integer("protein"), // in grams
  carbs: integer("carbs"), // in grams
  sugar: integer("sugar"), // in grams
  isCustomizable: boolean("is_customizable").default(true).notNull(),
  orderCount: integer("order_count").default(0).notNull(), // for trending
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
  orderCount: true,
});

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

// ===== ORDER TABLES =====

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  outletId: varchar("outlet_id").notNull().references(() => outlets.id),
  groupOrderId: varchar("group_order_id").references(() => groupOrders.id),
  status: varchar("status").notNull().default("placed"), // "placed", "preparing", "ready", "completed", "cancelled"
  paymentMethod: varchar("payment_method").notNull().default("cash"), // "cash" or "upi"
  paymentStatus: varchar("payment_status").notNull().default("pending"), // "pending", "completed"
  totalAmount: integer("total_amount").notNull(),
  specialInstructions: text("special_instructions"),
  estimatedReadyTime: timestamp("estimated_ready_time"),
  qrCode: varchar("qr_code").notNull(), // for pickup verification
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  qrCode: true,
  status: true,
  paymentStatus: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  dishId: varchar("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // price at time of order
  customizations: text("customizations"), // e.g., "No onion, Extra cheese"
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// ===== GROUP ORDER TABLES =====

export const groupOrders = pgTable("group_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  outletId: varchar("outlet_id").notNull().references(() => outlets.id),
  name: varchar("name").notNull(), // e.g., "CS Class Lunch"
  status: varchar("status").notNull().default("open"), // "open", "closed", "completed"
  totalAmount: integer("total_amount").default(0).notNull(),
  shareLink: varchar("share_link").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const insertGroupOrderSchema = createInsertSchema(groupOrders).omit({
  id: true,
  createdAt: true,
  closedAt: true,
  totalAmount: true,
  shareLink: true,
  status: true,
});

export type InsertGroupOrder = z.infer<typeof insertGroupOrderSchema>;
export type GroupOrder = typeof groupOrders.$inferSelect;

// ===== RATING TABLES =====

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  outletId: varchar("outlet_id").notNull().references(() => outlets.id),
  dishId: varchar("dish_id").references(() => dishes.id),
  rating: integer("rating").notNull(), // 1-5
  review: text("review"),
  tokensEarned: integer("tokens_earned").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
  tokensEarned: true,
});

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

// ===== REWARD TABLES =====

export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // "discount", "free_item", "offer"
  title: varchar("title").notNull(),
  description: text("description"),
  value: integer("value"), // discount percentage or item value
  probability: integer("probability").notNull(), // 1-100 for wheel
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
});

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export const rewardClaims = pgTable("reward_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardId: varchar("reward_id").notNull().references(() => rewards.id),
  tokensSpent: integer("tokens_spent").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const insertRewardClaimSchema = createInsertSchema(rewardClaims).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  isUsed: true,
});

export type InsertRewardClaim = z.infer<typeof insertRewardClaimSchema>;
export type RewardClaim = typeof rewardClaims.$inferSelect;

// ===== GAMIFICATION TABLES =====

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  type: varchar("type").notNull(), // "daily", "weekly"
  requirement: integer("requirement").notNull(), // e.g., "Order from 3 outlets"
  rewardTokens: integer("reward_tokens").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
});

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export const badges = pgTable("badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  icon: varchar("icon").notNull(), // emoji or icon identifier
  requirement: text("requirement").notNull(), // description of how to earn
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  badgeId: varchar("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// ===== RELATIONS =====

export const universitiesRelations = relations(universities, ({ many }) => ({
  users: many(users),
  outlets: many(outlets),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
  }),
  ownedOutlets: many(outlets),
  orders: many(orders),
  ratings: many(ratings),
  rewardClaims: many(rewardClaims),
  userBadges: many(userBadges),
  createdGroupOrders: many(groupOrders),
}));

export const outletsRelations = relations(outlets, ({ one, many }) => ({
  owner: one(users, {
    fields: [outlets.ownerId],
    references: [users.id],
  }),
  university: one(universities, {
    fields: [outlets.universityId],
    references: [universities.id],
  }),
  dishes: many(dishes),
  orders: many(orders),
  ratings: many(ratings),
  groupOrders: many(groupOrders),
}));

export const dishesRelations = relations(dishes, ({ one, many }) => ({
  outlet: one(outlets, {
    fields: [dishes.outletId],
    references: [outlets.id],
  }),
  orderItems: many(orderItems),
  ratings: many(ratings),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  outlet: one(outlets, {
    fields: [orders.outletId],
    references: [outlets.id],
  }),
  groupOrder: one(groupOrders, {
    fields: [orders.groupOrderId],
    references: [groupOrders.id],
  }),
  items: many(orderItems),
  ratings: many(ratings),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  dish: one(dishes, {
    fields: [orderItems.dishId],
    references: [dishes.id],
  }),
}));

export const groupOrdersRelations = relations(groupOrders, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupOrders.creatorId],
    references: [users.id],
  }),
  outlet: one(outlets, {
    fields: [groupOrders.outletId],
    references: [outlets.id],
  }),
  orders: many(orders),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [ratings.orderId],
    references: [orders.id],
  }),
  outlet: one(outlets, {
    fields: [ratings.outletId],
    references: [outlets.id],
  }),
  dish: one(dishes, {
    fields: [ratings.dishId],
    references: [dishes.id],
  }),
}));

export const rewardClaimsRelations = relations(rewardClaims, ({ one }) => ({
  user: one(users, {
    fields: [rewardClaims.userId],
    references: [users.id],
  }),
  reward: one(rewards, {
    fields: [rewardClaims.rewardId],
    references: [rewards.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));
