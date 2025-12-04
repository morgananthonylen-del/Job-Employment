"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LocalMessage = {
  id: string;
  body: string;
  sender: "jobseeker" | "business";
  createdAt: string;
};

export default function JobSeekerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const threadId = searchParams.get("threadId");
  const businessName = searchParams.get("businessName") ?? "Employer";
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(threadId);
  const listRef = useRef<HTMLDivElement | null>(null);

  const conversationActive = Boolean(jobId && currentThreadId);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch messages when threadId is available
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentThreadId) return;

      setLoadingMessages(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const response = await fetch(`/api/jobseeker/messages/${currentThreadId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = await response.json();
        const formattedMessages: LocalMessage[] = (data || []).map((msg: any) => ({
          id: msg.id,
          body: msg.body,
          sender: msg.sender_type === "jobseeker" ? "jobseeker" : "business",
          createdAt: msg.created_at,
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [currentThreadId]);

  // Create thread if jobId is provided but no threadId
  useEffect(() => {
    const createThread = async () => {
      if (!jobId || currentThreadId) return;

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const response = await fetch("/api/jobseeker/messages/threads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId }),
        });

        if (!response.ok) {
          throw new Error("Failed to create thread");
        }

        const thread = await response.json();
        setCurrentThreadId(thread.id);
        // Update URL with threadId
        router.replace(`/jobseeker/messages?jobId=${jobId}&threadId=${thread.id}&businessName=${encodeURIComponent(businessName)}`);
      } catch (error) {
        console.error("Error creating thread:", error);
      }
    };

    createThread();
  }, [jobId, currentThreadId, businessName, router]);

  const conversationLabel = useMemo(() => {
    if (!conversationActive) return "Messages";
    return businessName ? `Chat with ${businessName}` : "New enquiry";
  }, [conversationActive, businessName]);

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed || !currentThreadId) return;

    setSending(true);
    const tempId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timestamp = new Date().toISOString();
    
    // Optimistically add message
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        body: trimmed,
        sender: "jobseeker",
        createdAt: timestamp,
      },
    ]);
    setMessageText("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`/api/jobseeker/messages/${currentThreadId}`, {
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
      setMessages((prev) => prev.map((msg) => 
        msg.id === tempId 
          ? {
              id: newMessage.id,
              body: newMessage.body,
              sender: "jobseeker",
              createdAt: newMessage.created_at,
            }
          : msg
      ));
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{conversationLabel}</span>
          {conversationActive ? (
            <span className="text-xs text-gray-500">Say hello and let them know you’re interested.</span>
          ) : (
            <span className="text-xs text-gray-500">Reach out to businesses running Pro listings.</span>
          )}
        </div>
      </header>

      {conversationActive ? (
        <div
          className="flex flex-1 flex-col overflow-hidden"
          style={{ minHeight: "calc(100vh - 16rem)" }}
        >
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            {loadingMessages ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                <MessageCircle className="h-10 w-10 text-blue-400 animate-pulse" />
                <p>Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                <MessageCircle className="h-10 w-10 text-blue-400" />
                <p>Your conversation will appear here. Send a message to start the chat.</p>
                <p className="text-xs text-gray-400">Businesses can only reply if the job allows enquiries.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isSelf = message.sender === "jobseeker";
                  const displayTime = new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isSelf ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          isSelf
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        <p className="leading-relaxed">{message.body}</p>
                        <span className="mt-1 block text-[11px] opacity-70">{displayTime}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-200 bg-white px-4 py-3">
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Introduce yourself and share why you're a great fit..."
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
        <div
          className="flex flex-1 w-full flex-col items-center justify-center gap-6 text-center bg-white"
          style={{ minHeight: "calc(100vh - 16rem)" }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <MessageCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2 px-8">
            <h2 className="text-lg font-semibold text-gray-900">No conversations yet</h2>
            <p className="text-sm text-gray-600">
              Look for jobs with the <span className="inline-flex items-center gap-1 font-medium text-blue-600"><Sparkles className="h-4 w-4" /> Enquire now</span> option to start a conversation with a business.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 px-4">
            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
              <Link href="/jobseeker/jobs">Browse jobs</Link>
            </Button>
            <Link href="/jobseeker/applications" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View my applications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
