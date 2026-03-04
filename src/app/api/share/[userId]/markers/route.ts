import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Marker from "@/models/Marker";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const unwrappedParams = await params;
    const userId = unwrappedParams.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await dbConnect();
    const markers = await Marker.find({ userId });
    
    return NextResponse.json({ markers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
