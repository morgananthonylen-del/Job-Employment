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
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [businessesError, setBusinessesError] = useState<string>("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSuggestions, setHeroSuggestions] = useState<Business[]>([]);
  const [showHeroSuggestions, setShowHeroSuggestions] = useState(false);
  const [heroSelectedIndex, setHeroSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const searchInputRef = useRef<HTMLDivElement>(null);
  const heroSearchRef = useRef<HTMLFormElement>(null);

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
    fetchAllBusinesses();
    fetchFeaturedJobs();
  }, [router]);

  const fetchSliderImages = async () => {
    try {
      const response = await fetch("/api/slider-images", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch slider images:", errorData);
        setSliderImages([]);
        return;
      }

      const data = await response.json();
      const images = Array.isArray(data) ? data : [];
      setSliderImages(images);

      if (images.length > 0) {
        const firstImage = images[0];
        if (firstImage?.image_url) {
          const img = new Image();
          img.src = firstImage.image_url;
        }
      }
    } catch (error) {
      console.error("Error fetching slider images:", error);
      setSliderImages([]);
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

  const fetchAllBusinesses = async () => {
    try {
      const response = await fetch("/api/company", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setAllBusinesses(Array.isArray(data) ? data : []);
        setBusinessesError("");
      } else {
        setBusinessesError(`Failed to load businesses (HTTP ${response.status})`);
        setAllBusinesses([]);
      }
    } catch (error) {
      console.error("Error fetching all businesses:", error);
      setAllBusinesses([]);
      setBusinessesError("Failed to load businesses.");
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
      // Show up to 10 recent jobs
      setFeaturedJobs(source.slice(0, 10));
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

  // Hero autocomplete suggestions (businesses)
  const fetchHeroSuggestions = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setHeroSuggestions([]);
      setShowHeroSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/company?search=${encodeURIComponent(searchTerm.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setHeroSuggestions(Array.isArray(data) ? data.slice(0, 8) : []);
        setShowHeroSuggestions(true);
        setHeroSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching hero autocomplete suggestions:", error);
      setHeroSuggestions([]);
      setShowHeroSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchHeroSuggestions(searchQuery);
      } else {
        setHeroSuggestions([]);
        setShowHeroSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchHeroSuggestions]);

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

  const handleJobSearch = async (termOverride?: string) => {
    setJobsLoading(true);
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      let data = await response.json();
      
      // Filter by search term if provided
      const termSource = termOverride ?? searchQuery;
      if (termSource.trim()) {
        const term = termSource.trim().toLowerCase();
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
      handleCombinedSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHeroSelectedIndex((prev) =>
        prev < heroSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHeroSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowHeroSuggestions(false);
      setHeroSelectedIndex(-1);
    }
  };

  const handleCombinedSearch = () => {
    const term = searchQuery.trim();
    setBusinessSearchQuery(term);
    handleSearch(term);
    handleJobSearch(term);
    setShowHeroSuggestions(false);
    setHeroSelectedIndex(-1);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
      if (heroSearchRef.current && !heroSearchRef.current.contains(event.target as Node)) {
        setShowHeroSuggestions(false);
        setHeroSelectedIndex(-1);
      }
    };

    if (showAutocomplete || showHeroSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAutocomplete, showHeroSuggestions]);

  // Sync hero index when images change
  useEffect(() => {
    if (sliderImages.length > 0) {
      setHeroIndex(0);
    }
  }, [sliderImages.length]);

  // Auto-play hero slider (fade)
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [sliderImages.length]);

  return (
    <>
      {/* Hero with full-bleed slider */}
      <section className="hero-transparent relative w-full h-screen min-h-[800px] overflow-hidden flex items-center" style={{ background: "transparent" }}>
        <div className="absolute inset-0">
          {sliderImages.length > 0 ? (
            sliderImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === heroIndex ? "opacity-100 z-0" : "opacity-0"
                }`}
              >
                <img
                  src={image.image_url}
                  alt={image.title || "Slider image"}
                  className="w-full h-full object-cover"
                />
                {/* Overlay for text readability */}
                <div className="absolute inset-0 hero-overlay" />
              </div>
            ))
          ) : (
            <div className="w-full h-full bg-white" />
          )}
        </div>

        <div
          className="hero-content-clear relative z-20 max-w-4xl px-6 md:px-12 py-6"
          style={{ background: "transparent" }}
        >
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white" style={{ background: "transparent" }}>
            Find work. Connect with businesses.
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white max-w-2xl" style={{ background: "transparent" }}>
            FastLink connects everyday people with local businesses and real job opportunities across Fiji.
            Start with a quick search or browse what's featured today.
          </p>
          <form
            className="mt-6 w-full max-w-2xl md:max-w-[70vw]"
            ref={heroSearchRef}
            style={{ background: "transparent" }}
            onSubmit={(e) => {
              e.preventDefault();
              handleCombinedSearch();
            }}
          >
            <div className="relative">
              <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Search for jobs or businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCombinedSearch();
                  }}
                  className="flex-1 px-4 py-4 text-[18px] leading-[24px] font-[400] text-gray-900 placeholder:text-gray-500 bg-white border-0 outline-none min-w-0"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="mr-3 h-11 w-11 rounded-md bg-[#404145] text-white flex items-center justify-center shadow-sm hover:opacity-90 transition flex-shrink-0"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            {showHeroSuggestions && heroSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-64 overflow-auto z-30">
                {heroSuggestions.map((business, index) => (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(business.company_name || "");
                      setShowHeroSuggestions(false);
                      setHeroSelectedIndex(-1);
                      handleCombinedSearch();
                    }}
                    onMouseEnter={() => setHeroSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 text-[16px] leading-[22px] text-gray-900 hover:bg-gray-50 ${
                      heroSelectedIndex === index ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="text-[16px] text-gray-900 font-semibold truncate">
                      {business.company_name}
                    </div>
                    {business.slug && (
                      <div className="text-[16px] text-gray-500 truncate">
                        {business.slug}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            </div>
          </form>
          <div className="mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const term = "surveyor";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Surveyor →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "construction";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Construction →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "architect";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Architect →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "web development";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Web Development →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "plumber";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Plumber →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "lawyer";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Lawyer →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "mechanic";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Mechanic →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "car rental";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Car Rental →
              </button>
              <button
                type="button"
                onClick={() => {
                  const term = "private doctor";
                  setSearchQuery(term);
                  handleCombinedSearch();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-white text-white hover:bg-white/10 transition-colors"
              >
                Private Doctor →
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-white">

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Featured Businesses (above Recent Job Posts) */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex flex-wrap items-center gap-2 text-[24px] leading-[28px] md:text-[38px] md:leading-[42px]"
                style={{ color: "#404145", fontFamily: "Michroma, sans-serif", marginTop: "10px" }}
              >
                <span>Businesses On FastLink</span>
                <span aria-hidden="true" className="text-gray-700">→</span>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1 text-[24px] leading-[28px] md:text-[38px] md:leading-[42px] font-medium text-blue-500 hover:text-blue-600"
                >
                  <span>Signup Today - It's Free!</span>
                </Link>
              </div>
            </div>
            {businessesError ? (
              <div className="text-sm text-red-600">{businessesError}</div>
            ) : featuredBusinesses.length > 0 || allBusinesses.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(featuredBusinesses.length > 0 ? featuredBusinesses : allBusinesses).map((business) => {
                  const slugSource = (business.slug || business.company_name || "").toString().trim();
                  if (!slugSource) return null;
                  const safeSlug = encodeURIComponent(slugSource.toLowerCase());
                  return (
                    <Link
                      key={business.id}
                      href={`/${safeSlug}`}
                      className="group bg-white rounded-lg border border-gray-200 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:bg-blue-50/30"
                    >
                      <div className="flex flex-col items-center text-center">
                        {business.company_logo_url ? (
                          <div className="w-20 h-20 mb-3 flex items-center justify-center">
                            <img
                              src={business.company_logo_url}
                              alt={business.company_name}
                              className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div className="w-20 h-20 mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <h3 className="text-[16px] font-semibold text-gray-900">
                          {business.company_name}
                        </h3>
                        {business.company_description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {business.company_description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No businesses found.</div>
            )}
          </div>

          {/* Recent Job Posts */}
          {featuredJobs.length > 0 && (
            <div className="mb-12">
              <div className="w-full mx-[10px]">
                <div className="rounded-2xl bg-[#C55E7C] shadow-md py-[30px]">
                  <div className="p-5 bg-[#C55E7C] rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2 text-white">
                      <h2 className="text-[48px] leading-[50px] font-normal">
                        Recent Job Posts
                      </h2>
                      <p className="text-[18px] leading-[24px] text-white/90">
                        Hand-picked opportunities from businesses on FastLink
                      </p>
                    </div>
                    <div className="space-y-4 rounded-xl bg-[#BE5271] p-3">
                      {featuredJobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobseeker/jobs/${job.id}`}
                          className="block w-full px-2 py-2 rounded-lg transition-colors hover:bg-white/10"
                        >
                          <div className="flex items-start gap-4">
                            {job.business?.company_logo_url && (
                              <img
                                src={job.business.company_logo_url}
                                alt={job.business.company_name || "Business"}
                                className="w-12 h-12 object-contain rounded flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0 text-white">
                              <h3 className="text-lg font-semibold mb-1">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
                                {job.business?.company_name && (
                                  <span className="font-medium">{job.business.company_name}</span>
                                )}
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
                                {job.created_at && (
                                  <span className="text-xs text-white/80">
                                    {formatRelativeTime(job.created_at)}
                                  </span>
                                )}
                                {job.salary && (
                                  <span className="text-sm font-medium text-white">
                                    {job.salary}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
