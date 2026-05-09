import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, PenLine, Sparkles, RotateCcw } from "lucide-react";
import { LANGUAGES, TONES, MAX_SCRIPT } from "@/utils/constants";

export const Step2Script = ({ compositesHook, scriptHook, videoHook, onBack, onGenerate, isValid }) => {
  const {
    selectedCompositeArray,
    batchSize,
    isBatchMode,
  } = compositesHook;

  const {
    script,
    setScript,
    language,
    setLanguage,
    scriptTone,
    setScriptTone,
    allowEmotionTags,
    setAllowEmotionTags,
    generatingScript,
    structuredScripts,
    setStructuredScripts,
    setBatchScripts,
    sharedVoicePrompt,
    handleGenerateScript,
    retryScriptGeneration,
  } = scriptHook;

  const { generating } = videoHook;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Script & Generate</span>
        {isBatchMode && (
          <Badge className="gradient-bg text-white border-0 text-[10px]">
            Batch · {batchSize} videos
          </Badge>
        )}
      </div>

      {/* Selected composites preview strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {selectedCompositeArray.map((comp, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-border/50 p-1.5 bg-card/50 shrink-0">
            <img src={comp.url} alt={comp.title} className="w-10 h-14 rounded-lg object-cover border border-border" />
            <div>
              <p className="text-[10px] font-semibold">{comp.title}</p>
              <p className="text-[9px] text-muted-foreground">{isBatchMode ? `Video ${i + 1}` : "Selected"}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Language */}
      <div className="flex gap-2 flex-wrap">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              language === lang.id ? "gradient-bg text-white" : "border border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Script Tone</Label>
        <div className="flex gap-2 flex-wrap">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setScriptTone(tone.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                scriptTone === tone.id ? "gradient-bg text-white" : "border border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Emotion tags toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAllowEmotionTags((v) => !v)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
            allowEmotionTags ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            allowEmotionTags ? "translate-x-4" : "translate-x-0.5"
          }`} />
        </button>
        <span className="text-xs text-muted-foreground">
          Allow emotion tags like <code className="text-primary bg-primary/10 px-1 rounded">{`{{happy}}`}</code> in script
        </span>
      </div>

      {/* Script(s) — Batch vs Single */}
      {isBatchMode ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs">
              UGC Scripts · {batchSize} clips · 8s each
              {sharedVoicePrompt && <span className="ml-2 text-[10px] text-emerald-500 font-medium">🎙️ Shared voice active</span>}
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateScript} 
              disabled={generatingScript} 
              className="cursor-pointer text-xs"
            >
              {generatingScript ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <PenLine className="w-3 h-3 mr-1" />}
              ✨ {generatingScript ? "Generating…" : "AI Write All"}
            </Button>
          </div>

          {generatingScript && structuredScripts.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-4 rounded-lg border border-dashed border-border/50">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Crafting your {batchSize}-clip walkthrough…
            </div>
          )}

          {selectedCompositeArray.map((comp, i) => {
            const ss = structuredScripts[i] || {};
            const label = i === 0 ? "Opening" : i === batchSize - 1 ? "Closing" : `Clip ${i + 1}`;
            return (
              <div key={i} className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-card/60">
                  <Badge variant="outline" className="text-[9px]">{label}</Badge>
                  <img src={comp.url} alt={comp.title} className="w-5 h-7 rounded object-cover border border-border/50" />
                  <span className="text-[10px] text-muted-foreground truncate">{comp.title}</span>
                  <span className="text-[9px] font-mono ml-auto text-muted-foreground">8s clip</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Anything specific to say? <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <Textarea
                      value={ss._userIntent || ""}
                      onChange={(e) => {
                        setStructuredScripts((prev) => {
                          const n = [...prev];
                          n[i] = { ...(n[i] || {}), _userIntent: e.target.value };
                          return n;
                        });
                      }}
                      placeholder={`e.g. "mention the floor-to-ceiling windows" or "say it's move-in ready"`}
                      className="min-h-[44px] resize-none text-xs"
                    />
                  </div>
                  {ss.fullScript ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-500">🎬 AI Cinematic Prompt</span>
                        <span className="text-[9px] text-muted-foreground">sent to Veo — edit if needed</span>
                      </div>
                      <Textarea
                        value={ss.fullScript}
                        onChange={(e) => {
                          setStructuredScripts((prev) => {
                            const n = [...prev];
                            n[i] = { ...(n[i] || {}), fullScript: e.target.value };
                            setBatchScripts((bs) => { const b = [...bs]; b[i] = e.target.value; return b; });
                            return n;
                          });
                        }}
                        className="min-h-[72px] resize-none text-xs text-muted-foreground"
                      />
                    </div>
                  ) : generatingScript ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generating cinematic prompt…
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">
              Anything specific you want the presenter to say? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <span className={`text-xs font-mono ${script.length > MAX_SCRIPT ? "text-destructive font-bold" : "text-muted-foreground"}`}>
              {script.length}/{MAX_SCRIPT}
            </span>
          </div>
          <Textarea
            value={script}
            onChange={(e) => setScript(e.target.value.slice(0, MAX_SCRIPT))}
            placeholder="Optional · e.g. 'mention the terrace view' or 'say it's move-in ready' — AI builds the full cinematic ad prompt around this"
            className="min-h-[100px] resize-none text-sm"
            maxLength={MAX_SCRIPT}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateScript} 
            disabled={generatingScript} 
            className="cursor-pointer text-xs"
          >
            {generatingScript ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <PenLine className="w-3 h-3 mr-1" />}
            ✨ Generate Ad Prompt
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="cursor-pointer">
          Back
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryScriptGeneration} 
            className="cursor-pointer text-xs gap-1"
            disabled={generatingScript}
          >
            <RotateCcw className="w-3 h-3" /> Regenerate Script{isBatchMode ? 's' : ''}
          </Button>
          <Button 
            onClick={onGenerate} 
            disabled={!isValid || generating} 
            className="gradient-bg text-white shadow-md cursor-pointer px-8"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> {isBatchMode ? `Generate ${batchSize} Videos` : "Generate Video"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};