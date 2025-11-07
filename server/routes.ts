import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ===== AUTH ROUTES =====
  
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== OUTLET ROUTES =====
  
  app.get('/api/outlets', async (req, res) => {
    try {
      const outlets = await storage.getOutlets();
      
      // Add dish count for each outlet
      const outletsWithDishCount = await Promise.all(
        outlets.map(async (outlet) => {
          const dishes = await storage.getDishes(outlet.id);
          return {
            ...outlet,
            dishCount: dishes.length,
          };
        })
      );
      
      res.json(outletsWithDishCount);
    } catch (error) {
      console.error("Error fetching outlets:", error);
      res.status(500).json({ message: "Failed to fetch outlets" });
    }
  });

  app.get('/api/outlets/:id', async (req, res) => {
    try {
      const outlet = await storage.getOutlet(req.params.id);
      if (!outlet) {
        return res.status(404).json({ message: "Outlet not found" });
      }
      res.json(outlet);
    } catch (error) {
      console.error("Error fetching outlet:", error);
      res.status(500).json({ message: "Failed to fetch outlet" });
    }
  });

  app.post('/api/outlets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const outlet = await storage.createOutlet({
        ...req.body,
        ownerId: userId,
      });
      res.json(outlet);
    } catch (error) {
      console.error("Error creating outlet:", error);
      res.status(500).json({ message: "Failed to create outlet" });
    }
  });

  // ===== DISH ROUTES =====
  
  app.get('/api/outlets/:id/dishes', async (req, res) => {
    try {
      const dishes = await storage.getDishes(req.params.id);
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ message: "Failed to fetch dishes" });
    }
  });

  app.get('/api/dishes/trending', async (req, res) => {
    try {
      const trending = await storage.getTrendingDishes(20);
      
      // Add outlet name
      const trendingWithOutlet = await Promise.all(
        trending.map(async (dish) => {
          const outlet = await storage.getOutlet(dish.outletId);
          return {
            ...dish,
            outletName: outlet?.name || 'Unknown',
          };
        })
      );
      
      res.json(trendingWithOutlet);
    } catch (error) {
      console.error("Error fetching trending dishes:", error);
      res.status(500).json({ message: "Failed to fetch trending dishes" });
    }
  });

  app.get('/api/dishes/comfort', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comfortFood = await storage.getUserComfortFood(userId, 10);
      
      // Add outlet name and order count
      const comfortFoodWithDetails = await Promise.all(
        comfortFood.map(async (dish) => {
          const outlet = await storage.getOutlet(dish.outletId);
          return {
            ...dish,
            outletName: outlet?.name || 'Unknown',
          };
        })
      );
      
      res.json(comfortFoodWithDetails);
    } catch (error) {
      console.error("Error fetching comfort food:", error);
      res.status(500).json({ message: "Failed to fetch comfort food" });
    }
  });

  app.post('/api/dishes', isAuthenticated, async (req, res) => {
    try {
      const dish = await storage.createDish(req.body);
      res.json(dish);
    } catch (error) {
      console.error("Error creating dish:", error);
      res.status(500).json({ message: "Failed to create dish" });
    }
  });

  // ===== ORDER ROUTES =====
  
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOrders(userId);
      
      // Add outlet name and item count
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const outlet = await storage.getOutlet(order.outletId);
          // Count items would require a separate query - simplified for now
          return {
            ...order,
            outletName: outlet?.name || 'Unknown',
            itemCount: 1, // Simplified
          };
        })
      );
      
      res.json(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items, specialInstructions, totalAmount, outletId, groupOrderId } = req.body;
      
      const order = await storage.createOrder(
        {
          userId,
          outletId,
          groupOrderId,
          specialInstructions,
          totalAmount,
        },
        items
      );
      
      // Check if user earned "First Bite" badge
      const userOrders = await storage.getUserOrders(userId);
      if (userOrders.length === 1) {
        // Award first order badge
        const badges = await storage.getBadges();
        const firstBiteBadge = badges.find(b => b.name === "First Bite");
        if (firstBiteBadge) {
          await storage.awardBadge(userId, firstBiteBadge.id);
        }
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateOrderStatus(req.params.id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // ===== GROUP ORDER ROUTES =====
  
  app.post('/api/group-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupOrder = await storage.createGroupOrder({
        ...req.body,
        creatorId: userId,
      });
      res.json(groupOrder);
    } catch (error) {
      console.error("Error creating group order:", error);
      res.status(500).json({ message: "Failed to create group order" });
    }
  });

  app.get('/api/group-orders/:link', async (req, res) => {
    try {
      const groupOrder = await storage.getGroupOrderByLink(req.params.link);
      if (!groupOrder) {
        return res.status(404).json({ message: "Group order not found" });
      }
      res.json(groupOrder);
    } catch (error) {
      console.error("Error fetching group order:", error);
      res.status(500).json({ message: "Failed to fetch group order" });
    }
  });

  // ===== RATING ROUTES =====
  
  app.post('/api/ratings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.createRating({
        ...req.body,
        userId,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(500).json({ message: "Failed to create rating" });
    }
  });

  // ===== REWARD ROUTES =====
  
  app.get('/api/rewards', async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards/spin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reward = await storage.spinRewardWheel(userId);
      res.json(reward);
    } catch (error: any) {
      console.error("Error spinning wheel:", error);
      res.status(400).json({ message: error.message || "Failed to spin wheel" });
    }
  });

  app.get('/api/rewards/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const claims = await storage.getUserRewardClaims(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching reward claims:", error);
      res.status(500).json({ message: "Failed to fetch reward claims" });
    }
  });

  // ===== CHALLENGE ROUTES =====
  
  app.get('/api/challenges', async (req, res) => {
    try {
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserChallengeProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching challenge progress:", error);
      res.status(500).json({ message: "Failed to fetch challenge progress" });
    }
  });

  // ===== BADGE ROUTES =====
  
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/badges/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // ===== LEADERBOARD ROUTES =====
  
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard(50);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ===== OUTLET DASHBOARD ROUTES (for outlet owners) =====
  
  app.get('/api/outlet-dashboard/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get outlets owned by user
      const allOutlets = await storage.getOutlets();
      const userOutlets = allOutlets.filter(o => o.ownerId === userId);
      
      if (userOutlets.length === 0) {
        return res.json([]);
      }
      
      // Get orders for user's outlets
      const orders = await storage.getOutletOrders(userOutlets[0].id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching outlet orders:", error);
      res.status(500).json({ message: "Failed to fetch outlet orders" });
    }
  });

  app.patch('/api/outlet-dashboard/chill-period', isAuthenticated, async (req: any, res) => {
    try {
      const { outletId, isChillPeriod, duration } = req.body;
      const endsAt = isChillPeriod ? new Date(Date.now() + duration * 60 * 1000) : undefined;
      await storage.updateOutletChillPeriod(outletId, isChillPeriod, endsAt);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating chill period:", error);
      res.status(500).json({ message: "Failed to update chill period" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
