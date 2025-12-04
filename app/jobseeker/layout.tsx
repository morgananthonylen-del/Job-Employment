"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Roboto } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Search,
  FileText,
  Bookmark,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  UserRound,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  ArrowLeft,
  MessageCircle,
  MoreVertical,
  Check,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal";
import { AD_STORAGE_KEY, CUSTOM_ADS_EVENT, SponsoredAd, readStoredAds } from "@/lib/ads";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const defaultSponsoredAds: SponsoredAd[] = [
  {
    id: "default-js-1",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Interview coaching",
    headline: "Level up your interviews",
    body: "Ace every conversation with personalised coaching sessions.",
    href: "https://fastlink.example.com/ads/interview-coaching",
  },
  {
    id: "default-js-2",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Resume review",
    headline: "Polish your resume",
    body: "Get feedback from experts and stand out to recruiters.",
    href: "https://fastlink.example.com/ads/resume-review",
  },
  {
    id: "default-js-3",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Skill workshops",
    headline: "Grow your skillset",
    body: "Upgrade your capabilities with certified workshops.",
    href: "https://fastlink.example.com/ads/skill-workshops",
  },
  {
    id: "default-js-4",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Tech bootcamp",
    headline: "Join a tech bootcamp",
    body: "Pivot into tech through immersive, project-based learning.",
    href: "https://fastlink.example.com/ads/tech-bootcamp",
  },
];

type AssistantMessage = {
  id: number;
  sender: "amanda" | "user";
  text: string;
  suggestions?: { label: string; href: string }[];
};

