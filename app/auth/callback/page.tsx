"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const intent = (searchParams.get("intent") as "login" | "signup") ?? "login";
    const userTypeParam = searchParams.get("userType") ?? "auto";

    if (errorParam) {
      toast({
        title: "Google sign-in cancelled",
        description: "Please try again or use your email and password.",
        variant: "destructive",
      });
      router.replace(intent === "signup" ? "/register/jobseeker" : "/login");
      return;
    }

    if (!code) {
      toast({
        title: "Invalid callback",
        description: "Missing authorization code from Google.",
        variant: "destructive",
      });
      router.replace(intent === "signup" ? "/register/jobseeker" : "/login");
      return;
    }

    const isPopup = searchParams.get("popup") === "true";

    const completeOAuth = async () => {
      try {
        setStatusMessage("Securing your FastLink account…");
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);
        if (exchangeError) {
          throw exchangeError;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.email) {
          throw userError || new Error("Google account did not return an email address.");
        }

        setStatusMessage("Finalizing account setup…");
        const response = await fetch("/api/auth/oauth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.user.email,
            fullName:
              userData.user.user_metadata?.full_name ||
              userData.user.user_metadata?.name ||
              "",
            userType: userTypeParam,
            intent,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to authenticate with FastLink.");
        }

        // Clear Supabase session since FastLink issues its own token
        await supabase.auth.signOut();

        if (isPopup) {
          window.opener?.postMessage(
            {
              type: "FASTLINK_GOOGLE_AUTH_RESULT",
              success: true,
              token: data.token,
              user: data.user,
            },
            window.location.origin
          );
          window.close();
          return;
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("user-updated"));

          toast({
            title: "Signed in with Google",
            description: `Welcome to FastLink, ${data.user.name || "there"}!`,
          });

          if (data.user.userType === "business") {
            router.replace("/business/dashboard");
          } else if (data.user.userType === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/jobseeker/dashboard");
          }
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        if (isPopup) {
          window.opener?.postMessage(
            {
              type: "FASTLINK_GOOGLE_AUTH_RESULT",
              success: false,
              error: error.message || "Google sign-in failed. Please try again.",
            },
            window.location.origin
          );
          window.close();
        } else {
          toast({
            title: "Google sign-in failed",
            description: error.message || "Please try again or use another sign-in method.",
            variant: "destructive",
          });
          router.replace(intent === "signup" ? "/register/jobseeker" : "/login");
        }
      }
    };

    completeOAuth();
  }, [router, searchParams, toast]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="text-gray-700 font-medium">{statusMessage}</p>
      <p className="text-sm text-gray-500">You will be redirected automatically.</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-gray-700 font-medium">Loading…</p>
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}


