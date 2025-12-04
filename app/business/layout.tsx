"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Roboto } from "next/font/google";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Settings,
  Menu,
  X,
  Plus,
  Sparkles,
  UserRound,
  Zap,
  Megaphone,
  ArrowLeft,
  LogOut,
  CreditCard,
  MessageCircle,
  MoreVertical,
  Edit2,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ProfileCompletionModal } from "@/components/profile/profile-completion-modal";
import { AD_STORAGE_KEY, CUSTOM_ADS_EVENT, SponsoredAd, readStoredAds } from "@/lib/ads";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

type AssistantMessage = {
  id: number;
  sender: "assistant" | "user";
  text: string;
};

const defaultSponsoredAds: SponsoredAd[] = [
  {
    id: "default-biz-1",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Team collaboration advertisement",
    headline: "Promote your hiring campaigns",
    body: "Grow your hiring reach with targeted promotions.",
    href: "https://fastlink.example.com/ads/team-collaboration",
  },
  {
    id: "default-biz-2",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Business analytics promotion",
    headline: "Boost your visibility",
    body: "FastLink placements keep your brand top-of-mind with hiring managers.",
    href: "https://fastlink.example.com/ads/brand-visibility",
  },
  {
    id: "default-biz-3",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1484980859177-5ac1249fda6f?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Creative workspace advertisement",
    headline: "Reach active job seekers",
    body: "Sponsored placements connect your roles with motivated applicants.",
    href: "https://fastlink.example.com/ads/sponsored-campaigns",
  },
  {
    id: "default-biz-4",
    ownerId: null,
    format: "image-text",
    actionType: "website",
    imageUrl:
      "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=480&q=80",
    imageAlt: "Remote hiring solutions",
    headline: "Hire remote talent",
    body: "Put flexible opportunities in front of remote-ready professionals.",
    href: "https://fastlink.example.com/ads/remote-hiring",
  },
];

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adsToDisplay, setAdsToDisplay] = useState<SponsoredAd[]>([]);
  const [adsVisible, setAdsVisible] = useState(true);
  const [adsOpenInNewTab, setAdsOpenInNewTab] = useState(true);
  const [ownedAdsCount, setOwnedAdsCount] = useState(0);
  const adsPoolRef = useRef<SponsoredAd[]>(defaultSponsoredAds);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [profileData, setProfileData] = useState<any>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const lastStoredUserRef = useRef<string | null>(null);
  const [showMessagesBox, setShowMessagesBox] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [readThreads, setReadThreads] = useState<Set<string>>(new Set());
  const [lastOpenedAt, setLastOpenedAt] = useState<Date | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [messagesSending, setMessagesSending] = useState(false);
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

  const pickAds = useCallback(
    (pool?: SponsoredAd[]) => {
      const source = pool ?? adsPoolRef.current;
      if (!source.length) {
        setAdsToDisplay([]);
        return;
      }
      const shuffled = [...source].sort(() => Math.random() - 0.5);
      setAdsToDisplay(shuffled.slice(0, 2));
    },
    [setAdsToDisplay]
  );

  const updateAdsPool = useCallback(() => {
    const currentUserId = user?.id ?? null;
    let pool = defaultSponsoredAds.filter(
      (ad) => !currentUserId || ad.ownerId !== currentUserId
    );

    if (typeof window !== "undefined") {
      const storedAds = readStoredAds();
      const ownedAds = storedAds.filter(
        (ad) =>
          ad.ownerId &&
          ad.ownerId === currentUserId &&
          (ad.status === undefined || ad.status === "active")
      );
      setOwnedAdsCount((prev) =>
        prev === ownedAds.length ? prev : ownedAds.length
      );
      const filteredStored = storedAds.filter(
        (ad) =>
          ad.ownerId &&
          ad.ownerId !== currentUserId &&
          (ad.status === undefined || ad.status === "active")
      );
      if (filteredStored.length) {
        pool = [...filteredStored, ...pool];
      }
    } else {
      setOwnedAdsCount((prev) => (prev === 0 ? prev : 0));
    }

    if (!pool.length) {
      pool = defaultSponsoredAds;
    }

    adsPoolRef.current = pool;
    return pool;
  }, [user?.id]);

  // Ensure pathname is available
  const currentPath = pathname || "";

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    let rotationTimeout: ReturnType<typeof setTimeout> | undefined;
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    const scheduleRotation = () => {
      if (!isMounted) return; // Prevent scheduling if unmounted
      const delay = 60000 + Math.random() * 60000; // 1-2 minutes
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

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          lastStoredUserRef.current = storedUser;
          setUser(userData);
          if (userData.userType !== "business") {
            router.push("/login");
            return;
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      router.push("/login");
    }

    return () => {
      isMounted = false; // Set flag to prevent further scheduling
      window.removeEventListener("resize", handleResize);
      if (rotationTimeout) {
        clearTimeout(rotationTimeout);
      }
      if (fadeTimeout) {
        clearTimeout(fadeTimeout);
      }
    };
  }, [router, pickAds, updateAdsPool]);

  useEffect(() => {
    if (!mounted) return;
    const pool = updateAdsPool();
    pickAds(pool);
  }, [mounted, updateAdsPool, pickAds]);

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

  const computeMissingFields = useCallback((data: Record<string, any> | null) => {
    if (!data) return [];
    const required = ["company_name", "name", "phone_number", "address", "city"];
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
    if (!user || user.userType !== "business") return;
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
        const text = await response.text();
        throw new Error(`Failed to load profile: ${response.status} ${response.statusText} ${text}`);
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
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        if (stored !== lastStoredUserRef.current) {
          lastStoredUserRef.current = stored;
          setUser(JSON.parse(stored));
        }
      } else if (lastStoredUserRef.current !== null) {
        lastStoredUserRef.current = null;
        setUser(null);
      }
    } catch (error) {
      console.error("Error refreshing user info:", error);
    }
  }, [fetchProfile]);

  // Fetch conversations when messages box is opened
  const fetchConversations = useCallback(async () => {
    if (!user || user.userType !== "business") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/business/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch conversations: ${res.status}`);
      }
      const data = await res.json();
      // Ensure data is always an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setConversations([]);
    }
  }, [user]);

  // Calculate unread conversations (those with new messages since last opened)
  const unreadConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    
    return conversations.filter((conv: any) => {
      // FastLink Support is always considered read
      if (conv.job?.title === "FastLink Support" || conv.jobSeeker?.name === "FastLink Support") {
        return false;
      }
      
      // Check if thread has been marked as read
      if (readThreads.has(conv.id)) {
        return false;
      }
      
      // If lastOpenedAt is set, check if there are new messages since then
      if (lastOpenedAt && conv.lastMessageAt) {
        const lastMessageDate = new Date(conv.lastMessageAt);
        return lastMessageDate > lastOpenedAt;
      }
      
      // If lastOpenedAt is not set, consider conversations with messages as unread
      // This handles the case when the user hasn't opened messages yet
      if (!lastOpenedAt && conv.lastMessageAt) {
        return true;
      }
      
      return false;
    });
  }, [conversations, lastOpenedAt, readThreads]);

  // Fetch conversations on mount and set up real-time subscription (even when messages box is closed)
  useEffect(() => {
    if (user?.userType !== "business" || !user?.userId) return;

    // Initial fetch
    fetchConversations();

    // Set up real-time subscription for conversations (works even when messages box is closed)
    const conversationsChannel = supabase
      .channel(`business-conversations-${user.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_post_threads",
          filter: `business_id=eq.${user.userId}`,
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
        async (payload) => {
          console.log("New message detected:", payload);
          // Refresh conversations when new message is added (to update last_message_at)
          // Check if this message is in a thread belonging to this business
          if (payload.new?.thread_id) {
            const threadId = payload.new.thread_id;
            // Verify the thread belongs to this business
            const { data: thread } = await supabase
              .from("job_post_threads")
              .select("business_id")
              .eq("id", threadId)
              .eq("business_id", user.userId)
              .single();
            
            if (thread) {
              // This message is for a thread belonging to this business
              fetchConversations();
              // If a new message arrives for a thread that's not currently selected, mark it as unread
              if (selectedThread?.id !== threadId) {
                // Remove from readThreads so it shows as unread
                setReadThreads(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(threadId);
                  return newSet;
                });
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    // Also set up periodic refresh when messages box is closed (every 30 seconds)
    const intervalId = setInterval(() => {
      if (!showMessagesBox) {
        fetchConversations();
      }
    }, 30000);

    return () => {
      conversationsChannel.unsubscribe();
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.userType, selectedThread?.id, showMessagesBox]);

  // Fetch messages when a thread is selected
  const fetchMessages = useCallback(async () => {
    if (!selectedThread) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/business/messages/${selectedThread.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch messages: ${res.status}`);
      }
      const data = await res.json();
      // Ensure data is always an array
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => {
        if (messagesListRef.current) {
          messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (!selectedThread) {
      setIsOtherTyping(false);
      setMessages([]); // Clear messages when no thread
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
      .channel(`business-messages-${selectedThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_post_messages",
          filter: `thread_id=eq.${selectedThread.id}`,
        },
        (payload) => {
          // Add new message to the list
          const newMessage = payload.new;
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((msg: any) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
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
      .channel(`typing:${selectedThread.id}`)
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          // Only show typing indicator if it's from the other person (job seeker)
          const otherUserId = selectedThread.jobSeeker?.id;
          if (payload.payload.userId !== user?.id && payload.payload.userId === otherUserId) {
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
  }, [selectedThread?.id, user?.id]);

  // Auto-scroll messages
  useEffect(() => {
    if (!messagesListRef.current || messages.length === 0) return;
    
    // Throttle scroll operations to reduce CPU usage
    const rafId = requestAnimationFrame(() => {
      if (messagesListRef.current) {
        messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
      }
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [messages.length]); // Only depend on length, not the entire array

  useEffect(() => {
    const handler = () => {
      fetchProfile();
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          if (stored !== lastStoredUserRef.current) {
            lastStoredUserRef.current = stored;
            setUser(JSON.parse(stored));
          }
        } else if (lastStoredUserRef.current !== null) {
          lastStoredUserRef.current = null;
          setUser(null);
        }
      } catch (error) {
        console.error("Error refreshing user info:", error);
      }
    };
    window.addEventListener("user-updated", handler);
    return () => window.removeEventListener("user-updated", handler);
  }, [fetchProfile]);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedThread || !messageText.trim()) return;

    setMessagesSending(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/business/messages/${selectedThread.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: messageText }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        setIsOtherTyping(false);
        // Refresh conversations to update last_message_at
        await fetchConversations();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setMessagesSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newBody: string) => {
    if (!selectedThread || !newBody.trim()) return;

    setEditingMessageSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/business/messages/${selectedThread.id}/${messageId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: newBody }),
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages((prev) =>
          prev.map((msg: any) => (msg.id === messageId ? updatedMessage : msg))
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
    if (message.sender_type !== "business") return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    return now - messageTime <= twoMinutes;
  };

  const menuItems = [
    {
      title: "Dashboard",
      href: "/business/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Post New Job",
      href: "/business/jobs/new",
      icon: Plus,
      exact: true,
    },
    {
      title: "My Jobs",
      href: "/business/jobs",
      icon: Briefcase,
      exact: false,
    },
    {
      title: "Applications",
      href: "/business/applications",
      icon: FileText,
      exact: false,
    },
    {
      title: "Candidates",
      href: "/business/candidates",
      icon: Users,
      exact: true,
    },
    {
      title: "Advertise",
      href: "/business/advertise",
      icon: Megaphone,
      exact: true,
    },
    {
      title: "Accounts",
      href: "/business/account",
      icon: CreditCard,
      exact: true,
    },
    {
      title: "Profile",
      href: "/business/profile",
      icon: UserRound,
      exact: true,
    },
    {
      title: "Settings",
      href: "/business/settings",
      icon: Settings,
      exact: true,
    },
  ];

  const handleAssistantSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const id = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    setAssistantMessages((prev) => [
      ...prev,
      { id, sender: "user", text: trimmed },
      {
        id: id + 1,
        sender: "assistant",
        text:
          "Thanks for reaching out. Amanda will help businesses soon. For now, contact support@fastlink.com for assistance.",
      },
    ]);
    setAssistantInput("");
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800 transition-all duration-300 ease-in-out shadow-2xl",
          sidebarOpen ? "w-64" : "w-0 lg:w-16",
          "fixed lg:sticky top-0 h-screen z-40 overflow-hidden border-r border-blue-800/60"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-blue-700/50">
            {sidebarOpen && user && (
              <div className="flex w-full flex-col items-center gap-3 pr-0">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-700/60 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/50">
                    {user?.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user?.company_name || user?.name || "Profile"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-white font-semibold">
                        {user?.company_name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || "B"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-center">
                    <p className="text-sm font-medium text-blue-50 truncate">
                      {user?.company_name || user?.name || "Business"}
                    </p>
                    <p className="text-xs text-blue-200 truncate">
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
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="hidden lg:flex text-blue-100"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <ArrowLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-blue-100"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              let isActive = false;

              if (item.exact) {
                isActive = currentPath === item.href;
              } else {
                isActive = currentPath === item.href || (currentPath.startsWith(item.href + "/") && currentPath !== item.href + "/new");
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "text-blue-100"
                  )}
                  onClick={(e) => {
                    // Ensure link works
                    e.stopPropagation();
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", !sidebarOpen && "mx-auto")} />
                  {sidebarOpen && <span className="whitespace-nowrap">{item.title}</span>}
                </Link>
              );
            })}
          </nav>

                {/* Logout */}
                <div className="p-4 border-t border-blue-700/50 space-y-3">
                <button
                  onClick={() => {
                    setShowAssistant(true);
                    setAssistantMessages([
                      {
                        id: Date.now(),
                        sender: "assistant",
                        text:
                          "Hi! I'm Amanda. I'm learning to assist business users. How can I guide you today?",
                      },
                    ]);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-medium text-pink-700 hover:bg-pink-100 transition",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  {sidebarOpen && <span>Amanda · AI Assistant</span>}
                </button>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center text-blue-100 hover:text-red-400 transition-colors cursor-pointer",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <LogOut className={cn("h-5 w-5", !sidebarOpen ? "" : "mr-3")} />
                  {sidebarOpen && <span>Logout</span>}
                </button>
                </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 bg-gray-100 text-slate-900">
        <div className="flex min-h-screen">
          <div className={cn(
            "flex-1 overflow-y-auto pb-16 px-4 sm:px-6 lg:px-10",
            currentPath === "/business/account" && "lg:pr-6"
          )}>
            <div className="min-h-full">
              {children}
            </div>
          </div>
          {!currentPath.startsWith("/business/account") &&
            !currentPath.startsWith("/business/advertise") &&
            !currentPath.startsWith("/business/jobs/new") && (
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
                {adsToDisplay.length === 2 && (
                  <Link
                    href="/business/advertise"
                    className="block rounded-xl border border-dashed border-gray-300 bg-white py-5 px-4 text-center text-sm font-medium text-blue-600 hover:border-blue-400 hover:text-blue-700 transition"
                  >
                    {ownedAdsCount > 0
                      ? `${ownedAdsCount} active ad${ownedAdsCount === 1 ? "" : "s"} running`
                      : "Advertise your business here"}
                  </Link>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
    {user?.userType === "business" && profileData && profileIncomplete && (
      <ProfileCompletionModal
        userType="business"
        initialData={profileData}
        onComplete={(updated) => {
          setProfileData(updated || profileData);
          setProfileIncomplete(false);
        }}
      />
    )}
    {showAssistant && (
      <div
        className="fixed inset-0 z-50 flex items-end justify-end lg:items-center lg:justify-center"
        aria-modal="true"
        role="dialog"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAssistant(false)}
        />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Amanda</p>
              <p className="text-xs text-gray-500">Your FastLink business assistant</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowAssistant(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-3 px-4 py-3">
            {assistantMessages.map((msg, index) => (
              <div key={`assistant-${msg.id}-${index}`} className={cn("rounded-lg px-3 py-2 text-sm", msg.sender === "assistant" ? "bg-blue-50 text-gray-800" : "bg-gray-200 text-gray-900 ml-auto w-fit")}>{msg.text}</div>
            ))}
            {assistantMessages.length === 0 && (
              <p className="text-sm text-gray-500">Ask Amanda anything about managing jobs, applications, or analytics.</p>
            )}
          </div>
          <form onSubmit={handleAssistantSubmit} className="border-t border-gray-200 px-4 py-3 flex items-center gap-2">
            <Input
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="Ask Amanda about anything"
            />
            <Button type="submit" disabled={!assistantInput.trim()}>
              Send
            </Button>
          </form>
        </div>
      </div>
    )}

      {/* Floating Messages Button - Desktop/Laptop Only */}
      {!showMessagesBox && (
        <button
          onClick={async () => {
            const now = new Date();
            setShowMessagesBox(true);
            setLastOpenedAt(now);
            // Fetch conversations first to get the latest state
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const res = await fetch("/api/business/messages/conversations", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const data = await res.json();
                  const updatedConversations = Array.isArray(data) ? data : [];
                  setConversations(updatedConversations);
                  // Mark all conversations as read when opening messages box
                  setReadThreads(prev => {
                    const newSet = new Set(prev);
                    updatedConversations.forEach((conv: any) => {
                      if (conv.id && conv.job?.title !== "FastLink Support" && conv.jobSeeker?.name !== "FastLink Support") {
                        newSet.add(conv.id);
                      }
                    });
                    return newSet;
                  });
                }
              } catch (err) {
                console.error("Error fetching conversations:", err);
              }
            }
          }}
          className="hidden lg:flex fixed bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all hover:scale-110 z-30 relative"
          style={{ position: 'fixed', bottom: '24px', right: '24px' }}
          aria-label="Open messages"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadConversations.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadConversations.length}
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
            <div className="flex items-center justify-between bg-blue-600 px-5 py-4">
              <div className="flex items-center gap-3 flex-1">
                {selectedThread && (
                  <button
                    onClick={() => {
                      setSelectedThread(null);
                      setMessages([]);
                    }}
                    className="rounded-full p-1 text-white hover:text-gray-200"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="flex flex-col flex-1">
                  <span className="text-lg font-semibold text-white">
                    {selectedThread?.isAdminThread 
                      ? "FastLink Support" 
                      : selectedThread 
                        ? `Chat with ${selectedThread.jobSeeker?.name || "Job Seeker"}` 
                        : "Messenger"}
                  </span>
                  {selectedThread && !selectedThread.isAdminThread ? (
                    <button
                      onClick={async () => {
                        if (!selectedThread.job?.id) return;
                        setJobPopupLoading(true);
                        setShowJobPopup(true);
                        try {
                          const token = localStorage.getItem("token");
                          const response = await fetch(`/api/jobs/${selectedThread.job.id}`, {
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
                      className="text-xs text-white/90 hover:text-white hover:underline text-left mt-0.5"
                    >
                      {selectedThread.job?.title || "Job"}
                    </button>
                  ) : selectedThread?.isAdminThread ? (
                    <span className="text-xs text-white/80">Get help from our support team</span>
                  ) : (
                    <span className="text-xs text-white/80">Enquiries from job seekers</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMessagesBox(false);
                  setSelectedThread(null);
                  setMessages([]);
                  // Update lastOpenedAt when closing to track new messages
                  setLastOpenedAt(new Date());
                }}
                className="rounded-full p-1 text-white hover:text-gray-200"
                aria-label="Close messages"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            {selectedThread ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div ref={messagesListRef} className="flex-1 overflow-y-auto px-4 py-6">
                  {!Array.isArray(messages) || messages.length === 0 ? (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                      <MessageCircle className="h-10 w-10 text-blue-400" />
                      <p>Your conversation will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message: any, index: number) => {
                        const isBusiness = message.sender_type === "business";
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
                        const currentDate = new Date(message.created_at).toDateString();
                        const previousDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
                        const showDateSeparator = currentDate !== previousDate;

                        return (
                          <div key={`${message.id}-${index}-${message.created_at}`}>
                            {showDateSeparator && (
                              <div className="flex justify-center my-4">
                                <span className={`text-xs text-black ${roboto.className}`}>
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                            )}
                            <div
                              className={cn("flex flex-col group", isBusiness ? "items-end" : "items-start")}
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
                                        isBusiness
                                          ? "bg-blue-600 text-white"
                                          : "bg-transparent text-black",
                                        roboto.className
                                      )}
                                    >
                                      <p className="leading-relaxed">{message.body}</p>
                                    </div>
                                    {canEdit && isBusiness && (
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

                <form onSubmit={handleSendMessage} className="border-t border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        // Broadcast typing status
                        if (selectedThread && typingChannelRef.current && user?.id) {
                          typingChannelRef.current.send({
                            type: "broadcast",
                            event: "typing",
                            payload: {
                              userId: user.id,
                              threadId: selectedThread.id,
                            },
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder=""
                      className="flex-1 resize-none rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm leading-5 text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      rows={2}
                    />
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {/* FastLink Support - Always at top for businesses (hide if already selected) */}
                  {!selectedThread?.isAdminThread && (
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        if (!token) return;

                        // First check if admin thread already exists in conversations
                        const existingAdminThread = Array.isArray(conversations) 
                          ? conversations.find((conv: any) => 
                              conv.job?.title === "FastLink Support" || 
                              conv.jobSeeker?.name === "FastLink Support"
                            )
                          : null;

                        if (existingAdminThread) {
                          // Use existing thread
                          setSelectedThread({
                            id: existingAdminThread.id,
                            job: existingAdminThread.job || { id: existingAdminThread.jobId, title: "FastLink Support" },
                            jobSeeker: existingAdminThread.jobSeeker || { id: null, name: "FastLink Support" },
                            isAdminThread: true,
                          });
                          // Fetch messages for existing thread
                          setTimeout(() => {
                            fetch(`/api/business/messages/${existingAdminThread.id}`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                              .then((res) => res.json())
                              .then((data) => {
                                setMessages(Array.isArray(data) ? data : []);
                              })
                              .catch((err) => {
                                console.error("Error fetching admin messages:", err);
                                setMessages([]);
                              });
                          }, 100);
                          return;
                        }

                        // If no existing thread, create or get one
                        const response = await fetch("/api/business/messages/admin-thread", {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                        });

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || "Failed to open support thread");
                        }

                        const thread = await response.json();
                        // Set up the thread as selected
                        const adminThread = {
                          id: thread.id,
                          job: { id: thread.jobId, title: "FastLink Support" },
                          jobSeeker: { id: null, name: "FastLink Support" },
                          isAdminThread: true,
                        };
                        setSelectedThread(adminThread);
                        // Refresh conversations to include admin thread
                        await fetchConversations();
                        // Fetch messages for this thread after a short delay
                        setTimeout(() => {
                          fetch(`/api/business/messages/${thread.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then((res) => res.json())
                            .then((data) => {
                              setMessages(Array.isArray(data) ? data : []);
                            })
                            .catch((err) => {
                              console.error("Error fetching admin messages:", err);
                              setMessages([]);
                            });
                        }, 100);
                      } catch (error: any) {
                        console.error("Error opening support thread:", error);
                        alert(error.message || "Failed to open support thread");
                      }
                    }}
                    className="mb-3 flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100"
                  >
                    <Zap className="h-5 w-5 text-amber-500" />
                    <span className="font-bold text-gray-900">FastLink Support</span>
                  </button>
                  )}
                  
                  {!Array.isArray(conversations) || conversations.length === 0 ? (
                    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                      <MessageCircle className="h-10 w-10 text-blue-400" />
                      <p>No conversations yet</p>
                      <p className="text-xs text-gray-400">Job seekers can message you on Pro job posts</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations
                        .filter((conv: any, index: number, self: any[]) => {
                          // Filter out duplicate admin threads
                          const isAdminThread = conv.job?.title === "FastLink Support" || conv.jobSeeker?.name === "FastLink Support";
                          if (isAdminThread) {
                            // Keep only the first admin thread
                            return index === self.findIndex((c: any) => 
                              (c.job?.title === "FastLink Support" || c.jobSeeker?.name === "FastLink Support")
                            );
                          }
                          return true;
                        })
                        .sort((a: any, b: any) => {
                          // FastLink Support always first
                          const aIsSupport = a.job?.title === "FastLink Support" || a.jobSeeker?.name === "FastLink Support";
                          const bIsSupport = b.job?.title === "FastLink Support" || b.jobSeeker?.name === "FastLink Support";
                          
                          if (aIsSupport && !bIsSupport) return -1;
                          if (!aIsSupport && bIsSupport) return 1;
                          
                          // Then sort by last_message_at descending (newest first)
                          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                          return bTime - aTime;
                        })
                        .map((conv: any) => {
                          const isAdminThread = conv.job?.title === "FastLink Support" || conv.jobSeeker?.name === "FastLink Support";
                          // A conversation is unread if:
                          // 1. It's not an admin thread
                          // 2. It hasn't been marked as read
                          // 3. It has a last message, and either:
                          //    - lastOpenedAt is not set (first time opening), OR
                          //    - the last message is newer than when we last opened
                          const isUnread = !isAdminThread && !readThreads.has(conv.id) && 
                            conv.lastMessageAt && (
                              !lastOpenedAt || 
                              new Date(conv.lastMessageAt) > lastOpenedAt
                            );
                          
                          return (
                            <button
                              key={conv.id}
                              onClick={() => {
                                const threadData = {
                                  ...conv,
                                  isAdminThread,
                                };
                                setSelectedThread(threadData);
                                // Mark as read when clicked
                                if (!isAdminThread) {
                                  setReadThreads(prev => new Set(prev).add(conv.id));
                                }
                              }}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-blue-300 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  {isAdminThread ? (
                                    <Zap className="h-5 w-5 text-amber-500" />
                                  ) : (
                                    <span className="text-blue-600 font-semibold text-sm">
                                      {conv.jobSeeker?.name?.charAt(0)?.toUpperCase() || "?"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>
                                    {isAdminThread
                                      ? "FastLink Support"
                                      : conv.jobSeeker?.name || "Job Seeker"}
                                  </h4>
                                  <p className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-700' : 'text-gray-600'}`}>
                                    {isAdminThread 
                                      ? "Get help from our support team"
                                      : conv.job?.title || "Job"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
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
    </>
  );
}

