"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Save } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
    name: "",
    companyName: "",
    address: "",
    city: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          email: userData.email || "",
          phoneNumber: userData.phone_number || "",
          name: userData.name || "",
          companyName: userData.company_name || "",
          address: userData.address || "",
          city: userData.city || "",
        });
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Check if there are changes
      const emailChanged = newData.email !== (user?.email || "");
      const phoneChanged = newData.phoneNumber !== (user?.phone_number || "");
      const passwordChanged = newData.newPassword.length > 0 || newData.currentPassword.length > 0;
      const nameChanged = newData.name !== (user?.name || "");
      const companyNameChanged = newData.companyName !== (user?.company_name || "");
      const addressChanged = newData.address !== (user?.address || "");
      const cityChanged = newData.city !== (user?.city || "");
      
      setHasChanges(emailChanged || phoneChanged || passwordChanged || nameChanged || companyNameChanged || addressChanged || cityChanged);
      
      return newData;
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: 'Type "DELETE" in the confirmation box to confirm account removal.',
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please log in again",
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
        description: "Your company account and related data have been removed.",
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password if trying to change it
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required to change password",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (formData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate email
    if (formData.email && !formData.email.includes("@")) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Error",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      // Prepare update payload
      const updatePayload: any = {};
      
      if (formData.newPassword && formData.currentPassword) {
        updatePayload.currentPassword = formData.currentPassword;
        updatePayload.newPassword = formData.newPassword;
      }

      if (formData.email && formData.email !== user?.email) {
        updatePayload.email = formData.email;
      }

      if (formData.phoneNumber !== undefined && formData.phoneNumber !== user?.phone_number) {
        updatePayload.phoneNumber = formData.phoneNumber;
      }

      if (formData.name !== undefined && formData.name !== user?.name) {
        updatePayload.name = formData.name;
      }

      if (formData.companyName !== undefined && formData.companyName !== user?.company_name) {
        updatePayload.companyName = formData.companyName;
      }

      if (formData.address !== undefined) {
        updatePayload.address = formData.address;
      }

      if (formData.city !== undefined) {
        updatePayload.city = formData.city;
      }

      // Only make request if there are actual changes
      if (Object.keys(updatePayload).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes to save",
        });
        setSaving(false);
        return;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.emailChanged
            ? "Profile updated. Please check your new email for verification."
            : "Profile updated successfully",
        });
        
        // Update user state
        setUser(data.user);
        
        // Reset password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        
        // Update localStorage user data
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (data.user.email) userData.email = data.user.email;
          if (data.user.name) userData.name = data.user.name;
          if (data.user.company_name) userData.company_name = data.user.company_name;
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        setHasChanges(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage your company account settings</p>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900">Appearance</CardTitle>
              <CardDescription className="text-gray-600">
                Customize the appearance of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Sun className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <Label htmlFor="dark-mode" className="text-gray-900 font-medium cursor-pointer">
                      Dark Mode
                    </Label>
                    <p className="text-sm text-gray-600">
                      {theme === "dark" 
                        ? "Switch to light mode" 
                        : "Switch to dark mode"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900">Account Settings</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "profile" ? null : "profile")}
                    className={`w-full ${
                      activeSection === "profile"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Update Profile
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "password" ? null : "password")}
                    className={`w-full ${
                      activeSection === "password"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Change Password
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "email" ? null : "email")}
                    className={`w-full ${
                      activeSection === "email"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Change Email
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveSection(activeSection === "contact" ? null : "contact")}
                    className={`w-full ${
                      activeSection === "contact"
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Change Contact
                  </Button>
                </div>

                {/* Update Profile Section */}
                {activeSection === "profile" && (
                  <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange("companyName", e.target.value)}
                          placeholder="Enter company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="Enter city"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Change Password Section */}
                {activeSection === "password" && (
                  <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange("newPassword", e.target.value)}
                          placeholder="Enter new password"
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          placeholder="Confirm new password"
                          minLength={6}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Change Email Section */}
                {activeSection === "email" && (
                  <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Address</h3>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Change Phone Number Section */}
                {activeSection === "contact" && (
                  <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                )}

                {/* Save Button - Show when a section is active */}
                {activeSection && (
                  <div className="flex justify-end border-t border-gray-300 pt-6 mt-6">
                    <Button
                      type="submit"
                      disabled={saving || !hasChanges}
                      className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2"
                    >
                      {saving ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Update Profile Button - Always visible at bottom right */}
                <div className="flex justify-end border-t border-gray-300 pt-6 mt-6">
                  <Button
                    type="submit"
                    disabled={saving || !hasChanges}
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2"
                  >
                    {saving ? (
                      <span>Updating...</span>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-red-200 bg-red-50 shadow-md">
          <CardHeader>
            <CardTitle className="text-red-700">Danger Zone</CardTitle>
            <CardDescription className="text-red-600">
              Permanently delete this company account and associated data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600">
              This action cannot be undone. All jobs, applications, and saved information tied to this company will be removed permanently.
            </p>
            <div className="space-y-2">
              <Label htmlFor="business-delete-confirmation" className="text-red-700">
                Type DELETE to confirm
              </Label>
              <Input
                id="business-delete-confirmation"
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
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

