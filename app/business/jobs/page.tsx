"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Search, Users, MapPin, Briefcase, Clock, X, Crown } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface JobWithCount {
  id: string;
  title: string;
  description?: string;
  location?: string;
  job_type?: string;
  salary?: string;
  created_at: string;
  is_active: boolean;
  applicants_count?: number;
  image_url?: string;
  requirements?: string;
  promotion_tier?: "free" | "pro";
  business?: {
    company_name?: string;
  };
}

export default function MyJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingJob, setViewingJob] = useState<JobWithCount | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalLoading, setViewModalLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalAnimating, setDeleteModalAnimating] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobWithCount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const viewingProFeatured = viewingJob?.promotion_tier === "pro";

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs/my-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Job removed",
          description: `${jobToDelete.title} has been deleted successfully.`,
        });
        setDeleteModalAnimating(false);
        setTimeout(() => {
          setDeleteModalOpen(false);
          setJobToDelete(null);
        }, 200);
        fetchJobs();
      } else {
        throw new Error("Failed to delete job");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (job: JobWithCount) => {
    setJobToDelete(job);
    setDeleteModalOpen(true);
    requestAnimationFrame(() => setDeleteModalAnimating(true));
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalAnimating(false);
    setTimeout(() => {
      setDeleteModalOpen(false);
      setJobToDelete(null);
    }, 200);
  };

  const filteredJobs = jobs.filter((job) =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRelativeTime = (timestamp: string) => {
    const created = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return "Just now";

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  };

  const openViewModal = async (jobId: string) => {
    const existing = jobs.find((job) => job.id === jobId) || null;
    setViewingJob(existing);
    setViewModalOpen(true);
    setViewModalLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${jobId}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        setViewingJob((prev) => ({
          ...prev,
          ...data,
          applicants_count: prev?.applicants_count ?? data.applicants_count,
        }) as JobWithCount | null);
      }
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setViewModalLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewingJob(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600 mt-2">Manage all your job postings</p>
          </div>
          <Button asChild>
            <Link href="/business/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs by title or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : filteredJobs.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-md">
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No jobs found matching your search" : "No jobs posted yet"}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/business/jobs/new">Post Your First Job</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const isProFeatured = job.promotion_tier === "pro";
              return (
                <Card
                  key={job.id}
                  className={cn(
                    "bg-white border-gray-200 shadow-md",
                    isProFeatured && "border-amber-400 shadow-[0_10px_28px_rgba(251,191,36,0.24)]"
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              job.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-white text-gray-800 border border-gray-200"
                            )}
                          >
                            {job.is_active ? "Active" : "Inactive"}
                          </span>
                          {isProFeatured && (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                              <Crown className="h-5 w-5" />
                            </span>
                          )}
                          {Number(job.applicants_count) > 0 && (
                            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              <Users className="h-3 w-3" />
                              {job.applicants_count}
                              {Number(job.applicants_count) === 1 ? " applicant" : " applicants"}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{job.description?.substring(0, 150)}...</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            {job.job_type}
                          </span>
                          {job.salary && <span>💰 {job.salary}</span>}
                          <span className="inline-flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatRelativeTime(job.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewModal(job.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Vacancy
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/business/jobs/${job.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteModal(job)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <button
              onClick={closeViewModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6 space-y-6">
              {viewModalLoading ? (
                <div className="py-16 text-center text-gray-500">Loading job details…</div>
              ) : viewingJob ? (
                <div className="space-y-5">
                  {viewingProFeatured && viewingJob.image_url && (
                    <div className="relative h-64 w-full overflow-hidden rounded-xl border border-amber-100 bg-gray-900/80">
                      <Image
                        src={viewingJob.image_url}
                        alt={viewingJob.title || "Job image"}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-gray-900">Vacancy Details</h2>
                      {viewingProFeatured && (
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                          <Crown className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {viewingJob.business?.company_name || "Company"}
                    </p>
                    {viewingProFeatured && (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Crown className="h-6 w-6" />
                      </span>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      {viewingJob.location && (
                        <span className="inline-flex items-center gap-2 text-gray-500">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {viewingJob.location}
                        </span>
                      )}
                      {viewingJob.job_type && (
                        <span className="inline-flex items-center gap-2 text-gray-500">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          {viewingJob.job_type}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatRelativeTime(viewingJob.created_at)}
                      </span>
                      {viewingJob.salary && (
                        <span>💰 {viewingJob.salary}</span>
                      )}
                      {Number(viewingJob.applicants_count) > 0 && (
                        <span className="inline-flex items-center gap-2 text-blue-600">
                          <Users className="h-4 w-4" />
                          {viewingJob.applicants_count} applicant{Number(viewingJob.applicants_count) === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Description</h3>
                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                      {viewingJob.description || "No description provided."}
                    </p>
                  </section>

                  {viewingJob.requirements && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Requirements</h3>
                      <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                        {viewingJob.requirements}
                      </p>
                    </section>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={closeViewModal} className="sm:w-auto">
                      Close
                    </Button>
                    <Button asChild className="sm:w-auto">
                      <Link href={`/business/jobs/${viewingJob.id}/applications`}>
                        Manage Applications
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500">Unable to load job details.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 transition-opacity duration-200 ${
            deleteModalAnimating ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 ${
              deleteModalAnimating ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
            }`}
          >
            <button
              onClick={closeDeleteModal}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-4">
              <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-gray-900">Delete this job?</h2>
                <p className="text-sm text-gray-600">
                  {jobToDelete?.title}
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone. Applicants will no longer see this posting.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={closeDeleteModal} className="sm:w-auto">
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white sm:w-auto"
                  onClick={handleDeleteJob}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

