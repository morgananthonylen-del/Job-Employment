import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
        <p className="text-gray-600 mt-2">View and manage all job postings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>Platform-wide job listings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No jobs found</p>
        </CardContent>
      </Card>
    </div>
  );
}










