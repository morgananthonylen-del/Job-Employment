import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Building2, Mail, Phone, MapPin, Globe, Code } from "lucide-react";
import { AdsenseAd } from "@/components/adsense-ad";

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
}

// Reserved routes that should not be treated as company pages
const RESERVED_ROUTES = [
  "admin",
  "api",
  "auth",
  "login",
  "register",
  "business",
  "jobseeker",
  "resources",
  "verify-email",
  "resend-verification",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
];

async function getCompanyPage(slug: string): Promise<CompanyPage | null> {
  // Check if slug is a reserved route
  if (RESERVED_ROUTES.includes(slug.toLowerCase())) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("*")
      .eq("slug", slug.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error("Error fetching company page:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const company = await getCompanyPage(params.slug);

  if (!company) {
    return {
      title: "Company Not Found",
    };
  }

  const title = company.meta_title || `${company.company_name} - Contact Information`;
  const description =
    company.meta_description ||
    company.company_description ||
    `Contact ${company.company_name}. ${company.contact_email ? `Email: ${company.contact_email}` : ""} ${company.contact_phone ? `Phone: ${company.contact_phone}` : ""}`;

  return {
    title,
    description,
    keywords: company.meta_keywords || `${company.company_name}, contact, business, services`,
    openGraph: {
      title,
      description,
      images: company.og_image_url
        ? [company.og_image_url]
        : company.company_logo_url
        ? [company.company_logo_url]
        : [],
      type: "website",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${company.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: company.og_image_url
        ? [company.og_image_url]
        : company.company_logo_url
        ? [company.company_logo_url]
        : [],
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/${company.slug}`,
    },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: { slug: string };
}) {
  const company = await getCompanyPage(params.slug);

  if (!company) {
    notFound();
  }

  // Google Adsense Publisher ID - Replace with your actual Adsense ID
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXXXXX";
  const adSlot1 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_1 || "1234567890";
  const adSlot2 = process.env.NEXT_PUBLIC_ADSENSE_SLOT_2 || "0987654321";

  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Company Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {company.company_logo_url && (
                <img
                  src={company.company_logo_url}
                  alt={company.company_name}
                  className="w-24 h-24 object-contain rounded-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {company.company_name}
                </h1>
                {company.company_description && (
                  <p className="text-lg text-gray-600">{company.company_description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  {company.contact_email && (
                    <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Email</p>
                        <a
                          href={`mailto:${company.contact_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.contact_phone && (
                    <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Phone</p>
                        <a
                          href={`tel:${company.contact_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {company.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {company.contact_address && (
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Address</p>
                        <p className="text-gray-600">{company.contact_address}</p>
                      </div>
                    </div>
                  )}

                  {company.website && (
                    <div className="flex items-start gap-4">
                      <Globe className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">Website</p>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Adsense Ad Unit 1 */}
              <div>
                <AdsenseAd
                  adClient={adsenseId}
                  adSlot={adSlot1}
                  adFormat="auto"
                  fullWidthResponsive={true}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* React Media Promotion */}
              <div className="react-media-promo rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="h-8 w-8" />
                  <h3 className="text-xl font-bold">React Media</h3>
                </div>
                <p className="mb-4">
                  Professional web development services. We build modern, responsive websites
                  and web applications using cutting-edge technologies.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-semibold">Our Services:</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>Custom Web Development</li>
                    <li>Modern Web Applications</li>
                    <li>E-commerce Solutions</li>
                    <li>SEO Optimization</li>
                    <li>Performance Optimization</li>
                  </ul>
                </div>
                <a
                  href="https://www.reactmedia.com.fj/fastlink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Visit React Media
                </a>
              </div>

              {/* Adsense Ad Unit 2 */}
              <div>
                <AdsenseAd
                  adClient={adsenseId}
                  adSlot={adSlot2}
                  adFormat="auto"
                  fullWidthResponsive={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

