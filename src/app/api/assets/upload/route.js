import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Asset from "@/models/Asset";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { uploadFile } from "@/lib/upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const name = formData.get("name") || "Untitled Asset";
    const type = formData.get("type") || "general";
    const category = formData.get("category") || type; // Folder name

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Upload to disk
    const url = await uploadFile(file, category);

    await dbConnect();
    const asset = await Asset.create({
      userId: session.user.id,
      name: name.trim().substring(0, 100),
      url,
      type,
      metadata: {
        is_custom: true,
        originalName: (file).name,
      }
    });

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error("[Asset Upload] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
