import { db } from "./db";
import { users } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting database seed...");

  const defaultPassword = await bcrypt.hash("password123", 10);
  console.log("✅ Password hashed");

  try {
    console.log("Creating test accounts for authentication...");
    await db
      .insert(users)
      .values([
        {
          id: "app-admin",
          email: "admin@test.com",
          password: defaultPassword,
          firstName: "App",
          lastName: "Admin",
          role: "app_admin",
          universityId: null,
          tokens: 0,
        },
        {
          email: "student@test.com",
          password: defaultPassword,
          firstName: "Test",
          lastName: "Student",
          role: "student",
          universityId: null,
          tokens: 0,
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Test accounts created successfully!");
    console.log("   - App Admin: admin@test.com / password123");
    console.log("   - Student: student@test.com / password123");
    console.log("");
    console.log("Note: University admins and outlet owners will be created through the admin dashboard.");
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
