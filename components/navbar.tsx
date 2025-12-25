"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Zap, Building2, Briefcase, Gavel, FileText, UserCircle, Megaphone, ChevronDown, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Mobile menu removed
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement | null>(null);

  // Close features dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!featuresOpen) return;
      if (featuresRef.current && !featuresRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [featuresOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

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
        {/* Mobile layout */}
        <div className="md:hidden relative flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-12 w-12 items-center justify-center text-gray-800 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-7 w-7" strokeWidth={3} />
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <span className="text-[24px] leading-[28px] font-bold text-gray-900">FastLink</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-300 text-sm font-semibold text-gray-800 hover:border-gray-400 hover:text-gray-900"
            >
              Join
            </Link>
          </div>
        </div>

        {/* Mobile slide-in drawer */}
        <div
          className={`md:hidden fixed inset-0 z-[10000] transition ${
            mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ transitionProperty: "opacity" }}
        >
          <div
            className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${
              mobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-2xl transform transition-transform duration-200 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="px-4 py-3">
              <Link
                href="/login"
                className="block w-full text-center rounded-md bg-black text-white font-semibold py-3"
              >
                Join Fastlink
              </Link>
            </div>
            <div className="py-1">
              <Link href="/market-place" className="block px-4 py-3 text-[16px] leading-[22px] text-gray-800 hover:bg-gray-50">
                Market Place
              </Link>
              <Link href="/quote" className="block px-4 py-3 text-[16px] leading-[22px] text-gray-800 hover:bg-gray-50">
                Get Quote
              </Link>
              <Link href="/updates" className="block px-4 py-3 text-[16px] leading-[22px] text-gray-800 hover:bg-gray-50">
                Updates (Blog)
              </Link>
              <Link href="/get-listed" className="block px-4 py-3 text-[16px] leading-[22px] text-gray-800 hover:bg-gray-50">
                Get Listed
              </Link>
              <Link href="/login" className="block px-4 py-3 text-[16px] leading-[22px] text-gray-800 hover:bg-gray-50">
                Login
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center justify-between h-20">
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
          <div className="hidden md:flex items-center justify-between flex-1 ml-8 relative">
            {/* Left side options */}
            <div className="flex items-center gap-1 text-[16px] leading-[34px] font-[700]">
              <div className="relative" ref={featuresRef}>
                <button
                  type="button"
                  onClick={() => setFeaturesOpen((prev) => !prev)}
                  className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
                    isMarketPlace || isQuote ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <span>Features</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div
                  className={`absolute left-0 mt-2 w-[420px] rounded-md border border-gray-200 bg-white shadow-lg z-50 transform origin-top transition-all duration-200 ${
                    featuresOpen
                      ? "opacity-100 scale-y-100 translate-y-0"
                      : "opacity-0 scale-y-95 -translate-y-1 pointer-events-none"
                  }`}
                >
                  <Link
                    href="/market-place"
                    onClick={() => setFeaturesOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 text-[15px] font-[600] transition-colors ${
                      isMarketPlace ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Gavel className="h-4 w-4" />
                    Market Place
                  </Link>
                  <Link
                    href="/quote"
                    onClick={() => setFeaturesOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 text-[15px] font-[600] transition-colors ${
                      isQuote ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      <span>Get Quote</span>
                      <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-[2px] text-[11px] font-semibold text-white">
                        Fastlink User
                      </span>
                    </span>
                  </Link>
                  <Link
                    href="/shoutouts"
                    onClick={() => setFeaturesOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 text-[15px] font-[600] transition-colors ${
                      isShoutouts ? "text-blue-600 bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Megaphone className="h-4 w-4" />
                    Shoutouts
                  </Link>
                </div>
              </div>
              <Link
                href="/get-listed"
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
                  isGetListed ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Get Listed
              </Link>
              <Link
                href="/updates"
                className={`relative flex items-center gap-2 px-4 py-2 font-[700] leading-[34px] transition-colors ${
                  pathname === "/updates" ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                Updates
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

