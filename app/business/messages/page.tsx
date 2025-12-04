"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BusinessMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("threadId");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchConversations(token);
  }, [router]);

  useEffect(() => {
    if (threadId) {
      const thread = conversations.find((c: any) => c.id === threadId);
      if (thread) {
        setSelectedThread(thread);
        fetchMessages(threadId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]); // Only depend on threadId to avoid infinite loop

  const fetchConversations = async (token: string) => {
    try {
      const response = await fetch("/api/business/messages/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/business/messages/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !messageText.trim()) return;

    setSending(true);
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
        // Refresh conversations to update last_message_at
        fetchConversations(token);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Communicate with job seekers</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <Card className="lg:col-span-1 bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Job seeker enquiries</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-600 py-8">Loading...</p>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                  <p className="text-xs text-gray-500 mt-1">Job seekers can message you on Pro job posts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedThread(conv);
                        fetchMessages(conv.id);
                        router.push(`/business/messages?threadId=${conv.id}`, { scroll: false });
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedThread?.id === conv.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {conv.jobSeeker?.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {conv.jobSeeker?.name || "Job Seeker"}
                          </h4>
                          <p className="text-xs text-gray-600 truncate">
                            {conv.job?.title || "Job"}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {conv.unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages View */}
          <Card className="lg:col-span-2 bg-white border-gray-200 shadow-md">
            {selectedThread ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {selectedThread.jobSeeker?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedThread.jobSeeker?.name || "Job Seeker"}</CardTitle>
                      <CardDescription>{selectedThread.job?.title || "Job"}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-gray-500">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg: any) => {
                        const isBusiness = msg.sender_type === "business";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isBusiness ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                isBusiness
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{msg.body}</p>
                              <p className={`text-xs mt-1 ${isBusiness ? "text-blue-100" : "text-gray-500"}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="border-t p-4">
                    <div className="flex gap-2">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        rows={2}
                      />
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex h-[500px] items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a conversation to view messages</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}




