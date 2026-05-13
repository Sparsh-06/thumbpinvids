import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/r2";

/**
 * GET /api/r2?key=users/{userId}/...
 */
export async function GET(request) {
  try {
    const { resolveUserFromSession } = await import("@/lib/user-resolver");
    const user = await resolveUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const resolvedUserId = user._id.toString();

    const { searchParams } = new URL(request.url);
    const encodedKey = searchParams.get("key");

    if (!encodedKey) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    // CRITICAL FIX: Decode the URL-encoded key
    const key = decodeURIComponent(encodedKey);
    
    console.log("[R2 Proxy] Request:", { key, userId: resolvedUserId });

    // Ownership check
    const isPublic = key.startsWith("Avatars/");
    const ownedPrefix = `users/${resolvedUserId}/`;

    if (!isPublic && !key.startsWith(ownedPrefix)) {
      console.warn("[R2 Proxy] Forbidden - Ownership check failed:", { key, ownedPrefix });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch from R2 using DECODED key
    console.log("[R2 Proxy] Fetching from R2...");
    const response = await s3.send(
      new GetObjectCommand({ 
        Bucket: BUCKET, 
        Key: key  // Use decoded key here
      })
    );

    const contentType = response.ContentType || "application/octet-stream";
    const body = response.Body;

    if (!body) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const chunks = [];
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log("[R2 Proxy] Success! Returning", buffer.length, "bytes");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[R2 Proxy] Error:", error);
    if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to retrieve asset" }, { status: 500 });
  }
}