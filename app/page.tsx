"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Briefcase, FileText, Users, MessageSquare, Bell, Shield, TrendingUp } from "lucide-react";
import Image from "next/image";
import { Open_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const openSans = Open_Sans({
  weight: ["400", "600", "700"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
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

const BUSINESS_TESTIMONIALS = [
  "\"The Pro listings gave my business better matches.\" — Rakesh, Suva",
  "\"Applicants came in ready, thanks to FastLink's guidance.\" — Leo, Sigatoka",
  "\"FastLink helped us find the perfect candidate in just 3 days!\" — Tech Solutions, Suva",
  "\"The quality of applicants through FastLink is outstanding.\" — Retail Plus, Nadi",
  "\"FastLink streamlined our hiring process completely.\" — Hospitality Group, Lautoka",
];

const slides = [
  {
    id: 1,
    image: "/jobseeker.png",
    title: "Job Seeker",
    link: "/login/jobseeker",
    registerLink: "/register/jobseeker",
  },
  {
    id: 2,
    image: "/business.png",
    title: "Business",
    link: "/login/business",
    registerLink: "/register/business",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"jobseeker" | "business">("jobseeker");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showHero, setShowHero] = useState(false);
  const [showImage, setShowImage] = useState(false);
  
  const currentTestimonials = activeTab === "jobseeker" ? JOBSEEKER_TESTIMONIALS : BUSINESS_TESTIMONIALS;
  const currentTestimonial = currentTestimonials[testimonialIndex];

  useEffect(() => {
    // Check if user is already logged in
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          if (userData.role === "jobseeker" || userData.userType === "jobseeker") {
            router.replace("/jobseeker/dashboard");
            return;
          } else if (userData.role === "business" || userData.userType === "business") {
            router.replace("/business/dashboard");
            return;
          }
        } catch (e) {
          // Invalid user data, continue to landing page
        }
      }
    }

    // Set slide based on active tab
    if (activeTab === "jobseeker") {
      setCurrentSlide(0);
    } else {
      setCurrentSlide(1);
    }

    // Reset testimonial index when tab changes
    setTestimonialIndex(0);
  }, [router, activeTab]);

  // Animate hero text first, then image
  useEffect(() => {
    setShowHero(false);
    setShowImage(false);
    
    // Hero text slides in first
    const heroTimer = setTimeout(() => {
      setShowHero(true);
    }, 100);

    // Image appears after hero text
    const imageTimer = setTimeout(() => {
      setShowImage(true);
    }, 600);

    return () => {
      clearTimeout(heroTimer);
      clearTimeout(imageTimer);
    };
  }, [activeTab]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (currentTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % currentTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentTestimonials]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setActiveTab(index === 0 ? "jobseeker" : "business");
  };

  return (
    <div className={`min-h-screen bg-purple-600 flex flex-col ${openSans.className}`}>
      {/* Top Navigation */}
      <div className="w-full px-4 lg:px-8 pt-4">
        <div className="flex justify-end">
          <div className="flex items-center gap-2 text-white">
            <Link href="/login/jobseeker" className="pb-0.5 border-b-2 border-transparent hover:border-white transition-all">
              Job Seeker
            </Link>
            <span>|</span>
            <Link href="/login/business" className="pb-0.5 border-b-2 border-transparent hover:border-white transition-all">
              Company
            </Link>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-5xl mx-auto flex-col flex-1 px-4 lg:px-8 pt-4 lg:pt-8">
        <div className={cn(
          "flex flex-col items-center justify-center gap-2 mb-8 transition-all duration-500 ease-out",
          showHero ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        )}>
          <Link href="/" className={cn("flex items-center gap-4 text-white", openSans.className)} style={{ fontSize: "48px", lineHeight: "56px", fontWeight: 600, fontStyle: "normal" }}>
            <span>Introducing</span>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-4xl font-semibold drop-shadow-[0_6px_12px_rgba(251,191,36,0.35)]">
              ⚡
            </span>
            <span>FastLink 1.0</span>
          </Link>
          <p className="text-white text-2xl">Connecting Fiji companies with talented job seekers</p>
        </div>
      </div>

      {/* Slideshow */}
      <div className="relative w-full flex-1 flex items-end">
        <div className={cn(
          "relative w-full max-w-5xl mx-auto h-[70vh] overflow-hidden px-4 lg:px-8 pb-0 transition-opacity duration-500 ease-in-out",
          showImage ? "opacity-100" : "opacity-0"
        )}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-in-out",
                index === currentSlide 
                  ? "opacity-100 z-10 translate-x-0" 
                  : index < currentSlide
                  ? "opacity-0 z-0 -translate-x-full"
                  : "opacity-0 z-0 translate-x-full"
              )}
            >
              <div className="relative w-full h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain"
                  priority={index === currentSlide}
                />
              </div>
            </div>
          ))}

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white pt-40 pb-40 px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Action Buttons */}
          <div className="flex justify-center gap-0 -mt-40 mb-8">
            <button
              onClick={() => setActiveTab("jobseeker")}
              className={cn(
                "px-8 py-3 text-lg font-semibold rounded-r-none transition-all",
                activeTab === "jobseeker"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              )}
            >
              Job Seeker
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={cn(
                "px-8 py-3 text-lg font-semibold rounded-l-none transition-all",
                activeTab === "business"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              )}
            >
              Company
            </button>
          </div>

          <div className="w-full pt-8">
            {/* Job Seeker Features */}
            {activeTab === "jobseeker" && (
              <div className="w-full">
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Job Seekers</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Search className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Browse Jobs</h4>
                          <p className="text-base text-gray-600">Find opportunities that match your skills and interests</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Easy Applications</h4>
                          <p className="text-base text-gray-600">Apply quickly with AI-powered assistance and document management</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Bell className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Track Applications</h4>
                          <p className="text-base text-gray-600">Monitor your application status and get real-time updates</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Direct Messaging</h4>
                          <p className="text-base text-gray-600">Communicate directly with employers and ask questions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Users className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Save Jobs</h4>
                          <p className="text-base text-gray-600">Bookmark your favorite positions for later review</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Shield className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Profile Management</h4>
                          <p className="text-base text-gray-600">Create and manage your professional profile with documents</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Business Features */}
            {activeTab === "business" && (
              <div className="w-full">
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">For Companies (HR's + Managers) & Business Owners</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Briefcase className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Post Jobs</h4>
                          <p className="text-base text-gray-600">List your vacancies easily with detailed job descriptions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Users className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Find Candidates</h4>
                          <p className="text-base text-gray-600">Connect with talented job seekers across Fiji</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <Shield className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Manage Applications</h4>
                          <p className="text-base text-gray-600">Review, filter, and organize candidate applications</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <TrendingUp className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Pro Features</h4>
                          <p className="text-base text-gray-600">Boost visibility with featured listings and promotions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <MessageSquare className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Candidate Messaging</h4>
                          <p className="text-base text-gray-600">Communicate directly with applicants and schedule interviews</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border border-gray-200 shadow-sm bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Analytics Dashboard</h4>
                          <p className="text-base text-gray-600">Track job performance and application metrics</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-purple-600 py-12 px-4 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            {/* Testimonials on the left */}
            <div className="flex-1">
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

            {/* Call to Action on the right */}
            <div className="flex-1 flex flex-col items-center lg:items-start border-2 border-white rounded-lg p-8">
              <h3 className="text-3xl font-bold text-white mb-6 text-center lg:text-left">
                {activeTab === "jobseeker" 
                  ? "Are you ready to start finding a job?"
                  : "Are you ready to start hiring?"}
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link href={activeTab === "jobseeker" ? "/register/jobseeker" : "/register/business"} className="flex-1">
                  <Button size="lg" className="w-full bg-blue-600 text-white hover:bg-blue-700 border-2 border-white">
                    Sign Up
                  </Button>
                </Link>
                <Link href={activeTab === "jobseeker" ? "/login/jobseeker" : "/login/business"} className="flex-1">
                  <Button size="lg" variant="outline" className="w-full border-2 border-white text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
