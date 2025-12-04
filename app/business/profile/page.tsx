"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ProfileForm {
  company_name: string;
  contact_name: string;
  email: string;
  phone_number: string;
  address: string;
  additionalAddresses: string[];
  city: string;
  website: string;
}

export default function BusinessProfilePage() {
  const { toast } = useToast();

  const getStoredUserAvatar = () => {
    if (typeof window === "undefined") return null;
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return null;
      const parsed = JSON.parse(storedUser);
      return parsed?.avatar_url ?? null;
    } catch (error) {
      console.error("Error reading stored user avatar:", error);
      return null;
    }
  };

  const initialAvatarUrl = getStoredUserAvatar();

  const [form, setForm] = useState<ProfileForm>({
    company_name: "",
    contact_name: "",
    email: "",
    phone_number: "",
    address: "",
    additionalAddresses: [],
    city: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(() => Boolean(initialAvatarUrl));
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [websitePopoverOpen, setWebsitePopoverOpen] = useState(false);

  const triggerAvatarSelect = () => {
    avatarInputRef.current?.click();
  };

  const triggerLogoSelect = () => {
    logoInputRef.current?.click();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/user/profile", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (res.ok) {
          const data = await res.json();
          setForm({
            company_name: data.company_name || "",
            contact_name: data.name || "",
            email: data.email || "",
            phone_number: data.phone_number || "",
            address: data.address || "",
            additionalAddresses: Array.isArray(data.additional_addresses) ? data.additional_addresses : [],
            city: data.city || "",
            website: data.website || "",
          });
          setCompanyLogoUrl(data.company_logo_url || null);
          setAvatarUrl((previous) => {
            const nextUrl = data.avatar_url || null;
            if (!nextUrl) {
              if (previous !== null) {
                setAvatarLoaded(false);
              }
              return null;
            }
            if (previous === nextUrl) {
              setAvatarLoaded(true);
              return previous;
            }
            setAvatarLoaded(false);
            return nextUrl;
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!avatarUrl) {
      setAvatarLoaded(false);
    }
  }, [avatarUrl]);

  const handleChange = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.contact_name,
          companyName: form.company_name,
          phoneNumber: form.phone_number,
          address: form.address,
          additionalAddresses: form.additionalAddresses.filter((value) => value.trim().length > 0),
          city: form.city,
          website: form.website,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your company details have been saved successfully.",
      });
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.name = form.contact_name;
          parsed.company_name = form.company_name;
          parsed.avatar_url = avatarUrl;
          parsed.company_logo_url = companyLogoUrl;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (storageError) {
        console.error("Error updating stored user", storageError);
      }
      window.dispatchEvent(new Event("user-updated"));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads/profile-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Failed to upload photo");
      }

      const profileRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.message || "Failed to save photo");
      }

      setAvatarUrl((previous) => {
        if (previous === uploadData.url) {
          setAvatarLoaded(true);
          return previous;
        }
        setAvatarLoaded(false);
        return uploadData.url;
      });
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.avatar_url = uploadData.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (err) {
        console.error("Error updating local user avatar", err);
      }
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Profile photo updated",
        description: "Your photo has been refreshed.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not update profile photo",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!avatarUrl) return;
    setAvatarDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/uploads/profile-photo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: avatarUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete photo");
      }

      setAvatarUrl(null);
      setAvatarLoaded(false);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.avatar_url = null;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (error) {
        console.error("Error clearing stored avatar", error);
      }
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Profile photo removed",
        description: "Your profile picture has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to delete photo",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads/company-logo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Failed to upload logo");
      }

      const profileRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ companyLogoUrl: uploadData.url }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.message || "Failed to save logo");
      }

      setCompanyLogoUrl(uploadData.url);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.company_logo_url = uploadData.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (err) {
        console.error("Error updating local company logo", err);
      }
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Company logo updated",
        description: "Your logo has been refreshed.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not update company logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const extractLogoStoragePath = (url: string | null) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const marker = "/storage/v1/object/public/logo/";
      const idx = parsed.pathname.indexOf(marker);
      if (idx !== -1) {
        return parsed.pathname.slice(idx + marker.length);
      }
    } catch (error) {
      console.error("Failed to extract storage path", error);
    }
    return null;
  };

  const handleLogoDelete = async () => {
    if (!companyLogoUrl) return;
    setLogoDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/uploads/company-logo", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: companyLogoUrl, path: extractLogoStoragePath(companyLogoUrl) }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete logo");
      }

      setCompanyLogoUrl(null);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.company_logo_url = null;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (error) {
        console.error("Error clearing stored company logo", error);
      }
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Company logo removed",
        description: "Your company logo has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to delete photo",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLogoDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Profile</h1>
        <p className="text-gray-600 mt-2">View and update your company information.</p>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Keep your company information current for applicants. Add a profile photo and company
                logo so job seekers recognise your brand instantly.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Profile photo</span>
                <div
                  onClick={() => {
                    if (!uploadingAvatar && !avatarDeleting) {
                      triggerAvatarSelect();
                    }
                  }}
                  className={cn(
                    "group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-500 transition",
                    uploadingAvatar && "pointer-events-none opacity-70",
                    avatarDeleting && "pointer-events-none opacity-50"
                  )}
                >
                  {avatarUrl ? (
                    <>
                      {!avatarLoaded && (
                        <div className="pointer-events-none absolute inset-0 animate-pulse bg-gray-200" />
                      )}
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        fill
                        priority
                        className={`object-cover transition-opacity duration-200 ${avatarLoaded ? "opacity-100" : "opacity-0"}`}
                        onLoadingComplete={() => setAvatarLoaded(true)}
                      />
                    </>
                  ) : loading ? (
                    <div className="pointer-events-none absolute inset-0 animate-pulse bg-gray-200" />
                  ) : (
                    <span className="px-3 text-center">
                      {uploadingAvatar ? "Uploading…" : "Upload"}
                    </span>
                  )}

                  {avatarUrl ? (
                    <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-black/60 text-white group-hover:flex">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          triggerAvatarSelect();
                        }}
                        disabled={uploadingAvatar || avatarDeleting}
                        className="w-24 justify-center"
                      >
                        {uploadingAvatar ? "Uploading…" : "Change"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleAvatarDelete();
                        }}
                        disabled={uploadingAvatar || avatarDeleting}
                        className="w-24 justify-center"
                      >
                        {avatarDeleting ? "Removing…" : "Delete"}
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white text-xs font-semibold group-hover:flex">
                      {uploadingAvatar ? "Uploading…" : "Change"}
                    </div>
                  )}

                  {avatarDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white">
                      Removing…
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="absolute inset-x-0 bottom-0 h-full translate-y-full animate-water-fill bg-blue-500/60" />
                      <div className="absolute inset-x-0 bottom-0 h-full translate-y-full animate-water-fill-delayed bg-blue-400/60" />
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold">
                        Uploading…
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-xs text-gray-500 text-center max-w-[10rem]">
                  Use a square image for best results.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading profile...</p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company name</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(event) => handleChange("company_name", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact person</Label>
                  <Input
                    id="contact_name"
                    value={form.contact_name}
                    onChange={(event) => handleChange("contact_name", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone_number}
                    onChange={(event) => handleChange("phone_number", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(event) => handleChange("city", event.target.value)}
                  />
                </div>
              <div className="space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) => handleChange("address", event.target.value)}
                    onBlur={() => {
                      if (
                        form.address &&
                        form.additionalAddresses.length === 0
                      ) {
                        setForm((prev) => ({
                          ...prev,
                          additionalAddresses: [""],
                        }));
                      }
                    }}
                  />
                </div>

                {form.additionalAddresses.map((value, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`additionalAddress-${index}`}>
                        Additional address {index + 1}
                      </Label>
                      {form.additionalAddresses.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              additionalAddresses: prev.additionalAddresses.filter(
                                (_addr, addrIndex) => addrIndex !== index
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`additionalAddress-${index}`}
                      value={value}
                      onChange={(event) =>
                        setForm((prev) => {
                          const next = [...prev.additionalAddresses];
                          next[index] = event.target.value;
                          return { ...prev, additionalAddresses: next };
                        })
                      }
                      onBlur={() => {
                        const trimmed = value.trim();
                        if (trimmed.length > 0 && index === form.additionalAddresses.length - 1) {
                          setForm((prev) => ({
                            ...prev,
                            additionalAddresses: [...prev.additionalAddresses, ""],
                          }));
                        }
                      }}
                      placeholder="Enter another office location"
                    />
                  </div>
                ))}
              </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourcompany.com"
                    value={form.website}
                    onChange={(event) => handleChange("website", event.target.value)}
                  />
                  <Popover open={websitePopoverOpen} onOpenChange={setWebsitePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-500"
                      >
                        Don&apos;t have a website?
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-white shadow-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-4">
                        <span className="font-semibold text-gray-900">React Media</span> created this site. Have a question—do you need a website for your business?
                      </p>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => setWebsitePopoverOpen(false)}
                        >
                          Later
                        </Button>
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() =>
                            {
                              setWebsitePopoverOpen(false);
                              window.open(
                                "https://www.reactmedia.com.fj/apply-now",
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }
                          }
                        >
                          Yes
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Company logo</Label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
                  <div
                    onClick={() => {
                      if (!uploadingLogo && !logoDeleting) {
                        triggerLogoSelect();
                      }
                    }}
                    className={cn(
                      "group relative flex h-24 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-500 transition",
                      uploadingLogo && "pointer-events-none opacity-70",
                      logoDeleting && "pointer-events-none opacity-50"
                    )}
                  >
                    {companyLogoUrl ? (
                      <Image
                        src={companyLogoUrl}
                        alt="Company logo"
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="px-3 text-center">
                        {uploadingLogo ? "Uploading…" : "Upload logo"}
                      </span>
                    )}

                    {companyLogoUrl ? (
                      <div className="absolute inset-0 hidden flex-col items-center justify-center gap-2 bg-black/60 text-white group-hover:flex">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            triggerLogoSelect();
                          }}
                          disabled={uploadingLogo || logoDeleting}
                          className="w-28 justify-center"
                        >
                          {uploadingLogo ? "Uploading…" : "Change"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleLogoDelete();
                          }}
                          disabled={uploadingLogo || logoDeleting}
                          className="w-28 justify-center"
                        >
                          {logoDeleting ? "Removing…" : "Delete"}
                        </Button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white text-xs font-semibold group-hover:flex">
                        {uploadingLogo ? "Uploading…" : "Change"}
                      </div>
                    )}

                    {logoDeleting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-semibold text-white">
                        Removing…
                      </div>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <p className="text-xs text-gray-500 sm:max-w-[14rem]">
                    Recommended: horizontal logo, at least 320×120px (PNG or JPG).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={form.email} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500">Email changes must be done through account settings.</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
