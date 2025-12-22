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
    <div className="relative w-full h-[500px] overflow-hidden rounded-lg">
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

      {/* Overlay with title/description */}
      {(currentImage.title || currentImage.description) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
          <div className="p-8 text-white w-full">
            {currentImage.title && (
              <h3 className="text-3xl font-bold mb-2">{currentImage.title}</h3>
            )}
            {currentImage.description && (
              <p className="text-lg opacity-90">{currentImage.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-8" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

