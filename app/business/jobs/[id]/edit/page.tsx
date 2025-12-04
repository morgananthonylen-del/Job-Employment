"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Briefcase, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
    job_type: "full-time",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [promotionTier, setPromotionTier] = useState<"free" | "pro">("free");
  const isProTier = promotionTier === "pro";
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [deadlineTime, setDeadlineTime] = useState<string>("");
  const [deadlineError, setDeadlineError] = useState<string | null>(null);
  const previewDeadlineLabel = useMemo(() => {
    if (!deadline) return "No deadline selected";
    const dateLabel = format(deadline, "PPP");
    return deadlineTime ? `${dateLabel} at ${deadlineTime}` : dateLabel;
  }, [deadline, deadlineTime]);
  const previewDescription = useMemo(() => {
    if (!formData.description) {
      return "Use this area to highlight the opportunity, culture, and key responsibilities.";
    }
    return formData.description;
  }, [formData.description]);
  const previewDescriptionText = useMemo(
    () =>
      previewDescription.length > 240
        ? `${previewDescription.slice(0, 240)}…`
        : previewDescription,
    [previewDescription]
  );
  const [allowMessages, setAllowMessages] = useState(false);
  const [allowCalls, setAllowCalls] = useState(false);
  const [contactPreference, setContactPreference] = useState<"message" | "call" | "both">("call");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const promptUpgrade = () => setShowUpgradePrompt(true);
  const handleUpgradeCancel = () => setShowUpgradePrompt(false);
  const handleUpgradeConfirm = () => {
    setPromotionTier("pro");
    setShowUpgradePrompt(false);
    setAllowMessages(true);
    setAllowCalls(true);
    updateContactPreference(true, true);
  };

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(storedUser);
    if (userData.userType !== "business") {
      router.push("/login");
      return;
    }
    fetchJob();
  }, [router, params.id]);

  useEffect(() => {
    if (!deadlineTime) {
      setDeadlineTime("17:00");
    }
  }, [deadlineTime]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchJob = async () => {
    try {
      const token = localStorage.getItem("token");
    const response = await fetch(`/api/jobs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job");
      }

      const job = await response.json();
      setFormData({
        title: job.title || "",
        description: job.description || "",
        requirements: job.requirements || "",
        location: job.location || "",
        salary: job.salary || "",
        job_type: job.job_type || "full-time",
        is_active: job.is_active !== undefined ? job.is_active : true,
      });
      if (job.application_deadline) {
        const deadlineDate = new Date(job.application_deadline);
        setDeadline(deadlineDate);
        setDeadlineTime(format(deadlineDate, "HH:mm"));
      } else {
        setDeadline(undefined);
        setDeadlineTime("17:00");
      }
      const tier = job.promotion_tier === "pro" ? "pro" : "free";
      setPromotionTier(tier);
      if (tier === "pro" && job.image_url) {
        setExistingImageUrl(job.image_url);
        setImagePreview(job.image_url);
      } else {
        setExistingImageUrl(null);
        setImagePreview(null);
      }
      setRemoveImage(false);
      const preference: "message" | "call" | "both" =
        job.contact_preference === "both" ||
        job.contact_preference === "call" ||
        job.contact_preference === "message"
          ? job.contact_preference
          : "call";
      setContactPreference(preference);
      setAllowMessages(preference === "message" || preference === "both");
      setAllowCalls(preference === "call" || preference === "both");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load job",
        variant: "destructive",
      });
      router.push("/business/dashboard");
    } finally {
      setFetching(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProTier) {
      event.preventDefault();
      event.target.value = "";
      promptUpgrade();
      return;
    }
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setRemoveImage(false);
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(existingImageUrl);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
    setRemoveImage(true);
  };

  const updateContactPreference = (messageAllowed: boolean, callAllowed: boolean) => {
    const preference =
      messageAllowed && callAllowed
        ? "both"
        : callAllowed
        ? "call"
        : messageAllowed
        ? "message"
        : "call"; // Default to "call" if both are off
    setContactPreference(preference);
  };

  const handleMessagesToggle = (checked: boolean) => {
    if (!isProTier) {
      promptUpgrade();
      return;
    }
    setAllowMessages(checked);
    updateContactPreference(checked, allowCalls);
  };

  const handleCallsToggle = (checked: boolean) => {
    if (!isProTier) {
      promptUpgrade();
      return;
    }
    setAllowCalls(checked);
    updateContactPreference(allowMessages, checked);
  };

  useEffect(() => {
    if (!isProTier) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
      setExistingImageUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProTier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      if (!deadline) {
        setDeadlineError("Please choose an application deadline.");
        setLoading(false);
        return;
      }

      if (!deadlineTime) {
        setDeadlineError("Please choose a submission cut-off time.");
        setLoading(false);
        return;
      }

      const [hours, minutes] = deadlineTime.split(":").map((value) => Number(value));
      const combinedDeadline = new Date(deadline);
      combinedDeadline.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      const now = new Date();
      if (combinedDeadline <= now) {
        setDeadlineError("Deadline must be a future date and time.");
        setLoading(false);
        return;
      }

      let imageUrl: string | null = existingImageUrl;

      if (removeImage || !isProTier) {
        imageUrl = null;
      }

      if (isProTier && imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/job-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadForm,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Failed to upload vacancy image");
        }

        imageUrl = uploadData.url;
      }

      const response = await fetch(`/api/jobs/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          promotion_tier: promotionTier,
          image_url: imageUrl,
          contact_preference: contactPreference,
          application_deadline: combinedDeadline.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update job");
      }

      toast({
        title: "Success!",
        description: "Job updated successfully!",
      });

      router.push("/business/dashboard");
    } catch (error: any) {
      if (error.message === "application_deadline_must_be_future") {
        setDeadlineError("Deadline must be a future date and time.");
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || fetching) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Upgrade to Pro Featured</h2>
              <p className="text-sm text-gray-600">
                Unlock direct enquiries and branded imagery to help your vacancy stand out.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Current plan</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>• Standard listing placement</li>
                  <li>• Email alerts for applicants</li>
                  <li>• Manage applications in your dashboard</li>
                </ul>
              </div>
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-left shadow-inner">
                <p className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pro Featured</p>
                <ul className="mt-3 space-y-2 text-sm text-amber-800">
                  <li>• Highlighted placement to boost visibility</li>
                  <li>• Instant messaging & phone enquiries</li>
                  <li>• Vacancy imagery for stronger branding</li>
                </ul>
              </div>
            </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={handleUpgradeCancel}>
              Not now
            </Button>
            <button
              type="button"
              onClick={handleUpgradeConfirm}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Yes, switch to Pro
            </button>
          </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/business/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 xl:grid-cols-[7fr_5fr]">
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle>Edit Job</CardTitle>
            <CardDescription>Update your job listing details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (Optional)</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="List the required skills, experience, education, etc."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Suva, Fiji"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">Job Type *</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => setFormData({ ...formData, job_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary (Optional)</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g., $30,000 - $50,000 or Competitive"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Application deadline *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        selected={deadline}
                        onSelect={(date) => {
                          if (date) {
                            setDeadline(date);
                            setDeadlineError(null);
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div
                  className={cn(
                    "space-y-2 overflow-hidden transition-all duration-300",
                    deadline ? "max-h-40 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  <Label htmlFor="deadline-time">Submission cut-off time *</Label>
                  <Input
                    id="deadline-time"
                    type="time"
                    value={deadlineTime}
                    onChange={(event) => {
                      setDeadlineTime(event.target.value);
                      setDeadlineError(null);
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Candidates will not be able to apply after this date and time.
              </p>
              {deadlineError && <p className="text-xs text-red-600">{deadlineError}</p>}

              <div className="space-y-3">
                <div>
                  <Label>Contact preference</Label>
                  <p className="text-xs text-gray-500">
                    Let applicants know the best way to reach you about this vacancy.
                  </p>
                </div>
                <div
                  className={cn(
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6 rounded-xl border border-gray-200 bg-white px-4 py-3",
                    !isProTier && "border-dashed border-blue-200 bg-blue-50/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Switch
                      id="contact-messages"
                      checked={allowMessages}
                      onCheckedChange={handleMessagesToggle}
                      aria-label="Toggle FastLink messages"
                    />
                    <Label
                      htmlFor="contact-messages"
                      className={cn("text-sm", !isProTier ? "text-gray-500" : "text-gray-700")}
                    >
                      Receive FastLink messages
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="contact-calls"
                      checked={allowCalls}
                      onCheckedChange={handleCallsToggle}
                      aria-label="Toggle phone enquiries"
                    />
                    <Label
                      htmlFor="contact-calls"
                      className={cn("text-sm", !isProTier ? "text-gray-500" : "text-gray-700")}
                    >
                      Receive phone calls
                    </Label>
                  </div>
                </div>
                {!isProTier && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <p className="font-semibold">Upgrade to enable direct enquiries</p>
                    <p className="mt-1">
                      Keep applicants in touch instantly.{" "}
                      <button
                        type="button"
                        onClick={promptUpgrade}
                        className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                      >
                        Switch to Pro
                      </button>
                    </p>
                  </div>
                )}
                {contactPreference === "message" && (
                  <p className="text-xs text-gray-500">
                    Applicants will message you through FastLink.
                  </p>
                )}
                {contactPreference === "call" && (
                  <p className="text-xs text-gray-500">
                    Applicants will be encouraged to call the number on your profile.
                  </p>
                )}
                {contactPreference === "both" && (
                  <p className="text-xs text-gray-500">
                    Applicants may reach out via FastLink messages or phone.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="image" className="sr-only">
                  Upload vacancy image
                </Label>
                <div className="relative inline-flex flex-col gap-1 group">
                  <span className="text-sm font-medium text-gray-700">Vacancy Image (Optional)</span>
                  <div className="pointer-events-none absolute left-0 top-full z-20 hidden w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                    Showcase your role with an image. Job seekers will see it when they open View Details.
                    <span className="absolute left-6 -top-1 h-2 w-2 rotate-45 bg-gray-900" />
                  </div>
                </div>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                {isProTier ? (
                  <p className="text-xs text-gray-500">
                    Upload or replace the vacancy image. This appears to job seekers when viewing job
                    details.
                  </p>
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <p className="font-semibold">Brand your listing with Pro Featured</p>
                    <p className="mt-1">
                      Add imagery to stand out in job searches.{" "}
                      <button
                        type="button"
                        onClick={promptUpgrade}
                        className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                      >
                        Upgrade now
                      </button>
                    </p>
                  </div>
                )}
                {imagePreview && isProTier ? (
                  <div className="relative overflow-hidden border border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Vacancy preview"
                      width={600}
                      height={340}
                      className="block h-48 w-full object-contain bg-gray-900/5"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-2 top-2 h-8 w-8 rounded-full bg-white/80 text-red-500 hover:bg-white"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {isProTier ? "No image uploaded." : "Image upload unlocked with Pro Featured."}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Job is active (visible to job seekers)
                </Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Updating..." : "Update Job"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/business/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="border border-gray-200 bg-white shadow-md">
            <CardHeader>
              <CardTitle>Job preview</CardTitle>
              <CardDescription>Live look at how job seekers see this post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProTier && imagePreview ? (
                <div className="overflow-hidden rounded-xl border border-amber-100 bg-gray-900/70">
                  <div className="relative h-48 w-full">
                    <Image
                      src={imagePreview}
                      alt="Vacancy preview"
                      fill
                      className="object-contain bg-gray-900/5"
                    />
                  </div>
                  <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                    Featured listings show imagery in job details to boost engagement.
                  </p>
                </div>
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  Vacancy imagery appears here for Pro Featured posts.
                </div>
              )}
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-gray-900">
                  {formData.title || "Job title preview"}
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {previewDescriptionText}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {formData.location || "Location not set"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {formData.job_type}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Applications close {previewDeadlineLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  💰 {formData.salary || "Salary not shown"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}

