"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Briefcase, MapPin, Sparkles, FileText, AlertCircle } from "lucide-react";

interface JobDetails {
  id: string;
  title: string;
  location?: string;
  job_type?: string;
  business?: {
    company_name?: string;
  };
}

interface DocumentItem {
  path: string;
  url: string;
  name: string;
  category: "birth_certificate" | "cv" | "reference" | "application_letter" | "degree_diploma_certificate";
  uploaded_at: string;
}

const REQUIRED_DOCUMENT_TYPES: DocumentItem["category"][] = ["cv", "application_letter", "reference", "birth_certificate"];

const DOCUMENT_LABELS: Record<DocumentItem["category"], string> = {
  cv: "CV",
  application_letter: "Application letter",
  reference: "Reference",
  birth_certificate: "Birth certificate",
  degree_diploma_certificate: "Degree / Diploma / Certificate",
};

export default function JobSeekerApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedResumePath, setSelectedResumePath] = useState<string>("");
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  const [blockingMissingDocs, setBlockingMissingDocs] = useState<DocumentItem["category"][]>([]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;

      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJob({
            id: data.id,
            title: data.title,
            location: data.location,
            job_type: data.job_type,
            business: data.business,
          });
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

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
      } finally {
        setDocumentsLoaded(true);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    const resumeDocs = documents.filter((doc) => doc.category === "cv");
    if (resumeDocs.length && !selectedResumePath) {
      setSelectedResumePath(resumeDocs[0].path);
    }
  }, [documents, selectedResumePath]);

  const resumeOptions = useMemo(
    () => documents.filter((doc) => doc.category === "cv"),
    [documents]
  );

  const selectedResumeDoc = resumeOptions.find((doc) => doc.path === selectedResumePath) || null;

  const missingDocuments = useMemo(() => REQUIRED_DOCUMENT_TYPES.filter((category) => !documents.some((doc) => doc.category === category)), [documents]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!jobId) return;

    if (missingDocuments.length > 0) return;

    if (!selectedResumeDoc) {
      toast({
        title: "Resume required",
        description: "Upload a CV in Documents and select it before applying.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({ title: "Error", description: "You must be logged in to apply.", variant: "destructive" });
        return;
      }

      const res = await fetch(`/api/applications/job/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coverLetter,
          resumeUrl: selectedResumeDoc?.url,
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

      router.push("/jobseeker/applications");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unable to submit application",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToDocuments = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("returnToAfterDocuments", window.location.pathname);
    }
    router.push("/jobseeker/documents");
  };

  const handleRemindDocuments = () => {
    toast({
      title: "Upload your documents",
      description: "Head to the Documents section to upload the required files before applying.",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Apply for this job</h1>
      </div>

      {loading ? (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">Loading job details…</CardContent>
        </Card>
      ) : job ? (
        <>
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">{job.title}</CardTitle>
              <CardDescription>
                {job.business?.company_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex flex-wrap gap-4">
                {job.location && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {job.location}
                  </span>
                )}
                {job.job_type && (
                  <span className="inline-flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    {job.job_type}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Submit your application</CardTitle>
              <CardDescription>Upload your resume and share a cover note to introduce yourself.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>Select resume from Documents</Label>
                  <Select
                    onValueChange={(value) => setSelectedResumePath(value)}
                    value={selectedResumePath}
                    disabled={resumeOptions.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          resumeOptions.length
                            ? "Select a resume document"
                            : "Upload a resume in Documents first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {resumeOptions.map((doc) => (
                        <SelectItem key={doc.path} value={doc.path}>
                          {doc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>PDF documents stored in your Documents vault.</span>
                    <Button variant="ghost" asChild className="h-auto px-1 text-blue-600">
                      <Link href="/jobseeker/documents">Open Documents</Link>
                    </Button>
                  </div>
                  {selectedResumeDoc && (
                    <Button variant="ghost" size="sm" asChild className="flex items-center gap-2 text-blue-600 p-0">
                      <a href={selectedResumeDoc.url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" /> View selected resume
                      </a>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover letter / application message</Label>
                  <Textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    rows={6}
                    placeholder="Introduce yourself, highlight your experience, and explain why you're a good fit for this role."
                  />
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    Need inspiration? Start with a few sentences on your recent experience and how it relates to this role.
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" type="button" asChild>
                    <Link href="/jobseeker/assistant">Ask Amanda for tips</Link>
                  </Button>
                  <Button type="submit" disabled={submitting || missingDocuments.length > 0}>
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-12 text-center text-gray-500">
            We couldn’t find this job listing. It may have been removed.
          </CardContent>
        </Card>
      )}

      {missingDocuments.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={handleRemindDocuments}
          />
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
                    Before you can apply, upload the following document types:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {missingDocuments.map((category) => (
                      <li key={category}>{DOCUMENT_LABELS[category]}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500">
                    After uploading, return to this page to submit your application.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={handleGoToDocuments}>
                  Upload documents now
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleRemindDocuments}>
                  I’ll do it later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


