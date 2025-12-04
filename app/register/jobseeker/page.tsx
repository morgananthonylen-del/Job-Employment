"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { ArrowLeft, Eye, EyeOff, Zap } from "lucide-react";
import { Roboto } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Open_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";

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
const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

const JOBSEEKER_TESTIMONIALS = [
  "\"FastLink got me an interview within a week!\" — Amelia, Lautoka",
  "\"I never miss deadlines now—FastLink keeps everything organised.\" — Priya, Nadi",
  "\"FastLink made my job search simple and stress-free.\" — Hannah, Labasa",
  "\"Found the perfect role in Suva with FastLink's alerts.\" — Karishma, Suva",
  "\"FastLink connected me with a Nausori employer in days.\" — Daniel, Nausori",
  "\"My Navua placement came through FastLink's recommendations.\" — Elena, Navua",
  "\"FastLink opened doors in Ba I didn't know existed.\" — Moses, Ba",
];

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function JobSeekerRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<"match" | "mismatch" | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const currentTestimonial = JOBSEEKER_TESTIMONIALS[testimonialIndex];
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % JOBSEEKER_TESTIMONIALS.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateIsMobile = () => {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 1024);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && currentStep !== 0) {
      setCurrentStep(0);
    }
  }, [isMobile, currentStep]);

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
    if (passwordMatchStatus === "match") {
      const timer = setTimeout(() => {
        setPasswordMatchStatus(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [passwordMatchStatus]);

  const evaluatePasswordStrength = (value: string): "weak" | "medium" | "strong" | null => {
    if (!value) return null;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score >= 4) return "strong";
    if (score >= 2) return "medium";
    return "weak";
  };

  const checkEmailExists = useCallback(async (email: string): Promise<boolean | null> => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailExists(null);
      setEmailChecking(false);
      return null;
    }

    setEmailChecking(true);
    const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`).catch(() => null);
    if (!response || !response.ok) {
      setEmailExists(null);
      setEmailChecking(false);
      return null;
    }

    try {
      const data = await response.json();
      const exists = Boolean(data.exists);
      setEmailExists(exists);
      setEmailChecking(false);
      return exists;
    } catch {
      setEmailExists(null);
      setEmailChecking(false);
      return null;
    }
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setPasswordStrength(null);
    setPasswordMatchStatus(null);
    setEmailExists(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Missing name", description: "Please enter your full name.", variant: "destructive" });
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
      return false;
    }
    if (formData.password.length < 6) {
      toast({ title: "Weak password", description: "Password should be at least 6 characters long.", variant: "destructive" });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatchStatus("mismatch");
      toast({ title: "Password mismatch", description: "Passwords do not match.", variant: "destructive" });
      return false;
    }
    if (emailExists) {
      toast({ title: "Email already used", description: "Try signing in instead.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register/jobseeker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Registration failed");
      }

        toast({
          title: "Success!",
        description:
          data?.message || "Account created. Please check your email to verify your account.",
      });

      resetForm();
      setTimeout(() => router.push("/login"), 1200);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const googleBlock = (
    <div className="hidden lg:flex w-full max-w-sm flex-col gap-8">
      {currentTestimonial && (() => {
        const lastDashIndex = currentTestimonial.lastIndexOf(" — ");
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
          <GoogleAuthButton intent="signup" userType="jobseeker" label="Sign up with Google" />
      </div>
    );

  const formCard = (
    <Card ref={cardRef} className="w-full lg:max-w-xl lg:min-h-[620px] shadow-2xl border-2 rounded-none drop-shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-medium">
            Create Job Seeker Account
          </CardTitle>
        <CardDescription>Join FastLink and find your dream job</CardDescription>
        </CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm leading-5">Full Name *</Label>
              <Input
                  id="name"
                  required
                value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Doe"
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
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailExists(null);
              }}
              onBlur={(e) => checkEmailExists(e.target.value)}
              placeholder="eg. yourname@gmail.com"
              className="text-sm leading-5"
            />
            <div className="min-h-[20px]">
              {emailChecking && <p className="text-xs text-gray-500">Checking email...</p>}
              {!emailChecking && emailExists === true && (
                <p className="text-xs font-medium text-red-600">
                  This email is already registered. Try signing in instead. {" "}
                  <Link href="/login/jobseeker" className="text-blue-600 underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
                <Label htmlFor="password" className="text-sm leading-5">Password *</Label>
              <Input
                  id="password"
                type={showPassword ? "text" : "password"}
                  required
                minLength={6}
                value={formData.password}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, password: value });
                  setPasswordMatchStatus(null);
                  setPasswordStrength(evaluatePasswordStrength(value));
                }}
                className="text-sm leading-5"
                endAdornment={
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="p-1"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="min-h-[48px] space-y-1">
                {passwordStrength && (
                  <>
                    <div className="h-1 rounded-full bg-gray-200">
                      <div
                        className={
                          passwordStrength === "strong"
                            ? "h-1 w-full rounded-full bg-green-500"
                            : passwordStrength === "medium"
                            ? "h-1 w-2/3 rounded-full bg-orange-500"
                            : "h-1 w-1/3 rounded-full bg-red-500"
                        }
              />
            </div>
                    <p
                      className={
                        passwordStrength === "strong"
                          ? "text-xs font-medium text-green-600"
                          : passwordStrength === "medium"
                          ? "text-xs font-medium text-orange-600"
                          : "text-xs font-medium text-red-600"
                      }
                    >
                      Password strength: {passwordStrength}
                    </p>
                  </>
                )}
            </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm leading-5">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                  required
            value={formData.confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, confirmPassword: value });
                  if (!value) {
                    setPasswordMatchStatus(null);
                  } else if (formData.password === value) {
                    setPasswordMatchStatus("match");
                  } else if (formData.password.startsWith(value)) {
                    setPasswordMatchStatus(null);
                  } else {
                    setPasswordMatchStatus("mismatch");
                  }
                }}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && formData.password && formData.password !== value) {
                    setPasswordMatchStatus("mismatch");
                  }
                }}
                className="text-sm leading-5"
                endAdornment={
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="p-1"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="min-h-[32px]">
                {passwordMatchStatus === "mismatch" && (
                  <p className="text-xs font-medium text-red-600">Passwords do not match.</p>
                )}
                {passwordMatchStatus === "match" && (
                  <p className="text-xs font-medium text-green-600">Password matched.</p>
                    )}
                  </div>
          </div>
        </div>

          <div className="flex justify-center">
            <Button type="submit" className="min-w-[180px]" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
                </Button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account? {" "}
            <Link href="/login/jobseeker" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );

  const mobileSteps: Array<{ key: keyof typeof formData; label: string }> = [
    { key: "name", label: "Full Name" },
    { key: "email", label: "Email" },
    { key: "password", label: "Password" },
    { key: "confirmPassword", label: "Confirm Password" },
  ];
  const totalMobileSteps = mobileSteps.length;
  const activeMobileStep = mobileSteps[Math.min(currentStep, totalMobileSteps - 1)];
  const mobileProgress = ((Math.min(currentStep, totalMobileSteps - 1) + 1) / totalMobileSteps) * 100;

  const renderMobileStepField = () => {
    switch (activeMobileStep.key) {
      case "name":
  return (
              <div className="space-y-2">
            <Label htmlFor="name-mobile" className="text-sm leading-5">Full Name *</Label>
                <Input
              id="name-mobile"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Doe"
              className="text-sm leading-5"
                />
              </div>
        );
      case "email":
                        return (
              <div className="space-y-2">
            <Label htmlFor="email-mobile" className="text-sm leading-5">Email *</Label>
                <Input
              id="email-mobile"
                  type="email"
                  required
                  value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailExists(null);
              }}
              onBlur={(e) => checkEmailExists(e.target.value)}
              placeholder="eg. yourname@gmail.com"
              className="text-sm leading-5"
            />
            <div className="min-h-[20px]">
              {emailChecking && <p className="text-xs text-gray-500">Checking email...</p>}
              {!emailChecking && emailExists === true && (
                <p className="text-xs font-medium text-red-600">
                  This email is already registered. Try signing in instead. {" "}
                  <Link href="/login/jobseeker" className="text-blue-600 underline">
                    Sign in
                  </Link>
                </p>
              )}
              </div>
              </div>
        );
      case "password":
        return (
              <div className="space-y-2">
            <Label htmlFor="password-mobile" className="text-sm leading-5">Password *</Label>
                <Input
              id="password-mobile"
              type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, password: value });
                setPasswordMatchStatus(null);
                setPasswordStrength(evaluatePasswordStrength(value));
              }}
              className="text-sm leading-5"
              endAdornment={
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="p-1"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {passwordStrength && (
              <div className="space-y-1">
                <div className="h-1 rounded-full bg-gray-200">
                  <div
                    className={
                      passwordStrength === "strong"
                        ? "h-1 w-full rounded-full bg-green-500"
                        : passwordStrength === "medium"
                        ? "h-1 w-2/3 rounded-full bg-orange-500"
                        : "h-1 w-1/3 rounded-full bg-red-500"
                    }
                />
              </div>
                <p
                  className={
                    passwordStrength === "strong"
                      ? "text-xs font-medium text-green-600"
                      : passwordStrength === "medium"
                      ? "text-xs font-medium text-orange-600"
                      : "text-xs font-medium text-red-600"
                  }
                >
                  Password strength: {passwordStrength}
                </p>
              </div>
            )}
              </div>
        );
      case "confirmPassword":
        return (
              <div className="space-y-2">
            <Label htmlFor="confirmPassword-mobile">Confirm Password *</Label>
                <Input
              id="confirmPassword-mobile"
              type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, confirmPassword: value });
                if (!value) {
                  setPasswordMatchStatus(null);
                } else if (formData.password === value) {
                  setPasswordMatchStatus("match");
                } else if (formData.password.startsWith(value)) {
                  setPasswordMatchStatus(null);
                } else {
                  setPasswordMatchStatus("mismatch");
                }
              }}
              onBlur={(e) => {
                const value = e.target.value;
                if (value && formData.password && formData.password !== value) {
                  setPasswordMatchStatus("mismatch");
                }
              }}
              endAdornment={
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="p-1"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {passwordMatchStatus === "mismatch" && (
              <p className="text-xs font-medium text-red-600">Passwords do not match.</p>
            )}
            {passwordMatchStatus === "match" && (
              <p className="text-xs font-medium text-green-600">Password matched.</p>
            )}
              </div>
        );
      default:
        return null;
    }
  };

  const validateMobileStep = async () => {
    switch (activeMobileStep.key) {
      case "name":
        if (!formData.name.trim()) {
          toast({ title: "Missing name", description: "Please enter your full name.", variant: "destructive" });
          return false;
        }
        return true;
      case "email":
        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
          toast({ title: "Invalid email", description: "Enter a valid email address.", variant: "destructive" });
          return false;
        }
        {
          const exists = await checkEmailExists(formData.email);
          if (exists) {
            toast({ title: "Email already used", description: "Try signing in instead.", variant: "destructive" });
            return false;
          }
        }
        return true;
      case "password":
        if (formData.password.length < 6) {
          toast({ title: "Weak password", description: "Password should be at least 6 characters long.", variant: "destructive" });
          return false;
        }
        return true;
      case "confirmPassword":
        if (formData.confirmPassword !== formData.password) {
          toast({ title: "Password mismatch", description: "Passwords do not match.", variant: "destructive" });
          setPasswordMatchStatus("mismatch");
          return false;
        }
        setPasswordMatchStatus("match");
        return true;
      default:
        return true;
    }
  };

  const handleMobileNext = async () => {
    if (currentStep >= totalMobileSteps - 1) return;
    const isValid = await validateMobileStep();
    if (!isValid) return;
    setCurrentStep((prev) => Math.min(prev + 1, totalMobileSteps - 1));
  };

  const handleMobilePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  if (isMobile) {
                        return (
      <div className={`min-h-screen bg-white lg:bg-purple-600 flex flex-col items-center justify-center gap-4 p-4 ${roboto.className}`}>
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Link href="/" className={cn("flex items-center gap-3 text-gray-900 lg:text-white", openSans.className)} style={{ fontSize: "32px", lineHeight: "40px", fontWeight: 600, fontStyle: "normal" }}>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-2xl font-semibold drop-shadow-[0_6px_12px_rgba(251,191,36,0.35)]">
                  ⚡
                </span>
                <span>FastLink 1.0</span>
              </Link>
                </div>
            <h1 className="text-2xl font-medium">
              Create Job Seeker Account
            </h1>
            <p className="text-sm text-gray-600">Join FastLink and find your dream job</p>
              </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {renderMobileStepField()}

            <div className="flex items-center justify-between gap-3">
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={handleMobilePrev}>
                  Back
                </Button>
              ) : (
                <span className="flex-1" />
              )}

              {currentStep < totalMobileSteps - 1 ? (
                <Button type="button" className="flex-1" onClick={handleMobileNext}>
                  Next
                </Button>
              ) : (
                <div className="flex justify-center">
                  <Button type="submit" className="min-w-[180px]" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
              </div>
              )}
              </div>
          </form>

          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full items-center justify-start text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span>
                Step {Math.min(currentStep + 1, totalMobileSteps)} of {totalMobileSteps}
              </span>
              </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${mobileProgress}%` }}
              />
            </div>

            <span className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">or</span>

            <div className="mt-2">
        <GoogleAuthButton intent="signup" userType="jobseeker" label="Sign up with Google" />
            </div>
        <Link
          href="/"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
        </Link>
      </div>
        </div>
      </div>
    );
  }

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

