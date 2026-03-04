import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Area from "@/models/Area";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const unwrappedParams = await params;
    const userId = unwrappedParams.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await dbConnect();
    const areas = await Area.find({ userId });
    
    return NextResponse.json({ areas });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
