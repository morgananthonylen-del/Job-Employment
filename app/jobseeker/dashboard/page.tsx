"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Search, FileEdit, PenTool, X, MapPin, Clock, Crown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function JobSeekerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [resumeBuilderOpen, setResumeBuilderOpen] = useState(false);
  const [aiApplicationOpen, setAiApplicationOpen] = useState(false);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobModalLoading, setJobModalLoading] = useState(false);
  const [userApplication, setUserApplication] = useState<any>(null);
  const [resumeFormData, setResumeFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    experience: "",
    education: "",
    skills: "",
  });
  const [profileData, setProfileData] = useState<any>(null);
  const [applicationLetterData, setApplicationLetterData] = useState({
    jobTitle: "",
    companyName: "",
    recipient: "",
    jobDescription: "",
    yourName: "",
    yourEmail: "",
    whyInterested: "",
    relevantExperience: "",
  });
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const existingJobIdsRef = useRef<Set<string>>(new Set());
  const existingApplicationIdsRef = useRef<Set<string>>(new Set());
  const resumeFormPopulatedRef = useRef(false);
  const isFetchingProfileRef = useRef(false);
  const lastProfileDataIdRef = useRef<string | null>(null);
  const applicationLetterFormPopulatedRef = useRef(false);
  const lastProfileDataIdForLetterRef = useRef<string | null>(null);

  // Memoize fetchData to prevent recreation on every render
  const fetchData = useCallback(async () => {
    // Only fetch once per session
    if (hasFetchedRef.current || isFetchingRef.current) {
      return;
    }

    // Check if data exists in sessionStorage (persists during browser session)
    const sessionKey = `dashboard_data_${localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").id : "guest"}`;
    const cachedData = sessionStorage.getItem(sessionKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        // Use cached data if less than 5 minutes old
        if (now - cacheTime < 5 * 60 * 1000) {
          setJobs(parsed.jobs || []);
          setApplications(parsed.applications || []);
          setProfileData(parsed.profile || null);
          setLoading(false);
          hasFetchedRef.current = true;
          
          // Track existing IDs
          (parsed.jobs || []).forEach((job: any) => {
            if (job.id) existingJobIdsRef.current.add(job.id);
          });
          (parsed.applications || []).forEach((app: any) => {
            if (app.id) existingApplicationIdsRef.current.add(app.id);
          });
          return;
        }
      } catch (e) {
        // If cache is invalid, continue with fetch
        console.error("Error parsing cached data:", e);
      }
    }

    isFetchingRef.current = true;
    try {
      const token = localStorage.getItem("token");
      
      const [jobsRes, appsRes, profileRes] = await Promise.all([
        fetch("/api/jobs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/applications/my-applications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      let jobsData: any[] = [];
      let appsData: any[] = [];
      let profile: any = null;

      if (jobsRes.ok) {
        jobsData = await jobsRes.json();
        // Filter for only featured (pro) jobs
        const featuredJobs = jobsData.filter((job: any) => job.promotion_tier === "pro");
        // Sort by date (newest first)
        featuredJobs.sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Descending (newest first)
        });
        const latestJobs = featuredJobs.slice(0, 5);
        jobsData = latestJobs;
        // Track existing job IDs
        latestJobs.forEach((job: any) => {
          if (job.id) existingJobIdsRef.current.add(job.id);
        });
      }

      if (appsRes.ok) {
        appsData = await appsRes.json();
        // Track existing application IDs
        appsData.forEach((app: any) => {
          if (app.id) existingApplicationIdsRef.current.add(app.id);
        });
      }

      if (profileRes.ok) {
        profile = await profileRes.json();
      }

      // Update state
      setJobs(jobsData);
      setApplications(appsData);
      setProfileData(profile);

      // Cache data in sessionStorage
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify({
          jobs: jobsData,
          applications: appsData,
          profile: profile,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.error("Error caching data:", e);
      }

      hasFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []); // Empty deps - function is stable

  // Function to add new items incrementally
  const addNewJob = (job: any) => {
    if (!job.id || existingJobIdsRef.current.has(job.id)) {
      return;
    }
    if (job.promotion_tier === "pro") {
      setJobs((prev) => {
        const updated = [job, ...prev].sort((a: any, b: any) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 5);
        return updated;
      });
      existingJobIdsRef.current.add(job.id);
    }
  };

  const addNewApplication = (application: any) => {
    if (!application.id || existingApplicationIdsRef.current.has(application.id)) {
      return;
    }
    setApplications((prev) => [application, ...prev]);
    existingApplicationIdsRef.current.add(application.id);
  };

  const handleViewJobDetails = async (jobId: string) => {
    setJobModalOpen(true);
    setJobModalLoading(true);
    setUserApplication(null);
    try {
      const token = localStorage.getItem("token");
      const [jobRes, appRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`/api/applications/job/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setSelectedJob(jobData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive",
        });
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        setUserApplication(appData);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setJobModalLoading(false);
    }
  };

  const calculateDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.userType !== "jobseeker") {
        router.push("/login");
        return;
      }
      // Only fetch if not already fetched
      if (!hasFetchedRef.current) {
        fetchData();
      } else {
        setLoading(false);
      }
    } else {
      router.push("/login");
    }
  }, [fetchData, router]);

  // Populate resume form when dialog opens and profile data is available
  useEffect(() => {
    if (resumeBuilderOpen) {
      // Fetch profile if not already loaded and not currently fetching
      if (!profileData && !isFetchingProfileRef.current) {
        isFetchingProfileRef.current = true;
        const fetchProfile = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/user/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const profile = await response.json();
              setProfileData(profile);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          } finally {
            isFetchingProfileRef.current = false;
          }
        };
        fetchProfile();
      }
      
      // Populate form only if we haven't populated yet, or if profileData just arrived
      const shouldPopulate = !resumeFormPopulatedRef.current || 
        (profileData && profileData.id !== lastProfileDataIdRef.current);
      
      if (shouldPopulate) {
        const dataSource = profileData || user;
        if (dataSource) {
          setResumeFormData(prev => ({
            fullName: dataSource.name || "",
            email: dataSource.email || "",
            phone: dataSource.phone_number || "",
            address: profileData?.address ? `${profileData.address}${profileData.city ? `, ${profileData.city}` : ""}` : "",
            summary: prev.summary || "",
            experience: profileData?.years_of_experience ? `${profileData.years_of_experience} years of experience` : prev.experience || "",
            education: prev.education || "",
            skills: prev.skills || "",
          }));
          
          // Mark as populated and track the profileData ID to prevent re-population
          resumeFormPopulatedRef.current = true;
          if (profileData?.id) {
            lastProfileDataIdRef.current = profileData.id;
          }
        }
      }
    } else {
      // Reset flags when dialog closes
      resumeFormPopulatedRef.current = false;
      isFetchingProfileRef.current = false;
      lastProfileDataIdRef.current = null;
    }
  }, [resumeBuilderOpen, profileData, user]);

  // Populate AI Application Letter form when dialog opens and profile data is available
  useEffect(() => {
    if (aiApplicationOpen) {
      // Fetch profile if not already loaded and not currently fetching
      if (!profileData && !isFetchingProfileRef.current) {
        isFetchingProfileRef.current = true;
        const fetchProfile = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await fetch("/api/user/profile", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const profile = await response.json();
              setProfileData(profile);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          } finally {
            isFetchingProfileRef.current = false;
          }
        };
        fetchProfile();
      }
      
      // Populate form only if we haven't populated yet, or if profileData just arrived
      const shouldPopulate = !applicationLetterFormPopulatedRef.current || 
        (profileData && profileData.id !== lastProfileDataIdForLetterRef.current);
      
      if (shouldPopulate) {
        const dataSource = profileData || user;
        if (dataSource) {
          setApplicationLetterData(prev => ({
            jobTitle: prev.jobTitle || "",
            companyName: prev.companyName || "",
            recipient: prev.recipient || "",
            jobDescription: prev.jobDescription || "",
            yourName: dataSource.name || "",
            yourEmail: dataSource.email || "",
            whyInterested: prev.whyInterested || "",
            relevantExperience: profileData?.years_of_experience ? `${profileData.years_of_experience} years of experience` : prev.relevantExperience || "",
          }));
          
          // Mark as populated and track the profileData ID to prevent re-population
          applicationLetterFormPopulatedRef.current = true;
          if (profileData?.id) {
            lastProfileDataIdForLetterRef.current = profileData.id;
          }
        }
      }
    } else {
      // Reset flags when dialog closes
      applicationLetterFormPopulatedRef.current = false;
      lastProfileDataIdForLetterRef.current = null;
    }
  }, [aiApplicationOpen, profileData, user]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Job Seeker Dashboard</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Welcome back, {user?.name?.split(" ")[0] || "User"}</p>
        </div>
        <Button asChild className="self-start hidden lg:inline-flex">
          <Link href="/jobseeker/jobs">
            <Search className="h-4 w-4 mr-2" />
            Browse Jobs
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {[
          {
            title: "Applications",
            value: applications.length,
            helper: "Total submitted",
            icon: <FileText className="h-16 w-16 text-blue-600" />,
            background: "",
            clickable: false,
          },
          {
            title: "Available Jobs",
            value: jobs.length,
            helper: "New opportunities",
            icon: <Briefcase className="h-16 w-16 text-emerald-600" />,
            background: "",
            clickable: false,
          },
          {
            title: "Resume Builder",
            value: "",
            helper: "Build your professional resume",
            icon: <FileEdit className="h-8 w-8 text-white" />,
            background: "from-purple-500 via-purple-600 to-pink-500",
            clickable: true,
            onClick: () => setResumeBuilderOpen(true),
          },
          {
            title: "Ai Application Letter",
            value: "",
            helper: "Generate personalized cover letters",
            icon: <PenTool className="h-8 w-8 text-white" />,
            background: "from-orange-500 via-red-500 to-pink-500",
            clickable: true,
            onClick: () => setAiApplicationOpen(true),
          },
        ].map((card) => {
          const hasBackground = card.background !== "";
          return (
          <Card
            key={card.title}
            className={`border border-gray-200 shadow-sm ${hasBackground ? `bg-gradient-to-r ${card.background} text-white` : "bg-white"} ${card.clickable ? "cursor-pointer hover:scale-105 transition-transform" : ""}`}
            onClick={card.clickable ? (e) => {
              e.preventDefault();
              card.onClick?.();
            } : undefined}
            role={card.clickable ? "button" : undefined}
            tabIndex={card.clickable ? 0 : undefined}
            onKeyDown={card.clickable ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.onClick?.();
              }
            } : undefined}
          >
            <CardContent className="flex flex-col h-full relative p-3 sm:p-4 md:p-6 min-h-[120px] sm:min-h-[140px]">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-1 sm:pb-2 relative z-10 px-0 pt-0">
                <CardTitle className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight ${hasBackground ? "text-white" : "text-gray-900"}`}>{card.title}</CardTitle>
              </CardHeader>
              {card.value && (
                <div className={`text-2xl sm:text-3xl md:text-4xl font-bold ${hasBackground ? "text-white" : "text-gray-900"} text-center flex-1 flex items-center justify-center relative z-10 py-1 sm:py-2`}>
                  {card.value}
                </div>
              )}
              <p className={`${hasBackground ? "text-white/80" : "text-gray-600"} text-xs sm:text-sm md:text-base relative z-10 mt-auto`}>{card.helper}</p>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bottom-0 flex items-center justify-center opacity-10 sm:opacity-20 md:opacity-100 pointer-events-none">
                <div className="scale-50 sm:scale-75 md:scale-100">
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Resume Builder Dialog */}
      <Dialog open={resumeBuilderOpen} onOpenChange={(open) => {
        setResumeBuilderOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setResumeFormData({
            fullName: "",
            email: "",
            phone: "",
            address: "",
            summary: "",
            experience: "",
            education: "",
            skills: "",
          });
        }
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6"
          style={{ backgroundColor: 'white' }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">Resume Builder</DialogTitle>
            <DialogDescription>
              {profileData ? "Your profile information has been pre-filled. Complete any missing details below." : "Fill in your information to create your resume. After submitting, you'll be able to choose from professional templates."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast({
                title: "Resume Information Saved",
                description: "Next, you'll be able to choose from professional Canva templates to design your resume.",
              });
              setResumeBuilderOpen(false);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={resumeFormData.fullName}
                  onChange={(e) => setResumeFormData({ ...resumeFormData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={resumeFormData.email}
                  onChange={(e) => setResumeFormData({ ...resumeFormData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={resumeFormData.phone}
                  onChange={(e) => setResumeFormData({ ...resumeFormData, phone: e.target.value })}
                  placeholder="+679 123 4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={resumeFormData.address}
                  onChange={(e) => setResumeFormData({ ...resumeFormData, address: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                value={resumeFormData.summary}
                onChange={(e) => setResumeFormData({ ...resumeFormData, summary: e.target.value })}
                placeholder="Brief overview of your professional background and goals..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Work Experience</Label>
              <Textarea
                id="experience"
                value={resumeFormData.experience}
                onChange={(e) => setResumeFormData({ ...resumeFormData, experience: e.target.value })}
                placeholder="List your work experience, including company names, positions, and dates..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Textarea
                id="education"
                value={resumeFormData.education}
                onChange={(e) => setResumeFormData({ ...resumeFormData, education: e.target.value })}
                placeholder="List your educational background, including degrees and institutions..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={resumeFormData.skills}
                onChange={(e) => setResumeFormData({ ...resumeFormData, skills: e.target.value })}
                placeholder="List your key skills and competencies..."
                rows={2}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full sm:w-auto"
                onClick={() => setResumeBuilderOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Continue to Template Selection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Application Letter Dialog */}
      <Dialog open={aiApplicationOpen} onOpenChange={(open) => {
        setAiApplicationOpen(open);
        if (!open) {
          // Reset form when dialog closes
          setApplicationLetterData({
            jobTitle: "",
            companyName: "",
            recipient: "",
            jobDescription: "",
            yourName: "",
            yourEmail: "",
            whyInterested: "",
            relevantExperience: "",
          });
        }
      }}>
        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-4 sm:p-6"
          style={{ backgroundColor: 'white' }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold">AI Application Letter</DialogTitle>
            <DialogDescription>
              Fill in the details below to generate a personalized cover letter for your job application.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast({
                title: "Application Letter Generated",
                description: "Your personalized cover letter has been generated successfully!",
              });
              setAiApplicationOpen(false);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={applicationLetterData.jobTitle}
                  onChange={(e) => setApplicationLetterData({ ...applicationLetterData, jobTitle: e.target.value })}
                  placeholder="Software Developer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={applicationLetterData.companyName}
                  onChange={(e) => setApplicationLetterData({ ...applicationLetterData, companyName: e.target.value })}
                  placeholder="ABC Company"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Who you're writing to</Label>
              <Input
                id="recipient"
                value={applicationLetterData.recipient}
                onChange={(e) => setApplicationLetterData({ ...applicationLetterData, recipient: e.target.value })}
                placeholder="Hiring Manager, HR Department, or specific name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={applicationLetterData.jobDescription}
                onChange={(e) => setApplicationLetterData({ ...applicationLetterData, jobDescription: e.target.value })}
                placeholder="Paste the job description or key requirements here..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  value={applicationLetterData.yourName}
                  onChange={(e) => setApplicationLetterData({ ...applicationLetterData, yourName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yourEmail">Your Email</Label>
                <Input
                  id="yourEmail"
                  type="email"
                  value={applicationLetterData.yourEmail}
                  onChange={(e) => setApplicationLetterData({ ...applicationLetterData, yourEmail: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whyInterested">Why are you interested in this position?</Label>
              <Textarea
                id="whyInterested"
                value={applicationLetterData.whyInterested}
                onChange={(e) => setApplicationLetterData({ ...applicationLetterData, whyInterested: e.target.value })}
                placeholder="Explain what draws you to this role and company..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relevantExperience">Relevant Experience</Label>
              <Textarea
                id="relevantExperience"
                value={applicationLetterData.relevantExperience}
                onChange={(e) => setApplicationLetterData({ ...applicationLetterData, relevantExperience: e.target.value })}
                placeholder="Describe your relevant work experience, skills, and achievements..."
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full sm:w-auto"
                onClick={() => setAiApplicationOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Generate Cover Letter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 sm:space-y-6">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Recent Applications</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Track your job applications</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
              {loading ? (
                <p className="text-center text-gray-500 py-4">Loading...</p>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Button asChild>
                    <Link href="/jobseeker/jobs">Browse Jobs</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app: any) => {
                    const job = app.job || {};
                    const business = job.business || {};
                    const statusColors: Record<string, string> = {
                      pending: "bg-amber-100 text-amber-800 border-amber-200",
                      shortlisted: "bg-blue-100 text-blue-800 border-blue-200",
                      rejected: "bg-red-100 text-red-800 border-red-200",
                      accepted: "bg-green-100 text-green-800 border-green-200",
                      interview: "bg-purple-100 text-purple-800 border-purple-200",
                    };
                    const statusColor = statusColors[app.status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
                    const appliedDate = app.created_at ? formatRelativeTime(app.created_at) : '';
                    
                    return (
                      <div
                        key={app.id}
                        className="block p-3 sm:p-4 rounded-lg bg-white border border-gray-100"
                      >
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            {business.company_logo_url && (
                              <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                <Image
                                  src={business.company_logo_url}
                                  alt={`${business.company_name || "Company"} logo`}
                                  width={48}
                                  height={48}
                                  className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm sm:text-base md:text-lg text-gray-900 truncate mb-1">
                                {job.title || "Job Position"}
                              </h4>
                              {business.company_name && (
                                <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1">
                                  {business.company_name}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-4 text-xs text-gray-500">
                                {job.location && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                  </span>
                                )}
                                {appliedDate && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Applied {appliedDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row items-center justify-between sm:flex-col sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (job?.id) {
                                  handleViewJobDetails(job.id);
                                }
                              }}
                              className="text-xs flex-1 sm:flex-initial h-8 sm:h-9"
                            >
                              View Details
                            </Button>
                            <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium border rounded ${statusColor} whitespace-nowrap`}>
                              {app.status 
                                ? app.status.toLowerCase() === "pending" 
                                  ? "Pending Review" 
                                  : app.status.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                : "Pending Review"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-sm w-full overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <CardTitle className="text-lg sm:text-xl">Featured Jobs</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest opportunities</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 w-full overflow-hidden">
              {loading ? (
                <p className="text-center text-gray-500 py-4">Loading...</p>
              ) : jobs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No jobs available</p>
              ) : (
                <div className="space-y-3 sm:space-y-4 w-full">
                  {jobs.map((job: any) => {
                    const isProFeatured = job.promotion_tier === "pro";
                    return (
                      <Card
                        key={job.id}
                        className={cn(
                          "bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full overflow-hidden",
                          isProFeatured && "border-amber-400 shadow-none hover:shadow-none"
                        )}
                        onClick={() => router.push(`/jobseeker/jobs/${job.id}`)}
                      >
                        <CardContent className="p-3 sm:p-4 md:p-6 w-full overflow-hidden">
                          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-start w-full">
                            <div className="space-y-2 sm:space-y-3 flex-1 min-w-0 w-full overflow-hidden">
                              <div className="flex items-start gap-2 sm:gap-3 w-full">
                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-lg border border-gray-200 bg-white flex-shrink-0">
                                  {job.business?.company_logo_url ? (
                                    <Image
                                      src={job.business.company_logo_url}
                                      alt={`${job.business?.company_name || "Company"} logo`}
                                      width={56}
                                      height={56}
                                      className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain"
                                    />
                                  ) : (
                                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                                  )}
                                </div>
                                <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3">
                                    <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 leading-tight break-words">{job.title}</h2>
                                    {isProFeatured && (
                                      <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 flex-shrink-0">
                                        <Crown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-500 break-words">
                                    {job.business?.company_name || job.business?.name || "Company"}
                                  </p>
                                </div>
                              </div>

                              {job.description && (
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-3 break-words">
                                  {job.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-4 text-xs text-gray-500">
                                {job.location && (
                                  <span className="inline-flex items-center gap-1 break-words">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span className="break-words">{job.location}</span>
                                  </span>
                                )}
                                {job.job_type && (
                                  <span className="inline-flex items-center gap-1 break-words">
                                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                                    <span className="break-words">{job.job_type}</span>
                                  </span>
                                )}
                                {job.salary && (
                                  <span className="inline-flex items-center gap-1 break-words">
                                    <span>💰</span>
                                    <span className="break-words">{job.salary}</span>
                                  </span>
                                )}
                                {job.created_at && (
                                  <span className="inline-flex items-center gap-1 break-words">
                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                    <span className="break-words">{formatRelativeTime(job.created_at)}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Job Vacancy Popup */}
      {jobModalOpen && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/80 px-2 sm:px-4 py-4 sm:py-10">
          <div className="relative flex w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white shadow-2xl" style={{ backgroundColor: 'white' }}>
            <button
              onClick={() => {
                setJobModalOpen(false);
                setSelectedJob(null);
                setUserApplication(null);
              }}
              className="absolute right-2 sm:right-4 top-2 sm:top-4 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {jobModalLoading ? (
                <div className="py-16 text-center text-gray-500">Loading job details…</div>
              ) : selectedJob ? (
                <div className="space-y-5">
                  {selectedJob.image_url && (
                    <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                      <Image
                        src={selectedJob.image_url}
                        alt={selectedJob.title || "Job image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{selectedJob.title || "Job Position"}</h2>
                    {selectedJob.business?.company_name && (
                      <p className="text-sm text-gray-500">{selectedJob.business.company_name}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                      {selectedJob.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedJob.location}
                        </span>
                      )}
                      {selectedJob.job_type && (
                        <span className="inline-flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {selectedJob.job_type}
                        </span>
                      )}
                      {selectedJob.created_at && (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatRelativeTime(selectedJob.created_at)}
                        </span>
                      )}
                      {selectedJob.salary && (
                        <span>💰 {selectedJob.salary}</span>
                      )}
                    </div>
                    
                    {/* Status Information */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
                      {(() => {
                        const daysLeft = calculateDaysLeft(selectedJob.application_deadline);
                        return daysLeft !== null && daysLeft >= 0 ? (
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium ${
                            daysLeft <= 3 
                              ? "bg-red-100 text-red-800 border border-red-200" 
                              : daysLeft <= 7 
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            <Clock className="h-3 w-3" />
                            {daysLeft === 0 ? "Closes today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                          </span>
                        ) : null;
                      })()}
                      
                      {userApplication && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          <FileText className="h-3 w-3" />
                          {userApplication.status && userApplication.status.toLowerCase() === "pending" 
                            ? "Pending Review" 
                            : userApplication.status === "shortlisted" ? "Shortlisted" :
                            userApplication.status === "accepted" ? "Accepted" :
                            userApplication.status === "rejected" ? "Not Selected" :
                            userApplication.status ? userApplication.status.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "Pending Review"}
                        </span>
                      )}
                      
                      {selectedJob.is_active === false && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          <Briefcase className="h-3 w-3" />
                          Position Filled
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedJob.description && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Description</h3>
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                        {selectedJob.description}
                      </p>
                    </section>
                  )}

                  {selectedJob.requirements && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Requirements</h3>
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                        {selectedJob.requirements}
                      </p>
                    </section>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4">
                    <Button variant="outline" onClick={() => {
                      setJobModalOpen(false);
                      setSelectedJob(null);
                      setUserApplication(null);
                    }} className="sm:w-auto">
                      Close
                    </Button>
                    <Button asChild className="sm:w-auto">
                      <Link href={`/jobseeker/jobs/${selectedJob.id}`}>
                        View Full Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">Job details unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

