import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Marker from "@/models/Marker";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    if (!id) {
      return NextResponse.json({ error: "Missing marker ID" }, { status: 400 });
    }

    await dbConnect();
    
    // Ensure the user owns the marker
    const deletedMarker = await Marker.findOneAndDelete({ 
      _id: id, 
      userId: (session.user as any).id 
    });

    if (!deletedMarker) {
      return NextResponse.json({ error: "Marker not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
