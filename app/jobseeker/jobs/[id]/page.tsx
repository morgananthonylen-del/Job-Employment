"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  ArrowLeft,
  Phone,
  Crown,
  X,
  MessageCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { format } from "date-fns";

interface JobDetails {
  id: string;
  title: string;
  description?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  requirements?: string;
  created_at?: string;
  contact_preference?: string;
  application_deadline?: string;
  image_url?: string;
  promotion_tier?: "free" | "pro";
  business?: {
    company_name?: string;
    name?: string;
    email?: string;
    company_logo_url?: string;
    phone_number?: string;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callDialog, setCallDialog] = useState<{ open: boolean; phone: string; business?: string }>({
    open: false,
    phone: "",
    business: undefined,
  });
  const [openingMessenger, setOpeningMessenger] = useState(false);
  const isMobileDevice = () =>
    typeof window !== "undefined" && /Mobi|Android|iP(ad|hone|od)/i.test(navigator.userAgent);
  const normalizePhoneNumber = (phone: string) => phone.replace(/[^\d+]/g, "");
  const handleCallEmployer = (jobDetails?: JobDetails | null) => {
    const phone = jobDetails?.business?.phone_number;
    if (!phone) return;
    if (typeof window === "undefined") return;
    const normalized = normalizePhoneNumber(phone);
    if (isMobileDevice()) {
      window.location.href = `tel:${normalized}`;
    } else {
      setCallDialog({
        open: true,
        phone,
        business:
          jobDetails?.business?.company_name ||
          jobDetails?.business?.name ||
          jobDetails?.title ||
          "Employer",
      });
    }
  };
  const shouldOfferPhone = (preference?: string) =>
    preference === "call" || preference === "both";

  const handleMessageForInfo = async () => {
    if (!job || !job.id) return;
    
    setOpeningMessenger(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
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
      alert(error.message || "Failed to open messenger");
    } finally {
      setOpeningMessenger(false);
    }
  };
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (callDialog.open) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
    return;
  }, [callDialog.open]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error("Job not found");
        }
        const data = await response.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message || "Unable to load job details");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const isProFeatured = useMemo(() => job?.promotion_tier === "pro", [job?.promotion_tier]);
  const messagingEnabled = useMemo(() => {
    if (!job) return false;
    return job.promotion_tier === "pro" && 
           (job.contact_preference === "message" || job.contact_preference === "both");
  }, [job?.promotion_tier, job?.contact_preference]);
  const postedLabel = useMemo(() => {
    if (!job?.created_at) return "";
    const relative = formatRelativeTime(job.created_at);
    return relative.startsWith("in ") ? `${relative.slice(3)} ago` : relative;
  }, [job?.created_at]);

  useEffect(() => {
    if (!job) return;

    const detail = {
      enabled: job.promotion_tier === "pro",
      jobId: job.id,
      businessName: job.business?.company_name || job.business?.name || job.title,
    };

    window.dispatchEvent(new CustomEvent("jobseeker-message-availability", { detail }));

    return () => {
      window.dispatchEvent(
        new CustomEvent("jobseeker-message-availability", {
          detail: { enabled: false },
        })
      );
    };
  }, [job?.business?.company_name, job?.business?.name, job?.id, job?.promotion_tier, job?.title]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-10 w-3/4 bg-gray-200 rounded" />
          <div className="h-48 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">{error || "Job not found."}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/jobseeker/jobs">Back to job listings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-wrap gap-3">
          {messagingEnabled && (
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              onClick={handleMessageForInfo}
              disabled={openingMessenger}
            >
              <MessageCircle className="h-4 w-4" />
              {openingMessenger ? "Opening..." : "Message for information"}
            </Button>
          )}
          {shouldOfferPhone(job.contact_preference) && job.business?.phone_number && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleCallEmployer(job)}
            >
              <Phone className="h-4 w-4" />
              Enquire now
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/jobseeker/apply/${job.id}`}>Apply Now</Link>
          </Button>
        </div>
      </div>

      <Card
        className={cn(
          "bg-white border border-gray-200 shadow-sm",
          isProFeatured && "border-amber-400 shadow-none"
        )}
      >
        <CardHeader>
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
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-3xl text-gray-900">{job.title}</CardTitle>
                {isProFeatured && (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Crown className="h-6 w-6" />
                  </span>
                )}
              </div>
              <CardDescription className="text-gray-500">
                {job.business?.company_name || job.business?.name || "Company"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProFeatured && job.image_url && (
            <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gray-900/70">
              <div className="relative h-72 w-full">
                <Image
                  src={job.image_url}
                  alt={job.title || "Job vacancy"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority={false}
                />
              </div>
              <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                Visible to job seekers only on Pro Featured listings.
              </p>
            </div>
          )}

          {isProFeatured && (
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Crown className="h-7 w-7" />
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {job.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
            )}
            {job.job_type && (
              <span className="inline-flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {job.job_type}
              </span>
            )}
            {job.salary && (
              <span className="inline-flex items-center gap-2">
                💰 {job.salary}
              </span>
            )}
            {job.created_at && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Posted {postedLabel}
              </span>
            )}
            {job.application_deadline && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Applications close{" "}
                {format(new Date(job.application_deadline), "PPP 'at' p")}
              </span>
            )}
          </div>

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {job.description || "No description provided."}
              </p>
            </section>

            {job.requirements && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </p>
              </section>
            )}
          </div>

          {job.business && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Company</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {job.business.company_name || job.business.name || "Company"}
                </div>
                {job.business.email && (
                  <p className="ml-6">Contact: {job.business.email}</p>
                )}
                {shouldOfferPhone(job.contact_preference) && job.business.phone_number && (
                  <p className="ml-6 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {job.business.phone_number}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/jobseeker/apply/${job.id}`}>Apply Now</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/jobseeker/jobs`}>Browse More Jobs</Link>
        </Button>
      </div>

      {callDialog.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-6">
          <div className="relative w-full max-w-sm bg-white p-8 text-center shadow-2xl transition-all duration-300 ease-out animate-call-pop">
            <button
              onClick={() => setCallDialog({ open: false, phone: "", business: undefined })}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Close call information"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Phone className="h-8 w-8" />
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">{callDialog.business}</h2>
            <p className="mt-6 text-3xl font-bold text-gray-900">{callDialog.phone}</p>
            <p className="mt-3 text-xs text-gray-500">
              Dial this number from your phone to enquire about the vacancy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


