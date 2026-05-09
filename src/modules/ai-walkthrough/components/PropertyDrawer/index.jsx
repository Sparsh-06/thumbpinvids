import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2 } from "lucide-react";
import {
  PROPERTY_TYPES,
  PRICE_RANGES,
  KEY_FEATURES,
  AMENITIES,
  FURNISHING_OPTIONS,
  FACING_OPTIONS,
  FLOOR_OPTIONS,
} from "@/utils/constants";

export const PropertyDrawer = ({
  isOpen,
  onClose,
  propertyBrief,
  updatePropertyBrief,
  toggleFeature,
  toggleAmenity,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-primary" /> Property Details
          </SheetTitle>
          <SheetDescription className="text-xs">
            Fill in what you have — nothing is mandatory. This helps the AI
            write a more relevant script.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Location</Label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="e.g., Gurgaon Sector 49, Mumbai Bandra West"
              value={propertyBrief.location}
              onChange={(e) =>
                updatePropertyBrief({ location: e.target.value })
              }
            />
          </div>

          {/* Property Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Property Type
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() =>
                    updatePropertyBrief({
                      propertyType: propertyBrief.propertyType === pt ? "" : pt,
                    })
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    propertyBrief.propertyType === pt
                      ? "gradient-bg text-white shadow-sm"
                      : "border border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Price Range</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map((pr) => (
                <button
                  key={pr.id}
                  onClick={() => {
                    if (pr.id === "custom")
                      setPropertyBrief((p) => ({ ...p, priceRange: "custom" }));
                    else
                      setPropertyBrief((p) => ({
                        ...p,
                        priceRange: p.priceRange === pr.id ? "" : pr.id,
                        price: pr.label,
                      }));
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${propertyBrief.priceRange === pr.id ? "gradient-bg text-white shadow-sm" : "border border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5"}`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
            {propertyBrief.priceRange === "custom" && (
              <input
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1.5"
                placeholder="Enter custom price (e.g., ₹95 Lakhs)"
                value={propertyBrief.price}
                onChange={(e) =>
                  setPropertyBrief((p) => ({ ...p, price: e.target.value }))
                }
              />
            )}
          </div>

          {/* Bed + Bath Steppers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bedrooms</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      bedrooms: Math.max(0, p.bedrooms - 1),
                    }))
                  }
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold">
                  {propertyBrief.bedrooms}
                </span>
                <button
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      bedrooms: Math.min(10, p.bedrooms + 1),
                    }))
                  }
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bathrooms</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      bathrooms: Math.max(0, p.bathrooms - 1),
                    }))
                  }
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold">
                  {propertyBrief.bathrooms}
                </span>
                <button
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      bathrooms: Math.min(10, p.bathrooms + 1),
                    }))
                  }
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm font-bold hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Area / Size</Label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="e.g., 1650 sq ft"
              value={propertyBrief.area}
              onChange={(e) =>
                setPropertyBrief((p) => ({ ...p, area: e.target.value }))
              }
            />
          </div>

          {/* Furnishing */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Furnishing</Label>
            <div className="flex gap-1.5">
              {FURNISHING_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      furnishing: p.furnishing === f ? "" : f,
                    }))
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${propertyBrief.furnishing === f ? "gradient-bg text-white shadow-sm" : "border border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Facing */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Facing Direction
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {FACING_OPTIONS.map((dir) => (
                <button
                  key={dir}
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      facing: p.facing === dir ? "" : dir,
                    }))
                  }
                  className={`w-10 h-10 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center ${propertyBrief.facing === dir ? "gradient-bg text-white shadow-sm" : "border border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Floor */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Floor</Label>
            <div className="flex flex-wrap gap-1.5">
              {FLOOR_OPTIONS.map((fl) => (
                <button
                  key={fl}
                  onClick={() =>
                    setPropertyBrief((p) => ({
                      ...p,
                      floor: p.floor === fl ? "" : fl,
                    }))
                  }
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${propertyBrief.floor === fl ? "gradient-bg text-white shadow-sm" : "border border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {fl}
                </button>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Key Features{" "}
              <span className="text-[10px]">(select all that apply)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {KEY_FEATURES.map((feat) => {
                const isOn = propertyBrief.selectedFeatures?.includes(feat);
                return (
                  <button
                    key={feat}
                    onClick={() =>
                      setPropertyBrief((p) => ({
                        ...p,
                        selectedFeatures: isOn
                          ? p.selectedFeatures.filter((f) => f !== feat)
                          : [...(p.selectedFeatures || []), feat],
                      }))
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${isOn ? "bg-primary/15 text-primary border border-primary/30" : "border border-border/60 text-muted-foreground hover:border-primary/30 hover:bg-primary/5"}`}
                  >
                    {isOn && <span className="mr-0.5">✓</span>} {feat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Amenities</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {AMENITIES.map((am) => {
                const isOn = propertyBrief.selectedAmenities?.includes(am.id);
                return (
                  <button
                    key={am.id}
                    onClick={() =>
                      setPropertyBrief((p) => ({
                        ...p,
                        selectedAmenities: isOn
                          ? p.selectedAmenities.filter((a) => a !== am.id)
                          : [...(p.selectedAmenities || []), am.id],
                      }))
                    }
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer ${isOn ? "bg-primary/15 text-primary border border-primary/30 shadow-sm" : "border border-border/60 text-muted-foreground hover:border-primary/30"}`}
                  >
                    <span className="text-base">{am.emoji}</span>
                    <span className="truncate w-full text-center">
                      {am.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Done button */}
          <Button
            onClick={onClose}
            className="w-full gradient-bg text-white shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};