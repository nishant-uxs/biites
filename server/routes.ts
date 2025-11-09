import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { GeminiService } from "./geminiService";
import bcrypt from "bcrypt";

// Helper function to generate unique credentials
function generateUniqueId(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Role-based middleware
const isAppAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.id);
  if (user?.role !== "app_admin") {
    return res.status(403).json({ message: "Forbidden: App admin access required" });
  }
  req.dbUser = user;
  next();
};

const isUniversityAdmin = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.id);
  if (user?.role !== "university_admin" && user?.role !== "app_admin") {
    return res.status(403).json({ message: "Forbidden: University admin access required" });
  }
  req.dbUser = user;
  next();
};

const isOutletOwner = async (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.user.id);
  if (user?.role !== "outlet_owner" && user?.role !== "app_admin") {
    return res.status(403).json({ message: "Forbidden: Outlet owner access required" });
  }
  req.dbUser = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ===== AUTH ROUTES =====
  
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch('/api/auth/user/university', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { universityId } = req.body;
      
      const user = await storage.getUser(userId);
      
      // Security: Only students can set university, and only once
      if (user?.role !== "student") {
        return res.status(403).json({ message: "Only students can select university" });
      }
      
      if (user.universityId) {
        return res.status(403).json({ message: "University already set and cannot be changed" });
      }
      
      // Validate university exists
      const university = await storage.getUniversity(universityId);
      if (!university) {
        return res.status(404).json({ message: "Invalid university" });
      }
      
      await storage.updateUserUniversity(userId, universityId);
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user university:", error);
      res.status(500).json({ message: "Failed to update university" });
    }
  });

  // ===== UNIVERSITY ROUTES =====
  
  app.get('/api/universities', async (req, res) => {
    try {
      const universities = await storage.getUniversities();
      res.json(universities);
    } catch (error) {
      console.error("Error fetching universities:", error);
      res.status(500).json({ message: "Failed to fetch universities" });
    }
  });

  app.get('/api/universities/:id', async (req, res) => {
    try {
      const university = await storage.getUniversity(req.params.id);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      res.json(university);
    } catch (error) {
      console.error("Error fetching university:", error);
      res.status(500).json({ message: "Failed to fetch university" });
    }
  });

  app.post('/api/admin/universities', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      // Create university
      const university = await storage.createUniversity(req.body);
      
      // Generate unique credentials for university admin
      const uniqueId = generateUniqueId(6);
      const adminEmail = `admin.${university.code?.toLowerCase() || university.id}.${uniqueId}@campus.edu`;
      const adminPassword = generatePassword(16); // Increased to 16 for security
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      console.log(`[University Admin Created]: ${adminEmail}`);
      
      // Create university admin user
      const adminUser = await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: "University",
        lastName: "Admin",
        role: "university_admin",
      });
      
      // Set university for admin
      await storage.updateUserUniversity(adminUser.id, university.id);
      
      // Return university and credentials (password only shown once)
      res.json({
        university,
        credentials: {
          email: adminEmail,
          password: adminPassword, // Plain password for display
          userId: adminUser.id,
        }
      });
    } catch (error) {
      console.error("Error creating university:", error);
      res.status(500).json({ message: "Failed to create university" });
    }
  });

  app.get('/api/admin/analytics', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getPlatformAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching platform analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/universities/:id/stats', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getUniversityStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching university stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/universities/:id/outlets', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const outlets = await storage.getOutlets(req.params.id);
      res.json(outlets);
    } catch (error) {
      console.error("Error fetching university outlets:", error);
      res.status(500).json({ message: "Failed to fetch outlets" });
    }
  });

  // Get university admin details (email only, no password)
  app.get('/api/admin/universities/:id/admin', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const universityId = req.params.id;
      const adminUser = await storage.getUserByUniversityAndRole(universityId, 'university_admin');
      
      if (!adminUser) {
        return res.status(404).json({ message: "University admin not found" });
      }
      
      // Return safe user data (no password)
      res.json({
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        universityId: adminUser.universityId,
        createdAt: adminUser.createdAt,
      });
    } catch (error) {
      console.error("Error fetching university admin:", error);
      res.status(500).json({ message: "Failed to fetch university admin" });
    }
  });

  // Reset university admin password
  app.patch('/api/admin/universities/:id/admin/reset-password', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const universityId = req.params.id;
      const adminUser = await storage.getUserByUniversityAndRole(universityId, 'university_admin');
      
      if (!adminUser) {
        return res.status(404).json({ message: "University admin not found" });
      }
      
      // Generate new password
      const newPassword = generatePassword(16);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      console.log(`[Password Reset] University Admin: ${adminUser.email}`);
      
      // Update password
      await storage.updateUserPassword(adminUser.id, hashedPassword);
      
      res.json({
        email: adminUser.email,
        password: newPassword, // Return plain password (shown once)
        userId: adminUser.id,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Delete university (with cascade)
  app.delete('/api/admin/universities/:id', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const universityId = req.params.id;
      
      // Check if university exists
      const university = await storage.getUniversity(universityId);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      
      console.log(`[Delete University] Deleting: ${university.name} (${universityId})`);
      
      // Delete university (cascade will handle outlets, dishes, etc.)
      await storage.deleteUniversity(universityId);
      
      res.json({ message: "University deleted successfully" });
    } catch (error) {
      console.error("Error deleting university:", error);
      res.status(500).json({ message: "Failed to delete university" });
    }
  });

  // ===== ADMIN USER MANAGEMENT =====
  
  app.get('/api/admin/users', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      // Return users with sensitive data (password) excluded
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        universityId: user.universityId,
        tokens: user.tokens,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isAppAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      
      // Prevent deleting your own account
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ===== OUTLET ROUTES =====
  
  app.get('/api/outlets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Security: Users without university cannot access outlets
      if (user?.role !== "app_admin" && !user?.universityId) {
        return res.json([]); // Return empty array for students without university
      }
      
      // Filter outlets by user's university (students only see their campus)
      const universityId = user?.role === "app_admin" ? undefined : user?.universityId;
      const outlets = await storage.getOutlets(universityId || undefined);
      
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

  app.get('/api/outlets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      const outlet = await storage.getOutlet(req.params.id);
      if (!outlet) {
        return res.status(404).json({ message: "Outlet not found" });
      }
      
      // Security: Verify user can access this outlet's university
      if (user?.role !== "app_admin") {
        if (!user?.universityId || outlet.universityId !== user.universityId) {
          return res.status(403).json({ message: "Access denied to this outlet" });
        }
      }
      
      res.json(outlet);
    } catch (error) {
      console.error("Error fetching outlet:", error);
      res.status(500).json({ message: "Failed to fetch outlet" });
    }
  });

  app.post('/api/outlets', isAuthenticated, isUniversityAdmin, async (req: any, res) => {
    try {
      const user = req.dbUser;
      
      // Security: Determine universityId based on role
      let universityId: string | undefined;
      
      if (user.role === "app_admin") {
        // App admin can create for any university, but must provide valid ID
        universityId = req.body.universityId;
        if (!universityId) {
          return res.status(400).json({ message: "University ID required for app admin" });
        }
        // Validate university exists
        const university = await storage.getUniversity(universityId);
        if (!university) {
          return res.status(404).json({ message: "Invalid university" });
        }
      } else if (user.role === "university_admin") {
        // University admin can ONLY create for their own university
        universityId = user.universityId;
        if (!universityId) {
          return res.status(400).json({ message: "University admin must have assigned university" });
        }
        // Reject any attempt to create for different university
        if (req.body.universityId && req.body.universityId !== universityId) {
          return res.status(403).json({ message: "Cannot create outlet for different university" });
        }
      } else {
        return res.status(403).json({ message: "Invalid role for outlet creation" });
      }
      
      // Generate unique credentials for outlet owner
      const uniqueId = generateUniqueId(6);
      const ownerEmail = `owner.${req.body.name.toLowerCase().replace(/\s+/g, '')}.${uniqueId}@campus.edu`;
      const ownerPassword = generatePassword(12);
      const hashedPassword = await bcrypt.hash(ownerPassword, 10);
      
      // Create outlet owner user
      const ownerUser = await storage.createUser({
        email: ownerEmail,
        password: hashedPassword,
        firstName: "Outlet",
        lastName: "Owner",
        role: "outlet_owner",
      });
      
      // Set university for owner
      await storage.updateUserUniversity(ownerUser.id, universityId!);
      
      // Create outlet with owner ID
      const outlet = await storage.createOutlet({
        name: req.body.name,
        description: req.body.description,
        imageUrl: req.body.imageUrl || null,
        averagePrice: req.body.averagePrice,
        maxActiveOrders: req.body.maxActiveOrders || 10,
        ownerId: ownerUser.id,
        universityId,
      });
      
      // Return outlet and credentials (password only shown once)
      res.json({
        outlet,
        credentials: {
          email: ownerEmail,
          password: ownerPassword, // Plain password for display
          userId: ownerUser.id,
        }
      });
    } catch (error) {
      console.error("Error creating outlet:", error);
      res.status(500).json({ message: "Failed to create outlet" });
    }
  });

  // ===== DISH ROUTES =====
  
  app.get('/api/outlets/:id/dishes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Security: Verify outlet belongs to user's university
      const outlet = await storage.getOutlet(req.params.id);
      if (!outlet) {
        return res.status(404).json({ message: "Outlet not found" });
      }
      
      if (user?.role !== "app_admin") {
        if (!user?.universityId || outlet.universityId !== user.universityId) {
          return res.status(403).json({ message: "Access denied to this outlet" });
        }
      }
      
      const dishes = await storage.getDishes(req.params.id);
      res.json(dishes);
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ message: "Failed to fetch dishes" });
    }
  });

  app.get('/api/dishes/trending', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Only fetch trending dishes from user's university or all if app_admin
      const universityId = user?.role === "app_admin" ? undefined : user?.universityId;
      if (!universityId && user?.role !== "app_admin") {
        return res.json([]); // No university = no dishes for students
      }
      
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
      const userId = req.user.id;
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

  app.put('/api/dishes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const dishId = req.params.id;
      const userId = req.user.id;
      
      // Verify ownership - outlet owner can only edit their own dishes
      const dish = await storage.getDishById(dishId);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      
      const outlet = await storage.getOutlet(dish.outletId);
      if (!outlet || (outlet.ownerId !== userId && req.user.role !== 'app_admin')) {
        return res.status(403).json({ message: "Not authorized to edit this dish" });
      }
      
      const updatedDish = await storage.updateDish(dishId, req.body);
      res.json(updatedDish);
    } catch (error) {
      console.error("Error updating dish:", error);
      res.status(500).json({ message: "Failed to update dish" });
    }
  });

  app.delete('/api/dishes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const dishId = req.params.id;
      const userId = req.user.id;
      
      // Verify ownership - outlet owner can only delete their own dishes
      const dish = await storage.getDishById(dishId);
      if (!dish) {
        return res.status(404).json({ message: "Dish not found" });
      }
      
      const outlet = await storage.getOutlet(dish.outletId);
      if (!outlet || (outlet.ownerId !== userId && req.user.role !== 'app_admin')) {
        return res.status(403).json({ message: "Not authorized to delete this dish" });
      }
      
      await storage.deleteDish(dishId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dish:", error);
      res.status(500).json({ message: "Failed to delete dish" });
    }
  });

  // ===== OUTLET OWNER ROUTES =====

  // Get outlet owner's own outlet
  app.get('/api/outlet/my', isAuthenticated, isOutletOwner, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const outlet = await storage.getOutletByOwnerId(userId);
      
      if (!outlet) {
        return res.status(404).json({ message: "No outlet found for this owner" });
      }
      
      res.json(outlet);
    } catch (error) {
      console.error("Error fetching outlet:", error);
      res.status(500).json({ message: "Failed to fetch outlet" });
    }
  });

  // Get orders for an outlet
  app.get('/api/outlet/:id/orders', isAuthenticated, async (req: any, res) => {
    try {
      const outletId = req.params.id;
      const userId = req.user.id;
      
      // Verify ownership - outlet owner can only see their own orders
      const outlet = await storage.getOutlet(outletId);
      if (!outlet || (outlet.ownerId !== userId && req.user.role !== 'app_admin')) {
        return res.status(403).json({ message: "Not authorized to view these orders" });
      }
      
      const orders = await storage.getOutletOrders(outletId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching outlet orders:", error);
      res.status(500).json({ message: "Failed to fetch outlet orders" });
    }
  });

  // Toggle outlet chill period
  app.patch('/api/outlets/:id/chill-period', isAuthenticated, async (req: any, res) => {
    try {
      const outletId = req.params.id;
      const userId = req.user.id;
      const { isChillPeriod } = req.body;
      
      // Verify ownership - outlet owner can only update their own outlet
      const outlet = await storage.getOutlet(outletId);
      if (!outlet || (outlet.ownerId !== userId && req.user.role !== 'app_admin')) {
        return res.status(403).json({ message: "Not authorized to update this outlet" });
      }
      
      await storage.updateOutletChillPeriod(outletId, isChillPeriod, undefined);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating chill period:", error);
      res.status(500).json({ message: "Failed to update chill period" });
    }
  });

  // ===== ORDER ROUTES =====
  
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // Update order status (outlet owner only)
  app.patch('/api/orders/:id/status', isAuthenticated, isOutletOwner, async (req: any, res) => {
    try {
      const { status } = req.body;
      const orderId = req.params.id;
      
      // Get current order to validate
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if outlet owner owns this order's outlet
      const outlet = await storage.getOutletByOwnerId(req.dbUser.id);
      if (!outlet || outlet.id !== order.outletId) {
        return res.status(403).json({ message: "Not authorized to update this order" });
      }
      
      // Define valid status transitions
      const validTransitions: Record<string, string[]> = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['completed', 'cancelled'],
        'completed': [], // No transitions from completed
        'cancelled': []  // No transitions from cancelled
      };
      
      const currentStatus = order.status;
      const allowedNextStatuses = validTransitions[currentStatus] || [];
      
      if (!allowedNextStatuses.includes(status)) {
        return res.status(400).json({ 
          message: `Invalid status transition from '${currentStatus}' to '${status}'`,
          allowedStatuses: allowedNextStatuses
        });
      }
      
      await storage.updateOrderStatus(orderId, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Scan student QR code (outlet owner only) and confirm pickup
  app.post('/api/orders/scan-qr', isAuthenticated, isOutletOwner, async (req: any, res) => {
    try {
      const { qrCode, outletId } = req.body;
      const userId = req.user.id;
      
      if (!qrCode || !outletId) {
        return res.status(400).json({ message: "QR code and outlet ID required" });
      }
      
      // Verify outlet ownership
      const outlet = await storage.getOutlet(outletId);
      if (!outlet || outlet.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to scan for this outlet" });
      }
      
      // Find order by QR code and outlet
      const orders = await storage.getOutletOrders(outletId);
      const order = orders.find(o => o.qrCode === qrCode);
      
      if (!order) {
        return res.status(404).json({ 
          message: "Invalid QR code or order not found for this outlet" 
        });
      }
      
      // Order must be ready for pickup
      if (order.status !== 'ready') {
        return res.status(400).json({ 
          message: `Order is not ready yet. Current status: ${order.status}`,
          currentStatus: order.status
        });
      }
      
      // Mark order as completed
      await storage.updateOrderStatus(order.id, 'completed');
      
      res.json({ 
        success: true, 
        message: "Pickup confirmed successfully!",
        orderId: order.id
      });
    } catch (error) {
      console.error("Error scanning QR code:", error);
      res.status(500).json({ message: "Failed to process QR scan" });
    }
  });

  // ===== GROUP ORDER ROUTES =====
  
  app.post('/api/group-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
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
  
  app.get('/api/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // TODO: Implement university-scoped rewards
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  app.post('/api/rewards/spin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reward = await storage.spinRewardWheel(userId);
      res.json(reward);
    } catch (error: any) {
      console.error("Error spinning wheel:", error);
      res.status(400).json({ message: error.message || "Failed to spin wheel" });
    }
  });

  app.get('/api/rewards/claims', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const claims = await storage.getUserRewardClaims(userId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching reward claims:", error);
      res.status(500).json({ message: "Failed to fetch reward claims" });
    }
  });

  // ===== CHALLENGE ROUTES =====
  
  app.get('/api/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // TODO: Implement university-scoped challenges
      const challenges = await storage.getChallenges();
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getUserChallengeProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching challenge progress:", error);
      res.status(500).json({ message: "Failed to fetch challenge progress" });
    }
  });

  // ===== BADGE ROUTES =====
  
  app.get('/api/badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all available badges
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get('/api/badges/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // ===== LEADERBOARD ROUTES =====
  
  app.get('/api/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Get leaderboard - for students, only their campus; for admins, all
      // TODO: Implement university-scoped leaderboard in storage layer
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
      const userId = req.user.id;
      
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

  // ===== OBJECT STORAGE ROUTES =====

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.post("/api/objects/set-acl", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { objectURL, visibility } = req.body;

      if (!objectURL) {
        return res.status(400).json({ error: "objectURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        objectURL,
        {
          owner: userId,
          visibility: visibility || "public",
        }
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting object ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ===== OBJECT STORAGE ROUTES (Alternative endpoint for compatibility) =====

  app.post("/api/object-storage/upload-url", isAuthenticated, async (req: any, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadUrl: uploadURL });
  });

  // ===== MENU EXTRACTION ROUTES =====

  app.post("/api/menu/extract", isAuthenticated, async (req: any, res) => {
    try {
      const { menuImageUrl } = req.body;

      if (!menuImageUrl) {
        return res.status(400).json({ error: "menuImageUrl is required" });
      }

      const geminiService = new GeminiService();
      const result = await geminiService.extractMenuFromImage(menuImageUrl);

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ dishes: result.dishes });
    } catch (error) {
      console.error("Error extracting menu:", error);
      res.status(500).json({ error: "Failed to extract menu from image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
