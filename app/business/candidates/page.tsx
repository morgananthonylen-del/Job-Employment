"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CandidatesPage() {
  return (
    <div className="min-h-screen bg-gray-100 w-full">
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>Manage your candidate pool</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">This feature is coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

