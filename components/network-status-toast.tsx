"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

type BannerState = {
  mode: "online" | "offline" | null;
  visible: boolean;
};

export function NetworkStatusToast() {
  const [banner, setBanner] = useState<BannerState>({ mode: null, visible: false });
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const removeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const showOfflineBanner = () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
        removeTimeout.current = null;
      }
      setBanner({ mode: "offline", visible: true });
    };

    const showOnlineBanner = () => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
        removeTimeout.current = null;
      }

      setBanner({ mode: "online", visible: true });
      hideTimeout.current = setTimeout(() => {
        setBanner((prev) => ({ ...prev, visible: false }));
        removeTimeout.current = setTimeout(() => {
          setBanner({ mode: null, visible: false });
          removeTimeout.current = null;
        }, 500);
        hideTimeout.current = null;
      }, 2000);
    };

    if (typeof window !== "undefined") {
      if (!navigator.onLine) {
        showOfflineBanner();
      }
      window.addEventListener("offline", showOfflineBanner);
      window.addEventListener("online", showOnlineBanner);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("offline", showOfflineBanner);
        window.removeEventListener("online", showOnlineBanner);
      }
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      if (removeTimeout.current) {
        clearTimeout(removeTimeout.current);
      }
    };
  }, []);

  const shouldRender = banner.mode !== null || banner.visible;
  if (!shouldRender) {
    return null;
  }

  const isOffline = banner.mode === "offline";
  const containerClasses = [
    "pointer-events-none fixed left-1/2 z-[2000] flex w-[280px] -translate-x-1/2 transition-all duration-500",
    banner.visible ? "bottom-6 translate-y-0 opacity-100" : "bottom-[-140px] translate-y-full opacity-0",
  ].join(" ");

  return (
    <div className={containerClasses}>
      <div
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl transition-colors duration-300 ${
          isOffline ? "bg-black text-white" : "bg-white text-gray-900 ring-1 ring-emerald-200"
        }`}
      >
        {isOffline ? (
          <WifiOff className="h-5 w-5 text-green-400" />
        ) : (
          <Wifi className="h-5 w-5 text-emerald-600" />
        )}
        <div className="flex-1 text-sm font-semibold leading-tight">
          {isOffline ? "Connection lost. You're offline." : "Back online. Connection restored."}
        </div>
      </div>
    </div>
  );
}

