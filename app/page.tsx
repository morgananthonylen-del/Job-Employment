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
  const [activeTab, setActiveTab] = useState<"directory" | "jobs">("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [businessPlaceholder, setBusinessPlaceholder] = useState("Search for a business...");
  const [businessPlaceholderActive, setBusinessPlaceholderActive] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Business[]>([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<Business[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
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

    // Fetch slider images and featured businesses
    fetchSliderImages();
    fetchFeaturedBusinesses();
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
      if (activeTab === "directory" && businessSearchQuery.trim()) {
        fetchAutocompleteSuggestions(businessSearchQuery);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [businessSearchQuery, activeTab, fetchAutocompleteSuggestions]);

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
    if (activeTab === "directory") {
      if (e.key === "Enter") {
        if (selectedIndex >= 0 && autocompleteSuggestions[selectedIndex]) {
          handleSuggestionClick(autocompleteSuggestions[selectedIndex]);
        } else {
          handleSearch();
          setShowAutocomplete(false);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Escape") {
        setShowAutocomplete(false);
        setSelectedIndex(-1);
      }
    } else {
      if (e.key === "Enter") {
        handleJobSearch();
      }
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
      <Navbar activeSection={activeTab} onSectionChange={setActiveTab} />
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Image Slider */}
        {sliderImages.length > 0 && (
          <div className="mb-8">
            <ImageSlider images={sliderImages} />
          </div>
        )}

        {/* Featured Businesses Section */}
        {featuredBusinesses.length > 0 && (
          <div className="mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Businesses</h2>
              <p className="text-gray-600">Discover our featured business partners</p>
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

        {/* Content Sections */}
        {activeTab === "directory" && (
          <div className="w-full">
            {/* Main Content */}
            <div>
              <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Business Directory</h2>
        </div>
              <p className="text-lg text-gray-600 mb-6">
                Search for businesses and view their contact information
              </p>

              {/* Google-style Search Bar with Autocomplete */}
              <div className="max-w-2xl mx-auto">
                <div className="relative" ref={searchInputRef}>
                  {/* Main Search Container */}
                  <div className="relative bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 focus-within:shadow-lg focus-within:border-blue-500 overflow-hidden">
                    <div className="flex items-center min-h-[56px]">
                      {/* Search Icon */}
                      <div className="pl-5 pr-3 flex-shrink-0">
                        <Search className="h-5 w-5 text-gray-400" />
      </div>

                      {/* Input Field */}
                      <input
                        type="text"
                        placeholder={businessPlaceholder}
                        value={businessSearchQuery}
                        onChange={(e) => {
                          setBusinessSearchQuery(e.target.value);
                        }}
                        onKeyDown={handleKeyPress}
                        onFocus={() => {
                          // Stop typing effect and use static placeholder on click/focus
                          if (businessPlaceholderActive) {
                            setBusinessPlaceholderActive(false);
                          }
                          if (autocompleteSuggestions.length > 0) {
                            setShowAutocomplete(true);
                          }
                        }}
                        className="flex-1 py-4 pr-3 text-base text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:outline-none min-w-0"
                      />
                      
                      {/* Search Button (Google-style) */}
                      {businessSearchQuery.trim() && (
                        <div className="flex-shrink-0 pr-2">
            <button
                            type="button"
                            onClick={() => {
                              handleSearch();
                              setShowAutocomplete(false);
                            }}
                            disabled={loading}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                            aria-label="Search"
                          >
                            {loading ? (
                              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
            </button>
                        </div>
                      )}
                        </div>
                  </div>

                  {/* Autocomplete Dropdown - Google-style */}
                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                      {autocompleteSuggestions.map((business, index) => (
                        <button
                          key={business.id}
                          type="button"
                          onClick={() => handleSuggestionClick(business)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center gap-4 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedIndex === index ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          {business.company_logo_url ? (
                              <div className="flex-shrink-0">
                              <img
                                src={business.company_logo_url}
                                alt={business.company_name}
                                className="w-10 h-10 object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-normal text-gray-900 truncate">
                              {business.company_name}
                            </p>
                            {business.company_description && (
                              <p className="text-xs text-gray-500 truncate mt-1 leading-relaxed">
                                {business.company_description}
                              </p>
                            )}
                          </div>
                              <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                                </div>
                        </button>
                    ))}
                              </div>
                  )}
                            </div>
                          </div>
                        </div>
                        
              {/* Business Results */}
              {hasSearched && (
                <div className="mt-8">
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Searching businesses...</p>
                          </div>
                  ) : businesses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        {businessSearchQuery.trim() 
                          ? `No businesses found matching "${businessSearchQuery}". Try a different search term.` 
                          : "No businesses found. Make sure business pages are created and set to active in the admin panel."}
                      </p>
                              </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {businesses.map((business) => (
                        <Link
                          key={business.id}
                          href={`/${business.slug}`}
                          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            {business.company_logo_url && (
                              <img
                                src={business.company_logo_url}
                                alt={business.company_name}
                                className="w-16 h-16 object-contain rounded"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {business.company_name}
                              </h3>
                              {business.company_description && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {business.company_description}
                                </p>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                          </div>
                  )}
                </div>
              )}
                </div>
              </div>
            )}

        {activeTab === "jobs" && (
              <div className="w-full">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Job Search</h2>
                          </div>
              <p className="text-lg text-gray-600 mb-6">
                Find your next opportunity
              </p>

              {/* Google-style Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  {/* Main Search Container */}
                  <div className="relative bg-white rounded-full shadow-md hover:shadow-lg transition-shadow border border-gray-200 focus-within:shadow-lg focus-within:border-blue-500 overflow-hidden">
                    <div className="flex items-center min-h-[56px]">
                      {/* Search Icon */}
                      <div className="pl-5 pr-3 flex-shrink-0">
                        <Search className="h-5 w-5 text-gray-400" />
                          </div>
                      
                      {/* Input Field */}
                      <input
                        type="text"
                        placeholder="Search for jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 py-4 pr-3 text-base text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:outline-none min-w-0"
                      />
                      
                      {/* Search Button (Google-style) */}
                      {searchQuery.trim() && (
                        <div className="flex-shrink-0 pr-2">
                          <button
                            type="button"
                            onClick={handleJobSearch}
                            disabled={jobsLoading}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                            aria-label="Search"
                          >
                            {jobsLoading ? (
                              <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                        </div>
                  </div>
                              </div>
                            </div>
                          </div>

            {/* Job Results */}
            <div className="mt-8">
              {jobsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Searching jobs...</p>
                                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchQuery.trim() 
                      ? `No jobs found matching "${searchQuery}". Try a different search term.` 
                      : "Click 'Show All' to view all available jobs."}
                  </p>
                              </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobseeker/jobs/${job.id}`}
                      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                            <div className="flex items-start gap-4">
                        {job.business?.company_logo_url && (
                          <img
                            src={job.business.company_logo_url}
                            alt={job.business.company_name || "Company"}
                            className="w-16 h-16 object-contain rounded"
                          />
                        )}
                              <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          {job.business?.company_name && (
                            <p className="text-sm text-gray-600 mb-2">
                              {job.business.company_name}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            {job.job_type && (
                              <span className="flex items-center gap-1">
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
            )}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
