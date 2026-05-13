import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Loader2, ChevronRight, RotateCcw, Check, MapPin } from "lucide-react";

export const Step1Composites = ({ compositesHook, onNext, onBack, isValid }) => {
  const {
    composites,
    generatingComposites,
    selectedCompositeIndices,
    toggleComposite,
    selectAllComposites,
    selectedCompositeArray,
    batchSize,
    totalFullPrice,
    discountedTotal,
    savings,
    savingComposites,
    handleCompositeNext,
    retryCompositeGeneration,
  } = compositesHook;

  const handleNext = () => {
    handleCompositeNext();
    onNext();
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Select Composites</span>
        {composites.length > 1 && (
          <Badge variant="outline" className="text-[10px] ml-auto">
            {selectedCompositeIndices.size}/{composites.length} selected
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Select <strong>one or more</strong> composites to generate videos for. Multiple selections = batch walkthrough with continuation scripts!
      </p>

      {generatingComposites && (
        <div className="rounded-xl border-2 border-dashed border-amber-500/30 p-8 flex flex-col items-center gap-3 bg-amber-500/5">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-sm text-muted-foreground">Generating composites...</p>
          <p className="text-xs text-muted-foreground">~15-30 seconds each</p>
        </div>
      )}

      {composites.length > 0 && !generatingComposites && (
        <>
          {/* Select All toggle */}
          {composites.length > 1 && (
            <button
              onClick={selectAllComposites}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedCompositeIndices.size === composites.length
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "border border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {selectedCompositeIndices.size === composites.length ? "✓ All Selected" : "Select All"}
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {composites.map((comp, i) => {
              const isSelected = selectedCompositeIndices.has(i);
              return (
                <div
                  key={i}
                  onClick={() => toggleComposite(i)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group shadow-sm hover:shadow-xl ${
                    isSelected
                      ? "border-primary ring-4 ring-primary/20 scale-[1.02]"
                      : "border-border/40 bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="aspect-[9/16] w-full overflow-hidden bg-muted">
                    <img 
                      src={comp.url} 
                      alt={comp.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  </div>
                  
                  {/* Glass Header */}
                  <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
                    <Badge className="bg-white/20 text-white border-0 text-[10px] backdrop-blur-md px-2 py-0.5 font-medium">
                      <MapPin className="w-2.5 h-2.5 mr-1 text-primary-foreground/80" /> {comp.title}
                    </Badge>
                  </div>

                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg animate-in zoom-in-50">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Hover Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white/90 font-medium">Click to {isSelected ? 'deselect' : 'select'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch pricing banner */}
          {selectedCompositeIndices.size > 1 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center gap-3">
              <span className="text-lg">🎬</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Batch Walkthrough — {batchSize} videos
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {savings > 0 ? (
                    <>
                      <span className="line-through mr-1">{totalFullPrice} credits</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{discountedTotal} credits</span>
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">(save {savings}!)</span>
                    </>
                  ) : (
                    <span>{discountedTotal} credits</span>
                  )}
                  {" · "}Continuation-style narrative scripts
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-center mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={retryCompositeGeneration} 
              className="cursor-pointer text-xs gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Regenerate All Composites
            </Button>
          </div>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="cursor-pointer">
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!isValid || savingComposites} 
          className="gradient-bg text-white shadow-md cursor-pointer"
        >
          {savingComposites ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</>
          ) : (
            <>Next: Script & Generate <ChevronRight className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
};