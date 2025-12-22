"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { gsap } from "gsap";
import { Mail, ArrowLeft, Zap } from "lucide-react";
import { Roboto } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Open_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  weight: ["400", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

const BUSINESS_TESTIMONIALS = [
  "\"The Pro listings gave my business better matches.\" — Rakesh, Suva",
  "\"Applicants came in ready, thanks to FastLink's guidance.\" — Leo, Sigatoka",
  "\"FastLink helped us find the perfect candidate in just 3 days!\" — Tech Solutions, Suva",
  "\"The quality of applicants through FastLink is outstanding.\" — Retail Plus, Nadi",
  "\"FastLink streamlined our hiring process completely.\" — Hospitality Group, Lautoka",
];

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "700"] });

export default function BusinessLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const currentTestimonial = BUSINESS_TESTIMONIALS[testimonialIndex];
  const cardRef = useRef<HTMLDivElement>(null);
  const loginPanelRef = useRef<HTMLDivElement>(null);
  const forgotPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth <= 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  useEffect(() => {
    if (BUSINESS_TESTIMONIALS.length <= 1) return;
    const id = window.setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % BUSINESS_TESTIMONIALS.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (loginPanelRef.current && forgotPanelRef.current) {
      gsap.set(loginPanelRef.current, { xPercent: 0, opacity: 1 });
      gsap.set(forgotPanelRef.current, { xPercent: 100, opacity: 0, display: "none" });
    }
  }, []);

  useEffect(() => {
    if (!loginPanelRef.current || !forgotPanelRef.current) return;

    if (showForgot) {
      gsap.timeline()
        .set(forgotPanelRef.current, { display: "block" })
        .to(loginPanelRef.current, {
          xPercent: -100,
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .fromTo(
          forgotPanelRef.current,
          { xPercent: 100, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
          "<"
        );
    } else {
      gsap.timeline()
        .to(forgotPanelRef.current, {
          xPercent: 100,
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .set(forgotPanelRef.current, { display: "none" })
        .to(
          loginPanelRef.current,
          { xPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out" },
          "<"
        );
    }
  }, [showForgot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const identifierToUse = formData.identifier;
    const passwordToUse = formData.password;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          expectedRole: "business",
        }),
      });

      const status = response.status;
      const isOk = response.ok;

      let data: any = {};
      const responseText = await response.text();

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError: any) {
          data = { message: responseText || "Unknown error", error: "PARSE_ERROR" };
        }
      } else {
        if (status === 403) {
          data = {
            message: "Access denied. Please verify your email address or contact support.",
            error: "ACCESS_DENIED",
          };
        } else if (status === 401) {
          data = {
            message: "Invalid email or password.",
            error: "INVALID_CREDENTIALS",
          };
        } else {
          data = { message: "Empty response from server", error: "EMPTY_RESPONSE" };
        }
      }

      if (!isOk) {
        if (status === 403) {
          const errorMessage = data?.message || data?.error || "Access denied. Please verify your email or contact support.";

          if (data?.error === "ROLE_MISMATCH") {
            const actualRole = data?.actualRole;
            const correctLoginUrl = actualRole === "business" 
              ? "/login/company" 
              : "/login/jobseeker";
            
            throw new Error(`ROLE_MISMATCH:${correctLoginUrl}:${errorMessage}`);
          } else if (errorMessage.toLowerCase().includes("banned")) {
            throw new Error("Your account has been banned. Please contact support.");
          } else if (errorMessage.toLowerCase().includes("verify") || errorMessage.toLowerCase().includes("verification")) {
            throw new Error("Please verify your email address first");
          } else {
            throw new Error(errorMessage);
          }
        }

        const errorMsg = data?.message || data?.error || `Login failed (${status})`;
        throw new Error(errorMsg);
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("user-updated"));
      }

      toast({
        title: "Success!",
        description: "Welcome back!",
      });

      if (data.user.userType === "admin") {
        router.push("/admin");
      } else if (data.user.userType === "business") {
        router.push("/business/dashboard");
      } else {
        router.push("/jobseeker/dashboard");
      }
    } catch (error: any) {
      setFormData({ identifier: identifierToUse, password: passwordToUse });
      const message = error.message || "An error occurred. Please try again.";
      const lower = message.toLowerCase();

      if (message.startsWith("ROLE_MISMATCH:")) {
        const parts = message.split(":");
        const correctUrl = parts[1];
        const errorMsg = parts.slice(2).join(":");
        
        toast({
          title: "Wrong Login Page",
          description: (
            <div className="flex flex-col gap-2">
              <p>{errorMsg}</p>
              <Link 
                href={correctUrl}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
              >
                Go to {correctUrl.includes("company") ? "Company" : "Job Seeker"} Login
              </Link>
            </div>
          ),
          variant: "destructive",
        });
      } else if (lower.includes("banned")) {
        toast({
          title: "Account Banned",
          description: "Your account has been banned. Please contact support for assistance.",
          variant: "destructive",
        });
      } else if (lower.includes("verify")) {
        toast({
          title: "Email Verification Required",
          description: (
            <div className="flex items-start gap-3 pt-1">
              <div className="flex-shrink-0 mt-0.5">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 mb-1.5">Please verify your email address first</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Check your inbox for the verification link we sent when you registered. If you didn't receive it, check your spam folder.
                </p>
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(identifierToUse)}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Resend verification email
                </Link>
              </div>
            </div>
          ),
          variant: "warning",
        });
      } else {
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loginForm = (
    <>
      <div className="relative overflow-hidden">
        <div className="min-h-[220px]">
          <div ref={loginPanelRef} className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm leading-5">Email or mobile number</Label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="yourname@gmail.com or 7654321"
                  className="text-sm leading-5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm leading-5">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="text-sm leading-5"
                />
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="min-w-[180px] bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-5"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
            <button
              type="button"
              onClick={() => {
                const identifier = formData.identifier.trim();
                if (identifier.includes("@")) {
                  setForgotEmail(identifier);
                } else {
                  setForgotEmail("");
                }
                setShowForgot(true);
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition"
            >
              Forgot password?
            </button>
          </div>
          <div
            ref={forgotPanelRef}
            className="absolute inset-0 space-y-4"
            style={{ display: "none" }}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Reset your password</h3>
              <p className="text-sm text-gray-600">
                Enter the email linked to your account. We'll send instructions to reset your password.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-sm leading-5">Email address</Label>
              <Input
                id="forgot-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="you@example.com"
                className="text-sm leading-5"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!forgotEmail.trim()) {
                    toast({
                      title: "Enter your email",
                      description: "Please provide the email associated with your account.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setForgotLoading(true);
                  setTimeout(() => {
                    toast({
                      title: "Password reset sent",
                      description: "If an account exists, you'll receive reset instructions shortly.",
                    });
                    setForgotLoading(false);
                    setForgotEmail("");
                    setShowForgot(false);
                  }, 800);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm leading-5"
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Email reset link"}
              </button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium transition"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register/company" className="text-blue-600 hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </>
  );

  const footerLinks = (
    <>
      <Link href="/" className="flex items-center gap-2 text-gray-700 text-base font-medium">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>
    </>
  );

  if (isMobile) {
    return (
      <div className={`min-h-screen w-full bg-white lg:bg-purple-600 text-gray-900 lg:text-white flex flex-col px-5 py-6 ${roboto.className}`}>
        <div ref={cardRef} className="flex-1 flex flex-col justify-center">
          <div className="space-y-2 pb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-900 lg:text-white">Company Login</h2>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">{loginForm}</div>
        </div>

        <div className="pt-6 flex flex-col items-center gap-4">{footerLinks}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white lg:bg-purple-600 flex items-center justify-center p-4 lg:p-8 ${roboto.className}`}>
       <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="hidden lg:flex items-center">
          <Link href="/" className={cn("flex items-center gap-3 text-white", openSans.className)} style={{ fontSize: "32px", lineHeight: "40px", fontWeight: 600, fontStyle: "normal" }}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-2xl font-semibold drop-shadow-[0_6px_12px_rgba(251,191,36,0.35)]">
              ⚡
            </span>
            <span>FastLink</span>
          </Link>
        </div>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <Card ref={cardRef} className="w-full lg:max-w-xl shadow-2xl border border-gray-200 bg-white rounded-none drop-shadow-lg" data-login-type="business">
            <CardHeader className="text-center">
              <CardTitle className={`text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${montserrat.className}`}>
                Company
              </CardTitle>
              <CardDescription className="text-base text-gray-600" data-role="business">
                Sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>{loginForm}</CardContent>
          </Card>
 
          <div className="hidden lg:flex w-full max-w-sm flex-col gap-8">
            {currentTestimonial && (() => {
              const lastDashIndex = currentTestimonial.lastIndexOf(" — ");
              if (lastDashIndex === -1) {
                return (
                  <p className="min-h-[200px] text-3xl font-semibold italic leading-relaxed text-white" style={{ fontFamily: "'Roboto Slab', 'Spectral', 'Lora', serif" }}>
                    {currentTestimonial}
                  </p>
                );
              }
              const quote = currentTestimonial.substring(0, lastDashIndex);
              const attribution = currentTestimonial.substring(lastDashIndex);
              return (
                <p className="min-h-[200px] text-3xl leading-relaxed text-white" style={{ fontFamily: "'Roboto Slab', 'Spectral', 'Lora', serif" }}>
                  <span className="font-semibold italic">{quote}</span>
                  <span className="font-normal not-italic">{attribution}</span>
                </p>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

