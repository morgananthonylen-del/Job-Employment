"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { gsap } from "gsap";
import { Mail } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Roboto } from "next/font/google";
import { Open_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  weight: ["400", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

const BUSINESS_TESTIMONIALS = [
  "\"FastLink helped us find the perfect candidate in just 3 days!\" - Tech Solutions, Suva",
  "\"The quality of applicants through FastLink is outstanding.\" - Retail Plus, Nadi",
  "\"FastLink streamlined our hiring process completely.\" - Hospitality Group, Lautoka",
  "\"We filled 5 positions in one month thanks to FastLink.\" - Manufacturing Co., Lautoka",
  "\"FastLink's Pro listings gave us better matches than any other platform.\" - Rakesh, Suva",
  "\"Applicants came in ready, thanks to FastLink's guidance.\" - Leo, Sigatoka",
];

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const currentTestimonial = BUSINESS_TESTIMONIALS[testimonialIndex];
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % BUSINESS_TESTIMONIALS.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // Check if email failed
      if (data.emailFailed && data.verificationUrl) {
        toast({
          title: "Account Created!",
          description: (
            <div>
              <p className="mb-2 font-medium">We couldn't send the email, but your account is ready!</p>
              <p className="text-sm mb-3">Use this link to verify your email:</p>
              <div className="bg-white p-2 rounded text-xs break-all mb-2 border border-gray-200">
                <code>{data.verificationUrl}</code>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(data.verificationUrl, '_blank')}
                >
                  <a href={data.verificationUrl} target="_blank" rel="noopener noreferrer">
                    Open Verification Link
                  </a>
                </Button>
                <Link
                  href={`/resend-verification?email=${encodeURIComponent(formData.email)}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center justify-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  Or try resending email
                </Link>
              </div>
            </div>
          ),
          duration: 30000, // 30 seconds so user can copy the link
          variant: "warning",
        });
      } else {
        toast({
          title: "Success!",
          description: (
            <div>
              <p className="mb-2">Please check your email to verify your account.</p>
              <Link
                href={`/resend-verification?email=${encodeURIComponent(formData.email)}`}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium inline-flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Didn't receive it? Resend verification email
              </Link>
            </div>
          ),
          duration: 10000, // 10 seconds
          variant: "warning",
        });
      }

      // Redirect after a delay to let user see the message
      setTimeout(() => {
        router.push("/login/company");
      }, data.emailFailed ? 5000 : 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  const googleBlock = (
    <div className="hidden lg:flex w-full max-w-sm flex-col gap-8">
      {currentTestimonial && (() => {
        const lastDashIndex = currentTestimonial.lastIndexOf(" - ");
        if (lastDashIndex === -1) {
          return (
            <div className="min-h-[200px] text-3xl font-semibold italic leading-relaxed text-white" style={{ fontFamily: "'Roboto Slab', 'Spectral', 'Lora', serif" }}>
              {currentTestimonial}
            </div>
          );
        }
        const quote = currentTestimonial.substring(0, lastDashIndex);
        const attribution = currentTestimonial.substring(lastDashIndex);
        return (
          <div className="min-h-[200px] text-3xl leading-relaxed text-white" style={{ fontFamily: "'Roboto Slab', 'Spectral', 'Lora', serif" }}>
            <span className="font-semibold italic">{quote}</span>
            <span className="font-normal not-italic">{attribution}</span>
          </div>
        );
      })()}
      <GoogleAuthButton intent="signup" userType="business" label="Sign up with Google" />
    </div>
  );

  const formCard = (
    <Card ref={cardRef} className="w-full lg:max-w-xl lg:min-h-[620px] shadow-2xl border-2 rounded-none drop-shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-medium">
          Create Company Account
        </CardTitle>
        <CardDescription>Join FastLink and find the perfect candidates</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-sm leading-5">Company Name *</Label>
            <Input
              id="companyName"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Your Company Name"
              className="text-sm leading-5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm leading-5">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="eg. yourname@gmail.com"
              className="text-sm leading-5"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm leading-5">Password *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="text-sm leading-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm leading-5">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="text-sm leading-5"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <Button type="submit" className="min-w-[180px]" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account? {" "}
            <Link href="/login/company" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen bg-white lg:bg-purple-600 flex flex-col items-center justify-center gap-6 p-4 lg:p-8 ${roboto.className}`}>
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <Link href="/" className={cn("hidden lg:flex items-center gap-3 text-white", openSans.className)} style={{ fontSize: "32px", lineHeight: "40px", fontWeight: 600, fontStyle: "normal" }}>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-2xl font-semibold drop-shadow-[0_6px_12px_rgba(251,191,36,0.35)]">
            ⚡
          </span>
          <span>FastLink</span>
        </Link>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {formCard}
          {googleBlock}
        </div>
      </div>
    </div>
  );
}
