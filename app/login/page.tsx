"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";

const SHARE_TEMPLATES = [
  "FastLink just helped me find fresh job leads. Explore it: __URL__",
  "Just finished job hunting on FastLink—worth checking out: __URL__",
  "Trying FastLink for new roles. Thought you might like it too: __URL__",
  "FastLink made my job search easier today. Have a look: __URL__",
  "Found great openings on FastLink. Sharing the love: __URL__",
];

function ShareMode() {
  const [shareUrl, setShareUrl] = useState("https://fastlink.example.com");
  const [shareMessage, setShareMessage] = useState("I just used FastLink to explore new job opportunities.");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin || "https://fastlink.example.com";
      setShareUrl(origin);
      const template = SHARE_TEMPLATES[Math.floor(Math.random() * SHARE_TEMPLATES.length)];
      setShareMessage(template.replace("__URL__", origin));
    }
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
    } catch (error) {
      setCopied(false);
    }
  };

  const disableSocial = !copied;

  return (
    <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center gap-6 p-5">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-lg px-6 py-6 flex flex-col gap-5">
        <div className="space-y-2.5">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Share{" "}
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500 text-xl font-semibold drop-shadow-[0_6px_12px_rgba(251,191,36,0.35)]">
                ⚡
              </span>
              <span>FastLink</span>
            </span>
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Help others discover FastLink by sharing the message below on your social platforms.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-base text-gray-800 leading-relaxed shadow-inner">
          {shareMessage}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
          <Button
            variant={copied ? "default" : "outline"}
            onClick={handleCopy}
            className="inline-flex items-center gap-2.5 text-sm h-11"
          >
            <Copy className="h-5 w-5" />
            {copied ? "Copied!" : "Copy message"}
          </Button>
          <span className="text-xs text-gray-500 md:text-right">
            Copy the message first, then share it on your socials.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-gray-500">
          <span className="text-xs uppercase tracking-wide">Share after copying:</span>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-base transition ${disableSocial ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
            aria-label="Share on Facebook"
            aria-disabled={disableSocial}
            onClick={(event) => {
              if (disableSocial) event.preventDefault();
            }}
          >
            F
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white text-xs transition ${disableSocial ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}`}
            aria-label="Share on Instagram"
            aria-disabled={disableSocial}
            onClick={(event) => {
              if (disableSocial) event.preventDefault();
            }}
          >
            IG
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white text-base transition ${disableSocial ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-800"}`}
            aria-label="Share on X"
            aria-disabled={disableSocial}
            onClick={(event) => {
              if (disableSocial) event.preventDefault();
            }}
          >
            X
          </a>
        </div>
      </div>

      <p className="text-sm text-white text-center">
        Ready to log in again?{" "}
        <Link href="/login/jobseeker" className="text-white hover:underline font-medium">
          login
        </Link>
      </p>

      <Link href="/" className="flex items-center gap-1.5 text-white text-sm">
        <ArrowLeft className="h-4 w-4 text-white" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shareMode = searchParams?.get("share") === "1" || searchParams?.get("share") === "true";

  useEffect(() => {
    if (!shareMode) {
      // Redirect to jobseeker login by default if not share mode
      router.replace("/login/jobseeker");
    }
  }, [router, shareMode]);

  if (shareMode) {
    return <ShareMode />;
  }

  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
