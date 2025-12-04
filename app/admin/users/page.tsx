import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, UserCheck } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function AdminUsersPage() {
  // This will fetch users from API
  const users: any[] = []; // Placeholder

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all platform users</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                View and manage job seekers and businesses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Registered</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-100">
                      <td className="p-4">{user.name || user.companyName}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            user.userType === "jobseeker"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {user.userType}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={user.isBanned ? "destructive" : "default"}
                        >
                          {user.isBanned ? "Banned" : "Active"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {formatRelativeTime(user.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {user.isBanned ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Ban
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

