"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { gsap } from "gsap";
import { Shield } from "lucide-react";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-montserrat",
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Local login without auth - just store email
      if (!formData.email) {
        throw new Error("Email is required");
      }

      // Store email locally
      localStorage.setItem("admin_email", formData.email);
      localStorage.setItem("admin_logged_in", "true");

      toast({
        title: "Success!",
        description: "Welcome to Admin Panel",
      });

      router.push("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 p-4">
      <Card ref={cardRef} className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className={`text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ${montserrat.className}`}>
            FastLink Admin
          </CardTitle>
          <CardDescription>Sign in to admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@fastlink.com"
              />
            </div>


            <Button 
              type="submit" 
              className="w-full hover:scale-105 transition-transform" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

