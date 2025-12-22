 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="h-[calc(100vh-4rem)] bg-black flex flex-col">
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-4xl mx-auto px-4 py-2">
          <div className="mb-3 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Choose how you want to log in
            </h1>
            <p className="text-sm md:text-base text-gray-700">
              Pick the option that matches you. You can always create an account if you’re new.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* FastLink User (Job Seeker) */}
            <button
              type="button"
              onClick={() => router.push("/login/jobseeker")}
              className="w-full rounded-2xl bg-white border border-gray-200 px-5 py-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">FastLink User</h2>
                  <p className="text-xs md:text-sm text-gray-500">Job seekers &amp; people using FastLink to find work</p>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-2">
                Log in here if you’re looking for jobs, tracking applications or using FastLink as a job seeker.
              </p>
              <span className="inline-flex items-center text-sm md:text-base font-medium text-blue-600">
                Continue as FastLink User
              </span>
            </button>

            {/* Business */}
            <button
              type="button"
              onClick={() => router.push("/login/business")}
              className="w-full rounded-2xl bg-white border border-gray-200 px-5 py-5 text-left shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">Business</h2>
                  <p className="text-xs md:text-sm text-gray-500">Businesses posting jobs or managing listings</p>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-700 mb-2">
                Log in here if you’re a business using FastLink to post jobs, manage applicants or run a listing.
              </p>
              <span className="inline-flex items-center text-sm md:text-base font-medium text-emerald-600">
                Continue as Business
              </span>
            </button>
          </div>

          <div className="mt-3 text-center text-sm md:text-base text-gray-500">
            New to FastLink?{" "}
            <Link href="/register/jobseeker" className="text-blue-400 hover:text-blue-300 underline">
              Create a free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
