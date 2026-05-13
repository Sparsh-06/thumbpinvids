/**
 * Client-side video combiner using FFmpeg WASM
 * Combines multiple video clips into one with simple concatenation.
 * Runs entirely in the browser — no server-side FFmpeg needed.
 *
 * Fix: always create a fresh FFmpeg instance per call to avoid
 * virtual FS state corruption ("ErrnoError: FS error") across invocations.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

/**
 * Load a fresh FFmpeg WASM instance (single-threaded core).
 * We do NOT cache the instance — a dirty FS causes ErrnoError on reuse.
 */
async function loadFreshFFmpeg(onLog) {
  const ffmpeg = new FFmpeg();

  if (onLog) {
    ffmpeg.on("log", ({ message }) => onLog(message));
  }

  // Single-threaded core from CDN — no COOP/COEP headers required
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

/**
 * Combine multiple video URLs into a single video.
 * Uses concat demuxer for reliability across all clip counts.
 *
 * @param {string[]} videoUrls - Array of video URLs to combine
 * @param {object}   options
 * @param {function} options.onProgress - Progress callback (message: string)
 * @param {function} options.onLog      - FFmpeg log callback
 * @returns {Promise<{ blobUrl: string, blob: Blob }>}
 */
export async function combineVideos(videoUrls, options = {}) {
  const { onProgress, onLog } = options;
  const logs = [];
  
  const internalLog = (msg) => {
    logs.push(`[${new Date().toISOString()}] ${msg}`);
    if (onLog) onLog(msg);
    console.log("[VideoCombiner]", msg);
  };

  if (!videoUrls || videoUrls.length === 0) {
    throw new Error("No video URLs provided");
  }

  // Single video — just pass it through
  if (videoUrls.length === 1) {
    onProgress?.("Fetching video...");
    internalLog(`Single video detected. Fetching ${videoUrls[0]}`);
    const response = await fetch(videoUrls[0]);
    if (!response.ok) throw new Error(`Failed to fetch video: ${response.status}`);
    const blob = await response.blob();
    return { blobUrl: URL.createObjectURL(blob), blob, logs };
  }

  onProgress?.("Loading FFmpeg engine...");
  internalLog("Initializing FFmpeg WASM...");
  
  // Fresh instance every time — prevents FS state corruption
  const ffmpeg = await loadFreshFFmpeg((msg) => {
    logs.push(`[FFMPEG] ${msg}`);
    if (onLog) onLog(msg);
  });

  try {
    // Download all videos into FFmpeg's virtual FS
    for (let i = 0; i < videoUrls.length; i++) {
      onProgress?.(`Downloading clip ${i + 1} of ${videoUrls.length}...`);
      internalLog(`Downloading clip ${i + 1}: ${videoUrls[i]}`);
      let data;
      try {
        data = await fetchFile(videoUrls[i]);
        await ffmpeg.writeFile(`input${i}.mp4`, data);
        internalLog(`Wrote input${i}.mp4 to virtual FS (${data.length || data.byteLength} bytes)`);
      } catch (fetchErr) {
        internalLog(`CRITICAL: Failed to download clip ${i + 1}: ${fetchErr.message}`);
        throw new Error(`Failed to fetch clip ${i + 1}: ${fetchErr.message}`);
      }
    }

    onProgress?.("Concatenating clips...");
    internalLog("Creating concat list...");

    // Write concat list — use concat demuxer (most reliable in WASM environment)
    const concatList = videoUrls.map((_, i) => `file 'input${i}.mp4'`).join("\n");
    await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatList));
    internalLog("concat.txt content:\n" + concatList);

    // Concat with stream copy first (fast, no re-encoding)
    // If streams are incompatible, re-encode with libx264
    let execResult;
    try {
      internalLog("Executing FFmpeg (stream copy mode)...");
      execResult = await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",           // stream copy — fastest, no quality loss
        "-movflags", "+faststart",
        "output.mp4",
      ]);
      internalLog("Stream copy finished.");
    } catch (copyErr) {
      // Fallback: re-encode if stream copy fails (e.g. mismatched codecs)
      internalLog(`Stream copy failed: ${copyErr.message}. Falling back to re-encoding...`);
      onProgress?.("Re-encoding for compatibility...");
      await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "output.mp4",
      ]);
      internalLog("Re-encoding finished.");
    }

    onProgress?.("Finalizing combined video...");
    internalLog("Reading output.mp4 from virtual FS...");

    const outputData = await ffmpeg.readFile("output.mp4");
    const blob = new Blob([outputData.buffer], { type: "video/mp4" });
    const blobUrl = URL.createObjectURL(blob);

    internalLog(`Combination successful. Final size: ${blob.size} bytes`);
    onProgress?.("Done!");
    return { blobUrl, blob, logs };

  } catch (err) {
    internalLog(`CRITICAL ERROR: ${err.message}`);
    throw err;
  } finally {
    // Best-effort cleanup of the virtual FS
    internalLog("Cleaning up virtual FS...");
    for (let i = 0; i < videoUrls.length; i++) {
      try { await ffmpeg.deleteFile(`input${i}.mp4`); } catch {}
    }
    try { await ffmpeg.deleteFile("output.mp4"); } catch {}
    try { await ffmpeg.deleteFile("concat.txt"); } catch {}
    ffmpeg.terminate?.(); // If available in this version
  }
}

/**
 * Upload a combined video blob to the server for permanent storage.
 *
 * @param {Blob}   blob     - The combined video blob
 * @param {string} filename - Desired filename
 * @returns {Promise<{ url: string }>} Permanent URL
 */
export async function uploadCombinedVideo(blob, filename = "combined-walkthrough.mp4") {
  const fd = new FormData();
  fd.append("video", new File([blob], filename, { type: "video/mp4" }));

  const res = await fetch("/api/real-estate-video/save-combined", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Server error: ${res.status}`);
  }

  return res.json();
}
