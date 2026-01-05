import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET /api/users - List all users (super_admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    name: users.name,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users).orderBy(users.createdAt);

  return NextResponse.json(allUsers);
}

// POST /api/users - Create new user (super_admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, password, name, role = "admin" } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if username exists
    const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = nanoid();
    const now = new Date();

    await db.insert(users).values({
      id,
      username,
      password: hashedPassword,
      name: name || null,
      role: role === "super_admin" ? "super_admin" : "admin",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ 
      id,
      username,
      name,
      role: role === "super_admin" ? "super_admin" : "admin",
      createdAt: now,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
