"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${params.token}`, {
          method: "GET",
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    if (params.token) {
      verifyEmail();
    }
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <CardTitle>Verifying Email</CardTitle>
              <CardDescription>Please wait while we verify your email address...</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-600">Email Verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-red-600">Verification Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {status === "success" && (
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to login page...
            </p>
          )}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The verification link may be invalid or expired.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/resend-verification">Resend Verification Email</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

