"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ProfileForm {
  name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
}

export default function JobSeekerProfilePage() {
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
    name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(() => Boolean(initialAvatarUrl));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
            name: data.name || "",
            email: data.email || "",
            phone_number: data.phone_number || "",
            address: data.address || "",
            city: data.city || "",
          });
          if (data.avatar_url) {
            setAvatarUrl((previous) => {
              if (previous === data.avatar_url) {
                setAvatarLoaded(true);
                return previous;
              }
              setAvatarLoaded(false);
              return data.avatar_url;
            });
          } else {
            setAvatarUrl((previous) => {
              if (previous !== null) {
                setAvatarLoaded(false);
              }
              return null;
            });
          }
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
          name: form.name,
          phoneNumber: form.phone_number,
          address: form.address,
          city: form.city,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your details have been saved successfully.",
      });
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Review and update your personal information.</p>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Keep your contact information up to date.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div
                role="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-500 transition hover:border-blue-400 hover:text-blue-500 cursor-pointer"
              >
                {avatarUrl ? (
                  <>
                    {!avatarLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
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
                  <div className="absolute inset-0 animate-pulse bg-gray-200" />
                ) : (
                  <span className="text-center px-3">Upload your photo</span>
                )}
                <div className="absolute inset-0 hidden items-center justify-center bg-black/50 text-white text-xs font-semibold group-hover:flex">
                  {uploadingAvatar ? "Uploading…" : "Change"}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
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
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
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
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) => handleChange("address", event.target.value)}
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


