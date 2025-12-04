"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { FileUp, Trash2, X, Plus } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface DocumentItem {
  id: string;
  category: DocumentCategory;
  name: string;
  url: string;
  path: string;
  uploaded_at: string;
}

type DocumentCategory = "birth_certificate" | "cv" | "reference" | "application_letter" | "degree_diploma_certificate";

type UploadState = {
  inProgress: boolean;
  percentage: number;
  error?: string;
};

const CATEGORY_CONFIG: Record<
  DocumentCategory,
  {
    title: string;
    description: string;
    accept: string;
    helper: string;
  }
> = {
  birth_certificate: {
    title: "Birth Certificate",
    description: "Upload a clear scan or photo of your birth certificate.",
    accept: "application/pdf,image/*",
    helper: "Accepted formats: PDF or image files. Max size 10 MB.",
  },
  cv: {
    title: "Curriculum Vitae (CV)",
    description: "Upload the latest version of your CV.",
    accept: "application/pdf",
    helper: "PDF format required.",
  },
  reference: {
    title: "References",
    description: "Upload professional or personal reference letters.",
    accept: "application/pdf,image/*",
    helper: "Upload as PDF or image. You can upload multiple references.",
  },
  application_letter: {
    title: "Application Letter",
    description: "Save your latest application or cover letter for quick reuse.",
    accept: "application/pdf",
    helper: "Upload as PDF. You can also generate one with Amanda in the dashboard.",
  },
  degree_diploma_certificate: {
    title: "Degree / Diploma / Certificates",
    description: "Upload your educational certificates, diplomas, or degrees.",
    accept: "application/pdf,image/*",
    helper: "Upload as PDF or image. You can upload multiple certificates.",
  },
};

