import { useState } from 'react';
import { toast } from 'sonner';
import { ensureFileObject, compressImage, dataUrlToFile } from '../../helpers/fileHelpers';

export const useComposites = (propertyImages, selectedAvatar) => {
  const [composites, setComposites] = useState([]);
  const [generatingComposites, setGeneratingComposites] = useState(false);
  const [selectedCompositeIndices, setSelectedCompositeIndices] = useState(new Set());
  const [savingComposites, setSavingComposites] = useState(false);

  const selectedCompositeArray = [...selectedCompositeIndices].sort().map((i) => composites[i]).filter(Boolean);
  const isBatchMode = selectedCompositeIndices.size > 1;
  const batchSize = selectedCompositeIndices.size;
  const perVideoCost = 3;
  const totalFullPrice = batchSize * perVideoCost;
  const discountedTotal = batchSize <= 1 ? perVideoCost : batchSize === 2 ? 5 : Math.round(batchSize * perVideoCost * 0.75);
  const savings = totalFullPrice - discountedTotal;

  const toggleComposite = (i) => {
    setSelectedCompositeIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };
  
  const selectAllComposites = () => {
    if (selectedCompositeIndices.size === composites.length) {
      setSelectedCompositeIndices(new Set());
    } else {
      setSelectedCompositeIndices(new Set(composites.map((_, i) => i)));
    }
  };

  const handleGenerateComposites = async () => {
    if (!selectedAvatar || propertyImages.length === 0) return;
    setGeneratingComposites(true);
    setComposites([]);
    setSelectedCompositeIndices(new Set());
    
    try {
      // Ensure avatar is a proper file
      let avatarFile;
      if (selectedAvatar.file) {
        avatarFile = await ensureFileObject(selectedAvatar.file);
        avatarFile = await compressImage(avatarFile);
      } else if (selectedAvatar.url) {
        avatarFile = await ensureFileObject(selectedAvatar.url);
        avatarFile = await compressImage(avatarFile);
      }
      
      if (!avatarFile) {
        throw new Error('Failed to process avatar image');
      }

      const results = [];
      for (let i = 0; i < propertyImages.length; i++) {
        toast.info(`Creating composite ${i + 1}/${propertyImages.length}...`, { id: "composite-progress" });
        
        // Ensure property image is a proper file
        let propertyFile = await ensureFileObject(propertyImages[i]);
        if (!propertyFile) {
          throw new Error(`Failed to process property image ${i + 1}`);
        }
        
        const compressedProperty = await compressImage(propertyFile);
        const fd = new FormData();
        fd.append("avatarImage", avatarFile);
        fd.append("propertyImage", compressedProperty);

        const res = await fetch("/api/real-estate-video/composite", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Composite ${i + 1} failed`);

        results.push({
          url: data.compositeUrl,
          file: dataUrlToFile(data.compositeUrl, `re-composite-${i}.png`),
          title: `Property ${i + 1}`,
          propertyIndex: i,
        });
      }

      setComposites(results);
      toast.success(`${results.length} composite(s) ready — select your favorites!`, { id: "composite-progress" });
      if (results.length === 1) setSelectedCompositeIndices(new Set([0]));
    } catch (err) {
      console.error('Composite generation error:', err);
      toast.error("Composite generation failed", { description: err.message });
    } finally {
      setGeneratingComposites(false);
    }
  };

  const saveUnusedComposites = async () => {
    const unselected = composites.filter((_, i) => !selectedCompositeIndices.has(i));
    if (unselected.length === 0) return;
    setSavingComposites(true);
    try {
      const payload = {
        composites: composites.map((c) => ({ dataUrl: c.url, name: c.title })),
        selectedIndex: [...selectedCompositeIndices][0] ?? 0,
      };
      const res = await fetch("/api/real-estate-video/save-composites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.saved?.length > 0) {
        toast.success(`${data.saved.length} composite(s) saved to Asset Library`);
      }
    } catch (err) {
      console.error("Failed to save composites:", err);
    } finally {
      setSavingComposites(false);
    }
  };

  const handleCompositeNext = async () => {
    if (selectedCompositeIndices.size === 0) return;
    await saveUnusedComposites();
  };

  const retryCompositeGeneration = async () => {
    await handleGenerateComposites();
  };

  return {
    composites,
    setComposites,
    generatingComposites,
    selectedCompositeIndices,
    setSelectedCompositeIndices,
    savingComposites,
    selectedCompositeArray,
    isBatchMode,
    batchSize,
    totalFullPrice,
    discountedTotal,
    savings,
    toggleComposite,
    selectAllComposites,
    handleGenerateComposites,
    handleCompositeNext,
    retryCompositeGeneration,
  };
};