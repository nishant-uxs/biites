import { db } from "./db";
import { users, universities, outlets, dishes, rewards, challenges, badges } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Hash the default password: password123
  const defaultPassword = await bcrypt.hash("password123", 10);
  console.log("✅ Password hashed");

  try {
    // Create Universities
    console.log("Creating universities...");
    await db
      .insert(universities)
      .values([
        {
          name: "IIT Delhi",
          location: "Hauz Khas, New Delhi",
          code: "IIT-DEL",
          imageUrl: null,
        },
        {
          name: "BITS Pilani",
          location: "Pilani, Rajasthan",
          code: "BITS-PIL",
          imageUrl: null,
        },
        {
          name: "Delhi University - North Campus",
          location: "North Campus, Delhi",
          code: "DU-NC",
          imageUrl: null,
        },
      ])
      .onConflictDoNothing();

    // Fetch universities to get IDs
    const allUniversities = await db.select().from(universities);
    const iitDelhi = allUniversities.find(u => u.code === "IIT-DEL");
    const bitsPilani = allUniversities.find(u => u.code === "BITS-PIL");
    const duNorthCampus = allUniversities.find(u => u.code === "DU-NC");

    const iitDelhiId = iitDelhi?.id;
    const bitsPilaniId = bitsPilani?.id;
    const duNorthCampusId = duNorthCampus?.id;

    // Create App Admin
    console.log("Creating app admin...");
    const [appAdmin] = await db
      .insert(users)
      .values({
        id: "app-admin",
        email: "admin@test.com",
        password: defaultPassword,
        firstName: "App",
        lastName: "Admin",
        role: "app_admin",
        universityId: null,
        tokens: 0,
      })
      .onConflictDoNothing()
      .returning();

    // Create University Admins
    console.log("Creating university admins...");
    const [iitAdmin, bitsAdmin] = await db
      .insert(users)
      .values([
        {
          id: "iit-admin",
          email: "universityadmin@test.com",
          password: defaultPassword,
          firstName: "IIT Delhi",
          lastName: "Admin",
          role: "university_admin",
          universityId: iitDelhiId,
          tokens: 0,
        },
        {
          id: "bits-admin",
          email: "bits.admin@test.com",
          password: defaultPassword,
          firstName: "BITS Pilani",
          lastName: "Admin",
          role: "university_admin",
          universityId: bitsPilaniId,
          tokens: 0,
        },
      ])
      .onConflictDoNothing()
      .returning();

    // Create Outlet Owners
    console.log("Creating outlet owners...");
    const [outletOwner1, outletOwner2, outletOwner3] = await db
      .insert(users)
      .values([
        {
          id: "owner-1",
          email: "outletowner@test.com",
          password: defaultPassword,
          firstName: "Canteen",
          lastName: "Owner",
          role: "outlet_owner",
          universityId: iitDelhiId,
          tokens: 0,
        },
        {
          id: "owner-2",
          email: "owner2@test.com",
          password: defaultPassword,
          firstName: "Mess",
          lastName: "Manager",
          role: "outlet_owner",
          universityId: iitDelhiId,
          tokens: 0,
        },
        {
          id: "owner-3",
          email: "owner3@test.com",
          password: defaultPassword,
          firstName: "Cafe",
          lastName: "Manager",
          role: "outlet_owner",
          universityId: bitsPilaniId,
          tokens: 0,
        },
      ])
      .onConflictDoNothing()
      .returning();

    // Create Test Student
    console.log("Creating test student...");
    await db
      .insert(users)
      .values({
        email: "student@test.com",
        password: defaultPassword,
        firstName: "Test",
        lastName: "Student",
        role: "student",
        universityId: null, // Will select university on first login
        tokens: 50,
      })
      .onConflictDoNothing();

    const owner1Id = outletOwner1?.id || "owner-1";
    const owner2Id = outletOwner2?.id || "owner-2";
    const owner3Id = outletOwner3?.id || "owner-3";

    // Create Outlets
    console.log("Creating outlets...");
    const [canteen1, canteen2, cafe1] = await db
      .insert(outlets)
      .values([
        {
          name: "North Campus Canteen",
          description: "Your go-to spot for delicious Indian meals at student-friendly prices",
          imageUrl: null,
          ownerId: owner1Id,
          universityId: iitDelhiId!,
          rating: "4.5",
          totalRatings: 150,
          averagePrice: 80,
          maxActiveOrders: 15,
          activeOrdersCount: 0,
          isChillPeriod: false,
        },
        {
          name: "South Block Mess",
          description: "Hearty meals and quick bites for students on the go",
          imageUrl: null,
          ownerId: owner2Id,
          universityId: iitDelhiId!,
          rating: "4.2",
          totalRatings: 98,
          averagePrice: 60,
          maxActiveOrders: 20,
          activeOrdersCount: 0,
          isChillPeriod: false,
        },
        {
          name: "Campus Cafe",
          description: "Premium coffee and snacks in a cozy ambiance",
          imageUrl: null,
          ownerId: owner3Id,
          universityId: bitsPilaniId!,
          rating: "4.7",
          totalRatings: 220,
          averagePrice: 120,
          maxActiveOrders: 10,
          activeOrdersCount: 0,
          isChillPeriod: false,
        },
      ])
      .returning();

    // Create Dishes
    console.log("Creating dishes...");
    await db.insert(dishes).values([
      // North Campus Canteen
      {
        outletId: canteen1.id,
        name: "Paneer Butter Masala",
        description: "Creamy tomato-based curry with soft paneer cubes",
        price: 90,
        category: "main_course",
        isVeg: true,
        isCustomizable: true,
        calories: 450,
        protein: 18,
        carbs: 35,
        sugar: 8,
        orderCount: 145,
      },
      {
        outletId: canteen1.id,
        name: "Chole Bhature",
        description: "Spicy chickpea curry with fluffy deep-fried bread",
        price: 70,
        category: "main_course",
        isVeg: true,
        isCustomizable: false,
        calories: 520,
        protein: 15,
        carbs: 68,
        sugar: 6,
        orderCount: 230,
      },
      {
        outletId: canteen1.id,
        name: "Veg Biryani",
        description: "Aromatic basmati rice with mixed vegetables and spices",
        price: 85,
        category: "main_course",
        isVeg: true,
        isCustomizable: true,
        calories: 380,
        protein: 12,
        carbs: 72,
        sugar: 4,
        orderCount: 189,
      },
      {
        outletId: canteen1.id,
        name: "Masala Dosa",
        description: "Crispy rice crepe filled with spiced potato filling",
        price: 60,
        category: "main_course",
        isVeg: true,
        isCustomizable: false,
        calories: 320,
        protein: 8,
        carbs: 55,
        sugar: 3,
        orderCount: 167,
      },
      {
        outletId: canteen1.id,
        name: "Samosa",
        description: "Crispy fried pastry filled with spiced potatoes and peas",
        price: 20,
        category: "snack",
        isVeg: true,
        isCustomizable: false,
        calories: 150,
        protein: 4,
        carbs: 22,
        sugar: 2,
        orderCount: 312,
      },
      {
        outletId: canteen1.id,
        name: "Gulab Jamun",
        description: "Soft milk dumplings soaked in sweet rose-flavored syrup",
        price: 30,
        category: "dessert",
        isVeg: true,
        isCustomizable: false,
        calories: 200,
        protein: 3,
        carbs: 35,
        sugar: 28,
        orderCount: 98,
      },

      // South Block Mess
      {
        outletId: canteen2.id,
        name: "Dal Tadka with Rice",
        description: "Yellow lentils tempered with spices served with steamed rice",
        price: 50,
        category: "main_course",
        isVeg: true,
        isCustomizable: false,
        calories: 280,
        protein: 12,
        carbs: 48,
        sugar: 2,
        orderCount: 156,
      },
      {
        outletId: canteen2.id,
        name: "Rajma Chawal",
        description: "Red kidney beans curry with steamed rice",
        price: 55,
        category: "main_course",
        isVeg: true,
        isCustomizable: false,
        calories: 310,
        protein: 14,
        carbs: 52,
        sugar: 3,
        orderCount: 198,
      },
      {
        outletId: canteen2.id,
        name: "Aloo Paratha",
        description: "Wheat flatbread stuffed with spiced potato filling",
        price: 40,
        category: "main_course",
        isVeg: true,
        isCustomizable: true,
        calories: 250,
        protein: 6,
        carbs: 38,
        sugar: 2,
        orderCount: 223,
      },
      {
        outletId: canteen2.id,
        name: "Vada Pav",
        description: "Spicy potato fritter in a soft bun with chutneys",
        price: 25,
        category: "snack",
        isVeg: true,
        isCustomizable: true,
        calories: 180,
        protein: 5,
        carbs: 28,
        sugar: 4,
        orderCount: 276,
      },
      {
        outletId: canteen2.id,
        name: "Chai",
        description: "Traditional Indian spiced tea with milk",
        price: 15,
        category: "beverage",
        isVeg: true,
        isCustomizable: true,
        calories: 80,
        protein: 2,
        carbs: 12,
        sugar: 10,
        orderCount: 445,
      },

      // Campus Cafe
      {
        outletId: cafe1.id,
        name: "Cold Coffee",
        description: "Refreshing iced coffee with a hint of sweetness",
        price: 80,
        category: "beverage",
        isVeg: true,
        isCustomizable: true,
        calories: 150,
        protein: 4,
        carbs: 20,
        sugar: 18,
        orderCount: 267,
      },
      {
        outletId: cafe1.id,
        name: "Cappuccino",
        description: "Espresso with steamed milk and foam",
        price: 100,
        category: "beverage",
        isVeg: true,
        isCustomizable: false,
        calories: 120,
        protein: 6,
        carbs: 12,
        sugar: 10,
        orderCount: 189,
      },
      {
        outletId: cafe1.id,
        name: "Chocolate Brownie",
        description: "Rich, fudgy chocolate brownie served warm",
        price: 90,
        category: "dessert",
        isVeg: true,
        isCustomizable: false,
        calories: 380,
        protein: 5,
        carbs: 48,
        sugar: 35,
        orderCount: 134,
      },
      {
        outletId: cafe1.id,
        name: "Veg Sandwich",
        description: "Grilled sandwich with fresh vegetables and cheese",
        price: 110,
        category: "snack",
        isVeg: true,
        isCustomizable: true,
        calories: 280,
        protein: 12,
        carbs: 35,
        sugar: 5,
        orderCount: 156,
      },
      {
        outletId: cafe1.id,
        name: "Pasta Arrabiata",
        description: "Spicy tomato-based pasta with herbs",
        price: 140,
        category: "main_course",
        isVeg: true,
        isCustomizable: true,
        calories: 420,
        protein: 14,
        carbs: 65,
        sugar: 8,
        orderCount: 112,
      },
    ]);

    // Create Rewards
    console.log("Creating rewards...");
    await db.insert(rewards).values([
      {
        title: "Free Samosa",
        description: "Get one samosa free at North Campus Canteen",
        type: "discount",
        value: "20",
        probability: 30,
      },
      {
        title: "₹50 Off",
        description: "₹50 discount on orders above ₹150",
        type: "discount",
        value: "50",
        probability: 20,
      },
      {
        title: "Free Chai",
        description: "Complimentary chai at any outlet",
        type: "free_item",
        value: "15",
        probability: 25,
      },
      {
        title: "₹100 Off",
        description: "₹100 discount on orders above ₹300",
        type: "discount",
        value: "100",
        probability: 10,
      },
      {
        title: "Better Luck!",
        description: "Don't worry, try again!",
        type: "none",
        value: "0",
        probability: 15,
      },
    ]);

    // Create Challenges
    console.log("Creating challenges...");
    await db.insert(challenges).values([
      {
        title: "Order Explorer",
        description: "Place 5 orders to complete this challenge",
        type: "weekly",
        requirement: 5,
        rewardTokens: 25,
        isActive: true,
      },
      {
        title: "Rate Master",
        description: "Rate 10 orders to help others choose better",
        type: "weekly",
        requirement: 10,
        rewardTokens: 30,
        isActive: true,
      },
      {
        title: "Early Bird",
        description: "Place 3 orders before 10 AM",
        type: "daily",
        requirement: 3,
        rewardTokens: 20,
        isActive: true,
      },
      {
        title: "Weekend Warrior",
        description: "Order 10 times on weekends",
        type: "weekly",
        requirement: 10,
        rewardTokens: 40,
        isActive: true,
      },
    ]);

    // Create Badges
    console.log("Creating badges...");
    await db.insert(badges).values([
      {
        name: "First Bite",
        description: "Placed your first order on Campus Biites",
        icon: "trophy",
        requirement: "Place your first order",
      },
      {
        name: "Foodie Explorer",
        description: "Ordered from 5 different outlets",
        icon: "map",
        requirement: "Order from 5 different outlets",
      },
      {
        name: "Review Hero",
        description: "Written 20 helpful reviews",
        icon: "star",
        requirement: "Write 20 reviews",
      },
      {
        name: "Token Master",
        description: "Earned 500 tokens",
        icon: "coins",
        requirement: "Earn 500 tokens",
      },
      {
        name: "Group Captain",
        description: "Created 10 group orders",
        icon: "users",
        requirement: "Create 10 group orders",
      },
    ]);

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
