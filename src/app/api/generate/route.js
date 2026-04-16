import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { generateTTS } from "@/lib/api/tts";
import { generateLipSync } from "@/lib/api/lipsync";

export async function POST(request) {
  let videoId = null;
  let userId = null;
  let creditsDeducted = false;

  try {
    // ── 1. Parse & Validate Input ──────────────────────────
    const body = await request.json();
    const { script, avatar_url, voice_id, music_enabled, expression, gesture_intensity, head_motion } = body;

    if (!script || !avatar_url || !voice_id) {
      return NextResponse.json(
        { error: "Missing required fields: script, avatar_url, voice_id" },
        { status: 400 }
      );
    }

    if (script.trim().length < 10) {
      return NextResponse.json(
        { error: "Script must be at least 10 characters" },
        { status: 400 }
      );
    }

    // ── 2. Authenticate User ───────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    userId = session.user.id;
    await dbConnect();

    // ── 3. Check & Deduct Credits ──────────────────────────
    const user = await User.findById(userId);
    if (!user || user.credits < 2) {
      return NextResponse.json(
        { error: "Not enough credits. You need 2 credits to generate a video." },
        { status: 402 }
      );
    }

    user.credits -= 2;
    await user.save();
    creditsDeducted = true;

    // ── 4. Insert Video Row (status: queued) ───────────────
    const video = await Video.create({
      userId,
      script: script.trim(),
      avatarUrl: avatar_url,
      voiceId,
      musicEnabled: music_enabled ?? true,
      status: "queued",
    });

    videoId = video._id;
    console.log(`[Generate] Video ${videoId} created for user ${userId}`);

    // ── 5. Return immediately, then run pipeline async ─────
    runPipelineAsync(videoId, userId, script.trim(), avatar_url, voice_id, {
      expression: expression || "friendly",
      gesture_intensity: gesture_intensity || "natural",
      head_motion: head_motion || "natural",
    });

    return NextResponse.json({
      success: true,
      video_id: videoId,
      status: "queued",
      message: "Video generation started. Track progress in real-time.",
    });
  } catch (error) {
    console.error("[Generate] Unexpected error:", error);

    if (creditsDeducted && userId) {
      const user = await User.findById(userId);
      if (user) {
        user.credits += 2;
        await user.save();
      }
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ── Async Pipeline ───────────────────────────────────────────
async function runPipelineAsync(videoId, userId, script, avatarUrl, voiceId, gestureConfig = {}) {
  try {
    await Video.findByIdAndUpdate(videoId, { status: "generating" });

    // Step B: TTS
    console.log(`[Pipeline] Step 1/2: Generating TTS audio...`);
    const ttsResult = await generateTTS(script, voiceId, null, videoId);

    if (!ttsResult.success || !ttsResult.audio_url) {
      throw new Error("TTS generation failed");
    }

    // Step C: Lip-Sync
    console.log(`[Pipeline] Step 2/2: Generating lip-sync video...`);
    const lipSyncResult = await generateLipSync(
      avatarUrl,
      ttsResult.audio_url,
      null, // No Supabase admin needed anymore
      videoId,
      gestureConfig
    );

    if (!lipSyncResult.success || !lipSyncResult.video_url) {
      throw new Error("Lip-sync generation failed");
    }

    // Step D: Update video row → ready
    await Video.findByIdAndUpdate(videoId, {
      status: "ready",
      videoUrl: lipSyncResult.video_url,
    });

    console.log(`[Pipeline] ✅ Video ${videoId} is READY!`);
  } catch (error) {
    console.error(`[Pipeline] ❌ Video ${videoId} failed:`, error.message);

    await Video.findByIdAndUpdate(videoId, {
      status: "error",
      errorMessage: error.message,
    });

    const user = await User.findById(userId);
    if (user) {
      user.credits += 2;
      await user.save();
    }
  }
}
