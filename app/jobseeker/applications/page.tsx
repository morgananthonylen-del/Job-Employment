"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface Application {
  id: string;
  status: string;
  created_at?: string;
  resume_url?: string;
  job?: {
    id: string;
    title: string;
    location?: string;
  };
}

export default function JobSeekerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const appliedTimeCopy = (date?: string) => {
    if (!date) return "just now";
    const relative = formatRelativeTime(date);
    if (relative.startsWith("in ")) {
      return `${relative.substring(3)} ago`;
    }
    if (relative.endsWith("ago") || relative.toLowerCase() === "just now") {
      return relative;
    }
    return `${relative} ago`;
  };

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/applications/my-applications", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          setApplications(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error loading applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Recent Applications</h2>
          <p className="text-gray-600">Updates on the roles you have applied for.</p>
        </div>

        {loading ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 text-center text-gray-500">
              Loading applications...
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No applications yet.</p>
              <Button asChild>
                <Link href="/jobseeker/jobs">Browse jobs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => (
              <Card key={application.id} className="border border-gray-200 shadow-sm hover:shadow-md transition">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.job?.title || "Job"}
                      </h3>
                      <span className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
                        Applied {appliedTimeCopy(application.created_at)}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 capitalize text-right w-full lg:w-auto">
                      {application.status}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


