"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, FileText } from "lucide-react";

export default function JobSeekerAssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const result = await fetch("/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (result.ok) {
        const data = await result.json();
        setResponse(data.output || "Here is a draft you can refine.");
      } else {
        setResponse("Unable to generate content right now. Please try again later.");
      }
    } catch (error) {
      console.error("AI assistant error:", error);
      setResponse("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600">Get help drafting cover letters, application answers, and more.</p>
      </div>

      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Smart Drafting
          </CardTitle>
          <CardDescription>Describe what you need help with and the assistant will generate a draft.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Write a short cover letter for a customer support role emphasizing my communication skills."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-[140px]"
          />

          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Include details about the role and your experience.</li>
              <li>Ask for bullet points, an email, or a summary depending on what you need.</li>
              <li>Review and personalize the draft before submitting.</li>
            </ul>
          </div>

          {response && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Generated Draft
              </h2>
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{response}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/jobseeker/applications">View my applications</Link>
          </Button>
          <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
            {loading ? "Generating…" : "Generate Draft"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}











