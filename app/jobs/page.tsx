"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, MapPin, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  description?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  created_at?: string;
  business?: {
    company_name?: string;
    company_logo_url?: string;
  };
}

export default function JobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) throw new Error("Failed to fetch jobs");
        const data: Job[] = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = jobs
    .filter((job) => {
      const term = searchQuery.trim().toLowerCase();
      if (!term) return true;
      return (
        job.title?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.business?.company_name?.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Latest first (descending)
    })
    .slice(0, 20); // Limit to 20 results

  const handleJobClick = (jobId: string) => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      router.push(`/jobseeker/jobs/${jobId}`);
    } else {
      setPendingJobId(jobId);
      setShowLoginPrompt(true);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">Job Search</h1>
          </div>
          <p className="text-[18px] leading-[24px] text-gray-400 mb-6">
            Find your next opportunity
          </p>

        {/* Google-style Search Bar */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative">
            <div className="relative bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200 focus-within:border-blue-500 overflow-hidden">
              <div className="flex items-center min-h-[64px]">
                <div className="pl-6 pr-4 flex-shrink-0">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 pr-4 text-[18px] leading-[24px] font-[280] text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:outline-none min-w-0"
                  style={{ fontFamily: "Macan, system-ui, sans-serif", paddingTop: 12, paddingBottom: 12 }}
                />
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery.trim()
                  ? `No jobs found matching "${searchQuery}". Try a different search term.`
                  : "No jobs found. Try adjusting your search."}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="space-y-0 bg-white rounded-lg shadow-md overflow-hidden">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => handleJobClick(job.id)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-start gap-4">
                      {job.business?.company_logo_url && (
                        <img
                          src={job.business.company_logo_url}
                          alt={job.business.company_name || "Business"}
                          className="w-12 h-12 object-contain rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {job.business?.company_name && (
                            <span className="font-medium">{job.business.company_name}</span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              {job.job_type}
                            </span>
                          )}
                          {job.created_at && (
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(job.created_at)}
                            </span>
                          )}
                          {job.salary && (
                            <span className="text-sm font-medium text-blue-600">
                              {job.salary}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login required popup for FastLink users */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Login required</h2>
            <p className="text-sm text-gray-700">
              Job details are available for FastLink Users. Please log in to your account first,
              then you can open and apply for this job.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-800">FastLink User (Job Seeker)</p>
              <p>Use your job seeker login to view full job information and apply.</p>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => router.push("/login/jobseeker")}
                className="w-full rounded-md bg-blue-600 text-white text-sm font-medium py-2.5 hover:bg-blue-700 transition"
              >
                Login as FastLink User
              </button>
              <button
                type="button"
                onClick={() => router.push("/register/jobseeker")}
                className="w-full rounded-md border border-gray-300 text-sm font-medium py-2.5 text-gray-800 hover:bg-gray-50 transition"
              >
                Create a free FastLink User account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginPrompt(false);
                  setPendingJobId(null);
                }}
                className="w-full rounded-md text-sm font-medium py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

