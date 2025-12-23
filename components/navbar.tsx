"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Building2, Briefcase, Gavel, FileText, UserCircle, Megaphone } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide navbar on register, admin, and authenticated pages (show on login)
  const hideNavbar = 
    pathname?.startsWith("/register/") ||
    pathname?.startsWith("/admin/") ||
    pathname?.startsWith("/jobseeker/") ||
    pathname?.startsWith("/business/") ||
    pathname?.startsWith("/auth/");

  if (!mounted || hideNavbar) {
    return null;
  }

  const isJobs = pathname === "/jobs";
  const isDirectory = pathname === "/directory";
  const isMarketPlace = pathname === "/market-place";
  const isShoutouts = pathname === "/shoutouts";
  const isGetListed = pathname === "/get-listed";
  const isQuote = pathname === "/quote";
  const isLogin = pathname === "/login" || pathname?.startsWith("/login/");

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-1 text-[16px] leading-[24px]">
              <Link
                href="/jobs"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isJobs ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                Job Search
                {isJobs && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </Link>
              <Link
                href="/directory"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isDirectory ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Business Directory
                {isDirectory && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </Link>
              <Link
                href="/market-place"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isMarketPlace ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Gavel className="h-4 w-4" />
                Market Place
                {isMarketPlace && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </Link>
              <Link
                href="/shoutouts"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isShoutouts ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Megaphone className="h-4 w-4" />
                Shoutouts
                {isShoutouts && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
                )}
              </Link>
              <Link
                href="/quote"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isQuote ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                Get Quote
              </Link>
              <Link
                href="/get-listed"
                className={`relative flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
                  isGetListed ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Get Listed
              </Link>
            </div>

            {/* Right side links */}
            <div className="flex items-center gap-4 text-[16px] leading-[24px]">
              {/* Sign in - simple text link */}
              <Link
                href="/login"
                className={`font-medium transition-colors ${
                  isLogin ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </Link>

              {/* Join - boxed button */}
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-md border font-medium whitespace-nowrap bg-white border-blue-600 text-blue-700 hover:bg-blue-50 transition-colors"
              >
                Join
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

      {/* Mobile dropdown menu (overlay, does not push content) */}
      {mobileOpen && (
        <div className="md:hidden absolute inset-x-0 top-16 border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 pt-2 pb-3 space-y-1">
            <Link
              href="/jobs"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isJobs ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Job Search
            </Link>
            <Link
              href="/directory"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isDirectory ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Business Directory
            </Link>
            <Link
              href="/market-place"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isMarketPlace ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Gavel className="h-4 w-4" />
              Market Place
            </Link>
            <Link
              href="/shoutouts"
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isShoutouts ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Megaphone className="h-4 w-4" />
              Shoutouts
            </Link>
            <Link
              href="/quote"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Get Quote
            </Link>
            <Link
              href="/get-listed"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Building2 className="h-4 w-4" />
              Get Listed
            </Link>
            {/* Sign in - simple row link */}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                isLogin ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              Sign In
            </Link>

            {/* Join - boxed button */}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full inline-flex items-center justify-center px-6 py-2.5 rounded-md border text-sm font-medium whitespace-nowrap bg-white border-blue-600 text-blue-700 hover:bg-blue-50 transition-colors"
            >
              Join
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