export default function JobSeekerDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<DocumentCategory, UploadState>>({
    birth_certificate: { inProgress: false, percentage: 0 },
    cv: { inProgress: false, percentage: 0 },
    reference: { inProgress: false, percentage: 0 },
    application_letter: { inProgress: false, percentage: 0 },
    degree_diploma_certificate: { inProgress: false, percentage: 0 },
  });
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);
  const [visibleDegreeSlots, setVisibleDegreeSlots] = useState<number>(1);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/documents", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load documents");
        }

        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };

    fetchDocuments();
  }, []);

  const totalDocuments = useMemo(() => documents.length, [documents.length]);
  
  // Update visible degree slots when documents change
  const degreeDocs = documents.filter((doc) => doc.category === "degree_diploma_certificate");
  useEffect(() => {
    if (degreeDocs.length > 0 && visibleDegreeSlots <= degreeDocs.length) {
      setVisibleDegreeSlots(degreeDocs.length + 1);
    }
  }, [degreeDocs.length]);

  const handleUpload = async (category: DocumentCategory, file: File | null) => {
    if (!file) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setUploadStates((prev) => ({
      ...prev,
      [category]: { inProgress: true, percentage: 0 },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await fetch("/api/uploads/document", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setDocuments((prev) => [
        {
          id: data.path,
          category,
          name: file.name,
          url: data.url,
          path: data.path,
          uploaded_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      setUploadStates((prev) => ({
        ...prev,
        [category]: { inProgress: false, percentage: 100 },
      }));
    } catch (error: any) {
      setUploadStates((prev) => ({
        ...prev,
        [category]: {
          inProgress: false,
          percentage: 0,
          error: error.message || "Upload failed",
        },
      }));
    } finally {
      setTimeout(() => {
        setUploadStates((prev) => ({
          ...prev,
          [category]: { inProgress: false, percentage: 0 },
        }));
      }, 2000);
    }
  };

  const handleDelete = async (path: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/uploads/document?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments((prev) => prev.filter((doc) => doc.path !== path));
    } catch (error) {
      console.error("Delete document error:", error);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-2">
          Upload and manage the documents required for your job applications.
        </p>
        <p className="text-sm text-gray-500 mt-1">Documents uploaded: {totalDocuments}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).map((category) => {
          const config = CATEGORY_CONFIG[category];
          const uploadState = uploadStates[category];
          
          // Special handling for degree_diploma_certificate - allow multiple uploads
          if (category === "degree_diploma_certificate") {
            const categoryDegreeDocs = documents.filter((doc) => doc.category === category);
            
            return (
              <Card key={category} className="bg-white border border-gray-200 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileUp className="h-5 w-5 text-blue-600" /> {config.title}
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-gray-500">{config.helper}</p>
                  
                  {/* Render uploaded certificates and active upload slots */}
                  {Array.from({ length: visibleDegreeSlots }).map((_, index) => {
                    const slotDoc = categoryDegreeDocs[index];
                    const isUploading = uploadState.inProgress && index === categoryDegreeDocs.length;
                    const showPlusButton = slotDoc && index === categoryDegreeDocs.length - 1 && !isUploading;
                    
                    return (
                      <div key={index} className="space-y-3">
                        {slotDoc ? (
                          // Show uploaded certificate
                          <>
                            <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                              <div>
                                <p className="font-medium">
                                  Certificate {index + 1}: {slotDoc.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Uploaded {formatRelativeTime(slotDoc.uploaded_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" onClick={() => setActiveDocument(slotDoc)}>
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="text-gray-700 hover:text-gray-900"
                                  onClick={() => handleDelete(slotDoc.path)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Show plus button after uploaded certificate */}
                            {showPlusButton && (
                              <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2 border-dashed"
                                onClick={() => setVisibleDegreeSlots(prev => prev + 1)}
                              >
                                <Plus className="h-4 w-4" />
                                Add another certificate
                              </Button>
                            )}
                          </>
                        ) : (
                          // Show upload field
                          <>
                            <input
                              type="file"
                              accept={config.accept}
                              onChange={(event) => {
                                if (event.target.files?.[0]) {
                                  handleUpload(category, event.target.files[0]);
                                  event.target.value = ""; // Reset input
                                }
                              }}
                              className="hidden"
                              id={`file-${category}-${index}`}
                              disabled={isUploading}
                            />
                            <Label
                              htmlFor={`file-${category}-${index}`}
                              className={`flex w-full items-center justify-center rounded-md border border-dashed px-4 py-6 text-sm font-medium transition ${
                                !isUploading
                                  ? "cursor-pointer border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                                  : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                              }`}
                            >
                              {isUploading ? "Uploading…" : index === 0 ? "Upload first certificate" : `Upload certificate ${index + 1}`}
                            </Label>

                            {isUploading && (
                              <div className="space-y-2">
                                <Progress value={uploadState.percentage || 50} />
                                <p className="text-xs text-gray-500">Uploading…</p>
                              </div>
                            )}

                            {uploadState.error && index === categoryDegreeDocs.length && (
                              <p className="text-xs text-red-500">{uploadState.error}</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          }
          
          // Regular single-upload categories
          const latestDoc = documents.find((doc) => doc.category === category);
          const canUpload = !latestDoc && !uploadState.inProgress;

          return (
            <Card key={category} className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FileUp className="h-5 w-5 text-blue-600" /> {config.title}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  type="file"
                  accept={config.accept}
                  onChange={(event) => handleUpload(category, event.target.files?.[0] || null)}
                  className="hidden"
                  id={`file-${category}`}
                  disabled={!canUpload}
                />
                <Label
                  htmlFor={`file-${category}`}
                  className={`flex w-full items-center justify-center rounded-md border border-dashed px-4 py-6 text-sm font-medium transition ${
                    canUpload
                      ? "cursor-pointer border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                      : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {latestDoc
                    ? "Slot filled"
                    : uploadState.inProgress
                      ? "Uploading…"
                      : "No file uploaded yet"}
                </Label>
                <p className="text-xs text-gray-500">{config.helper}</p>

                {uploadState.inProgress && (
                  <div className="space-y-2">
                    <Progress value={uploadState.percentage || 50} />
                    <p className="text-xs text-gray-500">Uploading…</p>
                  </div>
                )}

                {uploadState.error && (
                  <p className="text-xs text-red-500">{uploadState.error}</p>
                )}

                {latestDoc && (
                  <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <div>
                      <p className="font-medium">
                        {config.title} uploaded
                      </p>
                      <p className="text-xs text-gray-500">
                        Uploaded {formatRelativeTime(latestDoc.uploaded_at)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Delete the current file to upload a new one.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" onClick={() => setActiveDocument(latestDoc)}>
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-gray-700 hover:text-gray-900"
                        onClick={() => handleDelete(latestDoc.path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-8">
          <div className="relative w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveDocument(null)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black transition hover:bg-black/20"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex flex-col gap-4 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {CATEGORY_CONFIG[activeDocument.category]?.title ?? "Document"}
              </p>
              <div className="h-[70vh] w-full overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                {activeDocument.name.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={activeDocument.url}
                    title={activeDocument.name}
                    className="h-full w-full"
                  />
                ) : (
                  <img
                    src={activeDocument.url}
                    alt={activeDocument.name}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveDocument(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


