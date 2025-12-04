"use client";

import { useEffect, useRef } from "react";
import { staggerChildren } from "@/lib/animations";

interface StaggerChildrenProps {
  children: React.ReactNode;
  childSelector: string;
  delay?: number;
  className?: string;
}

export default function StaggerChildren({
  children,
  childSelector,
  delay = 0,
  className = "",
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    staggerChildren(ref.current, childSelector, delay);
  }, [childSelector, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}










