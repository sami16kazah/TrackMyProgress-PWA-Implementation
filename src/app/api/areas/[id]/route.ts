import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Area from "@/models/Area";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    if (!id) {
      return NextResponse.json({ error: "Missing area ID" }, { status: 400 });
    }

    await dbConnect();
    
    // Ensure the user owns the area
    const deletedArea = await Area.findOneAndDelete({ 
      _id: id, 
      userId: (session.user as any).id 
    });

    if (!deletedArea) {
      return NextResponse.json({ error: "Area not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
