import { MessageCircle, Wrench, CheckCircle2 } from "lucide-react";

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <div className="rounded-2xl bg-white border border-gray-200 px-4 py-6 md:px-6 md:py-8">
          <header className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Get Quote – let businesses come to you
            </h1>
            <p className="text-sm md:text-base text-gray-800 max-w-2xl">
              Sometimes you just want to tell someone the problem and get a straight answer.
              Get Quote is a simple way for everyday people to describe what they need, and
              have the right local businesses reach out with prices and ideas.
            </p>
          </header>

          {/* Simple “graphic” row with icons and short text */}
          <section className="mb-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">1. Tell us the job</p>
                  <p>“Leaking roof in Suva”, “Need a surveyor for new land”, “Office aircon not working”… in your own words.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <MessageCircle className="h-5 w-5 text-sky-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">2. We match you</p>
                  <p>Your request appears to businesses on FastLink that want this kind of work, in your area.</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-2xl bg-gray-50 border border-gray-200 p-3">
                <div className="mt-1">
                  <CheckCircle2 className="h-5 w-5 text-violet-600" />
                </div>
                <div className="text-xs text-gray-800">
                  <p className="font-semibold text-gray-900 mb-1">3. You choose</p>
                  <p>Compare replies, ask questions, then pick the business you feel good about. No pressure.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Plain-language presell copy aimed at regular users */}
          <section>
            <div className="space-y-5 text-sm md:text-base text-gray-800 leading-relaxed">
              <p>
                If you’ve ever tried to fix something at home or organise work for your
                office, you know how quickly it turns into a headache. You google a few
                companies, call them one by one, explain the same story over and over, then
                wait days for someone to get back to you – if they do at all.
              </p>

              <p>
                Get Quote is built to take that pain away for normal people, not just
                builders and project managers. You don’t need to know the “correct” trade
                words or have a detailed plan. You simply explain what’s going on, and
                FastLink helps put that in front of businesses that can actually help.
              </p>

              <p>
                Imagine this: your hot water stops working on Sunday night. Instead of
                scrolling through dozens of websites, you open FastLink, go to Get Quote and
                type a short message about the problem. Local plumbers who use FastLink see
                your request and can reply with what they think is wrong, what it might cost
                and when they could come out. You stay in one place, and the options come to
                you.
              </p>

              <p>
                The same works if you’re planning something bigger – a house extension, a
                shop fit‑out, a new driveway, even getting your land properly surveyed.
                Many people put these jobs off because they’re not sure who to call first or
                they’re worried about being pushed into a decision. With Get Quote, you keep
                the power. You decide how much detail to share, who you reply to and when you
                want to move ahead.
              </p>

              <p>
                Over time, our goal is simple: whenever someone in Fiji says “I need to get
                this sorted”, FastLink is the first place they think of. A trusted starting
                point where you can see real businesses, real information and feel confident
                that you’re not wasting your time.
              </p>

              <p className="font-semibold text-gray-900">
                Right now we’re preparing this feature and inviting early users. If you’d
                like to be one of the first people to try Get Quote when it goes live,
                create a free FastLink account and you’ll see it appear in your dashboard
                as soon as it’s ready.
              </p>

              <p className="text-xs text-gray-600">
                No spam, no tricks – just a faster, easier way to get everyday problems in
                front of the right people.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}



