import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dataUrlToFile } from '../../helpers/fileHelpers';

export const useAvatars = () => {
  const [avatarMode, setAvatarMode] = useState("prebuilt");
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [uploadedAvatarFile, setUploadedAvatarFile] = useState(null);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarVariantCount, setAvatarVariantCount] = useState(1);
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [reAvatars, setReAvatars] = useState([]);
  const [reAvatarsLoading, setReAvatarsLoading] = useState(false);
  const [reAvatarsError, setReAvatarsError] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Fetch RE avatars
  useEffect(() => {
    if (avatarMode !== "prebuilt") return;
    let cancelled = false;
    setReAvatarsLoading(true);
    setReAvatarsError(null);
    
    fetch("/api/avatars/re")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setReAvatars(data.avatars ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[RE Avatars] fetch error:", err);
        setReAvatarsError("Failed to load avatars");
      })
      .finally(() => { if (!cancelled) setReAvatarsLoading(false); });
      
    return () => { cancelled = true; };
  }, [avatarMode]);

  const handleGenerateAvatars = async () => {
    if (!avatarPrompt.trim() || avatarPrompt.trim().length < 10) return;
    setGeneratingAvatar(true);
    setGeneratedAvatars([]);
    
    try {
      const res = await fetch("/api/product-video/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: avatarPrompt.trim(), variants: avatarVariantCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGeneratedAvatars(data.images || []);
      toast.success(`Generated ${data.images.length} avatar(s)!`);
    } catch (err) {
      toast.error("Avatar generation failed", { description: err.message });
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const selectAvatarFromGeneration = (av, index) => {
    const file = dataUrlToFile(av.url, `avatar-re-${index}.png`);
    setSelectedAvatar({ url: av.url, file, name: `Generated ${index + 1}` });
  };

  return {
    avatarMode,
    setAvatarMode,
    selectedAvatar,
    setSelectedAvatar,
    uploadedAvatarFile,
    setUploadedAvatarFile,
    avatarPrompt,
    setAvatarPrompt,
    avatarVariantCount,
    setAvatarVariantCount,
    generatedAvatars,
    generatingAvatar,
    reAvatars,
    reAvatarsLoading,
    reAvatarsError,
    lightboxUrl,
    setLightboxUrl,
    handleGenerateAvatars,
    selectAvatarFromGeneration
  };
};