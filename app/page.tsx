"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Briefcase, FileText, Users, MessageSquare, Bell, Shield, TrendingUp, Sparkles, Bot, Bookmark } from "lucide-react";
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
      <div className="sticky top-0 z-50 w-full bg-white shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className={cn("flex items-center gap-3", openSans.className)} style={{ fontSize: "28px", lineHeight: "32px", fontWeight: 600, fontStyle: "normal" }}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-2xl font-semibold drop-shadow-[0_4px_8px_rgba(251,191,36,0.35)]">
                ⚡
              </span>
              <span className="text-gray-900">FastLink</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login/jobseeker" className="px-4 py-2 text-gray-700 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600 transition-all font-medium">
                Job Seeker
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/login/business" className="px-4 py-2 text-gray-700 hover:text-purple-600 border-b-2 border-transparent hover:border-purple-600 transition-all font-medium">
                Company
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-7xl mx-auto flex-col flex-1 px-4 lg:px-8 pt-8 lg:pt-12">
        <div className={cn(
          "flex flex-col items-center justify-center gap-2 mb-8 transition-all duration-500 ease-out",
          showHero ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        )}>
          <p className="text-white text-2xl lg:text-3xl text-center">Connecting Fiji companies with talented job seekers</p>
        </div>
      </div>

      {/* Slideshow */}
      <div className="relative w-full flex-1 flex items-end">
        <div className={cn(
          "relative w-full max-w-7xl mx-auto h-[70vh] overflow-hidden px-4 lg:px-8 pb-0 transition-opacity duration-500 ease-in-out",
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
        <div className="max-w-7xl mx-auto">
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
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Fastlink</h3>
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Left Column - Main Features */}
                  <div className="flex-1 lg:flex-[2] space-y-6 w-full">
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Search className="h-10 w-10 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Find Your Dream Job</h4>
                            <p className="text-base text-gray-600 mb-3">Browse thousands of job opportunities across Fiji. From Suva to Nadi, Lautoka to Labasa - discover positions that match your skills, experience, and career goals.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Sarah from Nadi found her marketing role in just 3 days using our smart job matching!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <FileText className="h-10 w-10 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Streamlined Application Process</h4>
                            <p className="text-base text-gray-600 mb-3">Apply to multiple jobs in minutes, not hours. Our one-click application system saves your documents and personalizes each application automatically.</p>
                            <p className="text-sm text-gray-500 italic">Example: "James applied to 10 jobs in 15 minutes - something that used to take him 3 hours!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Bell className="h-10 w-10 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Application Tracking</h4>
                            <p className="text-base text-gray-600 mb-3">Never wonder about your application status again. Get instant notifications when employers view your profile, shortlist you, or schedule interviews.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Priya got notified the moment her application was reviewed - she prepared and got the job!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <MessageSquare className="h-10 w-10 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Direct Employer Communication</h4>
                            <p className="text-base text-gray-600 mb-3">Ask questions, clarify job details, and build relationships with employers before you even apply. Stand out from other candidates.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Daniel asked about work hours and got a response in 2 hours - he knew it was the right fit!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Bookmark className="h-10 w-10 text-indigo-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Save & Organize Jobs</h4>
                            <p className="text-base text-gray-600 mb-3">Bookmark your favorite positions and organize them by priority. Never lose track of opportunities that interest you.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Elena saved 20 jobs and organized them by location - made her job search so much easier!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-teal-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Shield className="h-10 w-10 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure Document Management</h4>
                            <p className="text-base text-gray-600 mb-3">Store and manage all your professional documents securely. Upload your CV, certificates, and references in one place.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Karishma uploaded all her documents once and uses them for every application - saves so much time!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Amanda AI */}
                  <div className="flex-1 lg:flex-[1.5] w-full lg:sticky lg:top-8 lg:self-start lg:h-fit">
                    <Card className="border-4 border-blue-400 shadow-2xl bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 transform hover:scale-[1.02] transition-transform duration-300">
                      <CardContent className="p-10">
                        <div className="text-center mb-8 relative">
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            AI POWERED
                          </div>
                          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 mb-5 shadow-xl ring-4 ring-blue-200">
                            <Bot className="h-12 w-12 text-white" />
                          </div>
                          <h4 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Amanda AI</h4>
                          <p className="text-lg text-gray-700 font-medium">Your Personal Career Assistant</p>
                          <p className="text-sm text-gray-500 mt-2">Powered by Advanced AI Technology</p>
                        </div>
                        <div className="space-y-6">
                          <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                  <Sparkles className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">AI Resume Creator</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Create professional, ATS-friendly resumes tailored to each job. Amanda analyzes job descriptions and optimizes your resume automatically.</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                                  <FileText className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">AI Application Letter</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Generate personalized cover letters in seconds. Amanda crafts compelling letters that highlight your unique fit for each position.</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                                  <Search className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">Smart Job Matching</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Amanda learns your preferences and suggests jobs you'll love. Save time by focusing on opportunities that truly match your goals.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Example Application Letter Showcase */}
                        <div className="mt-8 bg-white rounded-xl border-4 border-blue-400 shadow-xl overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 px-5 py-3">
                            <h5 className="text-base font-bold text-white flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Example Application Letter
                            </h5>
                          </div>
                          <div className="p-4 max-h-64 overflow-y-auto">
                            <div className="space-y-3 text-xs text-gray-700">
                              <div>
                                <p className="font-semibold mb-1">Dear Hiring Manager,</p>
                                <p className="leading-relaxed">I am writing to express my strong interest in the Marketing Coordinator position at your company. With 3 years of experience in digital marketing and a proven track record of increasing brand engagement by 40%, I am excited about the opportunity to contribute to your team.</p>
                              </div>
                              <div>
                                <p className="leading-relaxed">In my previous role at ABC Company, I successfully managed social media campaigns that reached over 50,000 users and developed content strategies that aligned with business objectives. My expertise in SEO, content creation, and analytics makes me an ideal candidate for this role.</p>
                              </div>
                              <div>
                                <p className="leading-relaxed">I am particularly drawn to your company's commitment to innovation and would welcome the opportunity to discuss how my skills can help drive your marketing initiatives forward.</p>
                              </div>
                              <div>
                                <p className="leading-relaxed">Thank you for considering my application. I look forward to hearing from you.</p>
                                <p className="mt-2 font-semibold">Sincerely,<br />[Your Name]</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-blue-50 px-4 py-2 border-t border-blue-200">
                            <p className="text-xs text-gray-600 italic">✨ Generated by Amanda AI in 5 seconds</p>
                          </div>
                        </div>
                        
                        <div className="mt-8 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-300 shadow-md">
                          <p className="text-base text-gray-800 italic leading-relaxed font-medium">"Amanda helped me create 5 tailored resumes in 10 minutes. I got 3 interviews!"</p>
                          <p className="text-sm text-gray-600 mt-2 font-semibold">- Maria, Suva</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Business Features */}
            {activeTab === "business" && (
              <div className="w-full">
                <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Fastlink</h3>
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column - Main Features */}
                  <div className="flex-1 lg:flex-[2] space-y-6">
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Briefcase className="h-10 w-10 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Post Jobs in Minutes</h4>
                            <p className="text-base text-gray-600 mb-3">Create compelling job listings with our intuitive interface. Reach thousands of qualified candidates across Fiji instantly. Free listings available, or boost with Pro features for maximum visibility.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Tech Solutions posted a developer role and received 25 qualified applications in the first 24 hours!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Users className="h-10 w-10 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Access Top Talent Pool</h4>
                            <p className="text-base text-gray-600 mb-3">Connect with skilled professionals actively seeking opportunities. Our platform attracts motivated candidates from Suva, Nadi, Lautoka, and across Fiji.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Retail Plus found their store manager from a pool of 50+ applicants - the perfect match in just 5 days!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-green-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <Shield className="h-10 w-10 text-green-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Streamlined Application Management</h4>
                            <p className="text-base text-gray-600 mb-3">Organize, filter, and review applications with ease. Our smart system helps you identify top candidates quickly and manage your hiring pipeline efficiently.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Hospitality Group reviewed 30 applications in 2 hours using our filtering tools - saved 8 hours of work!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <TrendingUp className="h-10 w-10 text-amber-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Pro Features for Maximum Impact</h4>
                            <p className="text-base text-gray-600 mb-3">Boost your job listings with featured placement, priority visibility, and advanced analytics. Get 3x more applications with Pro tier listings.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Rakesh's Pro listing got 80 applications vs 15 for free - he hired the perfect candidate in 1 week!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border border-gray-200 shadow-sm bg-gradient-to-br from-pink-50 to-white">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center">
                            <MessageSquare className="h-10 w-10 text-pink-600" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Direct Candidate Communication</h4>
                            <p className="text-base text-gray-600 mb-3">Engage with candidates before they apply. Answer questions, provide details, and build relationships that lead to better hires.</p>
                            <p className="text-sm text-gray-500 italic">Example: "Leo answered 5 candidate questions and found his ideal hire through meaningful conversations!"</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Amanda AI */}
                  <div className="flex-1 lg:flex-[1.5]">
                    <Card className="border-4 border-purple-400 shadow-2xl bg-gradient-to-br from-purple-100 via-blue-50 to-pink-50 sticky top-8 transform hover:scale-[1.02] transition-transform duration-300">
                      <CardContent className="p-10">
                        <div className="text-center mb-8 relative">
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                            AI POWERED
                          </div>
                          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-600 to-red-500 mb-5 shadow-xl ring-4 ring-purple-200">
                            <Bot className="h-12 w-12 text-white" />
                          </div>
                          <h4 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Amanda AI</h4>
                          <p className="text-lg text-gray-700 font-medium">Your Hiring Intelligence Assistant</p>
                          <p className="text-sm text-gray-500 mt-2">Powered by Advanced AI Technology</p>
                        </div>
                        <div className="space-y-6">
                          <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                                  <Sparkles className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">AI Candidate Selection</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Amanda analyzes applications and ranks candidates based on job requirements. Save hours of manual screening.</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                                  <Users className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">Smart Candidate Matching</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Get AI-powered recommendations of the best-fit candidates. Amanda learns your preferences and suggests top matches.</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-6 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                                  <FileText className="h-7 w-7 text-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-2 text-xl">Application Review Assistant</h5>
                                <p className="text-base text-gray-700 leading-relaxed">Amanda helps you review applications faster by highlighting key qualifications and flagging top candidates.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 shadow-md">
                          <p className="text-base text-gray-800 italic leading-relaxed font-medium">"Amanda helped us identify 3 perfect candidates from 50 applications in minutes!"</p>
                          <p className="text-sm text-gray-600 mt-2 font-semibold">- Tech Solutions, Suva</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-purple-600 py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
