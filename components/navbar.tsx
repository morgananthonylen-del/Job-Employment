"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Building2, Briefcase, Gavel, FileText, UserCircle, Megaphone } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Mobile menu removed

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-[9999] shadow-sm">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-[28px] leading-[32px] font-bold text-gray-900">FastLink</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center justify-between flex-1 ml-8">
            {/* Left side options */}
            <div className="flex items-center gap-1 text-[16px] leading-[34px] font-[700]">
              <Link
                href="/jobs"
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
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
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
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
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
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
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
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
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
                  isQuote ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                Get Quote
              </Link>
              <Link
                href="/get-listed"
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
                  isGetListed ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Get Listed
              </Link>
            </div>

            {/* Right side links */}
            <div className="flex items-center gap-4 text-[16px] leading-[34px] font-[600]">
              {/* Sign in - simple text link */}
              <Link
                href="/login"
                className={`font-[700] transition-colors ${
                  isLogin ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </Link>

              {/* Join - boxed, but matching link colors */}
              <Link
                href="/login"
                className={`inline-flex items-center justify-center px-6 py-2.5 rounded-md border font-[700] whitespace-nowrap transition-colors ${
                  isLogin
                    ? "border-blue-600 text-blue-600"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </div>

    </nav>
  );
}

