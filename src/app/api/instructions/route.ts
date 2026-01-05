import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { instructions, videos } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phase = searchParams.get("phase");
  const planet = searchParams.get("planet");

  try {
    // Build query conditions
    const conditions = [];
    if (phase) conditions.push(eq(instructions.phase, parseInt(phase)));
    if (planet) conditions.push(eq(instructions.planet, planet));

    // Fetch instructions
    const allInstructions = conditions.length > 0
      ? await db.select().from(instructions).where(and(...conditions)).orderBy(asc(instructions.missionType), asc(instructions.missionNumber))
      : await db.select().from(instructions).orderBy(asc(instructions.missionType), asc(instructions.missionNumber));

    // Fetch videos for each instruction
    const result = await Promise.all(
      allInstructions.map(async (instruction) => {
        const instructionVideos = await db.select().from(videos).where(eq(videos.instructionId, instruction.id)).orderBy(asc(videos.order));
        return { ...instruction, videos: instructionVideos };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching instructions:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Require authentication for creating instructions
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const { videos: videoList, ...instructionData } = body;
    const id = nanoid();
    const now = new Date();

    // Insert instruction
    await db.insert(instructions).values({
      id,
      ...instructionData,
      createdAt: now,
      updatedAt: now,
    });

    // Insert videos if provided
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

    // Fetch the created instruction with videos
    const [createdInstruction] = await db.select().from(instructions).where(eq(instructions.id, id)).limit(1);
    const instructionVideos = await db.select().from(videos).where(eq(videos.instructionId, id)).orderBy(asc(videos.order));

    return NextResponse.json({ ...createdInstruction, videos: instructionVideos }, { status: 201 });
  } catch (error) {
    console.error("Error creating instruction:", error);
    return NextResponse.json(
      { error: "Failed to create instruction" },
      { status: 500 }
    );
  }
}
