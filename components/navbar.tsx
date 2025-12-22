"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Building2, Briefcase } from "lucide-react";

interface NavbarProps {
  activeSection?: "directory" | "jobs";
  onSectionChange?: (section: "directory" | "jobs") => void;
}

export function Navbar({ activeSection = "jobs", onSectionChange }: NavbarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide navbar on login, register, admin, and authenticated pages
  const hideNavbar = 
    pathname === "/login" || 
    pathname?.startsWith("/login/") ||
    pathname?.startsWith("/register/") ||
    pathname?.startsWith("/admin/") ||
    pathname?.startsWith("/jobseeker/") ||
    pathname?.startsWith("/business/") ||
    pathname?.startsWith("/auth/");

  if (!mounted || hideNavbar) {
    return null;
  }

  const handleSectionClick = (section: "directory" | "jobs") => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    setMobileOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900">FastLink</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-8">
            {/* Left side options */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSectionClick("jobs")}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === "jobs"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Job Search
                {activeSection === "jobs" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => handleSectionClick("directory")}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeSection === "directory"
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Business Directory
                {activeSection === "directory" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Right side links */}
            <div className="flex items-center gap-4">
              <Link
                href="/get-listed"
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Get Listed
              </Link>
              <Link
                href="/login/jobseeker"
                className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                Job Seeker Login
              </Link>
            </div>
          </div>

          {/* Mobile burger button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <button
              onClick={() => handleSectionClick("jobs")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === "jobs"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Job Search
            </button>
            <button
              onClick={() => handleSectionClick("directory")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === "directory"
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Business Directory
            </button>
            <Link
              href="/get-listed"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Get Listed
            </Link>
            <Link
              href="/login/jobseeker"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-gray-50"
            >
              Job Seeker Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

