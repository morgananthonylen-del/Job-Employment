"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, XCircle, FileText, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type ReviewResponse = {
  application: any;
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

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [savingReview, setSavingReview] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ReviewResponse["aiSuggestion"]>(null);
  const [progress, setProgress] = useState<ReviewResponse["progress"] | null>(null);

  useEffect(() => {
    fetchApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id?.toString()]);

  const fetchApplication = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be signed in as a business user.");
      }

      const response = await fetch(`/api/applications/${params.id}/review`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to load application details");
      }

      const data: ReviewResponse = await response.json();

      let legacyData = null;
      try {
        const legacyResponse = await fetch(`/api/applications/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (legacyResponse.ok) {
          legacyData = await legacyResponse.json();
        }
      } catch (legacyError) {
        console.warn("Unable to load legacy application details:", legacyError);
      }

      const mergedApplication = legacyData
        ? { ...legacyData, reviewApplicationMeta: data.application }
        : data.application;

      setApplication(mergedApplication);
      setStatus(legacyData?.status ?? data.application?.status ?? "");
      setNotes(data.review?.note || legacyData?.notes || "");
      setRating(data.review?.rating || 0);
      setAiSuggestion(data.aiSuggestion);
      setProgress(data.progress);
    } catch (error) {
      console.error("Error fetching application:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/applications/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Application updated successfully",
        });
        fetchApplication();
      } else {
        throw new Error("Failed to update");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const handleSaveReview = async (advance: boolean) => {
    if (!rating) {
      toast({
        title: "Select a rating",
        description: "Choose a star rating before saving the review.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingReview(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be signed in as a business user.");
      }

      const response = await fetch(`/api/applications/${params.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          note: notes,
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
          ? result.nextApplicationId
            ? "Moving to the next candidate…"
            : "This was the final applicant for this job."
          : "Your rating and notes have been saved.",
      });

      if (advance && result.nextApplicationId) {
        router.push(`/business/applications/${result.nextApplicationId}`);
        return;
      }

      await fetchApplication();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unable to save review",
        variant: "destructive",
      });
    } finally {
      setSavingReview(false);
    }
  };

  const handleAcceptAiSuggestion = () => {
    if (!aiSuggestion?.rating) return;
    setRating(aiSuggestion.rating);
    if (!notes && aiSuggestion.summary) {
      setNotes(aiSuggestion.summary);
    }
    toast({
      title: "AI suggestion applied",
      description: "Feel free to adjust before saving.",
    });
  };

  const ratingOptions = useMemo(() => [1, 2, 3, 4, 5], []);

  const calculateAge = (birthday: string) => {
    if (!birthday) return null;
    return new Date().getFullYear() - new Date(birthday).getFullYear();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Application not found</p>
      </div>
    );
  }

  const age = calculateAge(application.job_seeker?.birthday);
  const reviewMeta = application.reviewApplicationMeta ?? {};
  const jobTitle =
    application.job?.title ?? reviewMeta.jobTitle ?? application.jobTitle ?? "Job";
  const jobLocation =
    application.job?.location ?? reviewMeta.jobLocation ?? application.jobLocation ?? "";

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/business/applications" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Applications
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Job Info */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-lg font-semibold">{jobTitle}</p>
                <p className="text-gray-600">{jobLocation || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Info */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{application.job_seeker?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{application.job_seeker?.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{application.job_seeker?.phone_number || "N/A"}</p>
                </div>
                {age && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Age</p>
                    <p className="text-gray-900">{age} years</p>
                  </div>
                )}
                {application.job_seeker?.ethnicity && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ethnicity</p>
                    <p className="text-gray-900 capitalize">{application.job_seeker.ethnicity}</p>
                  </div>
                )}
                {application.job_seeker?.gender && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="text-gray-900 capitalize">{application.job_seeker.gender}</p>
                  </div>
                )}
                {application.job_seeker?.years_of_experience !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="text-gray-900">{application.job_seeker.years_of_experience} years</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">
                    {application.job_seeker?.city || "N/A"}
                    {application.job_seeker?.address && `, ${application.job_seeker.address}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Letter */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{application.cover_letter}</p>
            </CardContent>
          </Card>

          {/* Resume */}
          {application.resume_url && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <a href={application.resume_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    View Resume
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Review Section */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Review Application</CardTitle>
              <CardDescription>
                Record your rating, notes, and status. Ratings remain private to your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Star rating</Label>
                <div className="flex items-center gap-2">
                  {ratingOptions.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`rounded-full p-2 transition ${
                        rating >= value ? "text-amber-500" : "text-gray-300 hover:text-gray-400"
                      }`}
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    >
                      <Star className={`h-6 w-6 ${rating >= value ? "fill-amber-400" : ""}`} />
                    </button>
                  ))}
                  <span className="text-sm text-gray-500">
                    {rating ? `${rating} star${rating > 1 ? "s" : ""}` : "No rating yet"}
                  </span>
                </div>
                {aiSuggestion?.rating && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-700">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">
                          AI suggestion: {aiSuggestion.rating} star{aiSuggestion.rating > 1 ? "s" : ""}
                        </p>
                        {aiSuggestion.summary && (
                          <p className="text-blue-700/90">{aiSuggestion.summary}</p>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="px-2 text-blue-700 hover:text-blue-800"
                          onClick={handleAcceptAiSuggestion}
                        >
                          Use this rating
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this candidate..."
                  rows={4}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={() => handleSaveReview(false)} disabled={savingReview}>
                  {savingReview ? "Saving…" : "Save rating"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSaveReview(true)}
                  disabled={savingReview}
                >
                  {progress?.nextApplicationId ? "Save & next" : "Save review"}
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={handleUpdate}>
                  Update status
                </Button>
                {progress?.previousApplicationId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      router.push(`/business/applications/${progress.previousApplicationId}`)
                    }
                  >
                    View previous applicant
              </Button>
                )}
              </div>

              {progress && progress.position !== null && (
                <p className="text-xs text-gray-500">
                  Reviewed {progress.position} of {progress.total} applicants.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

