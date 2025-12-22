import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileQuestion className="h-6 w-6 text-gray-500" />
            <CardTitle>Page not found</CardTitle>
          </div>
          <CardDescription>
            The admin page you're looking for doesn't exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin">
            <Button className="w-full">Go to Admin Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

