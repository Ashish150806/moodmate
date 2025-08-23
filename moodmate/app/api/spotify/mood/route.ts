import { NextResponse } from "next/server";
import { searchTracksByMood } from "@/lib/spotify";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get("mood") || "happy";

  try {
    const tracks = await searchTracksByMood(mood, 10);
    return NextResponse.json({ tracks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}
