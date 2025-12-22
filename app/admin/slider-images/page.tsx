"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";

interface SliderImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminSliderImagesPage() {
  const { toast } = useToast();
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<SliderImage | null>(null);
  const [formData, setFormData] = useState({
    image_url: "",
    title: "",
    description: "",
    link_url: "",
    display_order: 0,
    is_active: true,
  });
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showCrop, setShowCrop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSliderImages();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !imageRef.current) return;
      
      const rect = imageRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - dragStart.x - rect.left, rect.width - cropData.width));
      const newY = Math.max(0, Math.min(e.clientY - dragStart.y - rect.top, rect.height - cropData.height));
      
      setCropData(prev => ({
        ...prev,
        x: newX,
        y: newY,
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, cropData.width, cropData.height]);

  const fetchSliderImages = async () => {
    try {
      const response = await fetch("/api/admin/slider-images");
      if (!response.ok) throw new Error("Failed to fetch slider images");
      const data = await response.json();
      setSliderImages(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load slider images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImagePreview(imageUrl);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = cropData.width * scaleX;
    canvas.height = cropData.height * scaleY;

    ctx.drawImage(
      img,
      cropData.x * scaleX,
      cropData.y * scaleY,
      cropData.width * scaleX,
      cropData.height * scaleY,
      0,
      0,
      cropData.width * scaleX,
      cropData.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const croppedUrl = URL.createObjectURL(blob);
      setFormData({ ...formData, image_url: croppedUrl });
      setShowCrop(false);
      toast({
        title: "Success",
        description: "Image cropped successfully. Upload the image to your server and paste the URL.",
      });
    }, "image/png");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingImage
        ? `/api/admin/slider-images/${editingImage.id}`
        : "/api/admin/slider-images";
      const method = editingImage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save slider image");
      }

      toast({
        title: "Success",
        description: editingImage
          ? "Slider image updated successfully"
          : "Slider image created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchSliderImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save slider image",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (image: SliderImage) => {
    setEditingImage(image);
    setFormData({
      image_url: image.image_url || "",
      title: image.title || "",
      description: image.description || "",
      link_url: image.link_url || "",
      display_order: image.display_order || 0,
      is_active: image.is_active ?? true,
    });
    setImagePreview(image.image_url);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slider image?")) return;

    try {
      const response = await fetch(`/api/admin/slider-images/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete slider image");

      toast({
        title: "Success",
        description: "Slider image deleted successfully",
      });

      fetchSliderImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete slider image",
        variant: "destructive",
      });
    }
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const image = sliderImages.find((img) => img.id === id);
    if (!image) return;

    const currentOrder = image.display_order;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

    const swapImage = sliderImages.find((img) => img.display_order === newOrder);
    if (!swapImage) return;

    try {
      await Promise.all([
        fetch(`/api/admin/slider-images/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: newOrder }),
        }),
        fetch(`/api/admin/slider-images/${swapImage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_order: currentOrder }),
        }),
      ]);

      fetchSliderImages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingImage(null);
    setFormData({
      image_url: "",
      title: "",
      description: "",
      link_url: "",
      display_order: 0,
      is_active: true,
    });
    setImagePreview("");
    setShowCrop(false);
    setCropData({ x: 0, y: 0, width: 100, height: 100 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Slider Images</h1>
          <p className="text-gray-600 mt-2">Manage home page slider images</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slider Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Edit Slider Image" : "Add New Slider Image"}
              </DialogTitle>
              <DialogDescription>
                Upload and crop images for the home page slider
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload and Crop */}
              <div className="space-y-4">
                <Label>Image</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Input
                      type="url"
                      placeholder="Or paste image URL"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                </div>

                {/* Image Preview with Crop */}
                {(imagePreview || formData.image_url) && (
                  <div className="space-y-4">
                    <div className="relative border rounded-lg overflow-hidden bg-gray-100" style={{ height: "400px" }}>
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        ref={imageRef}
                        onLoad={() => {
                          if (imageRef.current) {
                            const rect = imageRef.current.getBoundingClientRect();
                            setCropData({
                              x: 0,
                              y: 0,
                              width: rect.width,
                              height: rect.height,
                            });
                          }
                        }}
                      />
                      {showCrop && imageRef.current && (
                        <>
                          {/* Crop Overlay */}
                          <div
                            className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                            style={{
                              left: `${cropData.x}px`,
                              top: `${cropData.y}px`,
                              width: `${cropData.width}px`,
                              height: `${cropData.height}px`,
                            }}
                            ref={cropBoxRef}
                            onMouseDown={(e) => {
                              setIsDragging(true);
                              setDragStart({ x: e.clientX - cropData.x, y: e.clientY - cropData.y });
                            }}
                          >
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded cursor-nwse-resize"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                // Handle resize from top-left
                              }}
                            />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded cursor-nesw-resize" />
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded cursor-nesw-resize" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded cursor-nwse-resize" />
                          </div>
                          {/* Dark overlay outside crop area */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.5) ${(cropData.x / (imageRef.current?.offsetWidth || 1)) * 100}%, transparent ${(cropData.x / (imageRef.current?.offsetWidth || 1)) * 100}%, transparent ${((cropData.x + cropData.width) / (imageRef.current?.offsetWidth || 1)) * 100}%, rgba(0,0,0,0.5) ${((cropData.x + cropData.width) / (imageRef.current?.offsetWidth || 1)) * 100}%)`,
                            }}
                          />
                        </>
                      )}
                    </div>
                    {showCrop && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>X Position</Label>
                            <Input
                              type="number"
                              value={Math.round(cropData.x)}
                              onChange={(e) => setCropData({ ...cropData, x: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>Y Position</Label>
                            <Input
                              type="number"
                              value={Math.round(cropData.y)}
                              onChange={(e) => setCropData({ ...cropData, y: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <Label>Width</Label>
                            <Input
                              type="number"
                              value={Math.round(cropData.width)}
                              onChange={(e) => setCropData({ ...cropData, width: parseInt(e.target.value) || 100 })}
                            />
                          </div>
                          <div>
                            <Label>Height</Label>
                            <Input
                              type="number"
                              value={Math.round(cropData.height)}
                              onChange={(e) => setCropData({ ...cropData, height: parseInt(e.target.value) || 100 })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" onClick={handleCrop} className="flex-1">
                            Apply Crop
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowCrop(false);
                              setImagePreview(formData.image_url);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Image title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_url">Link URL (Optional)</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Image description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Slider Image</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Slider Images</CardTitle>
          <CardDescription>Manage images displayed in the home page slider</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : sliderImages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No slider images found</p>
          ) : (
            <div className="space-y-4">
              {sliderImages.map((image, index) => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="w-32 h-20 flex-shrink-0">
                    <img
                      src={image.image_url}
                      alt={image.title || "Slider image"}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {image.title || "Untitled Image"}
                    </h3>
                    {image.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">{image.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>Order: {image.display_order}</span>
                      <span className={image.is_active ? "text-green-600" : "text-gray-400"}>
                        {image.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveOrder(image.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveOrder(image.id, "down")}
                      disabled={index === sliderImages.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

