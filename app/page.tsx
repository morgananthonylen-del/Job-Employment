"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, Briefcase, MapPin, Clock } from "lucide-react";
import { ImageSlider } from "@/components/image-slider";
import { formatRelativeTime } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

interface Business {
  id: string;
  company_name: string;
  slug: string;
  company_description?: string;
  company_logo_url?: string;
}

interface Job {
  id: string;
  title: string;
  description?: string;
  location?: string;
  salary?: string;
  job_type?: string;
  promotion_tier?: "free" | "pro";
  created_at?: string;
  business?: {
    company_name?: string;
    company_logo_url?: string;
  };
}

interface SliderImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [businessPlaceholder, setBusinessPlaceholder] = useState("Search for a business...");
  const [businessPlaceholderActive, setBusinessPlaceholderActive] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Business[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const searchInputRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: "Surveyors", searchTerm: "surveyor" },
    { name: "Construction", searchTerm: "construction" },
  ];

  // Typing effect for business search placeholder
  useEffect(() => {
    // If user has interacted with the field, stop the typing effect
    if (!businessPlaceholderActive) {
      setBusinessPlaceholder("Search for a business...");
      return;
    }

    const phrases = [
      "surveyors in suva",
      "construction in nadi",
      "plumbers near me",
      "electricians in lautoka",
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    let timeoutId: NodeJS.Timeout;

    const type = () => {
      const current = phrases[phraseIndex];

      if (!isDeleting) {
        // typing forward
        charIndex++;
        if (charIndex <= current.length) {
          setBusinessPlaceholder(current.slice(0, charIndex));
        } else {
          // pause at full phrase
          isDeleting = true;
          timeoutId = setTimeout(type, 1500);
          return;
        }
      } else {
        // deleting
        charIndex--;
        if (charIndex >= 0) {
          setBusinessPlaceholder(current.slice(0, charIndex) || "Search for a business...");
        } else {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      const speed = isDeleting ? 60 : 100;
      timeoutId = setTimeout(type, speed);
    };

    // Start typing
    timeoutId = setTimeout(type, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [businessPlaceholderActive]);

  useEffect(() => {
    // Check if user is already logged in
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          if (userData.role === "jobseeker" || userData.userType === "jobseeker") {
            router.replace("/jobseeker/dashboard");
            return;
          } else if (userData.role === "business" || userData.userType === "business") {
            router.replace("/business/dashboard");
            return;
          }
        } catch (e) {
          // Invalid user data, continue to landing page
        }
      }
    }

    // Fetch slider images, featured businesses, and featured jobs
    fetchSliderImages();
    fetchFeaturedBusinesses();
    fetchFeaturedJobs();
  }, [router]);

  const fetchSliderImages = async () => {
    try {
      const response = await fetch("/api/slider-images");
      if (response.ok) {
        const data = await response.json();
        setSliderImages(data || []);
      }
    } catch (error) {
      console.error("Error fetching slider images:", error);
    }
  };

  const fetchFeaturedBusinesses = async () => {
    try {
      const response = await fetch("/api/company/featured");
      if (response.ok) {
        const data = await response.json();
        setFeaturedBusinesses(data || []);
      }
    } catch (error) {
      console.error("Error fetching featured businesses:", error);
    }
  };

  const fetchFeaturedJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");

      const data: Job[] = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setFeaturedJobs([]);
        return;
      }

      const proJobs = data.filter((job) => job.promotion_tier === "pro");
      const source = proJobs.length > 0 ? proJobs : data;
      setFeaturedJobs(source.slice(0, 6));
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      setFeaturedJobs([]);
    }
  };

  // Debounced autocomplete search
  const fetchAutocompleteSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const response = await fetch(`/api/company?search=${encodeURIComponent(searchTerm.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setAutocompleteSuggestions(data.slice(0, 8)); // Limit to 8 suggestions
        setShowAutocomplete(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      setAutocompleteSuggestions([]);
    }
  }, []);

  // Debounce hook
  useEffect(() => {
    const timer = setTimeout(() => {
      if (businessSearchQuery.trim()) {
        fetchAutocompleteSuggestions(businessSearchQuery);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [businessSearchQuery, fetchAutocompleteSuggestions]);

  const handleSearch = async (categoryTerm?: string) => {
    setLoading(true);
    setHasSearched(true);

    try {
      const searchTerm = categoryTerm || businessSearchQuery.trim();
      const url = searchTerm 
        ? `/api/company?search=${encodeURIComponent(searchTerm)}`
        : `/api/company`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to search businesses");
      }
      
      const data = await response.json();
      setBusinesses(data || []);
    } catch (error: any) {
      console.error("Error searching businesses:", error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: { name: string; searchTerm: string }) => {
    setSelectedCategory(category.name);
    setBusinessSearchQuery(category.searchTerm);
    setShowAutocomplete(false);
    handleSearch(category.searchTerm);
  };

  const handleClearCategory = () => {
    setSelectedCategory("");
    setBusinessSearchQuery("");
    setBusinesses([]);
    setHasSearched(false);
  };

  const handleJobSearch = async () => {
    setJobsLoading(true);
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      let data = await response.json();
      
      // Filter by search term if provided
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        data = data.filter((job: Job) =>
          job.title?.toLowerCase().includes(term) ||
          job.location?.toLowerCase().includes(term) ||
          job.business?.company_name?.toLowerCase().includes(term)
        );
      }
      
      setJobs(data || []);
    } catch (error: any) {
      console.error("Error searching jobs:", error);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };


  const handleSuggestionClick = (business: Business) => {
    setBusinessSearchQuery(business.company_name);
    setShowAutocomplete(false);
    handleSearch(business.company_name);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJobSearch();
    }
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    if (showAutocomplete) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAutocomplete]);

  return (
    <>
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Image Slider */}
          {sliderImages.length > 0 && (
            <div className="mb-8">
              <ImageSlider images={sliderImages} />
            </div>
          )}

          {/* Featured Jobs */}
          {featuredJobs.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Featured Jobs</h2>
                  <p className="text-gray-400 text-sm">Hand-picked opportunities from businesses on FastLink</p>
                </div>
                <Link
                  href="/jobs"
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  View all jobs
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobseeker/jobs/${job.id}`}
                    className="block p-5 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {job.business?.company_logo_url && (
                        <img
                          src={job.business.company_logo_url}
                          alt={job.business.company_name || "Business"}
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                          {job.title}
                        </h3>
                        {job.business?.company_name && (
                          <p className="text-sm text-gray-600 mb-2">
                            {job.business.company_name}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {job.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </span>
                          )}
                          {job.job_type && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {job.job_type}
                            </span>
                          )}
                        </div>
                        {job.salary && (
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            {job.salary}
                          </p>
                        )}
                        {job.created_at && (
                          <p className="text-xs text-gray-400 mt-2">
                            {formatRelativeTime(job.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Featured Businesses Section */}
          {featuredBusinesses.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Featured Businesses</h2>
                  <p className="text-gray-400 text-sm">Discover businesses showcasing themselves on FastLink</p>
                </div>
                <Link
                  href="/directory"
                  className="text-sm font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
                >
                  View business directory
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {featuredBusinesses.map((business) => (
                  <Link
                    key={business.id}
                    href={`/${business.slug}`}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 border border-gray-100 hover:border-blue-300"
                  >
                    <div className="flex flex-col items-center text-center">
                      {business.company_logo_url ? (
                        <div className="w-20 h-20 mb-3 flex items-center justify-center">
                          <img
                            src={business.company_logo_url}
                            alt={business.company_name}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {business.company_name}
                      </h3>
                      {business.company_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {business.company_description}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
