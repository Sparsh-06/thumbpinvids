"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssets } from "@/hooks/use-assets";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Eye,
  CheckCircle,
  Trash2,
  Loader2,
  ImagePlus,
  Sparkles,
  Wand2,
  FileText,
  Package,
  Video,
  Play,
} from "lucide-react";
import { useHeygen } from "@/hooks/use-heygen";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AssetLibraryPage() {
  const {
    assets,
    avatars,
    customAvatars,
    libraryAvatars,
    productImages,
    videos,
    loading: assetsLoading,
    uploading,
    uploadAsset,
    deleteAsset,
    refetch,
  } = useAssets();

  const { photoAvatars, loading: photoLoading } = useHeygen();
  const router = useRouter();

  const loading = assetsLoading || photoLoading;

  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("avatar");
  const [deleting, setDeleting] = useState(null);
  const fileInputRef = useRef(null);

  const filteredLibrary = libraryAvatars.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.ethnicity?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustom = customAvatars.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = productImages.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );
  
  const filteredVideos = videos.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const isFullUrl = (url) => url && url.startsWith("http") || url.startsWith("/");

  function handleFileSelect(e, type = "avatar") {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type", { description: "Please use JPEG, PNG, or WebP images." });
      return;
    }

    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setAssetName(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
    setAssetType(type);
    setUploadModalOpen(true);
  }

  async function handleUpload() {
    if (!uploadFile) return;

    const result = await uploadAsset(uploadFile, assetName, assetType, assetType === "avatar" ? "avatars" : "products");

    if (result.success) {
      toast.success("Asset uploaded! 🎉");
      closeUploadModal();
    } else {
      toast.error("Upload failed", { description: result.error });
    }
  }

  function closeUploadModal() {
    setUploadModalOpen(false);
    setUploadFile(null);
    setUploadPreview(null);
    setAssetName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id) {
    setDeleting(id);
    const result = await deleteAsset(id);

    if (result.success) {
      toast.success("Asset deleted");
      if (selectedAsset?.id === id) setSelectedAsset(null);
      if (previewAsset?.id === id) setPreviewAsset(null);
    } else {
      toast.error("Delete failed", { description: result.error });
    }
    setDeleting(null);
  }

  function AssetCard({ asset, showDelete = false }) {
    const isSelected = selectedAsset?.id === asset.id;
    return (
      <Card
        className={`group cursor-pointer border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden ${
          isSelected ? "ring-2 ring-primary border-primary" : ""
        } ${asset.type === "video" || asset.type === "clip" ? "aspect-[9/16]" : ""}`}
        onClick={() => setSelectedAsset(asset)}
      >
        <CardContent className="p-0">
          <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 relative flex items-center justify-center overflow-hidden">
            {asset.type === "video" || asset.type === "clip" ? (
              <video
                src={asset.url}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                onMouseEnter={(e) => e.target.play()}
                onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
              />
            ) : (
              <img
                src={asset.url || asset.image_url}
                alt={asset.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewAsset(asset);
                }}
              >
                <Eye className="w-4 h-4 text-white" />
              </button>
              {showDelete && (
                <button
                  className="w-8 h-8 rounded-full bg-red-500/30 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-red-500/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.id);
                  }}
                  disabled={deleting === asset.id}
                >
                  {deleting === asset.id ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </div>
            
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary/80 text-white text-[10px] px-1.5 py-0.5 border-0 flex items-center gap-1">
                {asset.type === "avatar" && <Sparkles className="w-2.5 h-2.5" />}
                {asset.type === "product" && <Package className="w-2.5 h-2.5" />}
                {(asset.type === "video" || asset.type === "clip") && <Video className="w-2.5 h-2.5" />}
                {asset.type === "avatar" ? "Avatar" : asset.type === "product" ? "Product" : "Video"}
              </Badge>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate">{asset.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {asset.is_custom ? "Added by you" : "Library Asset"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, assetType)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            Asset Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Store and reuse your product images, custom avatars, and backgrounds
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setAssetType("product");
              fileInputRef.current?.click();
            }}
          >
            <Package className="w-4 h-4 mr-2" />
            Add Product Image
          </Button>
          <Button
            className="cursor-pointer gradient-bg text-white shadow-lg"
            onClick={() => {
              setAssetType("avatar");
              fileInputRef.current?.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Avatar
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search your library..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-0">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="all" className="cursor-pointer">All Assets ({assets.length})</TabsTrigger>
            <TabsTrigger value="avatars" className="cursor-pointer">Avatars ({avatars.length})</TabsTrigger>
            <TabsTrigger value="products" className="cursor-pointer">Products ({productImages.length})</TabsTrigger>
            <TabsTrigger value="videos" className="cursor-pointer">Videos ({videos.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((asset) => (
                <AssetCard key={asset.id} asset={asset} showDelete={asset.is_custom} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="avatars" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {avatars.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((asset) => (
                <AssetCard key={asset.id} asset={asset} showDelete={asset.is_custom} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {productImages.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((asset) => (
                <AssetCard key={asset.id} asset={asset} showDelete={asset.is_custom} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {videos.filter(a => a.name.toLowerCase().includes(search.toLowerCase())).map((asset) => (
                <AssetCard key={asset.id} asset={asset} showDelete={asset.is_custom} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && closeUploadModal()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload {assetType === "avatar" ? "Avatar" : "Product Image"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-square rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {uploadPreview && <img src={uploadPreview} className="w-full h-full object-cover" />}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</label>
              <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} />
            </div>
            <Button className="w-full gradient-bg text-white" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload to Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
