"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SliderImage {
  id: string;
  image_url: string;
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

  return (
    <div className="relative w-full h-[500px] overflow-hidden">
      {/* Image */}
      {currentImage.link_url ? (
        <Link href={currentImage.link_url} className="block w-full h-full">
          <img
            src={currentImage.image_url}
            alt={currentImage.title || "Slider image"}
            className="w-full h-full object-cover"
          />
        </Link>
      ) : (
        <img
          src={currentImage.image_url}
          alt={currentImage.title || "Slider image"}
          className="w-full h-full object-cover"
        />
      )}

      {/* No overlay text */}
    </div>
  );
}

