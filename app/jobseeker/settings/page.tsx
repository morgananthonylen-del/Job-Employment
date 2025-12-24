"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function JobSeekerSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.avatar_url) {
          setAvatarUrl(parsed.avatar_url);
        }
      }
    } catch (error) {
      console.error("Error reading user from storage", error);
    }
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again and retry",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads/profile-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Failed to upload profile photo");
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
        throw new Error(profileData.message || "Failed to save profile photo");
      }

      setAvatarUrl(uploadData.url);
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.avatar_url = uploadData.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } catch (storageError) {
        console.error("Error updating local user", storageError);
      }
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Profile photo updated",
        description: "Your avatar has been refreshed.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not update profile photo",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Type "DELETE" in the confirmation box to proceed.',
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please log in again and retry",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete account");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Account deleted",
        description: "We're sorry to see you go.",
      });

      router.push("/login?accountDeleted=1");
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Unable to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    // Could load notification preferences here
  }, []);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please make sure the new passwords match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Unable to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">Manage security preferences and appearance.</p>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a clear image so employers recognize you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                  No photo
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <p className="text-xs text-gray-500">Recommended: square image, at least 200x200px.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Switch between light and dark themes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
            <div>
              <p className="font-medium text-gray-900">Dark mode</p>
              <p className="text-sm text-gray-500">Dark mode is disabled</p>
            </div>
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Stay informed about application updates.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p>Notification preferences will be available soon.</p>
        </CardContent>
      </Card>

      <Card className="border border-red-200 bg-red-50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-700">Danger Zone</CardTitle>
          <CardDescription className="text-red-600">
            Permanently delete your account and all related data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-600">
            This action cannot be undone. All of your applications, saved jobs, and profile information will be removed permanently.
          </p>
          <div className="space-y-2">
            <Label htmlFor="delete-confirmation" className="text-red-700">
              Type DELETE to confirm
            </Label>
            <Input
              id="delete-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder="DELETE"
              className="border-red-200 focus-visible:ring-red-500"
              disabled={deleteLoading}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className="w-full sm:w-auto"
          >
            {deleteLoading ? "Deleting…" : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

