"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

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

  const filteredJobs = jobs.filter((job) => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return true;
    return (
      job.title?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      job.business?.company_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">Job Search</h1>
          </div>
          <p className="text-lg text-gray-400 mb-6">
            Find your next opportunity
          </p>

          {/* Google-style Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="relative bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 focus-within:shadow-lg focus-within:border-blue-500 overflow-hidden">
                <div className="flex items-center min-h-[56px]">
                  <div className="pl-5 pr-3 flex-shrink-0">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for jobs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 py-4 pr-3 text-base text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:outline-none min-w-0"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobseeker/jobs/${job.id}`}
                  className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {job.business?.company_logo_url && (
                      <img
                        src={job.business.company_logo_url}
                        alt={job.business.company_name || "Business"}
                        className="w-16 h-16 object-contain rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      {job.business?.company_name && (
                        <p className="text-sm text-gray-600 mb-2">
                          {job.business.company_name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        )}
                        {job.job_type && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.job_type}
                          </span>
                        )}
                      </div>
                      {job.salary && (
                        <p className="text-sm font-medium text-blue-600 mt-2">
                          {job.salary}
                        </p>
                      )}
                      {job.created_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(job.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


