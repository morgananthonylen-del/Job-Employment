"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SliderImage {
  id: string;
  image_url: string;
  video_url?: string;
  media_type?: 'image' | 'video';
  title?: string;
  description?: string;
  link_url?: string;
}

interface ImageSliderProps {
  images: SliderImage[];
  autoPlay?: boolean;
  interval?: number;
}

export function ImageSlider({ images, autoPlay = true, interval = 5000 }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, autoPlay, interval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const isVideo = currentImage.media_type === 'video' && currentImage.video_url;
  const mediaUrl = isVideo ? currentImage.video_url : currentImage.image_url;

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Image or Video */}
      {currentImage.link_url ? (
        <Link href={currentImage.link_url} className="block w-full h-full">
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt={currentImage.title || "Hero area media"}
              className="w-full h-full object-cover"
            />
          )}
        </Link>
      ) : (
        <>
          {isVideo ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt={currentImage.title || "Hero area media"}
              className="w-full h-full object-cover"
            />
          )}
        </>
      )}

      {/* No overlay text */}
    </div>
  );
}

