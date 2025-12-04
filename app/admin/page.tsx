"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";
import { gsap } from "gsap";
import StaggerChildren from "@/components/animations/StaggerChildren";

export default function AdminDashboard() {
  // Fetch stats from API
  // For now, showing placeholder data
  
  const stats = [
    {
      title: "Total Users",
      value: "0",
      description: "Job seekers and businesses",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Jobs",
      value: "0",
      description: "Currently posted",
      icon: Briefcase,
      color: "text-green-600",
    },
    {
      title: "Applications",
      value: "0",
      description: "Total submitted",
      icon: FileText,
      color: "text-purple-600",
    },
    {
      title: "Growth Rate",
      value: "0%",
      description: "This month",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 ref={titleRef} className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Welcome to FastLink Admin Panel</p>
      </div>

      <StaggerChildren childSelector=".stat-card" delay={0.2} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="stat-card hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </StaggerChildren>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest user sign-ups</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent registrations</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>Recent platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">No recent activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

