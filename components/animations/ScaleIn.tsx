"use client";

import { useEffect, useRef } from "react";
import { scaleIn } from "@/lib/animations";

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function ScaleIn({ children, delay = 0, className = "" }: ScaleInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scaleIn(ref.current, delay);
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}










