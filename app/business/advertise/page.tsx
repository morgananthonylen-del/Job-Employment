"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_ADS_EVENT,
  SponsoredAd,
  SponsoredAdAction,
  SponsoredAdFormat,
  SponsoredAdGender,
  SponsoredAdStatus,
  readStoredAds,
  writeStoredAds,
} from "@/lib/ads";
import { useToast } from "@/hooks/use-toast";

const RECOMMENDED_WIDTH = 288;
const RECOMMENDED_HEIGHT_IMAGE = 160;
const RECOMMENDED_HEIGHT_IMAGE_TEXT = 144;
const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

type StoredUser = {
  id: string;
  userType?: string;
  name?: string;
  company_name?: string;
  email?: string;
};

type FormState = {
  format: SponsoredAdFormat;
  actionType: SponsoredAdAction;
  headline: string;
  body: string;
  link: string;
  imageAlt: string;
  imageData: string;
  imageName: string;
  targetGender: SponsoredAdGender;
};

const defaultForm: FormState = {
  format: "image",
  actionType: "website",
  headline: "",
  body: "",
  link: "https://",
  imageAlt: "",
  imageData: "",
  imageName: "",
  targetGender: "all",
};

const formatOptions: { value: SponsoredAdFormat; label: string; description: string }[] = [
  {
    value: "image",
    label: "Image only",
    description: `Best for bold visuals. Displayed at ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT_IMAGE}px.`,
  },
  {
    value: "image-text",
    label: "Image + text snippet",
    description: `Include a headline and supporting copy. Image renders at ${RECOMMENDED_WIDTH}×${RECOMMENDED_HEIGHT_IMAGE_TEXT}px with text beneath.`,
  },
];

const CTA_LABELS: Record<SponsoredAdAction, string> = {
  website: "Website visits",
  call: "Call now",
};

const CTA_BUTTON_TEXT: Record<SponsoredAdAction, string> = {
  website: "Visit site",
  call: "Call now",
};

