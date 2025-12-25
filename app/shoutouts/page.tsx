export default function ShoutoutsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Shoutouts</h1>
          <p className="text-gray-600 text-[20px] leading-[28px]">
            A space for businesses to announce specials, events, launches, and time-limited offers to the FastLink community.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">How it works</h2>
          <ul className="list-disc pl-5 space-y-2 text-[18px] leading-[24px] text-gray-700">
            <li>Post quick announcements about sales, promotions, events, and openings.</li>
            <li>Keep shoutouts short, clear, and time-bound so they stand out.</li>
            <li>Update shoutouts frequently to keep audiences engaged.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">What to share</h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-700 text-[18px] leading-[24px]">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Specials &amp; Promotions</h3>
              <p className="text-[18px] leading-[24px]">Discounts, bundle deals, limited-time offers, clearance, flash sales.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Events &amp; Openings</h3>
              <p className="text-[18px] leading-[24px]">Grand openings, pop-ups, workshops, demos, launches, meetups.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Service Updates</h3>
              <p className="text-[18px] leading-[24px]">New services, expanded hours, delivery zones, seasonal menus.</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Hiring Callouts</h3>
              <p className="text-[18px] leading-[24px]">Short-term staffing needs, event staffing, seasonal roles.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Tips for better shoutouts</h2>
          <ul className="list-disc pl-5 space-y-2 text-[18px] leading-[24px] text-gray-700">
            <li>Lead with the value (what’s in it for the audience) and the dates.</li>
            <li>Add a clear call-to-action: visit, book, call, message, or RSVP.</li>
            <li>Include location or online link; mention any time window or stock limits.</li>
            <li>Refresh expired shoutouts so the list stays current.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Coming soon</h2>
          <p className="text-gray-700 text-[20px] leading-[28px]">
            We’re adding in-app shoutout creation with scheduling, media uploads, and analytics so you can see reach and responses.
          </p>
          <p className="text-gray-700 text-[20px] leading-[28px]">
            For now, contact support to have your shoutout posted.
          </p>
        </section>
      </div>
    </div>
  );
}

