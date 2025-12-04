"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Briefcase, MapPin, Clock, X, Bookmark, BookmarkCheck, Phone, Crown, AlertCircle, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  contact_preference?: string;
  created_at?: string;
  image_url?: string;
  promotion_tier?: "free" | "pro";
  business?: {
    company_name?: string;
    name?: string;
    company_logo_url?: string;
    phone_number?: string;
  };
}

interface DocumentItem {
  path: string;
  url: string;
  name: string;
  category: "birth_certificate" | "cv" | "reference" | "application_letter" | "degree_diploma_certificate";
  uploaded_at: string;
}

const REQUIRED_DOCUMENT_TYPES: DocumentItem["category"][] = [
  "cv",
  "application_letter",
  "reference",
  "birth_certificate",
];

const DOCUMENT_LABELS: Record<DocumentItem["category"], string> = {
  cv: "CV",
  application_letter: "Application letter",
  reference: "Reference",
  birth_certificate: "Birth certificate",
  degree_diploma_certificate: "Degree / Diploma / Certificate",
};

interface ExistingApplication {
  job_id?: string;
  job?: { id: string };
}

export default function JobSeekerJobsPage() {
  const router = useRouter();
  const contactPreferenceCopy = (value?: string) => {
    switch (value) {
      case "call":
        return "Call the employer";
      case "both":
        return "Message or call";
      default:
        return "Message the employer";
    }
  };
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalJob, setModalJob] = useState<Job | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [desktopContactJobId, setDesktopContactJobId] = useState<string | null>(null);
  const [missingDocsModalOpen, setMissingDocsModalOpen] = useState(false);
  const [missingDocsForModal, setMissingDocsForModal] = useState<DocumentItem["category"][]>([]);
  const [openingMessenger, setOpeningMessenger] = useState<string | null>(null);
  const isMobileDevice = () =>
    typeof window !== "undefined" && /Mobi|Android|iP(ad|hone|od)/i.test(navigator.userAgent);
  const normalizePhoneNumber = (phone: string) => phone.replace(/[^\d+]/g, "");
  const handleEnquire = (jobArg?: Job | null, context: "card" | "modal" = "card") => {
    if (!jobArg) return;
    const phone = jobArg.business?.phone_number;
    if (!phone) {
      toast({
        title: "No phone number available",
        description: "The employer has not provided a contact number.",
        variant: "destructive",
      });
      return;
    }
    if (typeof window === "undefined") return;
    const normalized = normalizePhoneNumber(phone);
    if (isMobileDevice()) {
      window.location.href = `tel:${normalized}`;
      return;
    }
    setDesktopContactJobId(jobArg.id);
    if (context === "card") {
      openJobModal(jobArg.id, { showContact: true });
    }
  };
  const shouldOfferPhone = (preference?: string) =>
    preference === "call" || preference === "both";
  const messagingEnabled = (job?: Job | null) => {
    if (!job) return false;
    // Must be Pro tier AND have messaging enabled (message or both)
    const isPro = job.promotion_tier === "pro";
    const hasMessaging = job.contact_preference === "message" || job.contact_preference === "both";
    return isPro && hasMessaging;
  };
  const handleMessageForInfo = async (job: Job) => {
    if (!job || !job.id) return;
    
    setOpeningMessenger(job.id);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Login required",
          description: "Sign in to message businesses.",
          variant: "destructive",
        });
        return;
      }

      // Dispatch event to open message thread in popup
      window.dispatchEvent(new CustomEvent("open-message-thread", {
        detail: {
          jobId: job.id,
          businessName: job.business?.company_name || job.business?.name || "Employer",
        },
      }));
    } catch (error: any) {
      console.error("Error opening messenger:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open messenger",
        variant: "destructive",
      });
    } finally {
      setOpeningMessenger(null);
    }
  };
  const renderMessageButton = (
    jobArg?: Job | null,
    extraClasses = "",
    context: "card" | "modal" = "card"
  ) => {
    if (!jobArg || !messagingEnabled(jobArg)) {
      return null;
    }
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 ${extraClasses}`.trim()}
        onClick={() => handleMessageForInfo(jobArg)}
        disabled={openingMessenger === jobArg.id}
      >
        <MessageCircle className="h-4 w-4" />
        {openingMessenger === jobArg.id ? "Opening..." : "Message for information"}
      </Button>
    );
  };
  const renderEnquireButton = (
    jobArg?: Job | null,
    extraClasses = "",
    context: "card" | "modal" = "card"
  ) => {
    if (!jobArg || !shouldOfferPhone(jobArg.contact_preference) || !jobArg.business?.phone_number) {
      return null;
    }
    return (
      <Button
        variant="outline"
        className={`flex items-center gap-2 ${extraClasses}`.trim()}
        onClick={() => handleEnquire(jobArg, context)}
      >
        <Phone className="h-4 w-4" />
        Enquire now
      </Button>
    );
  };
  const renderDesktopContactInfo = (jobArg?: Job | null) => {
    if (!jobArg) return null;
    if (isMobileDevice()) return null;
    if (desktopContactJobId !== jobArg.id) return null;
    const phone = jobArg.business?.phone_number;
    if (!phone) return null;
    return (
      <div className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 animate-callout-pop">
        <p className="text-sm font-semibold text-gray-900">Call this employer</p>
        <p className="text-lg font-semibold text-gray-900">{phone}</p>
        <p className="text-xs text-gray-600">
          You're on a computer. Open FastLink on your phone to open the dial pad automatically.
        </p>
      </div>
    );
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch("/api/jobs", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });

        if (response.ok) {
          const data = await response.json();
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const res = await fetch("/api/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data.documents) ? data.documents : []);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const res = await fetch("/api/jobs/saved", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>();
          if (Array.isArray(data)) {
            data.forEach((saved: any) => {
              if (saved?.job?.id) {
                ids.add(saved.job.id);
              }
            });
          }
          setSavedJobIds(ids);
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    fetchSavedJobs();
  }, []);

  useEffect(() => {
    const fetchExistingApplications = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const res = await fetch("/api/applications/my-applications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data: ExistingApplication[] = await res.json();
          const ids = new Set<string>();
          data.forEach((app) => {
            if (app.job_id) ids.add(app.job_id);
            if (app.job?.id) ids.add(app.job.id);
          });
          setAppliedJobIds(ids);
        }
      } catch (error) {
        console.error("Error fetching existing applications:", error);
      }
    };

    fetchExistingApplications();
  }, []);

  const resumes = useMemo(
    () => documents.filter((doc) => doc.category === "cv"),
    [documents]
  );

  const missingDocuments = useMemo(
    () =>
      REQUIRED_DOCUMENT_TYPES.filter(
        (category) => !documents.some((doc) => doc.category === category)
      ),
    [documents]
  );

  const filteredJobs = useMemo(() => {
    // First filter by search term
    const filtered = jobs.filter((job) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        job.title?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.business?.company_name?.toLowerCase().includes(term)
      );
    });

    // Separate featured (pro) and free jobs
    const featuredJobs = filtered.filter((job) => job.promotion_tier === "pro");
    const freeJobs = filtered.filter((job) => job.promotion_tier !== "pro");

    // Sort each group by date (newest first)
    const sortByDate = (a: Job, b: Job) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Descending (newest first)
    };

    featuredJobs.sort(sortByDate);
    freeJobs.sort(sortByDate);

    // Return featured jobs first, then free jobs
    return [...featuredJobs, ...freeJobs];
  }, [jobs, searchTerm]);

  const openJobModal = async (jobId: string, options?: { showContact?: boolean }) => {
    setModalLoading(true);
    setModalOpen(true);
    if (options?.showContact) {
      setDesktopContactJobId(jobId);
    } else {
      setDesktopContactJobId(null);
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const job = await response.json();
        setModalJob(job);
      } else {
        const fallback = jobs.find((job) => job.id === jobId) || null;
        setModalJob(fallback);
      }
    } catch (error) {
      console.error("Error loading job details:", error);
      const fallback = jobs.find((job) => job.id === jobId) || null;
      setModalJob(fallback);
    } finally {
      setModalLoading(false);
    }
  };

  const closeJobModal = () => {
    setModalOpen(false);
    setModalJob(null);
    setDesktopContactJobId(null);
  };

  const goToDocuments = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("returnToAfterDocuments", window.location.pathname);
    }
    setMissingDocsModalOpen(false);
    router.push("/jobseeker/documents");
  };

  const remindDocumentsLater = () => {
    setMissingDocsModalOpen(false);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (modalOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [modalOpen]);

  const toggleBookmark = async (job: Job | null) => {
    if (!job) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast({
        title: "Login required",
        description: "Sign in to save jobs for later.",
        variant: "destructive",
      });
      return;
    }

    const alreadySaved = savedJobIds.has(job.id);

    try {
      const res = await fetch(`/api/jobs/${job.id}/bookmark`, {
        method: alreadySaved ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Unable to update bookmark");
      }

      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (alreadySaved) {
          next.delete(job.id);
        } else {
          next.add(job.id);
        }
        return next;
      });

      toast({
        title: alreadySaved ? "Removed from saved jobs" : "Saved for later",
        description: alreadySaved
          ? "This job has been removed from your saved list."
          : "Find it anytime in Saved Jobs.",
      });
    } catch (error: any) {
      toast({
        title: "Bookmark error",
        description: error.message || "We couldn't update this bookmark.",
        variant: "destructive",
      });
    }
  };

  const handleQuickApply = async (job: Job) => {
    if (appliedJobIds.has(job.id)) {
      toast({ title: "Already applied", description: "You have already applied for this job." });
      return;
    }

    if (missingDocuments.length > 0) {
      setMissingDocsForModal(missingDocuments);
      setMissingDocsModalOpen(true);
      return;
    }

    const resume = resumes[0];
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to apply.", variant: "destructive" });
      return;
    }

    setApplyingJobId(job.id);

    try {
      const res = await fetch(`/api/applications/job/${job.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coverLetter: "",
          resumeUrl: resume.url,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit application");
      }

      toast({
        title: "Application submitted",
        description: "Your application has been sent to the employer.",
      });

      setAppliedJobIds((prev) => {
        const next = new Set(prev);
        next.add(job.id);
        return next;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unable to submit application",
        variant: "destructive",
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
        <p className="text-gray-600">Browse openings that match your skills and interests.</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search jobs by title, company or location"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-11"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-12 text-center">
          <p className="text-gray-500">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No jobs found. Try adjusting your search.</p>
          <Button variant="outline" onClick={() => setSearchTerm("")}>Clear search</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const isProFeatured = job.promotion_tier === "pro";
            return (
            <Card
              key={job.id}
              className={cn(
                "bg-white border border-gray-200 shadow-sm",
                isProFeatured && "border-amber-400 shadow-none hover:shadow-none"
              )}
            >
              <CardContent className="p-6">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleBookmark(job)}
                    aria-label={savedJobIds.has(job.id) ? "Remove bookmark" : "Save job"}
                    className={
                      savedJobIds.has(job.id)
                        ? "text-blue-600 hover:text-blue-700"
                        : "text-gray-400 hover:text-blue-600"
                    }
                  >
                    {savedJobIds.has(job.id) ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-white">
                        {job.business?.company_logo_url ? (
                          <Image
                            src={job.business.company_logo_url}
                            alt={`${job.business?.company_name || "Company"} logo`}
                            width={56}
                            height={56}
                            className="h-14 w-14 object-contain"
                          />
                        ) : (
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                          {isProFeatured && (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                              <Crown className="h-5 w-5" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {job.business?.company_name || job.business?.name || "Company"}
                        </p>
                      </div>
                    </div>

                    {isProFeatured && job.image_url && (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        Vacancy image available — open View Details to preview.
                      </div>
                    )}

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {job.description ? `${job.description.slice(0, 180)}${job.description.length > 180 ? "…" : ""}` : "No description provided."}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                      )}
                      {job.job_type && (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.job_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        Contact: {contactPreferenceCopy(job.contact_preference)}
                      </span>
                      {job.salary && (
                        <span className="inline-flex items-center gap-1">
                          💰 {job.salary}
                        </span>
                      )}
                      {job.created_at && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {(() => {
                            const relative = formatRelativeTime(job.created_at);
                            return relative.startsWith("in ") ? `${relative.slice(3)} ago` : relative;
                          })()}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {renderMessageButton(job)}
                      {renderEnquireButton(job)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-full lg:w-56">
                    <Button
                      className="w-full bg-white text-gray-900 border border-gray-500 hover:bg-gray-100 hover:text-black"
                      onClick={() => openJobModal(job.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant={appliedJobIds.has(job.id) ? "default" : "outline"}
                      className={`w-full ${
                        appliedJobIds.has(job.id)
                          ? "bg-emerald-800 hover:bg-emerald-800 text-white cursor-default"
                          : ""
                      }`}
                      onClick={() => handleQuickApply(job)}
                      disabled={applyingJobId === job.id || appliedJobIds.has(job.id)}
                    >
                      {appliedJobIds.has(job.id)
                        ? "Applied"
                        : applyingJobId === job.id
                        ? "Applying…"
                        : "Apply Now"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {missingDocsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" />
          <Card className="relative z-10 w-full max-w-md border border-amber-200 shadow-2xl">
            <CardContent className="space-y-4 py-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload required documents
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload the following document types before applying:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {missingDocsForModal.map((category) => (
                      <li key={category}>{DOCUMENT_LABELS[category]}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500">
                    After uploading, return here to submit your applications.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={goToDocuments}>
                  Upload documents now
                </Button>
                <Button variant="outline" className="flex-1" onClick={remindDocumentsLater}>
                  Got it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/80 px-4">
          <div className="relative w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <button
              onClick={closeJobModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className={`flex-1 overflow-y-auto ${modalJob?.image_url ? "pt-0" : "p-6"}`}>
              {modalLoading ? (
                <div className="py-16 text-center text-gray-500">Loading job details…</div>
              ) : modalJob ? (
                <div className="space-y-6">
                  <div
                    className={`flex items-center gap-3 ${
                      modalJob.image_url ? "px-6 pt-6" : ""
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-white">
                      {modalJob.business?.company_logo_url ? (
                        <Image
                          src={modalJob.business.company_logo_url}
                          alt={`${modalJob.business?.company_name || "Company"} logo`}
                          width={56}
                          height={56}
                          className="h-14 w-14 object-contain"
                        />
                      ) : (
                        <Briefcase className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">{modalJob.title}</h2>
                        {modalJob.promotion_tier === "pro" && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-100 p-1 text-amber-600">
                            <Crown className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {modalJob.business?.company_name || modalJob.business?.name || "Company"}
                      </p>
                    </div>
                  </div>

                  {modalJob.image_url ? (
                    <>
                      <div className="group relative h-[460px] w-full overflow-hidden bg-gray-900">
                        <Image
                          src={modalJob.image_url}
                          alt={modalJob.title || "Job vacancy"}
                          fill
                          className="object-contain"
                          loading="lazy"
                          sizes="(max-width: 768px) 90vw, 768px"
                        />
                        <button
                          onClick={closeJobModal}
                          className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white text-xl font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex flex-wrap justify-end gap-3 p-6">
                        <Button
                          variant="ghost"
                          onClick={() => toggleBookmark(modalJob)}
                          className={
                            modalJob && savedJobIds.has(modalJob.id)
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-gray-500 hover:text-blue-600"
                          }
                        >
                          {modalJob && savedJobIds.has(modalJob.id) ? (
                            <span className="inline-flex items-center gap-2">
                              <BookmarkCheck className="h-4 w-4" />
                              Saved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Bookmark className="h-4 w-4" />
                              Save
                            </span>
                          )}
                        </Button>
                        {renderMessageButton(modalJob, "sm:w-auto", "modal")}
                        {renderEnquireButton(modalJob, "sm:w-auto", "modal")}
                        <Button
                          className={`sm:w-auto ${
                            appliedJobIds.has(modalJob.id)
                              ? "bg-emerald-800 hover:bg-emerald-800 text-white cursor-default"
                              : ""
                          }`}
                          onClick={() => {
                            closeJobModal();
                            handleQuickApply(modalJob);
                          }}
                          disabled={applyingJobId === modalJob.id || appliedJobIds.has(modalJob.id)}
                        >
                          {appliedJobIds.has(modalJob.id)
                            ? "Applied"
                            : applyingJobId === modalJob.id
                            ? "Applying…"
                            : "Apply Now"}
                        </Button>
                        {renderDesktopContactInfo(modalJob)}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {modalJob.location && (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {modalJob.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2">
                          Contact: {contactPreferenceCopy(modalJob.contact_preference)}
                        </span>
                        {modalJob.job_type && (
                          <span className="inline-flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {modalJob.job_type}
                          </span>
                        )}
                        {modalJob.salary && (
                          <span className="inline-flex items-center gap-2">
                            💰 {modalJob.salary}
                          </span>
                        )}
                        {modalJob.created_at && (
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Posted {(() => {
                              const relative = formatRelativeTime(modalJob.created_at);
                              return relative.startsWith("in ") ? `${relative.slice(3)} ago` : relative;
                            })()}
                          </span>
                        )}
                      </div>

                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Job Description</h3>
                        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                          {modalJob.description || "No description provided."}
                        </p>
                      </section>

                      {modalJob.requirements && (
                        <section className="space-y-2">
                          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Requirements</h3>
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                            {modalJob.requirements}
                          </p>
                        </section>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => toggleBookmark(modalJob)}
                          className={
                            modalJob && savedJobIds.has(modalJob.id)
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-gray-500 hover:text-blue-600"
                          }
                        >
                          {modalJob && savedJobIds.has(modalJob.id) ? (
                            <span className="inline-flex items-center gap-2">
                              <BookmarkCheck className="h-4 w-4" />
                              Saved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <Bookmark className="h-4 w-4" />
                              Save
                            </span>
                          )}
                        </Button>
                        <Button variant="outline" onClick={closeJobModal} className="sm:w-auto">
                          Close
                        </Button>
                        {renderMessageButton(modalJob, "sm:w-auto", "modal")}
                        {renderEnquireButton(modalJob, "sm:w-auto", "modal")}
                        <Button
                          className={`sm:w-auto ${
                            appliedJobIds.has(modalJob.id)
                              ? "bg-emerald-800 hover:bg-emerald-800 text-white cursor-default"
                              : ""
                          }`}
                          onClick={() => {
                            closeJobModal();
                            handleQuickApply(modalJob);
                          }}
                          disabled={applyingJobId === modalJob.id || appliedJobIds.has(modalJob.id)}
                        >
                          {appliedJobIds.has(modalJob.id)
                            ? "Applied"
                            : applyingJobId === modalJob.id
                            ? "Applying…"
                            : "Apply Now"}
                        </Button>
                      </div>
                      {renderDesktopContactInfo(modalJob)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">
                  We couldn't load this job. Please try again later.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


