import type { Metadata } from "next";
import { Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { NetworkStatusToast } from "@/components/network-status-toast";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  title: "FastLink - Job Employment Platform",
  description: "Connect businesses with job seekers",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >
      <body className={`${sourceSans.className} overflow-x-hidden`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Footer />
          <NetworkStatusToast />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}