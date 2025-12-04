"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function useGSAP(callback: (ctx: gsap.Context) => void, deps: React.DependencyList = []) {
  const contextRef = useRef<gsap.Context | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      contextRef.current = gsap.context(() => {
        callback(gsap.context(() => {}));
      }, containerRef.current);
    }

    return () => {
      contextRef.current?.revert();
    };
  }, deps);

  return containerRef;
}










