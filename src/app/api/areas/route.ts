import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Area from "@/models/Area";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const areas = await Area.find({ userId: (session.user as any).id });
    
    return NextResponse.json({ areas });
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
    const { coordinates, name, notes } = body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json({ error: "Invalid coordinates array" }, { status: 400 });
    }

    await dbConnect();
    const newArea = await Area.create({
      userId: (session.user as any).id,
      coordinates,
      name,
      notes,
    });

    return NextResponse.json({ area: newArea }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
