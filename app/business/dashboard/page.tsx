"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, FileText, Users, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function BusinessDashboard() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      // Fetch both in parallel for better performance
      const [jobsResponse, appsResponse] = await Promise.all([
        fetch("/api/jobs/my-jobs", {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'default', // Allow caching for better performance
        }),
        fetch("/api/applications/business", {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'default', // Allow caching for better performance
        }),
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
        // Calculate stats once
        const activeCount = jobsData.filter((j: any) => j.is_active).length;
        setStats(prev => ({
          ...prev,
          totalJobs: jobsData.length,
          activeJobs: activeCount,
        }));
      }

      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData);
        // Calculate stats once
        const pending = appsData.filter((a: any) => a.status === "pending").length;
        const accepted = appsData.filter((a: any) => a.status === "accepted").length;
        const rejected = appsData.filter((a: any) => a.status === "rejected").length;
        setStats(prev => ({
          ...prev,
          totalApplications: appsData.length,
          pendingApplications: pending,
          acceptedApplications: accepted,
          rejectedApplications: rejected,
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchData();
    }
  }, [fetchData]);

  // Memoize expensive computations - MUST be before any early returns
  const recentJobs = useMemo(() => jobs.slice(0, 5), [jobs]);
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
                 <div>
                   <h1 className="text-4xl font-bold text-gray-900">
                     Dashboard
                   </h1>
                   <p className="text-gray-600 mt-2 text-lg">Welcome back, {user?.company_name || user?.name || "User"}</p>
                 </div>
                 <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                   <Link href="/business/jobs/new">
                     <Plus className="h-4 w-4 mr-2" />
                     Post New Job
                   </Link>
                 </Button>
               </div>

        {/* Stats Grid */}
               <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium text-gray-700">Total Jobs</CardTitle>
                     <div className="p-2 rounded-lg bg-purple-500/20">
                       <Briefcase className="h-5 w-5 text-purple-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-purple-600">{stats.totalJobs}</div>
                     <p className="text-xs text-gray-600 mt-1">
                       {stats.activeJobs} active
                     </p>
                   </CardContent>
          </Card>

                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium text-gray-700">Applications</CardTitle>
                     <div className="p-2 rounded-lg bg-emerald-500/20">
                       <FileText className="h-5 w-5 text-emerald-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-emerald-600">{stats.totalApplications}</div>
                     <p className="text-xs text-gray-600 mt-1">
                       {stats.pendingApplications} pending
                     </p>
                   </CardContent>
                 </Card>

                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium text-gray-700">Accepted</CardTitle>
                     <div className="p-2 rounded-lg bg-green-500/20">
                       <CheckCircle className="h-5 w-5 text-green-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-green-600">{stats.acceptedApplications}</div>
                     <p className="text-xs text-gray-600 mt-1">Candidates accepted</p>
                   </CardContent>
                 </Card>

                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <CardTitle className="text-sm font-medium text-gray-700">Rejected</CardTitle>
                     <div className="p-2 rounded-lg bg-red-500/20">
                       <XCircle className="h-5 w-5 text-red-600" />
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="text-3xl font-bold text-red-600">{stats.rejectedApplications}</div>
                     <p className="text-xs text-gray-600 mt-1">Applications rejected</p>
                   </CardContent>
                 </Card>
        </div>

        <div className="space-y-6">
                 {/* Recent Jobs */}
                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader>
                     <div className="flex justify-between items-center">
                       <div>
                         <CardTitle className="text-gray-900">Recent Jobs</CardTitle>
                         <CardDescription className="text-gray-600">Your latest job postings</CardDescription>
                       </div>
                       <Button variant="outline" size="sm" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50">
                         <Link href="/business/jobs">View All</Link>
                       </Button>
                     </div>
                   </CardHeader>
                   <CardContent>
                     {loading ? (
                       <p className="text-center text-gray-600 py-8">Loading...</p>
                     ) : recentJobs.length === 0 ? (
                       <div className="text-center py-8">
                         <p className="text-gray-600 mb-4">No jobs posted yet</p>
                         <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                           <Link href="/business/jobs/new">Post Your First Job</Link>
                         </Button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {recentJobs.map((job) => (
                           <Link
                             key={job.id}
                             href={`/business/jobs/${job.id}/applications`}
                             className="block p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group"
                           >
                             <div className="flex justify-between items-start">
                               <div className="flex-1">
                                 <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                                 <p className="text-xs text-gray-600 mt-1">{job.location}</p>
                               </div>
                               <span
                                 className={`px-2 py-1 text-xs rounded-full font-medium ${
                                   job.is_active
                                     ? "bg-green-100 text-green-800 border border-green-200"
                                     : "bg-gray-100 text-gray-600 border border-gray-200"
                                 }`}
                               >
                                 {job.is_active ? "Active" : "Inactive"}
                               </span>
                             </div>
                           </Link>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Recent Applications */}
                 <Card className="bg-white border-gray-200 shadow-md">
                   <CardHeader>
                     <div className="flex justify-between items-center">
                       <div>
                         <CardTitle className="text-gray-900">Recent Applications</CardTitle>
                         <CardDescription className="text-gray-600">Latest candidate applications</CardDescription>
                       </div>
                       <Button variant="outline" size="sm" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50">
                         <Link href="/business/applications">View All</Link>
                       </Button>
                     </div>
                   </CardHeader>
                   <CardContent>
                     {loading ? (
                       <p className="text-center text-gray-600 py-8">Loading...</p>
                     ) : recentApplications.length === 0 ? (
                       <div className="text-center py-8">
                         <p className="text-gray-600">No applications yet</p>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         {recentApplications.map((app) => (
                           <Link
                             key={app.id}
                             href={`/business/applications/${app.id}`}
                             className="block p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group"
                           >
                             <div className="flex justify-between items-start">
                               <div className="flex-1">
                                 <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{app.job?.title || "Job"}</h4>
                                 <p className="text-xs text-gray-600 mt-1">
                                   {app.job_seeker?.name || "Candidate"}
                                 </p>
                               </div>
                               <span
                                 className={`px-2 py-1 text-xs rounded-full font-medium ${
                                   app.status === "pending"
                                     ? "bg-blue-100 text-blue-800 border border-blue-200"
                                     : app.status === "accepted"
                                     ? "bg-green-100 text-green-800 border border-green-200"
                                     : app.status === "rejected"
                                     ? "bg-red-100 text-red-800 border border-red-200"
                                     : "bg-gray-100 text-gray-600 border border-gray-200"
                                 }`}
                               >
                                 {app.status}
                               </span>
                             </div>
                           </Link>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
        </div>
      </div>
    </div>
  );
}

