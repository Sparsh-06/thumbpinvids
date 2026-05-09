import { useState } from 'react';
import { toast } from 'sonner';
import { compressImage } from '../../helpers/fileHelpers';
import { AMENITIES, MAX_SCRIPT } from '@/utils/constants';

export const useScript = (selectedCompositeArray, propertyBrief) => {
  const [script, setScript] = useState("");
  const [batchScripts, setBatchScripts] = useState([]);
  const [structuredScripts, setStructuredScripts] = useState([]);
  const [sharedVoicePrompt, setSharedVoicePrompt] = useState("");
  const [language, setLanguage] = useState("english");
  const [scriptTone, setScriptTone] = useState("professional");
  const [allowEmotionTags, setAllowEmotionTags] = useState(true);
  const [generatingScript, setGeneratingScript] = useState(false);

  const isBatchMode = selectedCompositeArray.length > 1;

  const isStep2Valid = (batchSize) => {
    if (isBatchMode) {
      return structuredScripts.length === batchSize && 
             structuredScripts.every((s) => (s.fullScript || "").trim().length >= 15);
    }
    return script.trim().length >= 15;
  };

  const handleGenerateScript = async () => {
    if (selectedCompositeArray.length === 0) return;
    setGeneratingScript(true);
    try {
      const enrichedBrief = {
        ...propertyBrief,
        keyFeatures: [...(propertyBrief.selectedFeatures || []), propertyBrief.keyFeatures].filter(Boolean).join(", "),
        amenities: [...(propertyBrief.selectedAmenities || []).map((id) => AMENITIES.find((a) => a.id === id)?.label).filter(Boolean), propertyBrief.amenities].filter(Boolean).join(", "),
      };
      
      const fd = new FormData();
      fd.append("propertyBrief", JSON.stringify(enrichedBrief));
      fd.append("language", language);
      fd.append("tone", scriptTone);
      fd.append("allowEmotionTags", String(allowEmotionTags));

      if (isBatchMode) {
        fd.append("compositeCount", String(selectedCompositeArray.length));
        if (script.trim()) fd.append("userIntent", script.trim());
        
        for (let i = 0; i < selectedCompositeArray.length; i++) {
          fd.append(`compositeImage_${i}`, selectedCompositeArray[i].file);
        }
        
        const res = await fetch("/api/real-estate-video/generate-script", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Script generation failed");
        
        setStructuredScripts(data.scripts || []);
        setBatchScripts((data.scripts || []).map((s) => s.fullScript || ""));
        toast.success(`${data.scripts?.length || 0} structured scripts generated!`);
      } else {
        fd.append("compositeImage", selectedCompositeArray[0].file);
        if (script.trim()) fd.append("userIntent", script.trim());
        
        const res = await fetch("/api/real-estate-video/generate-script", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Script generation failed");
        
        if (data.script?.fullScript) {
          setScript(data.script.fullScript);
        } else if (typeof data.script === "string") {
          setScript(data.script);
        }
        toast.success("Script generated!");
      }
    } catch (err) {
      toast.error("Script generation failed", { description: err.message });
    } finally {
      setGeneratingScript(false);
    }
  };

  const retryScriptGeneration = async () => {
    await handleGenerateScript();
  };

  return {
    script,
    setScript,
    batchScripts,
    setBatchScripts,
    structuredScripts,
    setStructuredScripts,
    sharedVoicePrompt,
    setSharedVoicePrompt,
    language,
    setLanguage,
    scriptTone,
    setScriptTone,
    allowEmotionTags,
    setAllowEmotionTags,
    generatingScript,
    isBatchMode,
    isStep2Valid,
    handleGenerateScript,
    retryScriptGeneration,
  };
};