"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProfileCompletionModalProps {
  userType: "jobseeker" | "business";
  initialData: Record<string, any> | null;
  onComplete: (updatedUser: any) => void;
}

const JOB_SEEKER_FIELDS = [
  "name",
  "birthday",
  "phone_number",
  "address",
  "city",
  "gender",
  "ethnicity",
  "employment_status",
];

const BUSINESS_FIELDS = [
  "company_name",
  "name",
  "phone_number",
  "address",
  "city",
];

const DEFAULT_FORM_STATE = {
  name: "",
  birthday: "",
  phone_number: "",
  address: "",
  city: "",
  gender: "",
  ethnicity: "",
  employment_status: "",
  company_name: "",
  website: "",
};

export function ProfileCompletionModal({ userType, initialData, onComplete }: ProfileCompletionModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM_STATE);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!initialData) return;
    setForm((prev) => ({
      ...prev,
      name: initialData.name || initialData.contact_name || "",
      birthday: initialData.birthday || "",
      phone_number: initialData.phone_number || "",
      address: initialData.address || "",
      city: initialData.city || "",
      gender: initialData.gender || "",
      ethnicity: initialData.ethnicity || "",
      employment_status: initialData.employment_status || "",
      company_name: initialData.company_name || "",
      website: initialData.website || "",
    }));
  }, [initialData]);

  const requiredFields = useMemo(() => {
    return userType === "business" ? BUSINESS_FIELDS : JOB_SEEKER_FIELDS;
  }, [userType]);

  const missingFields = useMemo(() => {
    return requiredFields.filter((field) => {
      const value = (form as any)[field];
      if (value === null || value === undefined) return true;
      if (typeof value === "string") {
        return value.trim().length === 0;
      }
      return false;
    });
  }, [form, requiredFields]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        phoneNumber: form.phone_number,
        address: form.address,
        city: form.city,
        name: form.name,
        gender: form.gender,
        ethnicity: form.ethnicity,
        birthday: form.birthday,
        companyName: form.company_name,
        website: form.website,
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("You need to sign in again before updating your profile.");
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile");
      }

      if (data?.user) {
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            const updated = { ...parsed, ...data.user };
            localStorage.setItem("user", JSON.stringify(updated));
          }
        } catch (error) {
          console.error("Error updating stored user", error);
        }
      }

      window.dispatchEvent(new Event("user-updated"));

      toast({
        title: "Profile updated",
        description: "Thanks! Your profile is now complete.",
      });

      onComplete(data?.user || null);
      setOpen(false);
    } catch (error: any) {
      console.error("Profile completion error:", error);
      toast({
        title: "Update failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderJobSeeker = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pc-name">Full name</Label>
        <Input
          id="pc-name"
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
          placeholder="Jane Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-birthday">Birthday</Label>
        <Input
          id="pc-birthday"
          type="date"
          value={form.birthday ? form.birthday.slice(0, 10) : ""}
          onChange={(event) => handleChange("birthday", event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-phone">Phone number</Label>
        <Input
          id="pc-phone"
          value={form.phone_number}
          onChange={(event) => handleChange("phone_number", event.target.value)}
          placeholder="9876543210"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-address">Address</Label>
        <Input
          id="pc-address"
          value={form.address}
          onChange={(event) => handleChange("address", event.target.value)}
          placeholder="123 Example Street"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-city">City</Label>
        <Input
          id="pc-city"
          value={form.city}
          onChange={(event) => handleChange("city", event.target.value)}
          placeholder="Suva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select
          value={form.gender}
          onValueChange={(value) => handleChange("gender", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Ethnicity</Label>
        <Select
          value={form.ethnicity}
          onValueChange={(value) => handleChange("ethnicity", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ethnicity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="itaukei">iTaukei</SelectItem>
            <SelectItem value="indian">Indian</SelectItem>
            <SelectItem value="rotuman">Rotuman</SelectItem>
            <SelectItem value="others">Others</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBusiness = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pc-company-name">Company name</Label>
        <Input
          id="pc-company-name"
          value={form.company_name}
          onChange={(event) => handleChange("company_name", event.target.value)}
          placeholder="React Media"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-contact-name">Primary contact name</Label>
        <Input
          id="pc-contact-name"
          value={form.name}
          onChange={(event) => handleChange("name", event.target.value)}
          placeholder="Jane Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-phone">Phone number</Label>
        <Input
          id="pc-phone"
          value={form.phone_number}
          onChange={(event) => handleChange("phone_number", event.target.value)}
          placeholder="(+679) 123 4567"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-address">Business address</Label>
        <Input
          id="pc-address"
          value={form.address}
          onChange={(event) => handleChange("address", event.target.value)}
          placeholder="123 Example Street"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-city">City</Label>
        <Input
          id="pc-city"
          value={form.city}
          onChange={(event) => handleChange("city", event.target.value)}
          placeholder="Suva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pc-website">Website (optional)</Label>
        <Input
          id="pc-website"
          value={form.website}
          onChange={(event) => handleChange("website", event.target.value)}
          placeholder="https://example.com"
        />
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">Complete your profile</h2>
          <p className="text-sm text-gray-600">
            We just need a few more details to finish setting up your account.
          </p>
        </div>
        <div className="mt-5 space-y-4">
          {userType === "business" ? renderBusiness() : renderJobSeeker()}
        </div>
        {missingFields.length > 0 && (
          <p className="mt-4 text-xs text-red-500">
            Please complete all required fields highlighted above before continuing.
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={saving || missingFields.length > 0}
          >
            {saving ? "Saving..." : "Save details"}
          </Button>
        </div>
      </div>
    </div>
  );
}
