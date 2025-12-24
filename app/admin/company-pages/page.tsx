"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ExternalLink, Building2 } from "lucide-react";

interface CompanyPage {
  id: string;
  company_name: string;
  slug: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  website?: string;
  company_logo_url?: string;
  company_description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image_url?: string;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCompanyPagesPage() {
  const { toast } = useToast();
  const [companyPages, setCompanyPages] = useState<CompanyPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CompanyPage | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>("");
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    slug: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    website: "",
    company_logo_url: "",
    company_description: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    og_image_url: "",
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchCompanyPages();
  }, []);

  const fetchCompanyPages = async () => {
    try {
      const response = await fetch("/api/admin/company-pages");
      if (!response.ok) throw new Error("Failed to fetch company pages");
      const data = await response.json();
      setCompanyPages(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load company pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPage
        ? `/api/admin/company-pages/${editingPage.id}`
        : "/api/admin/company-pages";
      const method = editingPage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save company page");
      }

      toast({
        title: "Success",
        description: editingPage
          ? "Company page updated successfully"
          : "Company page created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchCompanyPages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save company page",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (page: CompanyPage) => {
    setEditingPage(page);
    setFormData({
      company_name: page.company_name || "",
      slug: page.slug || "",
      contact_email: page.contact_email || "",
      contact_phone: page.contact_phone || "",
      contact_address: page.contact_address || "",
      website: page.website || "",
      company_logo_url: page.company_logo_url || "",
      company_description: page.company_description || "",
      meta_title: page.meta_title || "",
      meta_description: page.meta_description || "",
      meta_keywords: page.meta_keywords || "",
      og_image_url: page.og_image_url || "",
      is_active: page.is_active ?? true,
      is_featured: page.is_featured ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company page?")) return;

    try {
      const response = await fetch(`/api/admin/company-pages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete company page");

      toast({
        title: "Success",
        description: "Company page deleted successfully",
      });

      fetchCompanyPages();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company page",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPage(null);
    setLogoFileName("");
    setFormData({
      company_name: "",
      slug: "",
      contact_email: "",
      contact_phone: "",
      contact_address: "",
      website: "",
      company_logo_url: "",
      company_description: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      og_image_url: "",
      is_active: true,
      is_featured: false,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCompanyNameChange = (value: string) => {
    setFormData({ ...formData, company_name: value });
    if (!editingPage && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, company_logo_url: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Pages</h1>
          <p className="text-gray-600 mt-2">Manage SEO-friendly business pages</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Business Page
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "Edit Business Page" : "Add New Business Page"}
            </DialogTitle>
            <DialogDescription>
              Create a SEO-friendly business page with contact details and metadata
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  required
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  required
                  placeholder="acme-corporation"
                />
                <p className="text-xs text-gray-500">
                  Will be accessible at: /{formData.slug || "companyname"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_description">Company Description</Label>
              <Textarea
                id="company_description"
                value={formData.company_description}
                onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                rows={4}
                placeholder="Brief description of the company..."
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="contact_address">Address</Label>
                <Textarea
                  id="contact_address"
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  rows={2}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.company.com"
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="company_logo_url">Logo</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      id="company_logo_url"
                      type="url"
                      value={formData.company_logo_url}
                      onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png or base64 from upload"
                    />
                    <Button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Upload Logo
                    </Button>
                  </div>
                  {logoFileName && (
                    <p className="text-xs text-gray-500">Selected: {logoFileName}</p>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={logoFileInputRef}
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">SEO Metadata</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="Company Name - Services & Contact Information"
                  />
                  <p className="text-xs text-gray-500">Recommended: 50-60 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    rows={3}
                    placeholder="Brief description for search engine results..."
                  />
                  <p className="text-xs text-gray-500">Recommended: 150-160 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords (comma-separated)</Label>
                  <Input
                    id="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                    placeholder="company, services, contact, location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image_url">Open Graph Image URL</Label>
                  <Input
                    id="og_image_url"
                    type="url"
                    value={formData.og_image_url}
                    onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                    placeholder="https://example.com/og-image.png"
                  />
                  <p className="text-xs text-gray-500">Image for social media sharing (1200x630px recommended)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active (visible on website)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_featured">Featured (showcase on home page)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
                <Button type="submit">Save Business Page</Button>
            </div>
          </form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>All Business Pages</CardTitle>
            <CardDescription>Manage SEO-friendly business listings</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : companyPages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No company pages found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Company</th>
                    <th className="text-left p-4 font-medium">Slug</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companyPages.map((page) => (
                    <tr key={page.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{page.company_name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {page.contact_email && (
                            <div className="text-gray-600">{page.contact_email}</div>
                          )}
                          {page.contact_phone && (
                            <div className="text-gray-500 text-xs">{page.contact_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={page.is_active ? "default" : "secondary"}>
                            {page.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {page.is_featured && (
                            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/${page.slug}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(page)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(page.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

