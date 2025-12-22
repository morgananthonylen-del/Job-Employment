"use client";

import { useEffect } from "react";
import Script from "next/script";

interface AdsenseAdProps {
  adClient: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function AdsenseAd({
  adClient,
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
  className,
}: AdsenseAdProps) {
  const isConfigured = adClient && adClient !== "ca-pub-XXXXXXXXXXXXXXXX" && adSlot && adSlot !== "1234567890" && adSlot !== "0987654321";

  useEffect(() => {
    if (isConfigured) {
      try {
        if (typeof window !== "undefined" && (window as any).adsbygoogle) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error("Adsense error:", error);
      }
    }
  }, [isConfigured]);

  // Show placeholder ad when Adsense is not configured
  if (!isConfigured) {
    return (
      <div 
        className={`border-2 border-dashed border-gray-300 bg-gray-50 ${className || ""}`}
        style={{ 
          minHeight: '250px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          ...style 
        }}
      >
        <div className="text-center">
          <div className="mb-3">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">Google AdSense</p>
          <p className="text-xs text-gray-500 mb-2">Ad will appear here</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="w-16 h-2 bg-gray-200 rounded"></div>
            <div className="w-20 h-2 bg-gray-200 rounded"></div>
            <div className="w-16 h-2 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="w-24 h-2 bg-gray-200 rounded"></div>
            <div className="w-28 h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <ins
        className={`adsbygoogle ${className || ""}`}
        style={{ display: "block", ...style }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
      />
    </>
  );
}

