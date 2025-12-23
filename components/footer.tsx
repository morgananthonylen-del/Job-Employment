"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Footer() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      setIsLoggedIn(!!(token && user));
    }
  }, []);

  const hideFooter = 
    pathname === "/login" || 
    pathname.startsWith("/login/") ||
    pathname.startsWith("/register/") ||
    pathname.startsWith("/jobseeker/") ||
    pathname.startsWith("/business/") ||
    isLoggedIn;

  if (hideFooter) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-4">
      <div className="container mx-auto text-center text-base text-gray-600">
        <p>
          © {new Date().getFullYear()} FastLink Pte Limited. All rights reserved.{" "}
          Powered by{" "}
          <a
            href="https://www.reactmedia.com.fj/fastlink"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            React Media
          </a>
          .
        </p>
      </div>
    </footer>
  );
}

