"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Filter, Search, MapPin, Briefcase, Clock, FileText, X, Star, RefreshCw, Sparkles, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ApplicationsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vacancyModalOpen, setVacancyModalOpen] = useState(false);
  const [vacancyLoading, setVacancyLoading] = useState(false);
  const [vacancyJob, setVacancyJob] = useState<any>(null);
  const [jobProgress, setJobProgress] = useState<Record<string, any>>({});
  const [progressLoading, setProgressLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [aiSelectionOpen, setAiSelectionOpen] = useState(false);
  const [aiSelectionCount, setAiSelectionCount] = useState("3");
  const [aiSelectionLoading, setAiSelectionLoading] = useState(false);
  const [aiSelectionResults, setAiSelectionResults] = useState<AiRecommendation[]>([]);
  const [aiSelectionError, setAiSelectionError] = useState<string | null>(null);
  const [aiSelectionShowInfo, setAiSelectionShowInfo] = useState(false);
  const [aiSelectionHints, setAiSelectionHints] = useState<{
    ethnicity?: string;
    gender?: string;
  }>({});
  const [aiSelectionAgeRange, setAiSelectionAgeRange] = useState<{ min: number; max: number }>({
    min: 21,
    max: 60,
  });

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please log in to view applications",
          variant: "destructive",
        });
        router.push("/login/business");
        return;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response: Response;
      try {
        response = await fetch("/api/applications/business", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Handle network errors specifically
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please check your internet connection and try again.");
        }
        if (fetchError.message === 'Failed to fetch' || fetchError.name === 'TypeError') {
          throw new Error("Unable to connect to server. Please check if the development server is running.");
        }
        throw fetchError;
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast({
            title: "Access denied",
            description: "Please log in again",
            variant: "destructive",
          });
          router.push("/login/business");
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch applications" }));
        throw new Error(errorData.error || errorData.message || `Failed to fetch applications: ${response.status}`);
      }

      const data = await response.json();
      setApplications(data || []);
      
      const jobIds: string[] = Array.from(
        new Set<string>(
          (data || [])
            .map((app: any) => app.job?.id)
            .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
        )
      );
      
      if (jobIds.length) {
        await fetchJobProgress(jobIds);
      } else {
        setJobProgress({});
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error loading applications",
        description: error.message || "Failed to fetch applications. Please try again.",
        variant: "destructive",
      });
      setApplications([]);
      setJobProgress({});
    } finally {
      setLoading(false);
    }
  };

  const fetchJobProgress = async (jobIds: string[]) => {
    try {
      setProgressLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const entries = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const response = await fetch(`/api/jobs/${jobId}/review-progress`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to load review progress");
            const data = await response.json();
            return [jobId, data] as const;
          } catch (error) {
            console.error("Error fetching review progress for job", jobId, error);
            return null;
          }
        })
      );

      const map: Record<string, any> = {};
      entries.forEach((entry) => {
        if (entry) {
          const [jobId, data] = entry;
          map[jobId] = data;
        }
      });
      setJobProgress(map);
    } finally {
      setProgressLoading(false);
    }
  };

  useEffect(() => {
    if (reviewModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [reviewModalOpen]);

  const openReviewModal = async (applicationId: string) => {
    setReviewModalOpen(true);
    setActiveReviewId(applicationId);
    setReviewData(null);
    setReviewNotes("");
    setReviewRating(0);
    await fetchReviewDetails(applicationId);
  };

  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setActiveReviewId(null);
    setReviewData(null);
    setReviewNotes("");
    setReviewRating(0);
    setAiSelectionResults([]);
    setAiSelectionOpen(false);
  };

  const fetchReviewDetails = async (applicationId: string) => {
    try {
      setReviewLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authorization required",
          description: "Please log in again and retry.",
          variant: "destructive",
        });
        handleCloseReviewModal();
        return;
      }

      const response = await fetch(`/api/applications/${applicationId}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load application review");
      }

      const data: ReviewResponse = await response.json();
      setReviewData(data);
      setReviewNotes(data.review?.note || "");
      setReviewRating(data.review?.rating || 0);
    } catch (error: any) {
      toast({
        title: "Failed to load applicant",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      handleCloseReviewModal();
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSaveReview = async (advance: boolean) => {
    if (!activeReviewId || !reviewData) return;
    if (reviewRating === 0) {
      toast({
        title: "Add a rating",
        description: "Please select a star rating before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      setReviewSaving(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired. Please log in again.");

      const response = await fetch(`/api/applications/${activeReviewId}/review`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: reviewRating,
          note: reviewNotes,
          advance,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || "Failed to save review");
      }

      const result = await response.json();
      toast({
        title: "Review saved",
        description: advance
          ? "Moving to the next applicant."
          : "You can continue reviewing at any time.",
      });

      await fetchApplications();
      if (advance && result?.nextApplicationId) {
        await fetchReviewDetails(result.nextApplicationId);
        setActiveReviewId(result.nextApplicationId);
      } else if (advance && !result?.nextApplicationId) {
        setReviewData((prev) =>
          prev
            ? {
                ...prev,
                progress: {
                  ...prev.progress,
                  nextApplicationId: null,
                },
              }
            : prev
        );
      } else {
        await fetchReviewDetails(activeReviewId);
      }
    } catch (error: any) {
      toast({
        title: "Unable to save review",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewSaving(false);
    }
  };

  const openAiSelection = () => {
    setAiSelectionOpen(true);
    setAiSelectionError(null);
    setAiSelectionResults([]);
    setAiSelectionHints({});
    setAiSelectionShowInfo(false);
    setAiSelectionAgeRange({ min: 21, max: 60 });
  };

  const closeAiSelection = () => {
    if (aiSelectionLoading) return;
    setAiSelectionOpen(false);
    setAiSelectionError(null);
    setAiSelectionCount("3");
    setAiSelectionShowInfo(false);
    setAiSelectionHints({});
    setAiSelectionAgeRange({ min: 21, max: 60 });
  };

  const runAiSelection = async () => {
    if (!reviewData?.application?.jobId) {
      setAiSelectionError("Missing job information for this applicant.");
      return;
    }

    const count = parseInt(aiSelectionCount, 10);
    if (Number.isNaN(count) || count <= 0) {
      setAiSelectionError("Enter a number greater than zero.");
      return;
    }

    try {
      setAiSelectionLoading(true);
      setAiSelectionError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Session expired. Sign in again.");

      const response = await fetch(`/api/jobs/${reviewData.application.jobId}/ai-select`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count,
          hints: {
            age: `${aiSelectionAgeRange.min}-${aiSelectionAgeRange.max}`,
            ethnicity:
              aiSelectionHints.ethnicity && aiSelectionHints.ethnicity !== "any"
                ? aiSelectionHints.ethnicity
                : undefined,
            gender:
              aiSelectionHints.gender && aiSelectionHints.gender !== "any"
                ? aiSelectionHints.gender
                : undefined,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "AI selection failed");
      }

      const data = await response.json();
      setAiSelectionResults(data.recommendations || []);
      toast({
        title: "AI shortlist ready",
        description: "Candidates have been ranked for you.",
      });
      setAiSelectionOpen(false);
    } catch (error: any) {
      setAiSelectionError(error.message || "Unable to run AI selection right now.");
    } finally {
      setAiSelectionLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_seeker?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_seeker?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "shortlisted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-white text-gray-800 border border-gray-200";
    }
  };

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "Now";
    const created = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return "Now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const closeVacancyModal = () => {
    setVacancyModalOpen(false);
    setVacancyJob(null);
  };

  const openVacancyModal = async (jobId?: string) => {
    if (!jobId) {
      toast({
        title: "Vacancy not found",
        description: "We could not locate the vacancy details for this application.",
        variant: "destructive",
      });
      return;
    }

    const existing = applications.find((app) => app.job?.id === jobId)?.job || null;
    setVacancyJob(existing ? { ...existing } : null);
    setVacancyModalOpen(true);
    setVacancyLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error("Unable to load vacancy details");
      }

      const data = await response.json();
      setVacancyJob(data);
    } catch (error: any) {
      toast({
        title: "Unable to load vacancy",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setVacancyModalOpen(false);
      setVacancyJob(null);
    } finally {
      setVacancyLoading(false);
    }
  };

  const resumableJobs = useMemo(
    () =>
      Object.values(jobProgress).filter(
        (item: any) => item?.summary?.nextApplicationId
      ),
    [jobProgress]
  );

  return (
    <>
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-2">Manage all candidate applications</p>
          </div>
        </div>

        {resumableJobs.length > 0 && (
          <div className="mb-6 space-y-3">
            {resumableJobs.map((item: any) => (
              <Card
                key={item.job.id}
                className="border border-blue-200 bg-blue-50/70 shadow-sm"
              >
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
                  <div className="space-y-1 text-sm text-blue-900">
                    <p className="text-base font-semibold">
                      Resume reviewing for {item.job.title || "your job"}
                    </p>
                    <p>
                      Reviewed {item.summary.reviewedCount} of {item.summary.totalApplications} applicants.
                    </p>
                    {progressLoading && (
                      <p className="inline-flex items-center gap-1 text-xs text-blue-700">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Updating progress…
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        if (item.summary.nextApplicationId) {
                          openReviewModal(item.summary.nextApplicationId);
                        }
                      }}
                    >
                      Resume reviewing
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/business/jobs/${item.job.id}/applications`)
                      }
                    >
                      View job queue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by job title, candidate name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : filteredApplications.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-md">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "No applications found matching your filters"
                  : "No applications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((app) => {
              const jobId = app.job?.id;
              const progressData = jobId ? jobProgress[jobId] : undefined;
              const queueEntry = progressData?.queue?.find(
                (entry: any) => entry.id === app.id
              );
              const manualRating = queueEntry?.manualRating || null;
              const aiRating = queueEntry?.aiRating || null;
              const reviewedPosition = queueEntry?.position || null;
              const isNextUp = progressData?.summary?.nextApplicationId === app.id;
              const totalForJob = progressData?.summary?.totalApplications ?? null;

              return (
                <Card
                  key={app.id}
                  className={cn(
                    "bg-white border-gray-200 shadow-md transition hover:shadow-lg",
                    isNextUp && "border-blue-300 ring-2 ring-blue-200"
                  )}
                >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.job?.title || "Job"}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          getStatusColor(app.status)
                        )}
                      >
                        {app.status}
                      </span>
                      {manualRating && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          {manualRating}/5
                        </span>
                      )}
                      {!manualRating && aiRating && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          <Star className="h-3 w-3 text-blue-600" />
                          AI {aiRating}/5
                        </span>
                      )}
                      {reviewedPosition && totalForJob && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                          {reviewedPosition} / {totalForJob}
                        </span>
                      )}
                      {isNextUp && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          Next to review
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        {app.job_seeker?.avatar_url ? (
                          <Image
                            src={app.job_seeker.avatar_url}
                            alt={app.job_seeker?.name || "Candidate avatar"}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>Photo</span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <strong>Candidate:</strong> {app.job_seeker?.name || "N/A"}
                        </p>
                        <p>
                          <strong>Email:</strong> {app.job_seeker?.email || "N/A"}
                        </p>
                        <p>
                          <strong>Location:</strong> {app.job?.location || "N/A"}
                        </p>
                        {app.job_seeker?.years_of_experience !== undefined && (
                          <p>
                            <strong>Experience:</strong> {app.job_seeker.years_of_experience} years
                          </p>
                        )}
                        {app.resume_url && (
                          <p className="flex items-center gap-2">
                            <strong>Resume:</strong>
                            <Button variant="ghost" asChild className="px-0 h-auto text-blue-600">
                              <a href={app.resume_url} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-gray-500">Applied: {formatRelativeTime(app.created_at)}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVacancyModal(app.job?.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Vacancy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewModal(app.id)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    {reviewModalOpen && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-8">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleCloseReviewModal}
        />
        <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {reviewLoading && !reviewData ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-gray-600">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading applicant…</p>
            </div>
          ) : reviewData ? (
            <>
              <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Review {reviewData.application.jobSeeker?.name || "Applicant"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {reviewData.application.jobTitle || "Job title unavailable"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Reviewed {reviewData.progress?.position ?? 0} of {reviewData.progress?.total ?? 0} applicants
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={openAiSelection}
                    className="bg-pink-500 hover:bg-pink-600 text-white border-transparent"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Let Amanda select for you
                  </Button>
                  <Button variant="ghost" onClick={handleCloseReviewModal}>
                    Continue reviewing later
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[7fr_5fr]">
                <div className="space-y-6">
                  <section className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-800">Email:</span>{" "}
                      {reviewData.application.jobSeeker?.email || "Not provided"}
                    </p>
                    <p className="mt-2">
                      <span className="font-semibold text-gray-800">Applied:</span>{" "}
                      {formatRelativeTime(reviewData.application.createdAt)}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Cover letter</h3>
                    <p className="whitespace-pre-line rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                      {reviewData.application.coverLetter || "No cover letter supplied."}
                    </p>
                  </section>

                  {reviewData.application.resumeUrl && (
                    <section className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
                      <Button variant="outline" asChild>
                        <a
                          href={reviewData.application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View resume
                        </a>
                      </Button>
                    </section>
                  )}

                  <section className="space-y-3">
                    <Label htmlFor="review-notes-modal">Notes (optional)</Label>
                    <Textarea
                      id="review-notes-modal"
                      rows={4}
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      placeholder="Keep track of interview feedback or discussion points."
                    />
                  </section>
                </div>

                <div className="space-y-4">
                  {reviewData.aiSuggestion?.rating ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      <p className="font-semibold">
                        AI suggestion: {reviewData.aiSuggestion.rating} star
                        {reviewData.aiSuggestion.rating > 1 ? "s" : ""}
                      </p>
                      {reviewData.aiSuggestion.summary && (
                        <p className="mt-1 text-blue-700/90">{reviewData.aiSuggestion.summary}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      <p className="font-semibold text-gray-700">AI suggestion unavailable</p>
                      <p className="mt-1">Once the applicant documents are processed we’ll show the AI summary here.</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <p className="font-semibold uppercase tracking-wide text-gray-500">Job details</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>
                        <span className="font-medium text-gray-800">Role:</span>{" "}
                        {reviewData.application.jobTitle || "—"}
                      </li>
                      <li>
                        <span className="font-medium text-gray-800">Status:</span>{" "}
                        {reviewData.application.status || "pending"}
                      </li>
                    </ul>
                  </div>

                  {aiSelectionResults.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-800">AI selected candidates</p>
                        <Button variant="ghost" size="sm" onClick={() => setAiSelectionResults([])}>
                          Clear
                        </Button>
                      </div>
                      <ul className="space-y-2 text-sm text-blue-700">
                        {aiSelectionResults.map((item) => (
                          <li
                            key={item.applicationId}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-2"
                          >
                            <p className="font-semibold text-blue-900">
                              {item.name || "Applicant"}
                            </p>
                            <p className="text-xs text-blue-700">
                              Score: {item.rating ?? "N/A"}
                              {item.summary ? ` · ${item.summary}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        className={cn(
                          "rounded-full p-2 transition",
                          reviewRating >= value
                            ? "text-amber-500"
                            : "text-gray-300 hover:text-gray-400"
                        )}
                        aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill={reviewRating >= value ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 4.3a.563.563 0 00.424.307l4.743.689a.562.562 0 01.312.96l-3.43 3.343a.563.563 0 00-.162.498l.81 4.718a.562.562 0 01-.814.592L12.39 17.77a.563.563 0 00-.522 0l-4.244 2.228a.562.562 0 01-.814-.592l.81-4.718a.563.563 0 00-.162-.498L4.028 9.755a.562.562 0 01.312-.96l4.743-.689a.563.563 0 00.424-.307l2.125-4.3z"
                          />
                        </svg>
                      </button>
                    ))}
                    <span className="text-sm text-gray-500">
                      {reviewRating
                        ? `${reviewRating} star${reviewRating > 1 ? "s" : ""}`
                        : "No rating yet"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveReview(false)}
                      disabled={reviewSaving || reviewRating === 0}
                    >
                      {reviewSaving ? "Saving…" : "Save rating"}
                    </Button>
                    {reviewData.progress?.nextApplicationId ? (
                      <Button
                        type="button"
                        onClick={() => handleSaveReview(true)}
                        disabled={reviewSaving || reviewRating === 0}
                      >
                        Review next applicant
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-gray-500">
                        All applicants reviewed for this job.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-gray-600">
              <p className="text-sm">We couldn’t load this applicant. Please try again.</p>
              <Button variant="outline" onClick={handleCloseReviewModal}>
                Close
              </Button>
            </div>
          )}
        </div>

        {aiSelectionOpen && (
          <div className="absolute inset-0 z-[140] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60" onClick={closeAiSelection} />
            <Card className="relative z-10 w-full max-w-md border border-blue-200 shadow-2xl">
              <CardContent className="space-y-4 py-6">
                <h3 className="text-lg font-semibold text-gray-900">Amanda's candidate shortlist</h3>
                <p className="text-sm text-gray-600">
                  Tell Amanda how many candidates you’d like shortlisted for{" "}
                  {reviewData?.application.jobTitle || "this job"}.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="ai-selection-count">Number of candidates</Label>
                  <Input
                    id="ai-selection-count"
                    type="number"
                    min={1}
                    value={aiSelectionCount}
                    onChange={(event) => {
                      setAiSelectionCount(event.target.value);
                      setAiSelectionError(null);
                    }}
                  />
                  {aiSelectionError && (
                    <p className="text-xs text-red-600">{aiSelectionError}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeAiSelection}
                    disabled={aiSelectionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={runAiSelection}
                    disabled={aiSelectionLoading}
                  >
                    {aiSelectionLoading ? "Analyzing…" : "Run AI selection"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between text-sm"
                  onClick={() => setAiSelectionShowInfo((prev) => !prev)}
                >
                  Additional information
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      aiSelectionShowInfo ? "rotate-180" : "rotate-0"
                    )}
                  />
                </Button>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300 ease-in-out",
                    aiSelectionShowInfo ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 space-y-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
                    <p className="font-semibold">Share more context with Amanda:</p>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide">
                          <span>Preferred age range</span>
                          <span>
                            {aiSelectionAgeRange.min} – {aiSelectionAgeRange.max}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2">
                          <input
                            type="range"
                            min={18}
                            max={70}
                            value={aiSelectionAgeRange.min}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setAiSelectionAgeRange((prev) => ({
                                min: Math.min(value, prev.max - 1),
                                max: prev.max,
                              }));
                            }}
                          />
                          <input
                            type="range"
                            min={18}
                            max={70}
                            value={aiSelectionAgeRange.max}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setAiSelectionAgeRange((prev) => ({
                                min: prev.min,
                                max: Math.max(value, prev.min + 1),
                              }));
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide">Ethnicity</span>
                        <Select
                          value={aiSelectionHints.ethnicity ?? "any"}
                          onValueChange={(value) =>
                            setAiSelectionHints((prev) => ({
                              ...prev,
                              ethnicity: value === "any" ? undefined : value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select ethnicity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">No preference</SelectItem>
                            <SelectItem value="itaukei">iTaukei</SelectItem>
                            <SelectItem value="indian">Indian</SelectItem>
                            <SelectItem value="rotuman">Rotuman</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-medium uppercase tracking-wide">Gender</span>
                        <Select
                          value={aiSelectionHints.gender ?? "any"}
                          onValueChange={(value) =>
                            setAiSelectionHints((prev) => ({
                              ...prev,
                              gender: value === "any" ? undefined : value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">No preference</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )}
    {vacancyModalOpen && (
      <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/80 px-4 py-10">
        <div className="relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-none bg-white shadow-2xl" style={{ backgroundColor: 'white' }}>
            <button
              onClick={closeVacancyModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {vacancyLoading ? (
                <div className="py-16 text-center text-gray-500">Loading vacancy details…</div>
              ) : vacancyJob ? (
                <div className="space-y-5">
                  {vacancyJob.image_url && (
                    <div className="relative h-64 w-full overflow-hidden rounded-none border border-gray-200 bg-gray-100">
                      <Image
                        src={vacancyJob.image_url}
                        alt={vacancyJob.title || "Vacancy image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-gray-900">{vacancyJob.title || "Vacancy"}</h2>
                    <p className="text-sm text-gray-500">
                      {vacancyJob.business?.company_name || "Company"}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {vacancyJob.location && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {vacancyJob.location}
                        </span>
                      )}
                      {vacancyJob.job_type && (
                        <span className="inline-flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          {vacancyJob.job_type}
                        </span>
                      )}
                      {vacancyJob.created_at && (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {formatRelativeTime(vacancyJob.created_at)}
                        </span>
                      )}
                      {vacancyJob.salary && (
                        <span>💰 {vacancyJob.salary}</span>
                      )}
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Description</h3>
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                      {vacancyJob.description || "No description provided."}
                    </p>
                  </section>

                  {vacancyJob.requirements && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Requirements</h3>
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                        {vacancyJob.requirements}
                      </p>
                    </section>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={closeVacancyModal} className="sm:w-auto">
                      Close
                    </Button>
                    <Button asChild className="sm:w-auto">
                      <Link href={`/business/jobs/${vacancyJob.id}/applications`}>
                        Manage Applications
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">Vacancy details unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type ReviewResponse = {
  application: {
    id: string;
    jobId: string;
    jobTitle?: string;
    status?: string;
    createdAt: string;
    coverLetter?: string;
    resumeUrl?: string;
    jobSeeker?: {
      id: string;
      name?: string;
      email?: string;
    } | null;
  };
  review: {
    id: string;
    rating: number | null;
    note: string | null;
    updatedAt: string | null;
  } | null;
  aiSuggestion: {
    rating: number | null;
    summary: string | null;
    version: string | null;
  } | null;
  progress: {
    position: number | null;
    total: number;
    previousApplicationId: string | null;
    nextApplicationId: string | null;
  };
};

type AiRecommendation = {
  applicationId: string;
  name?: string | null;
  email?: string | null;
  rating: number | null;
  summary: string | null;
};

