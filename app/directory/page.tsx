"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Building2 } from "lucide-react";
import { ImageSlider } from "@/components/image-slider";

interface Business {
  id: string;
  company_name: string;
  slug: string;
  company_description?: string;
  company_logo_url?: string;
}

interface SliderImage {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
  link_url?: string;
}

export default function DirectoryPage() {
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [businessPlaceholder, setBusinessPlaceholder] = useState("Search for a business...");
  const [businessPlaceholderActive, setBusinessPlaceholderActive] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);

  // Typing effect for business search placeholder
  useEffect(() => {
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
        charIndex++;
        if (charIndex <= current.length) {
          setBusinessPlaceholder(current.slice(0, charIndex));
        } else {
          isDeleting = true;
          timeoutId = setTimeout(type, 1500);
          return;
        }
      } else {
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

    timeoutId = setTimeout(type, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [businessPlaceholderActive]);

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
        const data: Business[] = await response.json();
        setAutocompleteSuggestions(data.slice(0, 8));
        setShowAutocomplete(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      setAutocompleteSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (businessSearchQuery.trim()) {
        fetchAutocompleteSuggestions(businessSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [businessSearchQuery, fetchAutocompleteSuggestions]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const searchTerm = businessSearchQuery.trim();
      const url = searchTerm
        ? `/api/company?search=${encodeURIComponent(searchTerm)}`
        : `/api/company`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to search businesses");
      }

      const data: Business[] = await response.json();
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error searching businesses:", error);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (business: Business) => {
    setBusinessSearchQuery(business.company_name);
    setShowAutocomplete(false);
    handleSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // Fetch slider images for directory page
  useEffect(() => {
    const fetchSliderImages = async () => {
      try {
          const response = await fetch("/api/slider-images?page=directory&t=" + Date.now(), {
            cache: "no-store", // Don't cache to see fresh data
          });

        if (response.ok) {
          const data = await response.json();
          const images = data || [];
          setSliderImages(images);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Directory: Failed to fetch slider images:", errorData);
        }
      } catch (error) {
        console.error("Directory: Error fetching slider images:", error);
      }
    };

    fetchSliderImages();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Slider Background */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden mb-8 bg-gray-200">
        <div className="absolute inset-0">
          {sliderImages.length > 0 ? (
            <ImageSlider images={sliderImages} autoPlay interval={5000} />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-center z-10" style={{ zIndex: 10 }}>
          <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Building2 className="h-8 w-8 text-white" />
                <h1 className="text-3xl font-bold text-white">Business Directory</h1>
              </div>
              <p className="text-[18px] leading-[24px] text-white/90 mb-6">
                Search for businesses and view their contact information
              </p>

          {/* Google-style Search Bar with Autocomplete */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="relative" ref={searchInputRef}>
              <div className="relative bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-200 focus-within:border-blue-500 overflow-hidden">
                <div className="flex items-center min-h-[64px]">
                  <div className="pl-6 pr-4 flex-shrink-0">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={businessPlaceholder}
                    value={businessSearchQuery}
                    onChange={(e) => {
                      setBusinessSearchQuery(e.target.value);
                    }}
                    onKeyDown={handleKeyPress}
                    onFocus={() => {
                      if (businessPlaceholderActive) {
                        setBusinessPlaceholderActive(false);
                      }
                      if (autocompleteSuggestions.length > 0) {
                        setShowAutocomplete(true);
                      }
                    }}
                    className="flex-1 pr-4 text-[18px] leading-[24px] font-[280] text-gray-900 placeholder:text-gray-400 bg-transparent border-0 outline-none focus:outline-none min-w-0"
                    style={{ fontFamily: "Macan, system-ui, sans-serif", paddingTop: 12, paddingBottom: 12 }}
                  />
                </div>
              </div>

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
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Business Results */}
        {hasSearched && (
          <div className="mt-8">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Searching businesses...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">
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
  );
}


