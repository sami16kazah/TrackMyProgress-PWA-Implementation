import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Track from "@/models/Track";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const track = await Track.findOne({ userId: (session.user as any).id });
    
    return NextResponse.json({ track });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { geojson } = body;

    if (!geojson) {
      return NextResponse.json({ error: "Missing geojson" }, { status: 400 });
    }

    await dbConnect();
    
    // We only keep one active track per user for now, or we could update it
    const track = await Track.findOneAndUpdate(
      { userId: (session.user as any).id },
      { geojson, timestamp: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
