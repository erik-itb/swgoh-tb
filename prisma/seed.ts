import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// For local development, use standard Prisma client with SQLite
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default super admin user
  const adminUsername = process.env.ADMIN_USERNAME || "superadmin";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme123";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Check if user exists first
  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  let admin;
  if (existingUser) {
    admin = await prisma.user.update({
      where: { username: adminUsername },
      data: {
        password: hashedPassword,
        role: "super_admin",
      },
    });
    console.log(`✅ Super admin user updated: ${admin.username}`);
  } else {
    admin = await prisma.user.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: "Super Admin",
        role: "super_admin",
      },
    });
    console.log(`✅ Super admin user created: ${admin.username}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
