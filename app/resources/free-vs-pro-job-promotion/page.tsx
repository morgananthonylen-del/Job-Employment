"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Crown, Info } from "lucide-react";

const features = [
  {
    name: "Listing placement",
    free: "Standard visibility in the job feed.",
    pro: "Boosted placement with crown badge and animated highlight.",
  },
  {
    name: "Vacancy imagery",
    free: "Text-only listing; no image preview.",
    pro: "Upload vacancy imagery that appears in listings & detail pages.",
  },
  {
    name: "AI candidate selection",
    free: "Manual screening only.",
    pro: "AI-assisted shortlisting suggestions tailored to your job.",
  },
  {
    name: "Candidate rating system",
    free: "Basic application tracking.",
    pro: "Rate applicants and rank top matches automatically.",
  },
  {
    name: "Direct outreach",
    free: "Email notification for every new applicant.",
    pro: "Email notification + 20 free FastLink text messages per post.",
  },
  {
    name: "Follow-up tools",
    free: "Manual follow-up outside the platform.",
    pro: "Send templated follow-up emails to shortlisted candidates.",
  },
  {
    name: "Cost",
    free: "$0 FJD per job post.",
    pro: "$50 FJD per job post.",
  },
];

export default function FreeVsProPromotionPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-blue-700">
            <Info className="h-4 w-4" />
            FastLink Promotions
          </span>
          <h1 className="text-3xl font-bold text-gray-900">
            Free vs Pro Featured Job Promotion
          </h1>
          <p className="mx-auto max-w-3xl text-base text-gray-600">
            Decide which tier matches your hiring needs. Both plans get your vacancy in front of job seekers, but
            Pro Featured adds AI-assisted tools, premium visuals, and more proactive outreach to help you fill roles faster.
          </p>
        </header>

        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="border-b border-blue-50 bg-blue-50/60">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-blue-900">
              <span>Top-Level Comparison</span>
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 text-gray-700">
                  Free Post
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-amber-800">
                  <Crown className="h-4 w-4" />
                  Pro Featured
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden px-0 pb-0">
            <div className="grid grid-cols-1 divide-y divide-gray-200 text-sm text-gray-700 md:grid-cols-3 md:divide-y-0 md:divide-x">
              <div className="space-y-3 px-6 py-6 md:col-span-1">
                <h2 className="text-lg font-semibold text-gray-900">Free Post</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Always-on listings for $0 FJD.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Standard placement in job search results.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Basic application notifications via email.
                  </li>
                </ul>
              </div>
              <div className="space-y-3 bg-gradient-to-b from-amber-50 to-white px-6 py-6 md:col-span-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-700">
                  <Crown className="h-4 w-4" />
                  Pro Featured
                </h2>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    Premium placement highlighted with a crown badge and elevated styling.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    Vacancy imagery showcased on listing cards and detail pages for richer storytelling.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    AI-assisted candidate analysis plus scoring to accelerate shortlisting.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    Candidate rating tools to rank applicants at a glance.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    20 FastLink text messages per job post for instant outreach, alongside automated follow-up emails.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 text-amber-500" />
                    Fixed pricing at $50 FJD per post with priority support.
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Feature Breakdown</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-1 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid-cols-3">
              <div className="px-4 py-3">Feature</div>
              <div className="px-4 py-3">Free Post</div>
              <div className="px-4 py-3">Pro Featured</div>
            </div>
            <div className="divide-y divide-gray-200 text-sm text-gray-700">
              {features.map((item) => (
                <div key={item.name} className="grid grid-cols-1 md:grid-cols-3">
                  <div className="px-4 py-4 font-medium text-gray-900 md:border-r md:border-gray-200">
                    {item.name}
                  </div>
                  <div className="px-4 py-4 text-gray-600 md:border-r md:border-gray-200">
                    {item.free}
                  </div>
                  <div className="px-4 py-4 text-gray-700">
                    {item.pro}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">When Free Post is enough</h3>
            <p className="text-sm text-gray-600">
              Free Post works best for evergreen roles, early hiring experiments, or positions where you anticipate a healthy supply of candidates without extra amplification.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Testing the market for a new role.</li>
              <li>• Positions with broad appeal or lower urgency.</li>
              <li>• Teams working with limited recruitment budgets.</li>
            </ul>
          </div>
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-700">
              <Crown className="h-4 w-4" />
              Why teams upgrade to Pro Featured
            </h3>
            <p className="text-sm text-amber-800">
              Pro is ideal when speed, candidate quality, and employer branding matter. The AI toolkit and rating system help you separate strong matches quickly, while imagery and premium placement attract more views.
            </p>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• Competitive roles requiring standout presentation.</li>
              <li>• Hiring managers who want actionable shortlists faster.</li>
              <li>• Teams running multiple campaigns who value built-in outreach.</li>
            </ul>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Ready to post?</h2>
          <p className="max-w-2xl text-sm text-gray-600">
            Start free and upgrade when you need the extra push, or go straight to Pro Featured for AI-powered support and richer storytelling.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/business/jobs/new"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Post a job
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
            >
              Talk with FastLink Sales
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}






