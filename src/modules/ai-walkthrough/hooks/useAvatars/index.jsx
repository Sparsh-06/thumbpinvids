import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { dataUrlToFile } from '../../helpers/fileHelpers';

export const useAvatars = () => {
  const [avatarMode, setAvatarMode] = useState("prebuilt");
  // selectedAvatars now stores all images from the selected collection/avatar
  const [selectedAvatars, setSelectedAvatars] = useState([]);
  // Track which collection is selected (for prebuilt mode)
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [uploadedAvatarFile, setUploadedAvatarFile] = useState(null);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarVariantCount, setAvatarVariantCount] = useState(3);
  const [generatedAvatars, setGeneratedAvatars] = useState([]);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  // reAvatars now stores collections: [{id, name, coverImage, images: [...]}]
  const [reAvatars, setReAvatars] = useState([]);
  const [reAvatarsLoading, setReAvatarsLoading] = useState(false);
  const [reAvatarsError, setReAvatarsError] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Fetch RE avatars (now returns collections)
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

  // Select an avatar collection (prebuilt mode) — max 1
  // All images in the collection become selectedAvatars
  const selectCollection = (collection) => {
    if (selectedCollectionId === collection.id) {
      // Deselect
      setSelectedCollectionId(null);
      setSelectedAvatars([]);
    } else {
      // Select this collection — all its images become selectedAvatars
      setSelectedCollectionId(collection.id);
      const avatarObjects = collection.images.map((img, i) => ({
        url: img.url,
        key: img.key,
        file: null,
        name: collection.name,
        angle: i === 0 ? "front" : i === 1 ? "three-quarter" : "side",
      }));
      setSelectedAvatars(avatarObjects);
    }
  };

  // Check if a collection is selected
  const isCollectionSelected = (collectionId) => {
    return selectedCollectionId === collectionId;
  };

  // Toggle avatar selection for upload/generate modes — max 1 avatar
  const toggleAvatarSelection = (avatar) => {
    setSelectedAvatars(prev => {
      if (!prev) return [avatar];
      
      const isSelected = prev.some(a => a?.url === avatar?.url || a?.key === avatar?.key);
      
      if (isSelected) {
        // Remove avatar
        return prev.filter(a => a?.url !== avatar?.url && a?.key !== avatar?.key);
      } else {
        // Replace with new avatar (max 1 in upload/generate modes)
        return [avatar];
      }
    });
  };

  // Clear all selected avatars
  const clearSelectedAvatars = () => {
    setSelectedAvatars([]);
    setSelectedCollectionId(null);
  };

  // Check if an avatar is selected
  const isAvatarSelected = (avatar) => {
    return (selectedAvatars || []).some(a => a?.url === avatar?.url || a?.key === avatar?.key);
  };

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
      
      // Convert generated images to avatar objects
      const generatedAvatarObjects = (data.images || []).map((img, index) => ({
        url: img.url,
        file: dataUrlToFile(img.url, `avatar-generated-${index}.png`),
        name: `Generated ${index + 1}`,
        angle: img.angle,
        variant: img.variant
      }));
      
      setGeneratedAvatars(generatedAvatarObjects);
      toast.success(`Generated ${data.images.length} avatar(s)!`);
    } catch (err) {
      toast.error("Avatar generation failed", { description: err.message });
    } finally {
      setGeneratingAvatar(false);
    }
  };

  const selectAvatarFromGeneration = (av, index) => {
    toggleAvatarSelection(av);
  };

  return {
    avatarMode,
    setAvatarMode,
    selectedAvatars,
    setSelectedAvatars,
    selectedCollectionId,
    setSelectedCollectionId,
    selectCollection,
    isCollectionSelected,
    toggleAvatarSelection,
    clearSelectedAvatars,
    isAvatarSelected,
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