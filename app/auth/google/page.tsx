"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

function GoogleOAuthPopupContent() {
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState("Connecting to Google…");

  useEffect(() => {
    const intent = (searchParams.get("intent") as "login" | "signup") ?? "login";
    const userType = searchParams.get("userType") ?? "auto";

    const startOAuth = async () => {
      try {
        const redirectUrl = `${window.location.origin}/auth/callback?intent=${intent}&userType=${userType}&popup=true`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          throw error;
        }
      } catch (error: any) {
        console.error("Popup OAuth error:", error);
        window.opener?.postMessage(
          {
            type: "FASTLINK_GOOGLE_AUTH_RESULT",
            success: false,
            error: error?.message || "Google sign-in failed. Please try again.",
          },
          window.location.origin
        );
        window.close();
      }
    };

    setStatusMessage("Redirecting to Google…");
    startOAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-gray-700 font-medium">{statusMessage}</p>
      <p className="text-sm text-gray-500">This window will close automatically.</p>
    </div>
  );
}

export default function GoogleOAuthPopupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-700 font-medium">Preparing Google sign-in…</p>
        </div>
      }
    >
      <GoogleOAuthPopupContent />
    </Suspense>
  );
}


