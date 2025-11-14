import {
  users,
  universities,
  outlets,
  dishes,
  orders,
  orderItems,
  groupOrders,
  ratings,
  rewards,
  rewardClaims,
  challenges,
  badges,
  userBadges,
  type User,
  type UpsertUser,
  type University,
  type InsertUniversity,
  type Outlet,
  type InsertOutlet,
  type Dish,
  type InsertDish,
  type Order,
  type InsertOrder,
  type InsertOrderItem,
  type InsertRating,
  type InsertGroupOrder,
  type GroupOrder,
  type Reward,
  type InsertReward,
  type Challenge,
  type Badge,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: { email: string; password: string; firstName?: string; lastName?: string; role?: string }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTokens(userId: string, tokens: number): Promise<void>;
  updateUserUniversity(userId: string, universityId: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  
  // University operations
  getUniversities(): Promise<University[]>;
  getUniversity(id: string): Promise<University | undefined>;
  createUniversity(university: InsertUniversity): Promise<University>;
  
  // Outlet operations
  getOutlets(universityId?: string): Promise<Outlet[]>;
  getOutlet(id: string): Promise<Outlet | undefined>;
  createOutlet(outlet: InsertOutlet): Promise<Outlet>;
  updateOutletChillPeriod(id: string, isChillPeriod: boolean, endsAt?: Date): Promise<void>;
  updateOutletActiveOrders(id: string, count: number): Promise<void>;
  
  // Dish operations
  getDishes(outletId: string): Promise<Dish[]>;
  getDish(id: string): Promise<Dish | undefined>;
  createDish(dish: InsertDish): Promise<Dish>;
  getTrendingDishes(limit?: number): Promise<Dish[]>;
  getUserComfortFood(userId: string, limit?: number): Promise<Dish[]>;
  incrementDishOrderCount(dishId: string): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  getOutletOrders(outletId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;
  
  // Group Order operations
  createGroupOrder(groupOrder: InsertGroupOrder): Promise<GroupOrder>;
  getGroupOrder(id: string): Promise<GroupOrder | undefined>;
  getGroupOrderByLink(shareLink: string): Promise<GroupOrder | undefined>;
  updateGroupOrderStatus(id: string, status: string): Promise<void>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<void>;
  getOrderRating(orderId: string): Promise<any>;
  
  // Reward operations
  getRewards(): Promise<Reward[]>;
  spinRewardWheel(userId: string): Promise<Reward>;
  getUserRewardClaims(userId: string): Promise<any[]>;
  
  // Challenge operations
  getChallenges(): Promise<Challenge[]>;
  getUserChallengeProgress(userId: string): Promise<any[]>;
  
  // Badge operations
  getBadges(): Promise<Badge[]>;
  getUserBadges(userId: string): Promise<any[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;
  
  // Leaderboard
  getLeaderboard(limit?: number): Promise<any[]>;
  
  // Admin Analytics
  getPlatformAnalytics(): Promise<{
    totalUsers: number;
    totalStudents: number;
    totalUniversities: number;
    totalOutlets: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  getUniversityStats(universityId: string): Promise<{
    outletCount: number;
    studentCount: number;
    orderCount: number;
  }>;
  getUniversityOutletSales(
    universityId: string,
    start?: Date,
    end?: Date
  ): Promise<Array<{ outletId: string; outletName: string; totalOrders: number; totalRevenue: number }>>;
}

export class DatabaseStorage implements IStorage {
  // ===== USER OPERATIONS =====
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string; role?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role || "student",
        tokens: 0,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        tokens: 0,
        role: "student",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserTokens(userId: string, tokens: number): Promise<void> {
    await db
      .update(users)
      .set({ tokens, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserUniversity(userId: string, universityId: string): Promise<void> {
    await db
      .update(users)
      .set({ universityId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async deleteUser(id: string): Promise<void> {
    // Delete dependent data in a safe order to satisfy FKs
    // 1) If the user owns any outlets, delete their dependent data and the outlets
    const owned = await db.select().from(outlets).where(eq(outlets.ownerId, id));
    if (owned.length > 0) {
      const ownedOutletIds = owned.map(o => o.id);
      // Orders for owned outlets (will cascade order_items)
      await db.delete(orders).where(inArray(orders.outletId, ownedOutletIds));
      // Group orders for owned outlets
      await db.delete(groupOrders).where(inArray(groupOrders.outletId, ownedOutletIds));
      // Ratings for owned outlets
      await db.delete(ratings).where(inArray(ratings.outletId, ownedOutletIds));
      // Finally delete outlets (will cascade dishes -> order_items via dish not needed as we removed orders already)
      await db.delete(outlets).where(inArray(outlets.id, ownedOutletIds));
    }

    // 2) Delete entities created by the user
    await db.delete(groupOrders).where(eq(groupOrders.creatorId, id));
    await db.delete(rewardClaims).where(eq(rewardClaims.userId, id));
    await db.delete(userBadges).where(eq(userBadges.userId, id));
    await db.delete(ratings).where(eq(ratings.userId, id));
    await db.delete(orders).where(eq(orders.userId, id)); // cascades order_items

    // 3) Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserByUniversityAndRole(universityId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        sql`${users.universityId} = ${universityId} AND ${users.role} = ${role}`
      )
      .limit(1);
    return user || undefined;
  }

  async updateUserPassword(userId: string, newHashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: newHashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // ===== UNIVERSITY OPERATIONS =====
  
  async getUniversities(): Promise<University[]> {
    return await db.select().from(universities).orderBy(universities.name);
  }

  async getUniversity(id: string): Promise<University | undefined> {
    const [university] = await db.select().from(universities).where(eq(universities.id, id));
    return university || undefined;
  }

  async createUniversity(universityData: InsertUniversity): Promise<University> {
    const [university] = await db
      .insert(universities)
      .values(universityData)
      .returning();
    return university;
  }

  async deleteUniversity(id: string): Promise<void> {
    // Manually cascade to avoid FK violations
    // 1) Gather outlets for the university
    const uniOutlets = await db.select().from(outlets).where(eq(outlets.universityId, id));
    const outletIds = uniOutlets.map(o => o.id);

    if (outletIds.length > 0) {
      // Delete orders for these outlets (order_items cascade)
      await db.delete(orders).where(inArray(orders.outletId, outletIds));
      // Delete group orders for these outlets
      await db.delete(groupOrders).where(inArray(groupOrders.outletId, outletIds));
      // Delete ratings for these outlets
      await db.delete(ratings).where(inArray(ratings.outletId, outletIds));
      // Delete dishes for these outlets (their order_items already removed with orders)
      await db.delete(dishes).where(inArray(dishes.outletId, outletIds));
      // Delete outlets
      await db.delete(outlets).where(inArray(outlets.id, outletIds));
    }

    // 2) Disassociate users from this university (keep accounts)
    await db.update(users).set({ universityId: null, updatedAt: new Date() }).where(eq(users.universityId, id));

    // 3) Delete the university
    await db.delete(universities).where(eq(universities.id, id));
  }

  // ===== OUTLET OPERATIONS =====
  
  async getOutlets(universityId?: string): Promise<Outlet[]> {
    if (universityId) {
      return await db
        .select()
        .from(outlets)
        .where(eq(outlets.universityId, universityId))
        .orderBy(desc(outlets.rating));
    }
    return await db.select().from(outlets).orderBy(desc(outlets.rating));
  }

  async getOutlet(id: string): Promise<Outlet | undefined> {
    const [outlet] = await db.select().from(outlets).where(eq(outlets.id, id));
    return outlet || undefined;
  }

  async createOutlet(outletData: InsertOutlet): Promise<Outlet> {
    const [outlet] = await db
      .insert(outlets)
      .values(outletData)
      .returning();
    return outlet;
  }

  async getOutletByOwnerId(ownerId: string): Promise<Outlet | undefined> {
    const [outlet] = await db.select().from(outlets).where(eq(outlets.ownerId, ownerId));
    return outlet || undefined;
  }

  async updateOutletChillPeriod(id: string, isChillPeriod: boolean, endsAt?: Date): Promise<void> {
    await db
      .update(outlets)
      .set({ isChillPeriod, chillPeriodEndsAt: endsAt || null })
      .where(eq(outlets.id, id));
  }

  async updateOutletActiveOrders(id: string, count: number): Promise<void> {
    await db
      .update(outlets)
      .set({ activeOrdersCount: count })
      .where(eq(outlets.id, id));
  }

  // ===== DISH OPERATIONS =====
  
  async getDishes(outletId: string): Promise<Dish[]> {
    return await db
      .select()
      .from(dishes)
      .where(eq(dishes.outletId, outletId))
      .orderBy(dishes.category, desc(dishes.orderCount));
  }

  async getDish(id: string): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    return dish || undefined;
  }

  async createDish(dishData: InsertDish): Promise<Dish> {
    const [dish] = await db
      .insert(dishes)
      .values(dishData)
      .returning();
    return dish;
  }

  async getDishById(id: string): Promise<Dish | undefined> {
    const [dish] = await db.select().from(dishes).where(eq(dishes.id, id));
    return dish || undefined;
  }

  async updateDish(id: string, dishData: Partial<InsertDish>): Promise<Dish> {
    const [dish] = await db
      .update(dishes)
      .set(dishData)
      .where(eq(dishes.id, id))
      .returning();
    return dish;
  }

  async deleteDish(id: string): Promise<void> {
    await db.delete(dishes).where(eq(dishes.id, id));
  }

  async getTrendingDishes(limit: number = 20): Promise<Dish[]> {
    return await db
      .select()
      .from(dishes)
      .orderBy(desc(dishes.orderCount))
      .limit(limit);
  }

  async getUserComfortFood(userId: string, limit: number = 10): Promise<Dish[]> {
    // Get dishes from user's past orders, ordered by frequency
    const result = await db
      .select({
        dish: dishes,
        orderCount: sql<number>`count(${orderItems.id})::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
      .where(eq(orders.userId, userId))
      .groupBy(dishes.id)
      .orderBy(desc(sql`count(${orderItems.id})`))
      .limit(limit);

    return result.map(r => r.dish);
  }

  async incrementDishOrderCount(dishId: string): Promise<void> {
    await db
      .update(dishes)
      .set({ orderCount: sql`${dishes.orderCount} + 1` })
      .where(eq(dishes.id, dishId));
  }

  // ===== ORDER OPERATIONS =====
  
  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const qrCode = `ORDER-${randomUUID()}`;
    const estimatedReadyTime = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

    const [order] = await db
      .insert(orders)
      .values({
        ...orderData,
        qrCode,
        estimatedReadyTime,
        status: "pending", // Orders start as pending, outlet must confirm
      })
      .returning();

    // Insert order items
    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({
        ...item,
        orderId: order.id,
      }));
      await db.insert(orderItems).values(itemsWithOrderId);

      // Increment dish order counts
      for (const item of items) {
        await this.incrementDishOrderCount(item.dishId);
      }
    }

    // Update outlet active orders
    const outlet = await this.getOutlet(order.outletId);
    if (outlet) {
      await this.updateOutletActiveOrders(
        order.outletId,
        outlet.activeOrdersCount + 1
      );

      // Auto chill period if threshold reached
      if (outlet.activeOrdersCount + 1 >= outlet.maxActiveOrders) {
        const chillEndsAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await this.updateOutletChillPeriod(order.outletId, true, chillEndsAt);
      }
    }

    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOutletOrders(outletId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.outletId, outletId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const updates: any = { status };
    
    if (status === "completed" || status === "cancelled") {
      updates.completedAt = new Date();
      
      // Decrease outlet active orders
      const order = await this.getOrder(id);
      if (order) {
        const outlet = await this.getOutlet(order.outletId);
        if (outlet && outlet.activeOrdersCount > 0) {
          await this.updateOutletActiveOrders(
            order.outletId,
            outlet.activeOrdersCount - 1
          );
        }
      }
    }

    await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id));
  }

  // ===== GROUP ORDER OPERATIONS =====
  
  async createGroupOrder(groupOrderData: InsertGroupOrder): Promise<GroupOrder> {
    const shareLink = `GROUP-${randomUUID().substring(0, 8)}`;
    
    const [groupOrder] = await db
      .insert(groupOrders)
      .values({
        ...groupOrderData,
        shareLink,
        status: "open",
      })
      .returning();

    return groupOrder;
  }

  async getGroupOrder(id: string): Promise<GroupOrder | undefined> {
    const [groupOrder] = await db
      .select()
      .from(groupOrders)
      .where(eq(groupOrders.id, id));
    return groupOrder || undefined;
  }

  async getGroupOrderByLink(shareLink: string): Promise<GroupOrder | undefined> {
    const [groupOrder] = await db
      .select()
      .from(groupOrders)
      .where(eq(groupOrders.shareLink, shareLink));
    return groupOrder || undefined;
  }

  async updateGroupOrderStatus(id: string, status: string): Promise<void> {
    const updates: any = { status };
    if (status === "closed") {
      updates.closedAt = new Date();
    }
    await db
      .update(groupOrders)
      .set(updates)
      .where(eq(groupOrders.id, id));
  }

  // ===== RATING OPERATIONS =====
  
  async createRating(ratingData: InsertRating): Promise<void> {
    const tokensEarned = 5;

    // Insert rating
    await db.insert(ratings).values({
      ...ratingData,
      tokensEarned,
    });

    // Update user tokens
    const user = await this.getUser(ratingData.userId);
    if (user) {
      await this.updateUserTokens(ratingData.userId, user.tokens + tokensEarned);
    }

    // Update outlet rating
    const outletRatings = await db
      .select()
      .from(ratings)
      .where(eq(ratings.outletId, ratingData.outletId));

    const avgRating = outletRatings.reduce((sum, r) => sum + r.rating, 0) / outletRatings.length;

    await db
      .update(outlets)
      .set({
        rating: avgRating.toFixed(2),
        totalRatings: outletRatings.length,
      })
      .where(eq(outlets.id, ratingData.outletId));
  }

  async getOrderRating(orderId: string): Promise<any> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(eq(ratings.orderId, orderId));
    return rating || null;
  }

  // ===== REWARD OPERATIONS =====
  
  async ensureDefaultRewards(): Promise<void> {
    const existing = await db.select().from(rewards);
    if (existing.length > 0) return;

    const defaults: InsertReward[] = [
      { type: "discount", title: "10% Off", description: "Get 10% off your next order", value: 10, probability: 35 },
      { type: "discount", title: "20% Off", description: "Save 20% on your next meal", value: 20, probability: 20 },
      { type: "offer", title: "Free Drink", description: "Free soft drink with any meal", value: 1, probability: 18 },
      { type: "offer", title: "Free Dessert", description: "Enjoy a free dessert on us", value: 1, probability: 12 },
      { type: "discount", title: "30% Off", description: "Big savings on your next order", value: 30, probability: 8 },
      { type: "offer", title: "Buy 1 Get 1 50% Off", description: "On select items", value: 1, probability: 7 },
    ];

    await db.insert(rewards).values(defaults as any);
  }

  async getRewards(): Promise<Reward[]> {
    await this.ensureDefaultRewards();
    return await db.select().from(rewards);
  }

  async spinRewardWheel(userId: string): Promise<Reward> {
    const spinCost = 20;
    const user = await this.getUser(userId);
    
    if (!user || user.tokens < spinCost) {
      throw new Error("Insufficient tokens");
    }

    // Deduct tokens
    await this.updateUserTokens(userId, user.tokens - spinCost);

    // Get all rewards and pick based on probability
    const allRewards = await this.getRewards();
    const totalProbability = allRewards.reduce((sum, r) => sum + r.probability, 0);
    const random = Math.random() * totalProbability;

    let cumulative = 0;
    for (const reward of allRewards) {
      cumulative += reward.probability;
      if (random <= cumulative) {
        // Create reward claim
        await db.insert(rewardClaims).values({
          userId,
          rewardId: reward.id,
          tokensSpent: spinCost,
        });
        return reward;
      }
    }

    return allRewards[0]; // Fallback
  }

  async getUserRewardClaims(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(rewardClaims)
      .where(eq(rewardClaims.userId, userId))
      .orderBy(desc(rewardClaims.createdAt));
  }

  // ===== CHALLENGE OPERATIONS =====
  
  async getChallenges(): Promise<Challenge[]> {
    return await db
      .select()
      .from(challenges)
      .where(eq(challenges.isActive, true));
  }

  async getUserChallengeProgress(userId: string): Promise<any[]> {
    // For now, return progress based on order count
    const userOrders = await this.getUserOrders(userId);
    const activeChallenges = await this.getChallenges();

    return activeChallenges.map(challenge => ({
      challengeId: challenge.id,
      progress: Math.min(userOrders.length, challenge.requirement),
    }));
  }

  // ===== BADGE OPERATIONS =====
  
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserBadges(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    // Check if already awarded
    const existing = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

    if (existing.length === 0) {
      await db.insert(userBadges).values({ userId, badgeId });
    }
  }

  // ===== LEADERBOARD =====
  
  async getLeaderboard(limit: number = 50): Promise<any[]> {
    const result = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        tokens: users.tokens,
        orderCount: sql<number>`count(${orders.id})::int`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(users.id)
      .orderBy(desc(users.tokens))
      .limit(limit);

    return result.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  // ===== ADMIN ANALYTICS =====

  async getPlatformAnalytics() {
    // Use separate queries to avoid Cartesian product issues
    const [userStats] = await db
      .select({
        totalUsers: sql<number>`count(*)::int`,
        totalStudents: sql<number>`count(CASE WHEN ${users.role} = 'student' THEN 1 END)::int`,
      })
      .from(users);

    const [universityStats] = await db
      .select({
        totalUniversities: sql<number>`count(*)::int`,
      })
      .from(universities);

    const [outletStats] = await db
      .select({
        totalOutlets: sql<number>`count(*)::int`,
      })
      .from(outlets);

    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::numeric`,
      })
      .from(orders);

    return {
      totalUsers: userStats.totalUsers,
      totalStudents: userStats.totalStudents,
      totalUniversities: universityStats.totalUniversities,
      totalOutlets: outletStats.totalOutlets,
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
    };
  }

  async getUniversityStats(universityId: string) {
    // Use separate queries to avoid issues with zero outlets/students
    const [outletStats] = await db
      .select({
        outletCount: sql<number>`count(*)::int`,
      })
      .from(outlets)
      .where(eq(outlets.universityId, universityId));

    const [studentStats] = await db
      .select({
        studentCount: sql<number>`count(*)::int`,
      })
      .from(users)
      .where(and(
        eq(users.role, 'student'),
        eq(users.universityId, universityId)
      ));

    const [orderStats] = await db
      .select({
        orderCount: sql<number>`count(distinct ${orders.id})::int`,
      })
      .from(orders)
      .innerJoin(outlets, eq(orders.outletId, outlets.id))
      .where(eq(outlets.universityId, universityId));

    return {
      outletCount: outletStats.outletCount || 0,
      studentCount: studentStats.studentCount || 0,
      orderCount: orderStats.orderCount || 0,
    };
  }

  async getUniversityOutletSales(
    universityId: string,
    start?: Date,
    end?: Date
  ): Promise<Array<{ outletId: string; outletName: string; totalOrders: number; totalRevenue: number }>> {
    let whereExpr: any = eq(outlets.universityId, universityId);
    if (start) {
      whereExpr = and(whereExpr, sql`${orders.createdAt} >= ${start}`);
    }
    if (end) {
      whereExpr = and(whereExpr, sql`${orders.createdAt} <= ${end}`);
    }

    const rows = await db
      .select({
        outletId: outlets.id,
        outletName: outlets.name,
        totalOrders: sql<number>`count(distinct ${orders.id})::int`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::numeric`,
      })
      .from(orders)
      .innerJoin(outlets, eq(orders.outletId, outlets.id))
      .where(whereExpr)
      .groupBy(outlets.id, outlets.name)
      .orderBy(desc(sql`COALESCE(SUM(${orders.totalAmount}), 0)`));

    return rows.map(r => ({
      outletId: r.outletId,
      outletName: r.outletName as unknown as string,
      totalOrders: r.totalOrders,
      totalRevenue: r.totalRevenue as unknown as number,
    }));
  }
}

export const storage = new DatabaseStorage();