export default function JobSeekerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [quickShortcutsOpen, setQuickShortcutsOpen] = useState(false);
  const [showMessagesBox, setShowMessagesBox] = useState(false);
  const [messagesBoxJobId, setMessagesBoxJobId] = useState<string | null>(null);
  const [messagesBoxThreadId, setMessagesBoxThreadId] = useState<string | null>(null);
  const [messagesBoxBusinessName, setMessagesBoxBusinessName] = useState<string>("");
  const [messagesBoxJobTitle, setMessagesBoxJobTitle] = useState<string>("");
  const [messagesText, setMessagesText] = useState("");
  const [messagesSending, setMessagesSending] = useState(false);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [editingMessageSaving, setEditingMessageSaving] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const [showJobPopup, setShowJobPopup] = useState(false);
  const [jobPopupData, setJobPopupData] = useState<any>(null);
  const [jobPopupLoading, setJobPopupLoading] = useState(false);
  const messagesListRef = useRef<HTMLDivElement | null>(null);
  const [adsToDisplay, setAdsToDisplay] = useState<SponsoredAd[]>([]);
  const [adsVisible, setAdsVisible] = useState(true);
  const [adsOpenInNewTab, setAdsOpenInNewTab] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [mobileMessageEnquiry, setMobileMessageEnquiry] = useState<{
    enabled: boolean;
    jobId?: string;
    businessId?: string;
    businessName?: string;
    proOnly?: boolean;
  }>({ enabled: true });
  const lastStoredUserRef = useRef<string | null>(null);
  const adsPoolRef = useRef<SponsoredAd[]>(defaultSponsoredAds);

  const pickAds = useCallback((pool?: SponsoredAd[]) => {
    const source = pool ?? adsPoolRef.current;
    if (!source.length) {
      setAdsToDisplay([]);
      return;
    }
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    setAdsToDisplay(shuffled.slice(0, 2));
  }, []);

  const updateAdsPool = useCallback(() => {
    const currentUserId = user?.id ?? null;
    let pool = defaultSponsoredAds.filter(
      (ad) => !currentUserId || ad.ownerId !== currentUserId
    );

    if (typeof window !== "undefined") {
      const storedAds = readStoredAds();
      const filteredStored = storedAds.filter(
        (ad) =>
          ad.ownerId &&
          ad.ownerId !== currentUserId &&
          (ad.status === undefined || ad.status === "active")
      );
      if (filteredStored.length) {
        pool = [...filteredStored, ...pool];
      }
    }

    if (!pool.length) {
      pool = defaultSponsoredAds;
    }

    adsPoolRef.current = pool;
    return pool;
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.userType !== "jobseeker") {
            router.push("/login");
            return;
          }
          setUser(parsedUser);
          lastStoredUserRef.current = storedUser;
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error accessing user data:", error);
        router.push("/login");
      }
    };

    loadUser();

    const handleUserUpdated = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          if (storedUser !== lastStoredUserRef.current) {
            lastStoredUserRef.current = storedUser;
            setUser(JSON.parse(storedUser));
          }
        } else if (lastStoredUserRef.current !== null) {
          lastStoredUserRef.current = null;
          setUser(null);
        }
      } catch (error) {
        console.error("Error updating user from storage:", error);
      }
    };

    window.addEventListener("user-updated", handleUserUpdated);
    window.addEventListener("focus", loadUser); // Reload when window regains focus
    return () => {
      window.removeEventListener("user-updated", handleUserUpdated);
      window.removeEventListener("focus", loadUser);
    };
  }, [router]);

  // Reload user data on pathname change to ensure it persists across navigation
  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.userType === "jobseeker") {
            // Always update user if stored user exists, even if current user is null
            if (!user || user.id !== parsedUser.id) {
              setUser(parsedUser);
              lastStoredUserRef.current = storedUser;
            }
          }
        }
      } catch (error) {
        console.error("Error reloading user on navigation:", error);
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initialize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    initialize();

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const computeMissingFields = useCallback((data: Record<string, any> | null) => {
    if (!data) return [];
    const required = ["name", "birthday", "phone_number", "address", "city", "gender", "ethnicity"];
    return required.filter((field) => {
      const value = data[field];
      if (value === null || value === undefined) return true;
      if (typeof value === "string") {
        return value.trim().length === 0;
      }
      return false;
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user || user.userType !== "jobseeker") return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setProfileData(null);
        setProfileIncomplete(false);
        return;
      }

      const response = await fetch("/api/user/profile", {
        headers: {
          "Cache-Control": "no-store",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }
      const data = await response.json();
      setProfileData(data);
      const missing = computeMissingFields(data);
      setProfileIncomplete(missing.length > 0);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [user, computeMissingFields]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const openMessageThread = useCallback(async (jobId: string, businessName: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }

      // Create or get thread
      const threadResponse = await fetch("/api/jobseeker/messages/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.json();
        throw new Error(error.error || "Failed to start conversation");
      }

      const thread = await threadResponse.json();
      setMessagesBoxThreadId(thread.id);
      setMessagesBoxJobId(jobId);
      setMessagesBoxBusinessName(businessName);
      // Fetch job title
      try {
        const jobResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setMessagesBoxJobTitle(jobData.title || "");
        }
      } catch (error) {
        console.error("Error fetching job title:", error);
      }
      setShowMessagesBox(true);
    } catch (error: any) {
      console.error("Error opening message thread:", error);
      alert(error.message || "Failed to open conversation");
    }
  }, [router]);

  useEffect(() => {
    const handleMessageAvailability = (event: Event) => {
      const detail = (event as CustomEvent<{
        enabled?: boolean;
        jobId?: string;
        businessId?: string;
        businessName?: string;
        proOnly?: boolean;
      }>).detail;

      if (!detail || detail.enabled === false) {
        setMobileMessageEnquiry({ enabled: true });
        return;
      }

      setMobileMessageEnquiry({
        enabled: true,
        jobId: detail.jobId,
        businessId: detail.businessId,
        businessName: detail.businessName,
        proOnly: detail.proOnly,
      });

      // Store job context for potential message opening
      if (detail.jobId) {
        setMessagesBoxJobId(detail.jobId);
        setMessagesBoxBusinessName(detail.businessName || "");
      }
    };

    const handleOpenMessageThread = async (event: Event) => {
      const detail = (event as CustomEvent<{
        jobId: string;
        businessName: string;
      }>).detail;

      if (detail?.jobId) {
        await openMessageThread(detail.jobId, detail.businessName || "");
      }
    };

    window.addEventListener("jobseeker-message-availability", handleMessageAvailability);
    window.addEventListener("open-message-thread", handleOpenMessageThread as EventListener);
    return () => {
      window.removeEventListener("jobseeker-message-availability", handleMessageAvailability);
      window.removeEventListener("open-message-thread", handleOpenMessageThread as EventListener);
    };
  }, [openMessageThread]);

  useEffect(() => {
    if (!mounted) return;
    const pool = updateAdsPool();
    pickAds(pool);
  }, [mounted, updateAdsPool, pickAds]);

  useEffect(() => {
    if (!messagesListRef.current || messagesList.length === 0) return;
    
    // Throttle scroll operations to reduce CPU usage
    const rafId = requestAnimationFrame(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [messagesList.length]); // Only depend on length, not the entire array

  // Fetch conversations when messages box is opened
  const fetchConversations = useCallback(async () => {
    if (!user || user.userType !== "jobseeker") return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    try {
      const res = await fetch("/api/jobseeker/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.status}`);
      }
      const data = await res.json();
      console.log("Job seeker conversations fetched:", {
        count: Array.isArray(data) ? data.length : 0,
        data: data,
      });
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    }
  }, [user]);

  useEffect(() => {
    if (!showMessagesBox || user?.userType !== "jobseeker" || !user?.userId) return;

    // Initial fetch
    fetchConversations();

    // Set up real-time subscription for conversations
    const conversationsChannel = supabase
      .channel(`jobseeker-conversations-${user.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_post_threads",
          filter: `job_seeker_id=eq.${user.userId}`,
        },
        (payload) => {
          console.log("Thread change detected:", payload);
          // Refresh conversations when thread changes
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_post_messages",
        },
        (payload) => {
          console.log("New message detected:", payload);
          // Refresh conversations when new message is added (to update last_message_at)
          // Only refresh if this message is in a thread belonging to this job seeker
          if (payload.new?.thread_id) {
            fetchConversations();
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      conversationsChannel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMessagesBox, user?.userId, user?.userType]);

  // Fetch messages when threadId is available
  const fetchMessages = useCallback(async () => {
    if (!messagesBoxThreadId) {
      setMessagesList([]);
      return;
    }

    setMessagesLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const response = await fetch(`/api/jobseeker/messages/${messagesBoxThreadId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      const formattedMessages: any[] = (data || []).map((msg: any) => ({
        id: msg.id,
        body: msg.body,
        sender: msg.sender_type === "jobseeker" ? "jobseeker" : "business",
        createdAt: msg.created_at,
      }));
      setMessagesList(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessagesList([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [messagesBoxThreadId]);

  useEffect(() => {
    if (!messagesBoxThreadId) {
      setIsOtherTyping(false);
      setMessagesList([]); // Clear messages when no thread
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        typingChannelRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchMessages();

    // Set up real-time subscription for messages in this thread
    const messagesChannel = supabase
      .channel(`jobseeker-messages-${messagesBoxThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_post_messages",
          filter: `thread_id=eq.${messagesBoxThreadId}`,
        },
        (payload) => {
          // Add new message to the list
          const newMessage = payload.new;
          setMessagesList((prev) => {
            // Check if message already exists
            if (prev.some((msg: any) => msg.id === newMessage.id)) {
              return prev;
            }
            // Format the new message
            const formattedMessage = {
              id: newMessage.id,
              body: newMessage.body,
              sender: newMessage.sender_type === "jobseeker" ? "jobseeker" : "business",
              createdAt: newMessage.created_at,
            };
            return [...prev, formattedMessage];
          });
          // Auto-scroll to bottom (throttled with requestAnimationFrame)
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (messagesListRef.current) {
                messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
              }
            }, 50);
          });
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing:${messagesBoxThreadId}`)
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          // Only show typing indicator if it's from the other person (business)
          if (payload.payload.userId !== user?.id) {
            setIsOtherTyping(true);
            // Clear typing indicator after 3 seconds if no update
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 3000);
          }
        }
      )
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      messagesChannel.unsubscribe();
      typingChannel.unsubscribe();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesBoxThreadId, user?.id]);

  const handleEditMessage = async (messageId: string, newBody: string) => {
    if (!messagesBoxThreadId || !newBody.trim()) return;

    setEditingMessageSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/jobseeker/messages/${messagesBoxThreadId}/${messageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newBody }),
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessagesList((prev) =>
          prev.map((msg: any) =>
            msg.id === messageId
              ? {
                  id: updatedMessage.id,
                  body: updatedMessage.body,
                  sender: "jobseeker",
                  createdAt: updatedMessage.created_at,
                }
              : msg
          )
        );
        setEditingMessageId(null);
        setEditingMessageText("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to edit message");
      }
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message");
    } finally {
      setEditingMessageSaving(false);
    }
  };

  const canEditMessage = (message: any) => {
    if (message.sender !== "jobseeker") return false;
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    return now - messageTime <= twoMinutes;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUpdate = () => {
      const pool = updateAdsPool();
      pickAds(pool);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AD_STORAGE_KEY) {
        handleUpdate();
      }
    };

    window.addEventListener(CUSTOM_ADS_EVENT, handleUpdate as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(CUSTOM_ADS_EVENT, handleUpdate as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, [updateAdsPool, pickAds]);

  useEffect(() => {
    let rotationTimeout: ReturnType<typeof setTimeout> | undefined;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    const scheduleRotation = () => {
      if (!isMounted) return; // Prevent scheduling if unmounted
      const delay = 60000 + Math.random() * 60000;
      rotationTimeout = setTimeout(() => {
        if (!isMounted) return; // Check again before updating state
        setAdsVisible(false);
        fadeTimeout = setTimeout(() => {
          if (!isMounted) return; // Check again before updating state
          const refreshedPool = updateAdsPool();
          pickAds(refreshedPool);
          setAdsVisible(true);
        scheduleRotation();
        }, 200);
      }, delay);
    };

    const initialPool = updateAdsPool();
    pickAds(initialPool);
    setAdsVisible(true);
    scheduleRotation();

    return () => {
      isMounted = false; // Set flag to prevent further scheduling
      if (rotationTimeout) {
        clearTimeout(rotationTimeout);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [pickAds, updateAdsPool]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedPreference = localStorage.getItem("ads-open-new-tab");
      if (storedPreference !== null) {
        setAdsOpenInNewTab(storedPreference === "true");
      }
    } catch (error) {
      console.error("Unable to read ads preference:", error);
    }

    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setAdsOpenInNewTab(customEvent.detail);
      }
    };

    window.addEventListener("ads-open-new-tab-updated", handlePreferenceChange as EventListener);
    return () => {
      window.removeEventListener("ads-open-new-tab-updated", handlePreferenceChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (showAssistant) {
      const initialId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
      setAssistantMessages([
        {
          id: initialId,
          sender: "amanda",
          text: `Hi ${user?.name ? user.name.split(" ")[0] : "there"}! I’m Amanda. Ask me anything about your FastLink dashboard, and I’ll point you in the right direction.`,
          suggestions: [
            { label: "How do I track my applications?", href: "/jobseeker/applications" },
            { label: "Where do I upload documents?", href: "/jobseeker/documents" },
          ],
        },
      ]);
      setAssistantInput("");
    }
  }, [showAssistant, user?.name]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login?share=1");
  };

  const assistantQuickLinks = useMemo(
    () => [
      { label: "Browse jobs", href: "/jobseeker/jobs", icon: LayoutDashboard },
      { label: "View applications", href: "/jobseeker/applications", icon: FileText },
      { label: "Saved jobs", href: "/jobseeker/saved", icon: Bookmark },
      { label: "Manage documents", href: "/jobseeker/documents", icon: FileText },
      { label: "Edit profile", href: "/jobseeker/profile", icon: UserRound },
      { label: "Account settings", href: "/jobseeker/settings", icon: Settings },
      { label: "Dashboard overview", href: "/jobseeker/dashboard", icon: LayoutDashboard },
    ],
    []
  );

  const handleMessageShortcut = useCallback(() => {
    if (mobileMessageEnquiry?.jobId) {
      // Open messages popup for mobile
      setMessagesBoxJobId(mobileMessageEnquiry.jobId);
      setMessagesBoxBusinessName(mobileMessageEnquiry.businessName || "");
      setShowMessagesBox(true);
      // Create/get thread
      openMessageThread(mobileMessageEnquiry.jobId, mobileMessageEnquiry.businessName || "");
    } else {
      setShowMessagesBox(true);
    }
  }, [mobileMessageEnquiry, router, openMessageThread]);

  const getAmandaResponse = (input: string): AssistantMessage => {
    const id = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const normalized = input.toLowerCase();

    if (normalized.includes("job") || normalized.includes("search") || normalized.includes("find")) {
      return {
        id,
        sender: "amanda",
        text:
          "You can browse the latest openings under Find Jobs. Use the search box and filters to narrow down roles by location or keywords.",
        suggestions: [
          { label: "Go to Find Jobs", href: "/jobseeker/jobs" },
          { label: "See saved jobs", href: "/jobseeker/saved" },
        ],
      };
    }

    if (normalized.includes("application") || normalized.includes("apply") || normalized.includes("status")) {
      return {
        id,
        sender: "amanda",
        text:
          "Track every application in the Applications area. You will see the status, dates, and quick links to revisit each job posting.",
        suggestions: [
          { label: "Open Applications", href: "/jobseeker/applications" },
          { label: "Review documents", href: "/jobseeker/documents" },
        ],
      };
    }

    if (normalized.includes("document") || normalized.includes("upload") || normalized.includes("birth") || normalized.includes("cv")) {
      return {
        id,
        sender: "amanda",
        text:
          "All required files can be managed in Documents. Upload your birth certificate, CV, references, and cover letters from there.",
        suggestions: [
          { label: "Manage documents", href: "/jobseeker/documents" },
          { label: "Need a cover letter?", href: "/jobseeker/assistant" },
        ],
      };
    }

    if (normalized.includes("profile") || normalized.includes("contact") || normalized.includes("info")) {
      return {
        id,
        sender: "amanda",
        text:
          "Update your personal details in the Profile section. That’s where you can change your address, phone number, or other contact info.",
        suggestions: [
          { label: "Edit profile", href: "/jobseeker/profile" },
          { label: "Update settings", href: "/jobseeker/settings" },
        ],
      };
    }

    if (normalized.includes("setting") || normalized.includes("password") || normalized.includes("theme")) {
      return {
        id,
        sender: "amanda",
        text:
          "Account Settings is where you can switch between dark and light mode, and change your password.",
        suggestions: [
          { label: "Open settings", href: "/jobseeker/settings" },
          { label: "Edit profile", href: "/jobseeker/profile" },
        ],
      };
    }

    if (normalized.includes("saved")) {
      return {
        id,
        sender: "amanda",
        text:
          "Your bookmarked roles live under Saved Jobs. Revisit them anytime to apply when you’re ready.",
        suggestions: [
          { label: "View saved jobs", href: "/jobseeker/saved" },
          { label: "Browse new jobs", href: "/jobseeker/jobs" },
        ],
      };
    }

    return {
      id,
      sender: "amanda",
      text:
        "I can help you browse jobs, track applications, manage documents, or update your profile. Ask me about any area and I’ll guide you there.",
      suggestions: [
        { label: "Show me my dashboard", href: "/jobseeker/dashboard" },
        { label: "How do I upload documents?", href: "/jobseeker/documents" },
      ],
    };
  };

  const handleAssistantSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;

    const userMessageId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const userMessage: AssistantMessage = {
      id: userMessageId,
      sender: "user",
      text: trimmed,
    };

    setAssistantMessages((prev) => [...prev, userMessage]);
    setAssistantInput("");

    // Show loading message
    const loadingId = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const loadingMessage: AssistantMessage = {
      id: loadingId,
      sender: "amanda",
      text: "Thinking...",
    };
    setAssistantMessages((prev) => [...prev, loadingMessage]);

    try {
      // Build user context
      const userContext = user
        ? `User name: ${user.name}, Email: ${user.email}`
        : undefined;

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/assistant/amanda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: trimmed,
          userContext,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to get AI response";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `API returned status ${response.status}`;
          if (!errorMessage || errorMessage === `API returned status ${response.status}`) {
            // If errorData is empty or doesn't have useful info, provide more context
            errorMessage = `API error (${response.status}): ${JSON.stringify(errorData) || "Unknown error"}`;
          }
          console.error("Amanda API error:", { status: response.status, error: errorData, errorMessage });
        } catch (e) {
          const text = await response.text().catch(() => "");
          errorMessage = `API returned status ${response.status}${text ? `: ${text}` : ""}`;
          console.error("Amanda API error:", { status: response.status, text, parseError: e });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error("No response from AI");
      }
      
      // Remove loading message and add AI response
      setAssistantMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingId);
        const aiResponse: AssistantMessage = {
          id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
          sender: "amanda",
          text: data.response,
          suggestions: getSuggestionsForMessage(trimmed),
        };
        return [...filtered, aiResponse];
      });
    } catch (error: any) {
      console.error("Amanda API error:", error);
      // Fallback to keyword-based response
      setAssistantMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingId);
        const fallbackResponse = getAmandaResponse(trimmed);
        return [...filtered, fallbackResponse];
      });
    }
  };

  const getSuggestionsForMessage = (input: string): { label: string; href: string }[] => {
    const normalized = input.toLowerCase();
    
    if (normalized.includes("job") || normalized.includes("search") || normalized.includes("find")) {
      return [
        { label: "Go to Find Jobs", href: "/jobseeker/jobs" },
        { label: "See saved jobs", href: "/jobseeker/saved" },
      ];
    }
    
    if (normalized.includes("application") || normalized.includes("apply") || normalized.includes("status")) {
      return [
        { label: "Open Applications", href: "/jobseeker/applications" },
        { label: "Review documents", href: "/jobseeker/documents" },
      ];
    }
    
    if (normalized.includes("document") || normalized.includes("upload") || normalized.includes("cv")) {
      return [
        { label: "Manage documents", href: "/jobseeker/documents" },
        { label: "Browse jobs", href: "/jobseeker/jobs" },
      ];
    }
    
    if (normalized.includes("profile") || normalized.includes("contact")) {
      return [
        { label: "Edit profile", href: "/jobseeker/profile" },
        { label: "Update settings", href: "/jobseeker/settings" },
      ];
    }
    
    return [
      { label: "Show me my dashboard", href: "/jobseeker/dashboard" },
      { label: "Browse jobs", href: "/jobseeker/jobs" },
    ];
  };

  const menuItems = [
    {
      title: "Dashboard",
      href: "/jobseeker/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Find Jobs",
      href: "/jobseeker/jobs",
      icon: Search,
      exact: false,
    },
    {
      title: "Applications",
      href: "/jobseeker/applications",
      icon: FileText,
      exact: false,
    },
    {
      title: "Saved Jobs",
      href: "/jobseeker/saved",
      icon: Bookmark,
      exact: false,
    },
    {
      title: "Documents",
      href: "/jobseeker/documents",
      icon: FileText,
      exact: true,
    },
    {
      title: "Profile",
      href: "/jobseeker/profile",
      icon: UserRound,
      exact: false,
    },
    {
      title: "Settings",
      href: "/jobseeker/settings",
      icon: Settings,
      exact: true,
    },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const currentPath = pathname || "";
  const mobileTopNavItems = [
    { href: "/jobseeker/messages", Icon: MessageCircle, label: "Messages" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={cn(
          "bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 border-r border-purple-800/60 shadow-xl transition-all duration-300 ease-in-out text-slate-100",
          sidebarOpen ? "w-64" : "w-20",
          "fixed lg:sticky top-0 h-screen z-40 overflow-hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between p-4 border-b border-purple-800/60">
            {sidebarOpen && user && (
              <div className="w-full pr-4">
                <div className="flex items-center gap-3 rounded-lg px-2 py-1 text-left text-slate-100">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user?.name || "Profile photo"}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 text-purple-950 flex items-center justify-center font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || "J"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {user?.name || "Job Seeker"}
                      </p>
                      <p className="text-xs text-purple-200 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex text-slate-300"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <ArrowLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = currentPath === item.href || (currentPath.startsWith(item.href) && item.href !== "/jobseeker/dashboard");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-500/30 text-white shadow-inner shadow-purple-800/40"
                      : "text-purple-100",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <Icon className={cn("h-5 w-5", !sidebarOpen && "mx-auto")} />
                  {sidebarOpen && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowAssistant(true)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg border border-pink-500/40 bg-pink-900/40 px-3 py-2 text-sm font-medium text-pink-100 hover:bg-pink-900/60 transition",
                !sidebarOpen && "justify-center"
              )}
            >
              <Sparkles className="h-5 w-5 text-pink-200" />
              {sidebarOpen && <span>Amanda · AI Assistant</span>}
            </button>

            <button
              onClick={handleLogout}
              className={cn(
                "hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-blue-200"
              )}
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>

          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 lg:ml-0">
        <div className="min-h-screen bg-gray-100">
          <div className="flex">
            <div className="flex-1 px-4 py-8 pb-24 lg:px-8 lg:pb-8">
              <div className="lg:hidden sticky top-0 z-30 -mx-4 -mt-8 mb-6 px-4 py-3 bg-white shadow-sm border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <Link
                    href="/jobseeker/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 text-white shadow hover:from-purple-900 hover:via-purple-800 hover:to-purple-700 transition-all"
                    aria-label="FastLink dashboard"
                  >
                    <Zap className="h-5 w-5" />
                  </Link>
                  <nav className="flex flex-1 items-center justify-center gap-2">
                    {mobileTopNavItems.map(({ href, Icon, label }) => {
                      const isActive =
                        currentPath === href || (currentPath.startsWith(href) && href !== "/jobseeker/dashboard");
                      return (
                        <Link
                          key={href}
                          href={href}
                          className={cn(
                            "flex h-10 w-12 items-center justify-center rounded-md transition-colors",
                            isActive
                              ? "text-blue-600 border-b-2 border-blue-600"
                              : "text-gray-400 hover:text-blue-500"
                          )}
                          aria-label={label}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Icon className="h-5 w-5" />
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="flex items-center gap-2">
                    {mobileMessageEnquiry?.enabled && mobileMessageEnquiry?.jobId && (
                      <button
                        type="button"
                        onClick={handleMessageShortcut}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        aria-label={
                          mobileMessageEnquiry.businessName
                            ? `Message ${mobileMessageEnquiry.businessName}`
                            : "Message employer"
                        }
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                    )}
                    <details className="relative group">
                      <summary className="flex items-center gap-2 list-none cursor-pointer p-0 border-none outline-none">
                        {(() => {
                          // Always show profile photo, even if user data is temporarily unavailable
                          const currentUser = user || (typeof window !== "undefined" ? (() => {
                            try {
                              const stored = localStorage.getItem("user");
                              return stored ? JSON.parse(stored) : null;
                            } catch {
                              return null;
                            }
                          })() : null);
                          
                          return currentUser?.avatar_url ? (
                            <Image
                              src={currentUser.avatar_url}
                              alt={currentUser?.name || "Profile photo"}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 shadow-sm hover:border-blue-400 transition-colors"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-900 font-semibold border-2 border-gray-200 shadow-sm hover:border-blue-400 transition-colors">
                              {currentUser?.name?.charAt(0)?.toUpperCase() || "J"}
                            </div>
                          );
                        })()}
                      </summary>
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                        <div className="flex flex-col divide-y divide-gray-200 text-sm text-gray-700">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              {user?.avatar_url ? (
                                <Image
                                  src={user.avatar_url}
                                  alt={user?.name || "Profile photo"}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-900 font-semibold">
                                  {user?.name?.charAt(0)?.toUpperCase() || "J"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {user?.name || "Job Seeker"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user?.email || ""}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Link href="/jobseeker/profile" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link href="/jobseeker/settings" className="px-4 py-2 hover:bg-gray-100 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600"
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
              {children}
            </div>
            <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-4 bg-gray-100 p-4 sticky top-0 h-screen">
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500 font-medium">Sponsored</p>
              <div
                className={cn(
                  "space-y-4 overflow-y-auto pr-1 transition-opacity duration-500 ease-out",
                  adsVisible ? "opacity-100" : "opacity-0"
                )}
              >
                {adsToDisplay.map((ad) => {
                  const actionType = ad.actionType ?? "website";
                  const isCallAction = actionType === "call" || ad.href.startsWith("tel:");
                  const target = isCallAction ? "_self" : adsOpenInNewTab ? "_blank" : "_self";
                  const rel = target === "_blank" ? "noopener noreferrer" : undefined;
                  return (
                    <a
                      key={ad.id}
                      href={ad.href}
                      target={target}
                      rel={rel}
                      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                      aria-label="Sponsored advertisement"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ad.imageUrl}
                        alt={ad.imageAlt}
                        className="h-40 w-full object-cover"
                        loading="lazy"
                      />
                      {(ad.headline || ad.body) && (
                        <div className="px-3 py-2 space-y-1">
                          {ad.headline && (
                            <p className="text-xs font-semibold text-gray-700">{ad.headline}</p>
                          )}
                          {ad.body && <p className="text-xs text-gray-500">{ad.body}</p>}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-gradient-to-br from-purple-950 via-purple-900 to-purple-800 border-t border-purple-800/60 shadow-[0_-12px_24px_rgba(88,28,135,0.3)]">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] text-xs font-medium">
          <Link
            href="/jobseeker/applications"
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors",
              currentPath.startsWith("/jobseeker/applications")
                ? "text-white bg-purple-500/30"
                : "text-purple-100 hover:text-white hover:bg-purple-800/50"
            )}
            aria-label="My applications"
          >
            <ClipboardCheck className="h-5 w-5" />
            <span>Applications</span>
          </Link>
          <Link
            href="/jobseeker/jobs"
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors",
              currentPath.startsWith("/jobseeker/jobs")
                ? "text-white bg-purple-500/30"
                : "text-purple-100 hover:text-white hover:bg-purple-800/50"
            )}
            aria-label="Find jobs"
          >
            <Search className="h-5 w-5" />
            <span>Find Jobs</span>
          </Link>
          <Link
            href="/jobseeker/saved"
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors",
              currentPath.startsWith("/jobseeker/saved")
                ? "text-white bg-purple-500/30"
                : "text-purple-100 hover:text-white hover:bg-purple-800/50"
            )}
            aria-label="Saved jobs"
          >
            <Bookmark className="h-5 w-5" />
            <span>Saved</span>
          </Link>
          <Link
            href="/jobseeker/documents"
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-colors",
              currentPath.startsWith("/jobseeker/documents")
                ? "text-white bg-purple-500/30"
                : "text-purple-100 hover:text-white hover:bg-purple-800/50"
            )}
            aria-label="My documents"
          >
            <FileText className="h-5 w-5" />
            <span>Documents</span>
          </Link>
        </div>
      </div>

      {user?.userType === "jobseeker" && profileData && profileIncomplete && (
        <ProfileCompletionModal
          userType="jobseeker"
          initialData={profileData}
          onComplete={(updated) => {
            setProfileData(updated || profileData);
            setProfileIncomplete(false);
          }}
        />
      )}

      {showAssistant && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end lg:items-center lg:justify-center pointer-events-none"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative m-4 w-full max-w-xl rounded-2xl border border-blue-200 bg-white pointer-events-auto">
            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-pink-700">Amanda</p>
                  <p className="text-xs text-gray-500">Your FastLink guide</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssistant(false)}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4 text-sm text-gray-700">
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                {assistantMessages.map((message, index) => (
                  <div
                    key={`assistant-${message.id}-${index}`}
                    className={cn(
                      "rounded-xl px-3 py-2",
                      message.sender === "amanda"
                        ? "bg-pink-50 text-pink-900 border border-pink-100"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    )}
                  >
                    {message.text.split("\n").map((line, index) => (
                      <p key={index} className="whitespace-pre-wrap leading-relaxed">
                        {line}
                      </p>
                    ))}
                    {message.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion) => (
                          <Link
                            key={suggestion.href + suggestion.label}
                            href={suggestion.href}
                            className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-medium text-pink-600 hover:bg-pink-50"
                            onClick={() => setShowAssistant(false)}
                          >
                            <Sparkles className="h-3 w-3" />
                            {suggestion.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAssistantSubmit} className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="amanda-input" className="sr-only">
                    Ask Amanda a question
                  </label>
                  <textarea
                    id="amanda-input"
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    placeholder="Ask Amanda about anything in your dashboard..."
                    className="placeholder:text-gray-400 w-full rounded-lg border border-pink-100 bg-white px-3 py-2 text-sm shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200"
                    rows={2}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!assistantInput.trim()}
                  className="self-stretch px-4 bg-pink-600 hover:bg-pink-700"
                >
                  Send
                </Button>
              </form>

              <div className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setQuickShortcutsOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  {quickShortcutsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Quick shortcuts
                </button>
                {quickShortcutsOpen && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {assistantQuickLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 hover:border-blue-300 hover:text-blue-600"
                          onClick={() => setShowAssistant(false)}
                        >
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Messages Button - Desktop/Laptop Only */}
      {!showMessagesBox && (
        <button
          onClick={() => {
            setShowMessagesBox(true);
            // If we have a job context, open the thread
            if (messagesBoxJobId) {
              openMessageThread(messagesBoxJobId, messagesBoxBusinessName);
            }
          }}
          className="hidden lg:flex fixed bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-30 relative"
          style={{ position: 'fixed', bottom: '24px', right: '24px' }}
          aria-label="Open messages"
        >
          <MessageCircle className="h-6 w-6" />
          {Array.isArray(conversations) && conversations.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {conversations.length}
            </span>
          )}
        </button>
      )}

      {/* Messages Box Modal - Desktop/Laptop Only */}
      {showMessagesBox && (
        <div className="hidden lg:block fixed inset-0 z-40 pointer-events-none">
          <div className="fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl border border-gray-200 bg-white flex flex-col pointer-events-auto shadow-2xl"
               style={{ position: 'fixed', bottom: '24px', right: '24px', maxHeight: 'calc(100vh - 48px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-3 flex-1">
                {messagesBoxThreadId && (
                  <button
                    onClick={() => {
                      setMessagesBoxThreadId(null);
                      setMessagesBoxJobId(null);
                      setMessagesBoxBusinessName("");
                      setMessagesBoxJobTitle("");
                      setMessagesList([]);
                    }}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {messagesBoxThreadId ? `Chat with ${messagesBoxBusinessName || "Employer"}` : "Messages"}
                  </span>
                  {messagesBoxThreadId && messagesBoxJobId ? (
                    <button
                      onClick={async () => {
                        if (!messagesBoxJobId) return;
                        setJobPopupLoading(true);
                        setShowJobPopup(true);
                        try {
                          const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                          const response = await fetch(`/api/jobs/${messagesBoxJobId}`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          if (response.ok) {
                            const jobData = await response.json();
                            setJobPopupData(jobData);
                          }
                        } catch (error) {
                          console.error("Error fetching job:", error);
                        } finally {
                          setJobPopupLoading(false);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline text-left mt-0.5"
                    >
                      {messagesBoxJobTitle || "View Job Post"}
                    </button>
                  ) : messagesBoxThreadId ? (
                    <span className="text-xs text-gray-500">Say hello and let them know you're interested.</span>
                  ) : (
                    <span className="text-xs text-gray-500">Reach out to businesses running Pro listings.</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMessagesBox(false);
                  setMessagesBoxThreadId(null);
                  setMessagesBoxJobId(null);
                  setMessagesBoxBusinessName("");
                  setMessagesBoxJobTitle("");
                  setMessagesList([]);
                }}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close messages"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Content */}
            {messagesBoxThreadId ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div ref={messagesListRef} className="flex-1 overflow-y-auto px-4 py-6">
                  {messagesLoading ? (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                      <MessageCircle className="h-10 w-10 text-blue-400 animate-pulse" />
                      <p>Loading messages...</p>
                    </div>
                  ) : messagesList.length === 0 ? (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                      <MessageCircle className="h-10 w-10 text-blue-400" />
                      <p>Your conversation will appear here. Send a message to start the chat.</p>
                      <p className="text-xs text-gray-400">Businesses can only reply if the job allows enquiries.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messagesList.map((message: any, index: number) => {
                        const isSelf = message.sender === "jobseeker";
                        const isEditing = editingMessageId === message.id;
                        const canEdit = canEditMessage(message);

                        // Format date as DD/MM/YY
                        const formatDate = (timestamp: string) => {
                          const date = new Date(timestamp);
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = String(date.getFullYear()).slice(-2);
                          return `${day}/${month}/${year}`;
                        };

                        // Check if we need to show a date separator
                        const messageTimestamp = message.createdAt || message.created_at;
                        const currentDate = new Date(messageTimestamp).toDateString();
                        const previousDate = index > 0 ? new Date(messagesList[index - 1].createdAt || messagesList[index - 1].created_at).toDateString() : null;
                        const showDateSeparator = currentDate !== previousDate;

                        return (
                          <div key={`${message.id}-${index}-${message.createdAt || message.created_at}`}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <span className={`text-xs text-black ${roboto.className}`}>
                                  {formatDate(messageTimestamp)}
                                </span>
                              </div>
                            )}
                            <div
                              className={cn("flex flex-col group", isSelf ? "items-end" : "items-start")}
                            >
                              <div className="relative max-w-[85%]">
                                {isEditing ? (
                                  <div className="flex flex-col gap-2">
                                    <textarea
                                      value={editingMessageText}
                                      onChange={(e) => setEditingMessageText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                          e.preventDefault();
                                          handleEditMessage(message.id, editingMessageText);
                                        }
                                        if (e.key === "Escape") {
                                          setEditingMessageId(null);
                                          setEditingMessageText("");
                                        }
                                      }}
                                      className="w-full resize-none rounded-2xl border border-blue-500 bg-white px-4 py-2 text-sm leading-5 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleEditMessage(message.id, editingMessageText)}
                                        disabled={editingMessageSaving || !editingMessageText.trim()}
                                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(null);
                                          setEditingMessageText("");
                                        }}
                                        className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative inline-flex items-start gap-2 group/edit">
                                    <div
                                      className={cn(
                                        "rounded-2xl px-4 py-2 text-base shadow-sm",
                                        isSelf
                                          ? "bg-blue-600 text-white"
                                          : "bg-transparent text-black",
                                        roboto.className
                                      )}
                                    >
                                      <p className="leading-relaxed">{message.body}</p>
                                    </div>
                                    {canEdit && isSelf && (
                                      <button
                                        onClick={() => {
                                          setEditingMessageId(message.id);
                                          setEditingMessageText(message.body);
                                        }}
                                        className="p-1 text-gray-500 hover:text-gray-700 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0 mt-1"
                                        title="Edit message"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
    </div>
  );
                      })}
                    </div>
                  )}
                  {isOtherTyping && (
                    <div className="flex justify-start px-4 py-2">
                      <div className="flex items-center gap-1 rounded-2xl bg-gray-100 px-4 py-2">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }}></span>
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }}></span>
                          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }}></span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">typing...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = messagesText.trim();
                    if (!trimmed || !messagesBoxThreadId) return;

                    setMessagesSending(true);
                    const tempId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
                    const timestamp = new Date().toISOString();
                    
                    // Optimistically add message
                    setMessagesList((prev) => [
                      ...prev,
                      {
                        id: tempId,
                        body: trimmed,
                        sender: "jobseeker",
                        createdAt: timestamp,
                      },
                    ]);
                    setMessagesText("");

                    try {
                      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                      if (!token) {
                        throw new Error("Not authenticated");
                      }

                      const response = await fetch(`/api/jobseeker/messages/${messagesBoxThreadId}`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ body: trimmed }),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || "Failed to send message");
                      }

                      const newMessage = await response.json();
                      // Replace temp message with real one
                      setMessagesList((prev) => prev.map((msg) => 
                        msg.id === tempId 
                          ? {
                              id: newMessage.id,
                              body: newMessage.body,
                              sender: "jobseeker",
                              createdAt: newMessage.created_at,
                            }
                          : msg
                      ));
                      setIsOtherTyping(false);
                      // Refresh conversations to update last_message_at and show thread in list
                      setTimeout(() => {
                        fetchConversations();
                      }, 500);
                    } catch (error: any) {
                      console.error("Error sending message:", error);
                      // Remove optimistic message on error
                      setMessagesList((prev) => prev.filter((msg) => msg.id !== tempId));
                      alert(error.message || "Failed to send message");
                    } finally {
                      setMessagesSending(false);
                      if (messagesListRef.current) {
                        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
                      }
                    }
                  }}
                  className="border-t border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      value={messagesText}
                      onChange={(e) => {
                        setMessagesText(e.target.value);
                        // Broadcast typing status
                        if (messagesBoxThreadId && typingChannelRef.current && user?.id) {
                          typingChannelRef.current.send({
                            type: "broadcast",
                            event: "typing",
                            payload: {
                              userId: user.id,
                              threadId: messagesBoxThreadId,
                            },
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const trimmed = messagesText.trim();
                          if (trimmed && messagesBoxThreadId) {
                            const form = e.currentTarget.closest("form");
                            if (form) {
                              form.requestSubmit();
                            }
                          }
                        }
                      }}
                      placeholder=""
                      className="flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm leading-5 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      rows={2}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-700">
                    Messages are cleared automatically after the business finalises interviews for this job.
                  </p>
                </form>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {conversations.length === 0 ? (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-6 text-center px-8">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <MessageCircle className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-gray-900">No conversations yet</h2>
                        <p className="text-sm text-gray-600">
                          Look for jobs with the <span className="inline-flex items-center gap-1 font-medium text-blue-600"><Sparkles className="h-4 w-4" /> Enquire now</span> option to start a conversation with a business.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-3">
                        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                          <Link href="/jobseeker/jobs" onClick={() => setShowMessagesBox(false)}>Browse jobs</Link>
                        </Button>
                        <Link href="/jobseeker/applications" className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={() => setShowMessagesBox(false)}>
                          View my applications
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv: any) => (
                        <button
                          key={conv.id}
                          onClick={async () => {
                            setMessagesBoxThreadId(conv.id);
                            setMessagesBoxJobId(conv.jobId);
                            setMessagesBoxBusinessName(conv.business?.name || "Employer");
                            // Fetch job title
                            if (conv.jobId) {
                              try {
                                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                                const jobResponse = await fetch(`/api/jobs/${conv.jobId}`, {
                                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                                });
                                if (jobResponse.ok) {
                                  const jobData = await jobResponse.json();
                                  setMessagesBoxJobTitle(jobData.title || "");
                                }
                              } catch (error) {
                                console.error("Error fetching job title:", error);
                              }
                            }
                          }}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {conv.business?.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-gray-900 truncate">
                                {conv.business?.name || "Employer"}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">{conv.job?.title || "Job"}</p>
                              {conv.lastMessageAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(conv.lastMessageAt).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Post Popup */}
      {showJobPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 pointer-events-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Job Details</h2>
              <button
                onClick={() => {
                  setShowJobPopup(false);
                  setJobPopupData(null);
                }}
                className="rounded-full p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {jobPopupLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">Loading job details...</p>
                </div>
              ) : jobPopupData ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{jobPopupData.title}</h3>
                    {jobPopupData.business?.company_name && (
                      <p className="text-sm text-gray-600 mt-1">{jobPopupData.business.company_name}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {jobPopupData.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {jobPopupData.location}
                      </div>
                    )}
                    {jobPopupData.job_type && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {jobPopupData.job_type}
                      </div>
                    )}
                    {jobPopupData.salary && (
                      <div className="text-gray-600">{jobPopupData.salary}</div>
                    )}
                  </div>
                  {jobPopupData.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{jobPopupData.description}</p>
                    </div>
                  )}
                  {jobPopupData.requirements && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{jobPopupData.requirements}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">Failed to load job details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