export default function AdvertisePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [previewAd, setPreviewAd] = useState<SponsoredAd | null>(null);
const [editingAdMeta, setEditingAdMeta] = useState<{
  id: string;
  createdAt?: string;
  status?: SponsoredAdStatus;
} | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteHeadline, setPendingDeleteHeadline] = useState<string | null>(null);
  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);
  const submissionStartRef = useRef<number>(0);

  const userDisplayName = useMemo(() => {
    if (!user) return "";
    return user.company_name || user.name || "your team";
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("user");
      if (stored) {
        const parsed: StoredUser = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (error) {
      console.error("Unable to load user for advertising:", error);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (previewAd) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
    return;
  }, [previewAd]);

  const refreshOwnedAds = useCallback(
    (ownerId?: string) => {
      if (!ownerId) {
        setAds([]);
        return;
      }
      const allAds = readStoredAds();
      const owned = allAds
        .filter((ad) => ad.ownerId === ownerId)
        .sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return 0;
        });
      setAds(owned);
    },
    [setAds]
  );

  const mutateAdStatus = useCallback(
    (
      adId: string,
      nextStatus: "active" | "paused" | "stopped",
      toastMessages: { title: string; description: string }
    ) => {
      if (!user?.id) return;
      const existing = readStoredAds();
      let changed = false;
      const updated = existing.map((ad) => {
        if (ad.id === adId) {
          if (ad.status === nextStatus) {
            return ad;
          }
          changed = true;
          return { ...ad, status: nextStatus };
        }
        return ad;
      });
      if (!changed) return;
      writeStoredAds(updated);
      refreshOwnedAds(user.id);
      window.dispatchEvent(new Event(CUSTOM_ADS_EVENT));
      toast(toastMessages);
    },
    [user?.id, refreshOwnedAds, toast]
  );

  const handleTogglePause = useCallback(
    (ad: SponsoredAd) => {
      if (!user?.id) return;
      const isPaused = ad.status === "paused";
      mutateAdStatus(ad.id, isPaused ? "active" : "paused", {
        title: isPaused ? "Ad resumed" : "Ad paused",
        description: isPaused
          ? "Your sponsored placement is visible again."
          : "This ad is hidden until you resume it.",
      });
    },
    [mutateAdStatus, user?.id]
  );

  const handleStop = useCallback(
    (ad: SponsoredAd) => {
      if (!user?.id) return;
      mutateAdStatus(ad.id, "stopped", {
        title: "Ad stopped",
        description: "This placement has been removed from all rotations.",
      });
    },
    [mutateAdStatus, user?.id]
  );

  const beginEditingAd = (ad: SponsoredAd) => {
    const format = ad.format ?? "image";
    const actionType = ad.actionType ?? "website";
    const targetGender = ad.targetGender ?? "all";
    const isCallAction = actionType === "call" || ad.href?.startsWith("tel:");
    const cleanedLink = ad.href
      ? isCallAction
        ? ad.href.replace(/^tel:/i, "")
        : ad.href
      : "https://";

    setForm({
      format,
      actionType,
      headline: format === "image-text" ? ad.headline ?? "" : "",
      body: format === "image-text" ? ad.body ?? "" : "",
      link: isCallAction ? cleanedLink : cleanedLink || "https://",
      imageAlt: ad.imageAlt || "",
      imageData: ad.imageUrl || "",
      imageName: ad.imageAlt || ad.imageUrl ? "existing-ad-image" : "",
      targetGender,
    });
    setImageError(null);
    setEditingAdMeta({
      id: ad.id,
      createdAt: ad.createdAt,
      status: (ad.status as SponsoredAdStatus) ?? "active",
    });
    setPreviewAd(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const computeAdMetrics = useCallback((ad: SponsoredAd) => {
    const baseKey = `${ad.id}-${ad.href}-${ad.headline ?? ""}-${ad.actionType ?? "website"}`;
    let seed = 0;
    for (let i = 0; i < baseKey.length; i += 1) {
      seed = (seed * 31 + baseKey.charCodeAt(i)) >>> 0;
    }

    const createdAt = ad.createdAt ? new Date(ad.createdAt).getTime() : Date.now() - 86400000;
    const ageDays = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

    const baseViews = 420 + (seed % 780); // 420 - 1199 per day
    const views = Math.max(120, baseViews * ageDays + (seed % 47) * ageDays);

    const reachMultiplier = 0.58 + ((seed % 35) / 200); // between ~0.58 and 0.755
    const reach = Math.min(views, Math.max(80, Math.floor(views * reachMultiplier)));

    const ctrBase = 0.035 + ((seed % 25) / 1000); // 3.5% - 5.9%
    const ctrSwing = 0.008 * Math.sin(ageDays / 1.8 + (seed % 7));
    const ctr = Math.max(0.012, Math.min(0.085, ctrBase + ctrSwing));
    const clicks = Math.max(5, Math.floor(views * ctr));

    return {
      views,
      reach,
      clicks,
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      refreshOwnedAds(user.id);
    }
  }, [user?.id, refreshOwnedAds]);

  const resetForm = () => {
    setForm(defaultForm);
    setImageError(null);
    setEditingAdMeta(null);
  };

  const handleFormatChange = (value: SponsoredAdFormat) => {
    setForm((prev) => ({
      ...prev,
      format: value,
      // Clear text fields if switching back to image-only
      ...(value === "image"
        ? {
            headline: "",
            body: "",
          }
        : {}),
    }));
  };

  const handleActionTypeChange = (value: FormState["actionType"]) => {
    setForm((prev) => ({
      ...prev,
      actionType: value,
      link:
        value === "call"
          ? ""
          : prev.link.startsWith("tel:")
          ? "https://"
          : prev.link.length > 0
          ? prev.link
          : "https://",
    }));
  };

  const handleGenderChange = (value: SponsoredAdGender) => {
    setForm((prev) => ({
      ...prev,
      targetGender: value,
    }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please upload a valid image file (PNG, JPG, SVG).");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("Image is too large. Please keep it under 1.5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        imageData: typeof reader.result === "string" ? reader.result : "",
        imageName: file.name,
      }));
      setImageError(null);
    };
    reader.onerror = () => {
      setImageError("We couldn't read that file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) {
      toast({
        title: "You need to be signed in",
        description: "Please sign in as a business user before creating sponsored ads.",
        variant: "destructive",
      });
      return;
    }

    if (!form.imageData) {
      setImageError("Add an image before saving your ad.");
      return;
    }

    let normalizedLink = "";

    if (form.actionType === "call") {
      const rawNumber = form.link.trim();
      const sanitizedNumber = rawNumber.replace(/[^+\d]/g, "");
      if (!sanitizedNumber || sanitizedNumber.replace(/\D/g, "").length < 5) {
        toast({
          title: "Add a phone number",
          description: "Enter a valid phone number so candidates can call you.",
          variant: "destructive",
        });
        return;
      }
      normalizedLink = sanitizedNumber.startsWith("tel:") ? sanitizedNumber : `tel:${sanitizedNumber}`;
    } else {
      const trimmedLink = form.link.trim();
      if (!trimmedLink) {
        toast({
          title: "Add a link",
          description: "Include your website link so visitors know where to go.",
          variant: "destructive",
        });
        return;
      }
      normalizedLink = /^[a-zA-Z]+:\/\//.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`;
    }

    const isEditing = Boolean(editingAdMeta);
    const adId =
      editingAdMeta?.id ??
      (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `ad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
    const createdAt = editingAdMeta?.createdAt ?? new Date().toISOString();
    const status = editingAdMeta?.status ?? "active";

    const newAd: SponsoredAd = {
      id: adId,
      ownerId: user.id,
      format: form.format,
      actionType: form.actionType,
      href: normalizedLink,
      imageUrl: form.imageData,
      imageAlt: form.imageAlt.trim() || form.headline.trim() || "Sponsored placement",
      headline: form.format === "image-text" ? form.headline.trim() : undefined,
      body: form.format === "image-text" ? form.body.trim() : undefined,
      createdAt,
      status,
      targetGender: form.targetGender,
    };

    setSubmitting(true);
    submissionStartRef.current = Date.now();
    try {
      const existing = readStoredAds();
      const updated = [...existing.filter((ad) => ad.id !== newAd.id), newAd];
      writeStoredAds(updated);
      refreshOwnedAds(user.id);
      window.dispatchEvent(new Event(CUSTOM_ADS_EVENT));
      toast({
        title: isEditing ? "Ad updated" : "Ad saved",
        description: isEditing
          ? "Your sponsored placement has been updated."
          : "Your sponsored placement is live for other businesses and job seekers.",
      });
      resetForm();
    } catch (error: any) {
      console.error("Failed to save sponsored ad:", error);
      toast({
        title: "Unable to save ad",
        description: "Something went wrong while storing your ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      const elapsed = Date.now() - submissionStartRef.current;
      const minimum = 600;
      if (elapsed >= minimum) {
        setSubmitting(false);
      } else {
        setTimeout(() => setSubmitting(false), minimum - elapsed);
      }
    }
  };

  const requestDelete = (adId: string, headline?: string | null) => {
    setPendingDeleteId(adId);
    setPendingDeleteHeadline(headline ?? null);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId || !user?.id) {
      setPendingDeleteId(null);
      setPendingDeleteHeadline(null);
      return;
    }
    const existing = readStoredAds();
    const updated = existing.filter((ad) => ad.id !== pendingDeleteId);
    writeStoredAds(updated);
    refreshOwnedAds(user.id);
    window.dispatchEvent(new Event(CUSTOM_ADS_EVENT));
    toast({
      title: "Ad removed",
      description: "This placement has been deleted permanently.",
    });
    setPendingDeleteId(null);
    setPendingDeleteHeadline(null);
  };

  const previewHeadline =
    form.format === "image-text" ? form.headline || "Headline appears here" : "";
  const previewBody =
    form.format === "image-text"
      ? form.body || "Add a concise sentence to tell candidates or businesses why they should click."
      : "";
  const previewActionInfo =
    form.actionType === "call"
      ? form.link.trim() || "+679 123 4567"
      : form.link.trim() && form.link.trim() !== "https://"
      ? form.link.trim()
      : "https://your-landing-page.com";

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 w-full flex items-center justify-center">
        <p className="text-gray-600">Loading advertising tools…</p>
      </div>
    );
  }

  if (!user || user.userType !== "business") {
    return (
      <div className="min-h-screen bg-gray-100 w-full flex items-center justify-center">
        <Card className="max-w-md border border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Company access required</CardTitle>
            <CardDescription>
              Sign in with your company account to create and manage sponsored placements.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Advertise</h1>
          <p className="text-gray-600 text-lg">
            Launch sponsored placements that appear in the right-side rail for job seekers and other
            businesses. You won’t see your own ads in the dashboard, but everyone else will.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Create a sponsored placement</CardTitle>
              <CardDescription>
                Upload an image, choose the format, and decide what happens when someone taps your ad.
                We’ll size it to fit the sidebar automatically.
              </CardDescription>
          </CardHeader>
            <CardContent>
              <div className="relative">
                {submitting && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/85 backdrop-blur-sm border border-blue-200">
                    <span className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
                    <p className="text-sm font-semibold text-blue-700">Publishing your ad…</p>
                    <p className="text-xs text-blue-500">Please wait while we save your placement.</p>
                  </div>
                )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <section className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Format</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {formatOptions.map((option) => {
                      const isActive = form.format === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFormatChange(option.value)}
                          className={`rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            isActive
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow"
                              : "border-gray-200 bg-white hover:border-blue-300"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{option.label}</span>
                          <span className="mt-2 block text-xs text-gray-600 leading-relaxed">
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="ad-image">Image</Label>
                    <Input
                      id="ad-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={submitting}
                    />
                    <p className="text-xs text-gray-500">
                      Recommended size {RECOMMENDED_WIDTH}×
                      {form.format === "image" ? RECOMMENDED_HEIGHT_IMAGE : RECOMMENDED_HEIGHT_IMAGE_TEXT}
                      px. JPG or PNG under 1.5MB.
                    </p>
                    {imageError && <p className="text-xs text-red-500">{imageError}</p>}
                    {form.imageName && !imageError && (
                      <p className="text-xs text-gray-500">Selected: {form.imageName}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Call to action</Label>
                      <Select
                        value={form.actionType}
                        onValueChange={(value) => handleActionTypeChange(value as FormState["actionType"])}
                        disabled={submitting}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Choose what happens when people click your ad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website visits</SelectItem>
                          <SelectItem value="call">Call now</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad-link">
                        {form.actionType === "call"
                          ? "Phone number to dial"
                          : "Website link"}
                      </Label>
                      <Input
                        id="ad-link"
                        value={form.link}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, link: event.target.value }))
                        }
                        placeholder={
                          form.actionType === "call"
                            ? "+679 123 4567"
                            : "https://your-landing-page.com"
                        }
                        inputMode={form.actionType === "call" ? "tel" : "url"}
                        disabled={submitting}
                      />
                      <p className="text-xs text-gray-500">
                        {form.actionType === "call"
                          ? "When someone taps your placement on mobile, their dial pad opens with this number."
                          : "Send interested candidates straight to your website or landing page."}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Target gender</Label>
                    <Select
                      value={form.targetGender}
                      onValueChange={(value) => handleGenderChange(value as SponsoredAdGender)}
                      disabled={submitting}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Choose a target gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        {/* <SelectItem value="nonbinary">Non-binary</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Select the primary audience you want this placement to reach.
                    </p>
                  </div>
                </section>

                {form.format === "image-text" && (
                  <section className="space-y-4">
              <div className="space-y-2">
                      <Label htmlFor="headline">Headline</Label>
                      <Input
                        id="headline"
                        value={form.headline}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, headline: event.target.value }))
                        }
                        maxLength={80}
                        placeholder="Promote your next hiring campaign"
                        disabled={submitting}
                      />
              </div>
              <div className="space-y-2">
                      <Label htmlFor="body">Supporting text</Label>
                      <Textarea
                        id="body"
                        value={form.body}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, body: event.target.value }))
                        }
                        maxLength={140}
                        placeholder="Explain the benefit or call-to-action in a sentence."
                        rows={3}
                        disabled={submitting}
                      />
                      <p className="text-xs text-gray-500">
                        Up to 140 characters shown beneath the image.
                      </p>
                    </div>
                  </section>
                )}

                <div className="flex justify-end gap-3">
                <Button
                    type="button"
                  variant="outline"
                    onClick={resetForm}
                    disabled={submitting && !form.imageData}
                >
                    Reset
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                        Publishing…
                      </span>
                    ) : (
                      "Publish ad"
                    )}
                  </Button>
              </div>
              </form>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-blue-100 bg-blue-50/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-700 text-base">Preview</CardTitle>
                <CardDescription className="text-sm">
                  Here’s how your placement appears in the sidebar for other users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {form.imageData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.imageData}
                        alt={form.imageAlt || "Sponsored preview"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex flex-col items-center justify-center text-gray-500 text-xs">
                        Upload artwork to preview
                      </div>
                    )}
                  </div>
                  {form.format === "image-text" && (
                    <div className="px-3 py-3 space-y-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {previewHeadline}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed">{previewBody}</p>
                    </div>
                  )}
                  <div className="px-3 pb-4 pt-3 border-t border-gray-100 bg-slate-50/80">
                    <Button
                      type="button"
                      className="w-full bg-blue-600 hover:bg-blue-600 text-white"
                      disabled
                    >
                      {CTA_BUTTON_TEXT[form.actionType]}
                    </Button>
                    <p className="mt-2 text-[11px] text-gray-500 text-center break-all">
                      {previewActionInfo}
                    </p>
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] text-gray-600">
                      <p className="font-semibold uppercase tracking-wide text-gray-500">Targeting</p>
                      <div className="mt-1 space-y-1">
                        <p>
                          Gender:{" "}
                          <span className="font-semibold text-gray-800">
                            {form.targetGender === "all"
                              ? "All genders"
                              : form.targetGender === "male"
                              ? "Male"
                              : form.targetGender === "female"
                              ? "Female"
                              : "Non-binary"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>

            <Card className="border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-gray-900">Ad specs</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  We size every creative to the dashboard rail so placements stay consistent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  • Sidebar width: <strong>{RECOMMENDED_WIDTH}px</strong>
                </p>
                <p>
                  • Image-only creatives: <strong>{RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT_IMAGE}px</strong>
                </p>
                <p>
                  • Image + text creatives: image at{" "}
                  <strong>{RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT_IMAGE_TEXT}px</strong> with
                  headline and supporting copy beneath.
                </p>
                <p>• Supported formats: JPG, PNG, SVG. Keep file sizes lean for faster loading.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle>Your placements</CardTitle>
            <CardDescription>
              Manage the ads created by {userDisplayName || "your business"}. Removing an ad takes
              it out of circulation instantly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ads.length === 0 ? (
              <p className="text-sm text-gray-600">
                You haven’t published any sponsored placements yet. Create your first ad above.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {ads
                  .sort((a, b) => (a.createdAt && b.createdAt ? (a.createdAt < b.createdAt ? 1 : -1) : 0))
                  .map((ad) => {
                    const status = (ad.status ?? "active") as "active" | "paused" | "stopped";
                    const isPaused = status === "paused";
                    const isStopped = status === "stopped";
                    const statusLabel =
                      status === "active" ? "Active" : status === "paused" ? "Paused" : "Stopped";
                    const statusBadgeClass =
                      status === "active"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : status === "paused"
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-slate-200 text-slate-600 border border-slate-300";
                    const metricsMutedClass = status === "active" ? "" : "opacity-60";
                    const actionType: SponsoredAdAction = ad.actionType ?? "website";
                    const ctaLabel = CTA_LABELS[actionType];
                    const isCallAction = actionType === "call" || ad.href.startsWith("tel:");
                    const displayLink = ad.href
                      ? isCallAction
                        ? ad.href.replace(/^tel:/i, "")
                        : ad.href.replace(/^(https?:\/\/)/i, "")
                      : "";
                    const thirdMetricLabel = actionType === "call" ? "Calls" : "Clicks";
                    const thirdMetricDescription =
                      actionType === "call" ? "Dial-throughs triggered" : "Visits driven to your link";
                    const targetGender: SponsoredAdGender =
                      ad.targetGender === "male" || ad.targetGender === "female"
                        ? ad.targetGender
                        : "all";
                    return (
                      <div
                        key={ad.id}
                        className="flex flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
                      >
                        <div className="h-32 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ad.imageUrl} alt={ad.imageAlt} className="h-full w-full object-contain" />
                        </div>
                        {ad.format === "image-text" && (
                          <div className="px-3 py-3 space-y-1">
                            {ad.headline && (
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {ad.headline}
                              </p>
                            )}
                            {ad.body && (
                              <p className="text-xs text-gray-600 leading-relaxed">{ad.body}</p>
                            )}
                          </div>
                        )}
                        <div className="px-3 py-3 border-t border-gray-100 bg-slate-50/70">
                          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-gray-500">
                            <span className="font-semibold text-gray-600">Performance</span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                            <span className="uppercase tracking-wide text-[11px] font-semibold text-gray-600">
                              Ad cost
                            </span>
                            <span className="text-base font-semibold text-gray-900">
                              $245.00
                            </span>
                          </div>
                          {(() => {
                            const { views, reach, clicks } = computeAdMetrics(ad);
                            return (
                              <div
                                className={`grid grid-cols-3 divide-x divide-gray-300 text-xs text-gray-700 text-center ${metricsMutedClass}`}
                              >
                                <div className="px-4 space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                    Views
                                  </p>
                                  <p className="text-base font-semibold text-gray-900">
                                    {numberFormatter.format(views)}
                                  </p>
                                  <p className="text-[11px] text-gray-600">
                                    New impressions across FastLink
                                  </p>
                                </div>
                                <div className="px-4 space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                    Reach
                                  </p>
                                  <p className="text-base font-semibold text-gray-900">
                                    {numberFormatter.format(reach)}
                                  </p>
                                  <p className="text-[11px] text-gray-600">
                                    Unique people who saw the ad
                                  </p>
                                </div>
                                <div className="px-4 space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                                    {thirdMetricLabel}
                                  </p>
                                  <p className="text-base font-semibold text-gray-900">
                                    {numberFormatter.format(clicks)}
                                  </p>
                                  <p className="text-[11px] text-gray-600">
                                    {thirdMetricDescription}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="px-3 py-3 mt-auto space-y-2 border-t border-gray-200">
                          <div className="space-y-1 text-xs text-gray-500">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                              {ctaLabel}
                            </span>
                            <a
                              href={ad.href}
                              className="inline-flex max-w-full items-center gap-1 truncate text-blue-600 hover:text-blue-700 hover:underline"
                              target={isCallAction ? undefined : "_blank"}
                              rel={isCallAction ? undefined : "noopener noreferrer"}
                            >
                              {isCallAction ? "Call " : "Visit "}
                              <span className="truncate">{displayLink}</span>
                            </a>
                          </div>
                          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
                            <p className="font-semibold uppercase tracking-wide text-gray-500">
                              Targeting
                            </p>
                            <div className="mt-1 space-y-1">
                              <p>
                                Gender:{" "}
                                <span className="font-semibold text-gray-800">
                                  {targetGender === "all"
                                    ? "All genders"
                                    : targetGender === "male"
                                    ? "Male"
                                    : "Female"}
                                </span>
                              </p>
                            </div>
                          </div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setPreviewAd(ad)}
                                  className="bg-blue-600 text-white hover:bg-blue-500"
                                >
                                  Preview ad
                                </Button>
                                {!isStopped ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTogglePause(ad)}
                                    >
                                      {isPaused ? "Resume" : "Pause"}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStop(ad)}
                                    >
                                      Stop
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      mutateAdStatus(ad.id, "active", {
                                        title: "Ad resumed",
                                        description: "Your sponsored placement is visible again.",
                                      })
                                    }
                                  >
                                    Run ad
                                  </Button>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => requestDelete(ad.id, ad.headline)}
                              >
                                Delete ad
                              </Button>
                            </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    {previewAd && (
      <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/85 px-4 py-12">
        {(() => {
          const status = (previewAd.status ?? "active") as SponsoredAdStatus;
          const isPaused = status === "paused";
          const isStopped = status === "stopped";
          const actionType: SponsoredAdAction = previewAd.actionType ?? "website";
          const isCallAction = actionType === "call" || previewAd.href?.startsWith("tel:");
          const displayHref = previewAd.href
            ? isCallAction
              ? previewAd.href.replace(/^tel:/i, "")
              : previewAd.href.replace(/^(https?:\/\/)/i, "")
            : "";
          const { views, reach, clicks } = computeAdMetrics(previewAd);
          const thirdMetricLabel = actionType === "call" ? "Calls" : "Clicks";
          const thirdMetricDescription =
            actionType === "call" ? "Dial-throughs triggered" : "Visits driven to your link";
          return (
            <div className="relative flex w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl md:flex-row animate-ad-preview">
              <button
                onClick={() => setPreviewAd(null)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow hover:bg-white"
                aria-label="Close ad preview"
              >
                <span className="text-base font-semibold">×</span>
              </button>
              <div className="flex min-h-[360px] flex-1 items-center justify-center bg-slate-900 p-8 md:max-w-[50%]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewAd.imageUrl}
                  alt={previewAd.imageAlt}
                  className="w-full max-h-[420px] rounded-2xl border border-slate-700/40 bg-slate-800/60 object-contain p-4"
                />
              </div>
              <div className="flex flex-1 flex-col gap-6 bg-white px-8 pb-10 pt-14">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Sponsored placement
                  </span>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {previewAd.headline || previewAd.imageAlt || "Your headline appears here"}
                  </h2>
                  {previewAd.body && (
                    <p className="text-sm text-gray-600 leading-relaxed">{previewAd.body}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <span className="font-semibold uppercase tracking-wide text-[11px] text-gray-500">
                      {CTA_LABELS[actionType]}
                    </span>
                    <span className="truncate text-sm">{displayHref || "—"}</span>
                  </div>
                  <Button
                    asChild
                    className="mt-3 h-11 w-full justify-center rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500"
                  >
                    <a
                      href={previewAd.href}
                      target={isCallAction ? undefined : "_blank"}
                      rel={isCallAction ? undefined : "noopener noreferrer"}
                    >
                      {CTA_BUTTON_TEXT[actionType]}
                    </a>
                  </Button>
                </div>

                <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <span>Performance</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        status === "active"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : status === "paused"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-slate-200 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {status === "active" ? "Active" : status === "paused" ? "Paused" : "Stopped"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-center md:grid-cols-3 md:divide-x md:divide-gray-200">
                    <div className="space-y-1 px-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Views
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {numberFormatter.format(views)}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        New impressions across FastLink
                      </p>
                    </div>
                    <div className="space-y-1 px-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Reach
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {numberFormatter.format(reach)}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        Unique viewers exposed to the ad
                      </p>
                    </div>
                    <div className="space-y-1 px-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {thirdMetricLabel}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {numberFormatter.format(clicks)}
                      </p>
                      <p className="text-[11px] text-gray-600">{thirdMetricDescription}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => beginEditingAd(previewAd)}
                    >
                      Edit text
                    </Button>
                    {!isStopped ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleTogglePause(previewAd);
                            setPreviewAd((prev) =>
                              prev ? { ...prev, status: isPaused ? "active" : "paused" } : prev
                            );
                          }}
                        >
                          {isPaused ? "Resume" : "Pause"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleStop(previewAd);
                            setPreviewAd((prev) => (prev ? { ...prev, status: "stopped" } : prev));
                          }}
                        >
                          Stop
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          mutateAdStatus(previewAd.id, "active", {
                            title: "Ad resumed",
                            description: "Your sponsored placement is visible again.",
                          });
                          setPreviewAd((prev) => (prev ? { ...prev, status: "active" } : prev));
                        }}
                      >
                        Run ad
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        requestDelete(previewAd.id, previewAd.headline);
                        setPreviewAd(null);
                      }}
                    >
                      Delete ad
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Controls update the live placement immediately. Close this preview when you’re done.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    )}
    {pendingDeleteId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => {
            setPendingDeleteId(null);
            setPendingDeleteHeadline(null);
          }}
        />
        <div className="relative z-10 w-full max-w-sm rounded-xl bg-white shadow-2xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Delete sponsored placement</h3>
            <p className="mt-2 text-sm text-gray-600">
              {pendingDeleteHeadline
                ? `Are you sure you want to delete the placement “${pendingDeleteHeadline}”?`
                : "Are you sure you want to delete this placement?"} This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingDeleteId(null);
                setPendingDeleteHeadline(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
