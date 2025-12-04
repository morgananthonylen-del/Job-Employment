import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check authentication - this will be implemented with proper auth
  // For now, we'll allow access but protect individual routes
  
  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

