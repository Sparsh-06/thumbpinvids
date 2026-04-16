"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ShoppingBag,
  Upload,
  X,
  ImagePlus,
  User,
  FileText,
  Sparkles,
  Loader2,
  Play,
  CheckCircle2,
  ChevronRight,
  Info,
  Download,
} from "lucide-react";
import { AssetSelector } from "@/components/dashboard/asset-selector";

const MAX_SCRIPT = 450;

async function compressImage(file, maxDimension = 1200, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ImageUploadBox({ label, icon: Icon, images, onAdd, onRemove, maxImages, hint, type = "all" }) {
  const inputRef = useRef(null);

  function handleFiles(files) {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = maxImages - images.length;
    valid.slice(0, remaining).forEach((f) => onAdd(f));
    if (!valid.length) toast.error("Please upload image files (JPEG, PNG, WebP)");
  }

  async function handleAssetSelect(asset) {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const file = new File([blob], asset.name, { type: blob.type });
      onAdd(file);
    } catch (error) {
      toast.error("Failed to load asset from library");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground ml-auto">{images.length}/{maxImages}</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {images.length < maxImages && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <Upload className="w-5 h-5 group-hover:text-primary transition-colors" />
            <p className="text-xs font-medium">Click to upload</p>
          </button>
          
          <AssetSelector 
            type={type} 
            title={`Select ${label}`}
            onSelect={handleAssetSelect}
          />
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex gap-3 flex-wrap pt-2">
          {images.map((img, i) => (
            <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border shadow-md group animate-in zoom-in-50 duration-200">
              <img
                src={URL.createObjectURL(img)}
                alt={`${label} ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        multiple={maxImages > 1}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function VideoCard({ index, video, status, totalParts }) {
  const isReady = status === "ready";
  const isGenerating = status === "generating";
  const isPending = status === "pending";

  return (
    <div
      className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
        isReady
          ? "border-primary/40 bg-card shadow-lg"
          : isGenerating
          ? "border-amber-500/40 bg-amber-500/5 animate-pulse"
          : "border-border/40 bg-muted/30 opacity-50"
      }`}
    >
      <div className="p-3 flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
            isReady
              ? "gradient-bg text-white"
              : isGenerating
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isReady ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {isReady ? `Video ${index + 1}` : isGenerating ? "Generating..." : `Video ${index + 1}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isReady
              ? "Ready to watch"
              : isGenerating
              ? "Creating your product video..."
              : "Waiting..."}
          </p>
        </div>
        {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />}
      </div>

      {isReady && video?.videoUrl && (
        <div className="px-3 pb-3">
          <div className="rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-80 mx-auto relative">
            <video
              src={video.videoUrl}
              controls
              className="w-full h-full object-contain"
              autoPlay={false}
            >
              Your browser does not support video.
            </video>
          </div>
          <div className="flex justify-end mt-2">
            <a
              href={video.videoUrl}
              download={`product-video-${index + 1}.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const STEPS = ["Product", "Avatar", "Script"];

function ProductToVideoContent() {
  const searchParams = useSearchParams();
  const initialScript = searchParams.get("script");

  const [step, setStep] = useState(0);

  // Images
  const [productImages, setProductImages] = useState([]);
  const [avatarImages, setAvatarImages] = useState([]);

  // Script
  const [script, setScript] = useState(initialScript || "");

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [videoStatuses, setVideoStatuses] = useState([]); // "pending" | "generating" | "ready"
  const [videos, setVideos] = useState([]); // [{ videoUrl }]
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (initialScript) {
      setScript(initialScript);
      setStep(2); // Start at script step if coming from UGC Creator
    }
  }, [initialScript]);

  const step1Valid = productImages.length >= 1;
  const step2Valid = avatarImages.length >= 1;
  const step3Valid = script.trim().length >= 20;

  function addProductImage(file) {
    setProductImages((prev) => [...prev, file]);
  }
  function removeProductImage(i) {
    setProductImages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addAvatarImage(file) {
    setAvatarImages((prev) => [...prev, file]);
  }
  function removeAvatarImage(i) {
    setAvatarImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleGenerate() {
    if (!step1Valid || !step2Valid || !step3Valid) return;

    setVideoStatuses(["pending"]);
    setVideos([null]);
    setDone(false);
    setGenerating(true);

    try {
      toast.info("Preparing images...");
      const compressedAvatar = await Promise.all(avatarImages.slice(0, 2).map(f => compressImage(f)));
      const compressedProduct = await Promise.all(productImages.slice(0, 2).map(f => compressImage(f)));

      const fd = new FormData();
      compressedAvatar.forEach((f) => fd.append("personImages", f));
      compressedProduct.forEach((f) => fd.append("locationImages", f));
      fd.append("scriptParts", JSON.stringify([script]));
      fd.append("context", "product"); // Special flag for the backend

      const response = await fetch("/api/ai-walkthrough/generate", {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSSEEvent(event);
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Generation failed", { description: err.message });
      setVideoStatuses(["error"]);
    } finally {
      setGenerating(false);
    }
  }

  function handleSSEEvent(event) {
    if (event.type === "progress") {
      setVideoStatuses(["generating"]);
      toast.info(event.message, { id: "video-progress" });
    }

    if (event.type === "video_ready") {
      setVideoStatuses(["ready"]);
      setVideos([{ videoUrl: event.videoUrl }]);
      toast.success("🎬 Product video ready!", { id: "video-progress" });
    }

    if (event.type === "done") {
      setDone(true);
      toast.success("✅ Video generated successfully!");
    }

    if (event.type === "error") {
      toast.error("Generation error", { description: event.message });
    }
  }

  function reset() {
    setProductImages([]);
    setAvatarImages([]);
    setScript("");
    setVideoStatuses([]);
    setVideos([]);
    setDone(false);
    setGenerating(false);
    setStep(0);
  }

  const showResults = videoStatuses.length > 0;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-md">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading">Product Video</h1>
          <p className="text-sm text-muted-foreground">
            Create a cinematic product showcase with an AI presenter.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex gap-2.5 mb-6">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Upload <strong className="text-foreground">1–2 photos of your product</strong> and <strong className="text-foreground">your presenter photo</strong>. Our AI will create a cinematic 8-second video featuring the presenter with your product.
        </p>
      </div>

      {/* Step progress */}
      {!showResults && (
        <div className="flex items-center gap-1 mb-7">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => {
                  if (i < step || (i === 1 && step1Valid) || (i === 2 && step1Valid && step2Valid)) setStep(i);
                }}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                  step === i
                    ? "gradient-bg text-white shadow-md"
                    : i < step
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground bg-muted/50"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : (
                  <span className="w-4 h-4 rounded-full border text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                )}
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${i < step ? "bg-primary/40" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Steps */}
      {!showResults && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {step === 0 && (
            <ImageUploadBox
              label="Product Photo"
              icon={ShoppingBag}
              images={productImages}
              onAdd={addProductImage}
              onRemove={removeProductImage}
              maxImages={2}
              type="products"
              hint="Upload 1–2 photos of your product. These will be the focus of the background/scene."
            />
          )}

          {step === 1 && (
            <ImageUploadBox
              label="Avatar / Presenter Photo"
              icon={User}
              images={avatarImages}
              onAdd={addAvatarImage}
              onRemove={removeAvatarImage}
              maxImages={1}
              type="avatars"
              hint="Upload a clear photo of the person who will be the presenter in the video."
            />
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Script</span>
                <span className={`text-xs ml-auto font-mono ${script.length > MAX_SCRIPT ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                  {script.length}/{MAX_SCRIPT}
                </span>
              </div>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value.slice(0, MAX_SCRIPT))}
                placeholder="Write what the presenter should say about the product..."
                className="min-h-[140px] resize-none text-sm"
                maxLength={MAX_SCRIPT}
              />
              <p className="text-xs text-muted-foreground">Max {MAX_SCRIPT} characters.</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="cursor-pointer">Back</Button>
            ) : <div />}
            
            {step < 2 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
                className="gradient-bg text-white shadow-md cursor-pointer"
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!step3Valid || generating}
                className="gradient-bg text-white shadow-md cursor-pointer px-8"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Video</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {showResults && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              {done ? "✅ Your video is ready" : "Generating your product video..."}
            </h2>
            {done && (
              <Button variant="outline" size="sm" onClick={reset} className="cursor-pointer text-xs">
                Start over
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {videoStatuses.map((status, i) => (
              <VideoCard
                key={i}
                index={i}
                status={status}
                video={videos[i]}
                totalParts={videoStatuses.length}
              />
            ))}
          </div>

          {done && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <p className="text-sm font-medium">🎬 Video generated successfully!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can download your cinematic 8-second product showcase above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductToVideoPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ProductToVideoContent />
    </Suspense>
  );
}
