"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Roboto } from "next/font/google";

const robotoMedium = Roboto({ subsets: ["latin"], weight: "500" });

type GoogleAuthIntent = "login" | "signup";
type GoogleAuthUserType = "jobseeker" | "business" | "auto";

interface GoogleAuthButtonProps {
  intent: GoogleAuthIntent;
  userType?: Exclude<GoogleAuthUserType, "auto">;
  label?: string;
}

export function GoogleAuthButton({
  intent,
  userType,
  label = "Continue with Google",
}: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const origin = window.location.origin;
      const params = new URLSearchParams({
        intent,
        userType: userType ?? "auto",
      });

      const oauthWindow = window.open(
        `${origin}/auth/google?${params.toString()}`,
        "fastlink-google-auth",
        "width=520,height=640,left=200,top=120"
      );

      if (!oauthWindow) {
        throw new Error("Unable to open Google sign-in window. Please disable your popup blocker and try again.");
      }

      let popupCheckInterval: NodeJS.Timeout | null = null;

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== origin) return;
        if (!event.data || typeof event.data !== "object") return;

        if (event.data.type === "FASTLINK_GOOGLE_AUTH_RESULT") {
          window.removeEventListener("message", handleMessage);
          if (popupCheckInterval) {
            clearInterval(popupCheckInterval);
            popupCheckInterval = null;
          }
          oauthWindow.close();

          if (event.data.success) {
            if (event.data.token && event.data.user) {
              localStorage.setItem("token", event.data.token);
              localStorage.setItem("user", JSON.stringify(event.data.user));
              window.dispatchEvent(new Event("user-updated"));
              toast({
                title: "Signed in with Google",
                description: `Welcome to FastLink, ${event.data.user.name || "there"}!`,
              });
              if (event.data.user.userType === "business") {
                window.location.href = "/business/dashboard";
              } else if (event.data.user.userType === "admin") {
                window.location.href = "/admin";
              } else {
                window.location.href = "/jobseeker/dashboard";
              }
            } else {
              window.location.reload();
            }
          } else {
            toast({
              title: "Google sign-in failed",
              description: event.data.error || "Please try again later.",
              variant: "destructive",
            });
            setLoading(false);
          }
        }
      };

      window.addEventListener("message", handleMessage);

      // Check if popup is closed manually
      popupCheckInterval = setInterval(() => {
        if (oauthWindow.closed) {
          if (popupCheckInterval) {
            clearInterval(popupCheckInterval);
            popupCheckInterval = null;
          }
          window.removeEventListener("message", handleMessage);
          setLoading(false);
        }
      }, 500);
    } catch (error: any) {
      console.error("Google auth error:", error);
      toast({
        title: "Google sign-in failed",
        description: error?.message ?? "Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition shadow-md py-6"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="h-4 w-4"
          viewBox="0 0 533.5 544.3"
          aria-hidden="true"
        >
          <path
            d="M533.5 278.4c0-17.4-1.6-34.1-4.8-50.3H272v95.1h146.9c-6.4 34.8-25.9 64.2-55.1 83.9l-.5 3.4 80.1 62.1 5.6.6c51.6-47.6 84.5-117.9 84.5-195.1z"
            fill="#4285f4"
          />
          <path
            d="M272 544.3c72.9 0 134.1-24.1 178.8-65.6l-85.2-66.1c-23.4 16-53.4 25.5-93.6 25.5-71.9 0-132.9-48.6-154.7-113.9l-3.2.3-83.5 64.5-1.1 3.1c44.6 88.5 136 152.2 242.5 152.2z"
            fill="#34a853"
          />
          <path
            d="M117.3 324.2c-5.5-16.3-8.6-33.7-8.6-51.6s3.1-35.3 8.4-51.6l-.1-3.5L23.7 151.9l-2.8 1.3C7.3 185.6 0 222.7 0 270s7.3 84.4 20.9 116.8l96.4-62.6z"
            fill="#fbbc04"
          />
          <path
            d="M272 107.7c50.8 0 85 22 104.5 40.4l76.4-74.5C405.9 28.6 344.9 0 272 0 165.5 0 74.1 63.7 29.5 152.2l87.8 66.5C139.1 156.3 200.1 107.7 272 107.7z"
            fill="#ea4335"
          />
        </svg>
      )}
      <span
        className={`ml-3 text-[16px] leading-6 ${robotoMedium.className}`}
      >
        {loading ? "Redirecting…" : label}
      </span>
    </Button>
  );
}


