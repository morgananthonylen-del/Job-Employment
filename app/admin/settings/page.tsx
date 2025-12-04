import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bot } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage platform settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Features
          </CardTitle>
          <CardDescription>
            Control AI-powered features for job seekers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ai-enabled">Enable AI Application Assistant</Label>
              <p className="text-sm text-gray-500">
                Allow job seekers to use AI for writing applications
              </p>
            </div>
            <Switch id="ai-enabled" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>General platform settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <p className="text-sm text-gray-600 mt-1">FastLink</p>
          </div>
          <div>
            <Label>Version</Label>
            <p className="text-sm text-gray-600 mt-1">1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










