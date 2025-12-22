"use client";

import { Tag, Gavel, Package } from "lucide-react";

export default function MarketPlacePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <div className="rounded-2xl bg-white border border-gray-200 px-4 py-6 md:px-6 md:py-8">
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Market Place – buy, sell and auction in one place
            </h1>
            <p className="text-sm md:text-base text-gray-800 max-w-2xl">
              Market Place is where people in Fiji can put up things they’re selling and
              where buyers can find real items from real people – from tools and furniture
              to vehicles and business equipment. Auctions are also available for special
              items you want to put up for bidding.
            </p>
          </header>

          {/* Simple explanation row */}
          <section className="mb-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">List what you have</p>
                  <p>
                    Take a few photos, tell people what you’re selling and where you are
                    based. Keep it simple and honest.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <Tag className="h-5 w-5 text-sky-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">Set a price or accept offers</p>
                  <p>
                    Put a straight price, say “ono” (or nearest offer), or let buyers send
                    you offers through FastLink.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <Gavel className="h-5 w-5 text-violet-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">Run auctions if you want</p>
                  <p>
                    For special items, you’ll also be able to run timed auctions so people
                    can bid and you get the best price.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Plain-language content for everyday users */}
          <section>
            <div className="space-y-5 text-sm md:text-base text-gray-800 leading-relaxed">
              <p>
                Everyone has things sitting at home or in the office that they don’t use
                anymore – tools you’ve upgraded, furniture from an old shop, a vehicle
                you’ve replaced, or extra stock from a small business. Market Place gives
                you a single, trusted spot on FastLink to put those items in front of
                people who are actually looking.
              </p>

              <p>
                Instead of posting in ten different Facebook groups and dealing with random
                messages, you can create one clear listing on FastLink. Buyers can see what
                you’re selling, where you are and how to contact you. Over time this will
                make it easier for people in Fiji to browse real listings without the usual
                noise and confusion.
              </p>

              <p>
                Auctions are there for when you have something that might attract a lot of
                interest – a rare car, high‑value equipment, or anything where you’d like
                buyers to bid against each other. You’ll be able to set a starting price,
                set an end time and watch the offers move up.
              </p>

              <p>
                For everyday buyers, Market Place means you can come to one place to look
                for what you need – whether that’s a second‑hand fridge, a generator for
                work, or a good deal on building materials – knowing the listings are part
                of the wider FastLink network.
              </p>

              <p className="font-semibold text-gray-900">
                Right now we’re shaping how Market Place will work and getting things ready
                behind the scenes. If you’d like to sell items or run auctions when it
                launches, create a free FastLink account and keep an eye on your dashboard
                – Market Place will appear there as soon as it opens.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


