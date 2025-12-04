"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Filter, Ban, UserCheck, UserX, Eye } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minAge: "",
    maxAge: "",
    ethnicity: "all",
    minExperience: "",
    gender: "all",
    status: "all",
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch job
      const jobResponse = await fetch(`/api/jobs/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
      }

      // Fetch applications
      await fetchApplications();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      
      if (filters.minAge) queryParams.append("minAge", filters.minAge);
      if (filters.maxAge) queryParams.append("maxAge", filters.maxAge);
      if (filters.ethnicity !== "all") queryParams.append("ethnicity", filters.ethnicity);
      if (filters.minExperience) queryParams.append("minExperience", filters.minExperience);
      if (filters.gender !== "all") queryParams.append("gender", filters.gender);
      if (filters.status !== "all") queryParams.append("status", filters.status);

      const response = await fetch(
        `/api/applications/job/${params.id}?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchApplications();
    }
  }, [filters, params.id]);

  const handleBlock = async (userId: string) => {
    if (!confirm("Are you sure you want to block this candidate from this job?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/jobs/${params.id}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Candidate blocked successfully",
        });
        fetchApplications();
      } else {
        throw new Error("Failed to block candidate");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to block candidate",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Application status updated",
        });
        fetchApplications();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return null;
    const age = new Date().getFullYear() - new Date(birthday).getFullYear();
    return age;
  };

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

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/business/jobs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {job?.title || "Job"} Applications
            </h1>
            <p className="text-gray-600 mt-2">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6 bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Filter Candidates</CardTitle>
              <CardDescription>Filter applications by age, race, experience, and more</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={filters.minAge}
                    onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input
                    type="number"
                    placeholder="65"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Experience (Years)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minExperience}
                    onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ethnicity</Label>
                  <Select
                    value={filters.ethnicity}
                    onValueChange={(value) => setFilters({ ...filters, ethnicity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All ethnicities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="itaukei">Itaukei</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="rotuman">Rotuman</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={filters.gender}
                    onValueChange={(value) => setFilters({ ...filters, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
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
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : applications.length === 0 ? (
          <Card className="bg-white border-gray-200 shadow-md">
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => {
              const age = calculateAge(app.job_seeker?.birthday);
              return (
                <Card key={app.id} className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.job_seeker?.name || "Candidate"}
                          </h3>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              getStatusColor(app.status)
                            )}
                          >
                            {app.status}
                          </span>
                        </div>
                        <div className="grid gap-2 text-sm text-gray-600">
                          <p><strong>Email:</strong> {app.job_seeker?.email || "N/A"}</p>
                          <p><strong>Phone:</strong> {app.job_seeker?.phone_number || "N/A"}</p>
                          {age && <p><strong>Age:</strong> {age} years</p>}
                          {app.job_seeker?.ethnicity && (
                            <p><strong>Ethnicity:</strong> {app.job_seeker.ethnicity}</p>
                          )}
                          {app.job_seeker?.gender && (
                            <p><strong>Gender:</strong> {app.job_seeker.gender}</p>
                          )}
                          {app.job_seeker?.years_of_experience !== undefined && (
                            <p><strong>Experience:</strong> {app.job_seeker.years_of_experience} years</p>
                          )}
                          <p><strong>Location:</strong> {app.job_seeker?.city || "N/A"}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                          Applied: {formatRelativeTime(app.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/business/applications/${app.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Select
                          value={app.status}
                          onValueChange={(value) => handleStatusChange(app.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="reviewed">Reviewed</SelectItem>
                            <SelectItem value="shortlisted">Shortlisted</SelectItem>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlock(app.job_seeker?.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Block
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
    </div>
  );
}

