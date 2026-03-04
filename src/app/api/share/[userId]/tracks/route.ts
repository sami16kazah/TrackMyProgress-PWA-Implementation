import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Track from "@/models/Track";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const unwrappedParams = await params;
    const { userId } = unwrappedParams;

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    await dbConnect();
    const track = await Track.findOne({ userId });
    
    return NextResponse.json({ track });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
