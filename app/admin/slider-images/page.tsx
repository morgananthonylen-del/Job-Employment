"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Edit } from "lucide-react";

interface SliderImage {
  id: string;
  image_url: string;
  video_url?: string;
  media_type: 'image' | 'video';
  title?: string;
  description?: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  page_name?: string;
  created_at: string;
  updated_at: string;
}

const PAGE_OPTIONS = [
  { value: "home", label: "Home Page" },
  { value: "directory", label: "Business Directory" },
  { value: "marketplace", label: "Market Place" },
];

export default function AdminSliderImagesPage() {
  const { toast } = useToast();
  const [selectedPage, setSelectedPage] = useState<string>("home");
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageToCrop, setImageToCrop] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Sync from bucket on initial load to catch any images that were uploaded but not saved
    fetchSliderImages(true);
  }, [selectedPage]);

  // Helper function to get auth headers
  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {};
    
    // Check if admin is logged in (from localStorage)
    if (typeof window !== "undefined" && localStorage.getItem("admin_logged_in") === "true") {
      headers["x-admin-logged-in"] = "true";
    }
    
    // Also try to get JWT token from localStorage if it exists
    const token = typeof window !== "undefined" && localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    return headers;
  };

  const fetchSliderImages = async (syncFromBucket = false) => {
    try {
      setLoading(true);
      const url = syncFromBucket 
        ? `/api/admin/slider-images?sync=true`
        : `/api/admin/slider-images`;
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      
      const data = await response.json();
      
      console.log("Fetch response:", { status: response.status, data });

      if (!response.ok) {
        const errorMsg =
          data?.error ||
          `Failed to fetch slider images (${response.status})`;
        throw new Error(errorMsg);
      }

      // Ensure data is an array
      const images = Array.isArray(data) ? data : [];
      console.log("Setting slider images:", images);
      setSliderImages(images);
    } catch (error: any) {
      console.error("Fetch slider images error:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to load slider images. Make sure the slider_images table exists in your database.",
        variant: "destructive",
      });
      setSliderImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on media type
    if (mediaType === 'image') {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Please upload a JPG, PNG, WebP, or GIF image file.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    } else if (mediaType === 'video') {
      const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Please upload an MP4, WebM, OGG, or QuickTime video file.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    }

    // Validate file size (max 10MB for images, 100MB for videos)
    const maxSize = mediaType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for videos
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: mediaType === 'image' 
          ? "Image file is too large. Maximum file size is 10MB."
          : "Video file is too large. Maximum file size is 100MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("mediaType", mediaType);
      
      console.log("Uploading file:", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        mediaType: mediaType,
      });

      const uploadResponse = await fetch("/api/uploads/hero-slider", {
        method: "POST",
        headers: getAuthHeaders(),
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse
          .json()
          .catch(() => ({ message: "Failed to upload image" }));
        throw new Error(error.message || "Failed to upload image");
      }

      const { url, videoUrl } = await uploadResponse.json();
      console.log("Media uploaded successfully, URL:", url, "Video URL:", videoUrl);

      // Immediately save to database with is_active: true
      try {
        const saveResponse = await fetch("/api/admin/slider-images", {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: mediaType === 'image' ? url : null,
            video_url: mediaType === 'video' ? (videoUrl || url) : null,
            media_type: mediaType,
            title: null,
            description: null,
            link_url: null,
            display_order: 0,
            is_active: true,
            page_name: selectedPage,
          }),
        });

        if (!saveResponse.ok) {
          let errorMessage = "Unknown error";
          try {
            const errorData = await saveResponse.json();
            errorMessage = errorData?.error || errorData?.message || `HTTP ${saveResponse.status}`;
            console.error("Failed to save media to database:", errorData);
          } catch (parseError) {
            const errorText = await saveResponse.text().catch(() => "");
            errorMessage = errorText || `HTTP ${saveResponse.status}`;
            console.error("Failed to parse error response:", errorMessage);
          }
          // Still show success for upload, but warn about database
          toast({
            title: `${mediaType === 'image' ? 'Image' : 'Video'} Uploaded`,
            description: `${mediaType === 'image' ? 'Image' : 'Video'} uploaded but failed to save to database: ${errorMessage}. Syncing from bucket...`,
            variant: "default",
          });
          // Try sync as fallback
          await fetchSliderImages(true);
        } else {
          console.log("Image saved to database successfully");
          toast({
            title: "Success",
            description: `${mediaType === 'image' ? 'Image' : 'Video'} uploaded and saved successfully.`,
          });
          // Refresh the list
          await fetchSliderImages();
        }
      } catch (saveError: any) {
        console.error("Error saving image to database:", saveError);
        toast({
          title: "Image Uploaded",
          description: "Image uploaded but failed to save to database. Syncing from bucket...",
          variant: "default",
        });
        // Try sync as fallback
        await fetchSliderImages(true);
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this slider image? This will remove it from both the database and storage.")) return;

    try {
      // Extract file path from URL
      // URL format: https://...supabase.co/storage/v1/object/public/Heroe%20Slider%20Images/hero-slides/filename.jpg
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.findIndex(part => part.includes("Slider"));
      let filePath = "";
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Get everything after the bucket name
        filePath = pathParts.slice(bucketIndex + 1).join("/");
        // Decode URL encoding
        filePath = decodeURIComponent(filePath);
      } else {
        // Fallback: try to extract from pathname
        const match = urlObj.pathname.match(/hero-slides\/.+$/);
        if (match) {
          filePath = match[0];
        }
      }

      console.log("Deleting image:", { id, imageUrl, filePath });

      const response = await fetch(`/api/admin/slider-images/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        let message = "Failed to delete slider image";
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === "object" && errorData.error) {
            message = errorData.error;
          }
        } catch (parseError) {
          console.error("Failed to parse delete error response", parseError);
        }
        throw new Error(message);
      }

      toast({
        title: "Success",
        description: "Slider image deleted successfully from database and storage",
      });

      fetchSliderImages();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete slider image",
        variant: "destructive",
      });
    }
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingImageId) return;

    // Find the current media type from the editing image
    const editingImage = sliderImages.find(img => img.id === editingImageId);
    const currentMediaType = editingImage?.media_type || 'image';

    // Re-use the same validation rules as upload
    if (currentMediaType === 'image') {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Please upload a JPG, PNG, WebP, or GIF image file.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    } else if (currentMediaType === 'video') {
      const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Format",
          description: "Please upload an MP4, WebM, OGG, or QuickTime video file.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
    }

    const maxSize = currentMediaType === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: currentMediaType === 'image'
          ? "Image file is too large. Maximum file size is 10MB."
          : "Video file is too large. Maximum file size is 100MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // For images, open crop dialog. For videos, upload directly
    if (currentMediaType === 'image') {
      setImageToCrop(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropImage(event.target?.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      // For videos, upload directly without cropping
      handleVideoUpload(file);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!editingImageId) return;

    try {
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("mediaType", "video");

      const uploadResponse = await fetch("/api/uploads/hero-slider", {
        method: "POST",
        headers: getAuthHeaders(),
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse
          .json()
          .catch(() => ({ message: "Failed to upload video" }));
        throw new Error(error.message || "Failed to upload video");
      }

      const { videoUrl } = await uploadResponse.json();

      // Update existing slider image with new video URL
      const saveResponse = await fetch(`/api/admin/slider-images/${editingImageId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_url: videoUrl,
          media_type: "video",
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error("Failed to update video in database:", errorData);
        throw new Error("Failed to update video");
      }

      toast({
        title: "Success",
        description: "Video updated successfully.",
      });

      setEditingImageId(null);
      await fetchSliderImages();
    } catch (error: any) {
      toast({
        title: "Edit Error",
        description: error.message || "Failed to update video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    }
  };

  const handleCrop = () => {
    if (!cropImage || !imageToCrop || !editingImageId || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate scale factor between displayed and natural image size
    const scaleX = img.naturalWidth / img.clientWidth;
    const scaleY = img.naturalHeight / img.clientHeight;

    // Calculate actual crop coordinates in natural image size
    const naturalX = cropArea.x * scaleX;
    const naturalY = cropArea.y * scaleY;
    const naturalWidth = cropArea.width * scaleX;
    const naturalHeight = cropArea.height * scaleY;

    // Set canvas size to crop area
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    // Draw cropped image
    ctx.drawImage(
      img,
      naturalX,
      naturalY,
      naturalWidth,
      naturalHeight,
      0,
      0,
      naturalWidth,
      naturalHeight
    );

    // Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob || !editingImageId) return;

      try {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", blob, imageToCrop.name);
        uploadFormData.append("mediaType", "image"); // Crop is only for images

        const uploadResponse = await fetch("/api/uploads/hero-slider", {
          method: "POST",
          headers: getAuthHeaders(),
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse
            .json()
            .catch(() => ({ message: "Failed to upload image" }));
          throw new Error(error.message || "Failed to upload image");
        }

        const { url } = await uploadResponse.json();

        // Update existing slider image with new URL
        const saveResponse = await fetch(`/api/admin/slider-images/${editingImageId}`, {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: url,
            media_type: "image",
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json().catch(() => ({}));
          console.error("Failed to update image in database:", errorData);
          throw new Error("Failed to update image");
        }

        toast({
          title: "Success",
          description: "Image cropped and updated successfully.",
        });

        setIsCropDialogOpen(false);
        setCropImage(null);
        setImageToCrop(null);
        setEditingImageId(null);
        await fetchSliderImages();
      } catch (error: any) {
        toast({
          title: "Edit Error",
          description: error.message || "Failed to crop and update image. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }, imageToCrop.type, 0.9);
  };

  const handleImageLoad = () => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const container = containerRef.current;
    
    // Get displayed image size
    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;
    setImageSize({ width: displayedWidth, height: displayedHeight });
    
    // Initialize crop area to center 80% of image
    const cropWidth = displayedWidth * 0.8;
    const cropHeight = displayedHeight * 0.8;
    setCropArea({
      x: (displayedWidth - cropWidth) / 2,
      y: (displayedHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is within crop area
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;
    
    // Constrain crop area within image bounds
    const maxX = imageSize.width - cropArea.width;
    const maxY = imageSize.height - cropArea.height;
    
    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDragStart = (e: any, id: string) => {
    setDraggingId(id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = async (e: any, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const updated = [...sliderImages];
    const fromIndex = updated.findIndex((img) => img.id === draggingId);
    const toIndex = updated.findIndex((img) => img.id === targetId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null);
      return;
    }

    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Recalculate display_order locally
    const reordered = updated.map((img, index) => ({
      ...img,
      display_order: index,
    }));

    setSliderImages(reordered);
    setDraggingId(null);

    // Persist new order to the database
    try {
      await Promise.all(
        reordered.map((img) =>
          fetch(`/api/admin/slider-images/${img.id}`, {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ display_order: img.display_order }),
          })
        )
      );
      toast({
        title: "Order updated",
        description: "Slide order has been saved.",
      });
    } catch (error: any) {
      console.error("Error saving new order:", error);
      toast({
        title: "Error",
        description: "Failed to save new slide order.",
        variant: "destructive",
      });
      // Reload from server to avoid inconsistent state
      fetchSliderImages();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMediaType('image')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              mediaType === 'image'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Images
          </button>
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              mediaType === 'video'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Videos
          </button>
        </div>
        <Button
          onClick={() => {
            fileInputRef.current?.click();
          }}
          disabled={isUploading}
          className="!bg-blue-600 hover:!bg-blue-700 !text-white px-6 py-3 text-base font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Upload {mediaType === 'image' ? 'Image' : 'Video'}
            </>
          )}
        </Button>
      </div>

        {/* Hidden file input for uploading images/videos */}
        <input
          ref={fileInputRef}
          type="file"
          accept={mediaType === 'image' 
            ? "image/jpeg,image/jpg,image/png,image/webp,image/gif"
            : "video/mp4,video/webm,video/ogg,video/quicktime"}
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Hidden file input for editing/replacing existing images/videos */}
        <input
          ref={editFileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
          className="hidden"
          onChange={handleEditFileSelect}
        />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Area</h1>
          <p className="text-gray-600 mt-2">
            Add and manage images or videos for the hero area on different pages
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label htmlFor="page-select" className="text-sm font-medium text-gray-700">
            Page:
          </label>
          <select
            id="page-select"
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {PAGE_OPTIONS.map((page) => (
              <option key={page.value} value={page.value}>
                {page.label}
              </option>
            ))}
          </select>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {mediaType === 'image' ? 'Image' : 'Video'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Hero Area Media - {mediaType === 'image' ? 'Images' : 'Videos'}</CardTitle>
          <CardDescription>
            Manage {mediaType === 'image' ? 'images' : 'videos'} displayed in the hero area. Switch tabs above to view the other type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          )}
          {!loading && sliderImages.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No {mediaType === 'image' ? 'images' : 'videos'} found. Upload one using the button above.
            </p>
          )}
          {!loading && sliderImages.length > 0 && (
            <div className="relative">
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Uploading image...</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sliderImages
                  .filter((image) => {
                    // Filter to show only the selected media type
                    if (mediaType === 'video') {
                      return image.media_type === 'video' && image.video_url;
                    } else {
                      return !image.media_type || image.media_type === 'image' || image.image_url;
                    }
                  })
                  .map((image) => (
                  <div
                    key={image.id}
                    className="relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, image.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, image.id)}
                  >
                    <div className="aspect-video bg-gray-100">
                      {image.media_type === 'video' && image.video_url ? (
                        <video
                          src={image.video_url}
                          className="w-full h-full object-cover"
                          controls={false}
                          muted
                        />
                      ) : (
                        <img
                          src={image.image_url}
                          alt={image.title || "Hero area media"}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-t bg-white">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingImageId(image.id);
                          editFileInputRef.current?.click();
                        }}
                        className="bg-white hover:bg-gray-100 shadow-sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(image.id, image.image_url)}
                        className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Select the area you want to crop. Drag to adjust the selection.
            </DialogDescription>
          </DialogHeader>
          {cropImage && (
            <div className="space-y-4">
              <div 
                ref={containerRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 cursor-move"
                style={{ maxHeight: "60vh" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="relative" style={{ width: "100%", height: "auto", maxHeight: "60vh", overflow: "auto" }}>
                  <img
                    ref={imageRef}
                    src={cropImage}
                    alt="Crop preview"
                    onLoad={handleImageLoad}
                    className="max-w-full h-auto select-none"
                    style={{ display: "block", pointerEvents: "none" }}
                    draggable={false}
                  />
                  {/* Crop overlay with draggable selection */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Dark overlay outside crop area */}
                    <div
                      className="absolute bg-black/50"
                      style={{
                        left: 0,
                        top: 0,
                        width: `${cropArea.x}px`,
                        height: "100%",
                      }}
                    />
                    <div
                      className="absolute bg-black/50"
                      style={{
                        left: `${cropArea.x}px`,
                        top: 0,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.y}px`,
                      }}
                    />
                    <div
                      className="absolute bg-black/50"
                      style={{
                        left: `${cropArea.x + cropArea.width}px`,
                        top: 0,
                        width: `${imageSize.width - cropArea.x - cropArea.width}px`,
                        height: "100%",
                      }}
                    />
                    <div
                      className="absolute bg-black/50"
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y + cropArea.height}px`,
                        width: `${cropArea.width}px`,
                        height: `${imageSize.height - cropArea.y - cropArea.height}px`,
                      }}
                    />
                    {/* Crop selection border */}
                    <div
                      className="absolute border-4 border-blue-500 bg-transparent"
                      style={{
                        left: `${cropArea.x}px`,
                        top: `${cropArea.y}px`,
                        width: `${cropArea.width}px`,
                        height: `${cropArea.height}px`,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Click and drag the highlighted area to adjust the crop selection
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCropDialogOpen(false);
                    setCropImage(null);
                    setImageToCrop(null);
                    setEditingImageId(null);
                    if (editFileInputRef.current) {
                      editFileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCrop} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Apply Crop & Upload"
                  )}
                </Button>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>

      {/* Hidden file input for editing images/videos */}
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
        className="hidden"
        onChange={handleEditFileSelect}
      />
    </div>
  );
}
