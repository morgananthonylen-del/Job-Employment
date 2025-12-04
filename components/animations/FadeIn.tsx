"use client";

import { useEffect, useRef } from "react";
import { fadeIn } from "@/lib/animations";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fadeIn(ref.current, delay);
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}










