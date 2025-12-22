"use client";

import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";

// Simple redirect page: /auctions -> /market-place
export default function AuctionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/market-place");
  }, [router]);

  // Fallback redirect for non-client navigation
  if (typeof window === "undefined") {
    redirect("/market-place");
  }

  return null;
}


