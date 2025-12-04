"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Briefcase, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salary: "",
    job_type: "full-time",
    contact_preference: "call",
    promotion_tier: "free" as "free" | "pro",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [allowMessages, setAllowMessages] = useState(false);
  const [allowCalls, setAllowCalls] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const isProTier = formData.promotion_tier === "pro";
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

  const promptUpgrade = () => setShowUpgradePrompt(true);
  const handleUpgradeCancel = () => setShowUpgradePrompt(false);
  const handleUpgradeConfirm = () => {
    setFormData((prev) => ({
      ...prev,
      promotion_tier: "pro",
      contact_preference: allowMessages && allowCalls ? "both" : allowCalls ? "call" : "message",
    }));
    setShowUpgradePrompt(false);
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
    }
  }, [router]);

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

  useEffect(() => {
    if (!isProTier) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
      setAllowMessages(false);
      setAllowCalls(false);
      setFormData((prev) => ({ ...prev, contact_preference: "call" }));
    }
  }, [isProTier, imagePreview]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProTier) {
      event.preventDefault();
      event.target.value = "";
      promptUpgrade();
      return;
    }
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
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
    setFormData((prev) => ({ ...prev, contact_preference: preference }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeadlineError(null);
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

      let imageUrl: string | null = null;

      if (isProTier && imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);

        const uploadResponse = await fetch("/api/uploads/job-image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || "Failed to upload vacancy image");
        }

        imageUrl = uploadData.url;
      }

      // Calculate contact_preference from toggles at submit time
      const finalContactPreference =
        allowMessages && allowCalls
          ? "both"
          : allowCalls
          ? "call"
          : allowMessages
          ? "message"
          : "message"; // Default to "message" if both are off

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          application_deadline: combinedDeadline.toISOString(),
          contact_preference: finalContactPreference,
          image_url: isProTier ? imageUrl : null,
          promotion_tier: formData.promotion_tier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || `Failed to create job (${response.status})`;
        console.error("Job creation error:", { status: response.status, data });
        throw new Error(errorMessage);
      }

      toast({
        title: "Success!",
        description: "Job posted successfully!",
      });

      router.push("/business/dashboard");
    } catch (error: any) {
      if (error.message === "application_deadline_must_be_future") {
        setDeadlineError("Deadline must be a future date and time.");
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      {tierDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-gray-900">Choose how you want to promote this job</h2>
              <p className="text-sm text-gray-600">
                Pick between a free listing or our Pro Featured placement to boost visibility.
              </p>
              <Link
                href="/resources/free-vs-pro-job-promotion"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                View more information
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, promotion_tier: "free" }))}
                className={cn(
                  "rounded-2xl border-2 px-5 py-5 text-left transition hover:border-blue-400 hover:shadow",
                  formData.promotion_tier === "free" ? "border-blue-500 shadow-lg" : "border-gray-200"
                )}
              >
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Free Post</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">$0</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>• Standard listing placement</li>
                  <li>• Visible to all job seekers</li>
                  <li>• Email notification for every new applicant</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, promotion_tier: "pro" }))}
                className={cn(
                  "rounded-2xl border-2 px-5 py-5 text-left transition hover:border-blue-400 hover:shadow",
                  formData.promotion_tier === "pro" ? "border-blue-500 shadow-lg" : "border-gray-200"
                )}
              >
                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Pro Featured</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">$50 FJD / post</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>• Featured placement highlighted with a crown badge</li>
                  <li>• Upload a vacancy image shown in View Details</li>
                  <li>• AI-assisted candidate selection insights</li>
                  <li>• Candidate rating system to shortlist faster</li>
                  <li>• 20 free text messages per job post</li>
                  <li>• Send emails to candidates once selected</li>
                  <li>• Email notification for every new applicant</li>
                </ul>
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push("/business/jobs")}>
                Cancel
              </Button>
              <Button onClick={() => setTierDialogOpen(false)}>
                Continue with {formData.promotion_tier === "pro" ? "Pro Featured" : "Free Post"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {showUpgradePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-xl font-semibold text-gray-900">This is a paid feature</h3>
            <p className="text-sm text-gray-600">
              Vacancy imagery and other highlighted perks are part of the Pro Featured plan. Switch to Pro
              to unlock this option?
            </p>
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
        <div className="grid gap-6 xl:grid-cols-[7fr_5fr]">
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>Fill in the details to post your job listing</CardDescription>
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
              {deadlineError && (
                <p className="text-xs text-red-600">{deadlineError}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="salary-toggle">Display salary range</Label>
                    <p className="text-xs text-gray-500">
                      Share a range to attract more qualified applicants.
                    </p>
                  </div>
                  <Switch
                    id="salary-toggle"
                    checked={showSalary}
                    onCheckedChange={(checked) => {
                      setShowSalary(checked);
                      if (!checked) {
                        setFormData((prev) => ({ ...prev, salary: "" }));
                      }
                    }}
                  />
                </div>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300 ease-in-out",
                    showSalary ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0 space-y-2">
                    <Label htmlFor="salary">Salary range</Label>
                    <Input
                      id="salary"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="e.g., $30,000 - $50,000 or Competitive"
                    />
                  </div>
                </div>
              </div>

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
                      className={cn(
                        "text-sm",
                        !isProTier ? "text-gray-500" : "text-gray-700"
                      )}
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
                      className={cn(
                        "text-sm",
                        !isProTier ? "text-gray-500" : "text-gray-700"
                      )}
                    >
                      Receive phone calls
                    </Label>
                  </div>
                </div>
                {!isProTier && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <p className="font-semibold">Upgrade to enable direct enquiries</p>
                    <p className="mt-1">
                      Let applicants message or call you instantly.{" "}
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
                {formData.contact_preference === "message" && (
                  <p className="text-xs text-gray-500">
                    Applicants will message you through FastLink.
                  </p>
                )}
                {formData.contact_preference === "call" && (
                  <p className="text-xs text-gray-500">
                    Applicants will be encouraged to call the number on your profile.
                  </p>
                )}
                {formData.contact_preference === "both" && (
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
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={cn(!isProTier && "cursor-pointer")}
                />
                {isProTier ? (
                  <p className="text-xs text-gray-500">
                    Upload a vacancy image. This appears to job seekers when viewing job details.
                  </p>
                ) : (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    <p className="font-semibold">Add branding with Pro Featured jobs</p>
                    <p className="mt-1">
                      Showcase your opportunity with imagery to stand out.{" "}
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

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Posting..." : "Post Job"}
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




