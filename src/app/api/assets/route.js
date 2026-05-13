import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";

export async function GET(request) {
  try {
    const { getResolvedUserId } = await import("@/lib/user-resolver");
    const userId = await getResolvedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    await dbConnect();
    
    const query = { userId };
    if (type) query.type = type;

    const assets = await Asset.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { getResolvedUserId } = await import("@/lib/user-resolver");
    const userId = await getResolvedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, url, type, metadata } = body;

    if (!name || !url || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    
    const asset = await Asset.create({
      userId,
      name,
      url,
      type,
      metadata,
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { getResolvedUserId } = await import("@/lib/user-resolver");
    const userId = await getResolvedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing asset ID" }, { status: 400 });
    }

    await dbConnect();
    
    const asset = await Asset.findOneAndDelete({ _id: id, userId });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
