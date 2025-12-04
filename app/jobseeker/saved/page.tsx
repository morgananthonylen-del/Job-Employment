"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin } from "lucide-react";

interface SavedJob {
  id: string;
  job?: {
    id: string;
    title: string;
    location?: string;
    business?: {
      company_name?: string;
      name?: string;
      company_logo_url?: string;
    };
  };
}

export default function JobSeekerSavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/jobs/saved", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          setSavedJobs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading saved jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedJobs();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-gray-600 mt-2">Keep track of opportunities you are interested in.</p>
        </div>
        {savedJobs.length > 0 && (
          <Button variant="outline" className="self-start sm:self-auto">
            <Link href="/jobseeker/jobs">Find Jobs</Link>
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-12">Loading saved jobs...</p>
      ) : savedJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/80 p-10 text-center text-gray-500">
          <p className="text-lg font-medium text-gray-700">No saved jobs yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Browse jobs and click the bookmark icon to save roles for later.
          </p>
          <Button asChild className="mt-4">
            <Link href="/jobseeker/jobs">Find Jobs</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {savedJobs.map((saved) => (
            <div
              key={saved.id}
              className="rounded-lg border border-gray-200 bg-white/95 p-4 shadow-sm hover:border-blue-200 transition"
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white">
                    {saved.job?.business?.company_logo_url ? (
                      <Image
                        src={saved.job.business.company_logo_url}
                        alt={`${saved.job?.business?.company_name || "Company"} logo`}
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {saved.job?.title || "Job"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {saved.job?.business?.company_name || saved.job?.business?.name || "Company"}
                    </p>
                    {saved.job?.location && (
                      <p className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {saved.job.location}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/jobseeker/jobs/${saved.job?.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/jobseeker/apply/${saved.job?.id}`}>Apply Now</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}





