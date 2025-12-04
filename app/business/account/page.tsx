"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const cardIcons = [
  {
    label: "Visa",
    src: "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png",
  },
  {
    label: "Mastercard",
    src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
  },
  {
    label: "American Express",
    src: "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg",
  },
  {
    label: "Discover",
    src: "https://upload.wikimedia.org/wikipedia/commons/5/50/Discover_Card_logo.svg",
  },
];

export default function BusinessAccountPage() {
  const [amount, setAmount] = useState("200");

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account & Billing</h1>
              <p className="text-gray-600 mt-1">
                Deposit funds to promote your business, sponsor ads, and boost visibility on FastLink.
              </p>
            </div>
            <Link
              href="/business/advertise"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
            >
              Go to Advertise
            </Link>
          </div>
          <div className="flex gap-3">
            {cardIcons.map((card) => (
              <div
                key={card.label}
                className="flex w-28 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
              >
                <img
                  src={card.src}
                  alt={`${card.label} logo`}
                  className="h-6 object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Quick Deposit</CardTitle>
              <CardDescription>Select or enter an amount to add to your business wallet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="preset" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="preset">Presets</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <TabsContent value="preset" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {["200", "500", "1000", "2000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                          amount === preset
                            ? "border-blue-500 bg-blue-50 text-blue-600 shadow"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-500"
                        )}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="custom" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-amount">Custom amount (USD)</Label>
                    <Input
                      id="custom-amount"
                      type="number"
                      min={50}
                      step={50}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-gray-500">Minimum deposit is $50. We recommend $200+ for campaign testing.</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Cardholder name</Label>
                    <Input id="account-name" placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-email">Billing email</Label>
                    <Input id="account-email" type="email" placeholder="billing@business.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-card">Card number</Label>
                    <Input id="account-card" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-[1fr_1fr] gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="account-exp">Expiry</Label>
                      <Input id="account-exp" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-cvc">CVC</Label>
                      <Input id="account-cvc" placeholder="123" />
                    </div>
                  </div>
                </div>
                <Button className="w-full md:w-auto">Deposit ${amount}</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-blue-100 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700">Account summary</CardTitle>
                <CardDescription>Track available balance and campaign usage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <span>Current wallet balance</span>
                  <span className="font-semibold text-lg">$1,250.00</span>
                </div>
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <span>Pending transactions</span>
                  <span>$150.00</span>
                </div>
                <div className="flex items-center justify-between text-sm text-blue-700">
                  <span>Reserved for active campaigns</span>
                  <span>$600.00</span>
                </div>
                <p className="text-xs text-blue-600">
                  Wallet updates every few minutes. Campaigns draw from your available balance automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle>Saved payment methods</CardTitle>
                <CardDescription>Manage the cards your team uses for FastLink deposits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                      alt="Visa"
                      className="h-5 object-contain"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Visa ending 4242</p>
                      <p className="text-xs text-gray-500">Primary · Expires 08/27</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-sm text-red-500 hover:text-red-600">
                    Remove
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                      alt="Mastercard"
                      className="h-5 object-contain"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Mastercard ending 8890</p>
                      <p className="text-xs text-gray-500">Backup · Expires 03/26</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-sm text-red-500 hover:text-red-600">
                    Remove
                  </Button>
                </div>
                <Button variant="outline" className="w-full">
                  Add new payment method
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
