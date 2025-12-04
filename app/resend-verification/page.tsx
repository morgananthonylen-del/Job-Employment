"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { gsap } from "gsap";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

function ResendVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if manual verification is needed
        if (data.manualVerification && data.verificationUrl) {
          setSuccess(true);
          // Store verification URL for display
          setVerificationUrl(data.verificationUrl);
          toast({
            title: "Email Service Unavailable",
            description: "We couldn't send the email, but here's your verification link.",
            variant: "warning",
          });
        } else {
          setSuccess(true);
          toast({
            title: "Email Sent!",
            description: "Please check your inbox for the verification link.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to resend verification email",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card ref={cardRef} className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : (
              <Mail className="h-12 w-12 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {success ? "Email Sent!" : "Resend Verification Email"}
          </CardTitle>
          <CardDescription>
            {success
              ? "Check your inbox for the verification link"
              : "Enter your email to receive a new verification link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              {verificationUrl ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Email service is currently unavailable, but your account is ready!
                    </p>
                    <p className="text-sm text-blue-700 mb-3">
                      Use this link to verify your email address:
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-300 break-all">
                      <code className="text-xs text-gray-800">{verificationUrl}</code>
                    </div>
                    <Button
                      asChild
                      className="w-full mt-3"
                      onClick={() => window.open(verificationUrl, '_blank')}
                    >
                      <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                        Open Verification Link
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Copy the link above or click the button to verify your email. This link expires in 24 hours.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600">
                    We've sent a new verification email to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Please check your inbox and spam folder. The link will expire in 24 hours.
                  </p>
                </>
              )}
              <div className="flex flex-col gap-2 pt-4">
                <Button asChild className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setVerificationUrl(null);
                  }}
                  className="w-full"
                >
                  Resend Another Email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <Button
                type="submit"
                className="w-full hover:scale-105 transition-transform"
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>

              <div className="text-center space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <Link href="/login" className="flex items-center justify-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <ResendVerificationContent />
    </Suspense>
  );
}

