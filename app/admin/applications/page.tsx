import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
        <p className="text-gray-600 mt-2">View and manage all job applications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>Platform-wide applications</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No applications found</p>
        </CardContent>
      </Card>
    </div>
  );
}










