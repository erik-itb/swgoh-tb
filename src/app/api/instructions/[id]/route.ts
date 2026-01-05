import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { instructions, videos } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single instruction
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const [instruction] = await db.select().from(instructions).where(eq(instructions.id, id)).limit(1);

    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction not found" },
        { status: 404 }
      );
    }

    const instructionVideos = await db.select().from(videos).where(eq(videos.instructionId, id)).orderBy(asc(videos.order));

    return NextResponse.json({ ...instruction, videos: instructionVideos });
  } catch (error) {
    console.error("Error fetching instruction:", error);
    return NextResponse.json(
      { error: "Failed to fetch instruction" },
      { status: 500 }
    );
  }
}

// UPDATE instruction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Require authentication for updating instructions
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { videos: videoList, ...instructionData } = body;

    // Delete existing videos
    await db.delete(videos).where(eq(videos.instructionId, id));

    // Update instruction
    await db.update(instructions).set({
      ...instructionData,
      updatedAt: new Date(),
    }).where(eq(instructions.id, id));

    // Insert new videos if provided
    if (videoList?.length > 0) {
      await db.insert(videos).values(
        videoList.map((v: { url: string; title?: string }, idx: number) => ({
          id: nanoid(),
          url: v.url,
          title: v.title || null,
          instructionId: id,
          order: idx,
        }))
      );
    }

    // Fetch updated instruction with videos
    const [updatedInstruction] = await db.select().from(instructions).where(eq(instructions.id, id)).limit(1);
    const instructionVideos = await db.select().from(videos).where(eq(videos.instructionId, id)).orderBy(asc(videos.order));

    return NextResponse.json({ ...updatedInstruction, videos: instructionVideos });
  } catch (error) {
    console.error("Error updating instruction:", error);
    return NextResponse.json(
      { error: "Failed to update instruction" },
      { status: 500 }
    );
  }
}

// DELETE instruction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Require authentication for deleting instructions
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Delete videos first (cascade not automatic with raw Drizzle)
    await db.delete(videos).where(eq(videos.instructionId, id));
    
    // Delete instruction
    await db.delete(instructions).where(eq(instructions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting instruction:", error);
    return NextResponse.json(
      { error: "Failed to delete instruction" },
      { status: 500 }
    );
  }
}
