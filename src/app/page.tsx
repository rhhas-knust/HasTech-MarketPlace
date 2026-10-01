import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChartLine,
  Check,
  MessageCircle,
  MoonStar,
  Palette,
  Share2,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlatformLogo } from "@/components/platform-logo";
import { LiveDemoDashboard } from "@/components/landing/live-demo-dashboard";
import { getFoundingSpotsLeft } from "@/lib/founding";
import {
  COMMISSION_RATE_PERCENT,
  FOUNDING_MEMBER_LIMIT,
  PLATFORM_NAME,
  SUBSCRIPTION_PRICE_GHS,
} from "@/lib/constants";

// The founding-spots counter is read live from the database; refreshing it
// every few minutes keeps the page static-fast without going stale.
export const revalidate = 300;

const DM_MESSAGES = [
  { from: "them", text: "Is this still available?" },
  { from: "them", text: "How much?" },
  { from: "you", text: "GHS 45. Send to my MoMo 024…" },
  { from: "them", text: "I've sent it oo, check" },
  { from: "you", text: "Haven't seen it yet 😩" },
];

const STORE_EVENTS = [
  "Order #HC-1042 paid · GHS 45.00",
  "Receipt emailed to the customer",
  "Stock updated automatically",
];

const REASONS = [
  {
    icon: Wallet,
    title: "Get paid before you deliver",
    body: "Customers pay by MoMo or card at checkout. No more “I'll pay when it reaches” or chasing screenshots.",
  },
  {
    icon: MoonStar,
    title: "Sell while you sleep",
    body: "Your store takes orders at 2am, on Sundays and while you're serving another customer.",
  },
  {
    icon: BadgeCheck,
    title: "Look like a real brand",
    body: "A store link with your name, colours and prices earns the trust a chat never will.",
  },
  {
    icon: ChartLine,
    title: "Know your numbers",
    body: "See what sells, who's buying and what's running low, instead of guessing from your chats.",
  },
];

const BUILD_STEPS = [
  { icon: Palette, title: "Design it", body: "Name your store, pick your colour, add your first product. No account needed." },
  { icon: UserPlus, title: "Claim it", body: "Create your account and everything you designed is saved into your real store." },
  { icon: Share2, title: "Share it", body: "Drop your store link on WhatsApp, TikTok and Instagram and start taking payments." },
];

function Blob({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute rounded-full blur-3xl ${className}`} />;
}

export default async function Home() {
  const spotsLeft = await getFoundingSpotsLeft();
  const hasFoundingSpots = spotsLeft !== null && spotsLeft > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-(--color-border)/60 px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="shrink-0 text-lg font-semibold text-(--color-ink)">
            <PlatformLogo />
          </span>
          <nav className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/sell"
              className="hidden rounded-full px-3 py-1.5 text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink) sm:inline"
            >
              For sellers
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-(--color-ink-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-ink)"
            >
              Sign in
            </Link>
            <LinkButton href="/start" size="sm" className="whitespace-nowrap">
              Start selling
            </LinkButton>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero: motivation first */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <Blob className="-left-32 -top-24 h-96 w-96 bg-(--color-brand)/25" />
          <Blob className="-right-24 top-10 h-80 w-80 bg-(--color-brand-2)/25" />

          <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-16 text-center sm:pt-24">
            {hasFoundingSpots ? (
              <span className="glass inline-flex items-center gap-2 rounded-full border border-(--color-brand)/30 px-4 py-1.5 text-xs font-medium text-(--color-brand) shadow-soft">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-brand) opacity-60 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-brand)" />
                </span>
                🎁 {spotsLeft} of {FOUNDING_MEMBER_LIMIT} founding spots left · no fees this month
              </span>
            ) : (
              <span className="glass inline-flex items-center gap-2 rounded-full border border-(--color-border) px-4 py-1.5 text-xs font-medium text-(--color-ink-muted) shadow-soft">
                <Sparkles className="h-3.5 w-3.5 text-(--color-brand)" /> Built for Ghanaian businesses
              </span>
            )}
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-(--color-ink) sm:text-6xl sm:leading-[1.05]">
              Stop selling in DMs.
              <br />
              <span className="text-gradient">Start selling like a real store.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-(--color-ink-muted)">
              Your customers already want to buy. Give them a store link where they can see your
              prices, pay with MoMo or card, and get a receipt, while you get your time back.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/start" size="lg" className="w-full sm:w-auto">
                Design your store free <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/store/amara-books" size="lg" variant="outline" className="w-full sm:w-auto">
                See a live store
              </LinkButton>
            </div>
            <p className="mt-4 flex items-center justify-center gap-4 text-xs text-(--color-ink-muted)">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-(--color-success)" /> No account needed to start
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3.5 w-3.5 text-(--color-success)" /> About 2 minutes
              </span>
            </p>
          </div>

          {/* Contrast: show the painful "before" first so the "after" lands */}
          <div className="relative mx-auto grid max-w-4xl items-center gap-6 px-4 pb-20 sm:grid-cols-2">
            <div className="rounded-3xl border border-(--color-border)/70 bg-(--color-surface-subtle)/80 p-6 opacity-90 shadow-soft sm:rotate-[-1.5deg]">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--color-ink-muted)">
                <MessageCircle className="h-4 w-4" /> Selling in DMs today
              </p>
              <div className="mt-5 space-y-2.5">
                {DM_MESSAGES.map((m, i) => (
                  <div key={i} className={m.from === "you" ? "flex justify-end" : "flex justify-start"}>
                    <span
                      className={
                        m.from === "you"
                          ? "max-w-[80%] rounded-2xl rounded-br-md bg-(--color-border) px-4 py-2 text-sm text-(--color-ink)"
                          : "max-w-[80%] rounded-2xl rounded-bl-md bg-(--color-surface) px-4 py-2 text-sm text-(--color-ink) shadow-soft"
                      }
                    >
                      {m.text}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-t border-(--color-border) pt-4 text-sm text-(--color-ink-muted)">
                Hours of replying, unconfirmed payments, lost orders.
              </p>
            </div>

            <div className="rounded-[1.6rem] bg-brand-gradient p-[2px] shadow-lift motion-safe:animate-[float-slow_6s_ease-in-out_infinite]">
              <div className="rounded-[calc(1.6rem-2px)] bg-(--color-surface) p-6">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-(--color-brand)">
                  <Sparkles className="h-4 w-4" /> With your {PLATFORM_NAME} store
                </p>
                <div className="mt-5 rounded-2xl border border-(--color-border)/70 bg-(--color-surface-subtle)/60 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-brand-subtle) text-2xl">
                      🎓
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-(--color-ink)">Graduation sash</p>
                      <p className="font-mono text-sm text-(--color-ink-muted) tabular-nums">GHS 45.00</p>
                    </div>
                    <span className="rounded-full bg-brand-gradient px-3.5 py-1.5 text-xs font-medium text-white shadow-glow">
                      Add to Cart
                    </span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {STORE_EVENTS.map((event) => (
                    <li key={event} className="flex items-center gap-2.5 text-sm text-(--color-ink)">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-success-subtle) text-(--color-success)">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {event}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 border-t border-(--color-border) pt-4 text-sm font-medium text-(--color-ink)">
                  Paid, confirmed and recorded, with no back-and-forth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Motivation: why they'd actually use it */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-(--color-brand)">Why switch</p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-(--color-ink) sm:text-4xl">
              Why sellers make the switch
            </h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {REASONS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="group rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-(--color-ink)">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-(--color-ink-muted)">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Digital numbers, not bars */}
        <section className="relative overflow-hidden px-4 py-20">
          <Blob className="right-0 top-1/3 h-80 w-80 bg-(--color-brand-2)/15" />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-(--color-brand)">Live dashboard</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-(--color-ink) sm:text-4xl">
                Watch your business move, live
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-(--color-ink-muted)">
                Every visit, order and cedi shows up the moment it happens. Open your dashboard and
                see exactly how today is going, at a glance.
              </p>
              <LinkButton href="/start" className="mt-7">
                Build mine now <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
            <LiveDemoDashboard />
          </div>
        </section>

        {/* Pricing contrast: anchor on the expensive option first */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-(--color-brand)">Pricing</p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-(--color-ink) sm:text-4xl">
              What it costs to go online
            </h2>
            <div className="mt-12 grid items-center gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-(--color-border)/70 bg-(--color-surface-subtle)/70 p-7 opacity-80">
                <p className="text-sm font-medium text-(--color-ink-muted)">Hiring a developer</p>
                <p className="mt-4 font-mono text-4xl font-semibold text-(--color-ink-muted) line-through decoration-(--color-danger)/60">
                  GHS 3,000+
                </p>
                <p className="mt-1 text-sm text-(--color-ink-muted)">upfront, typical quote</p>
                <ul className="mt-6 space-y-2 text-sm text-(--color-ink-muted)">
                  <li>+ hosting every year</li>
                  <li>+ paying for every change</li>
                  <li>Weeks before you can sell</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-7 shadow-soft">
                <p className="text-sm font-medium text-(--color-ink)">Monthly plan</p>
                <p className="mt-4 font-mono text-4xl font-semibold text-(--color-ink)">GHS {SUBSCRIPTION_PRICE_GHS}</p>
                <p className="mt-1 text-sm text-(--color-ink-muted)">per month, flat</p>
                <ul className="mt-6 space-y-2.5 text-sm text-(--color-ink)">
                  {["Everything included", "No cut of your sales", "Live today"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-(--color-success)" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-[1.6rem] bg-brand-gradient p-[2px] shadow-lift md:scale-105">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-gradient px-3.5 py-1 text-xs font-semibold text-white shadow-glow">
                  Most sellers pick this
                </span>
                <div className="rounded-[calc(1.6rem-2px)] bg-(--color-surface) p-7">
                  <p className="text-sm font-semibold text-(--color-brand)">Pay as you sell</p>
                  <p className="mt-4 font-mono text-4xl font-semibold text-(--color-ink)">GHS 0</p>
                  <p className="mt-1 text-sm text-(--color-ink-muted)">
                    upfront, then {COMMISSION_RATE_PERCENT}% only when you make a sale
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-(--color-ink)">
                    {["Everything included", "No sale, no fee", "Live today"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-(--color-success)" /> {item}
                      </li>
                    ))}
                  </ul>
                  <LinkButton href="/start" className="mt-7 w-full">
                    Start free
                  </LinkButton>
                </div>
              </div>
            </div>
            {hasFoundingSpots && (
              <p className="mx-auto mt-10 w-fit rounded-full border border-dashed border-(--color-brand)/50 bg-(--color-brand-subtle) px-5 py-2.5 text-center text-sm text-(--color-ink)">
                🎁 <strong>Founding members pay nothing this month.</strong> {spotsLeft} of{" "}
                {FOUNDING_MEMBER_LIMIT} spots left.
              </p>
            )}
          </div>
        </section>

        {/* IKEA effect: build first, sign up after */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-(--color-brand)">How it works</p>
            <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-(--color-ink) sm:text-4xl">
              Build it before you sign up
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-lg text-(--color-ink-muted)">
              See your store come to life first. Only create an account once you love it.
            </p>
            <ol className="mt-12 grid gap-5 sm:grid-cols-3">
              {BUILD_STEPS.map(({ icon: Icon, title, body }, i) => (
                <li
                  key={title}
                  className="relative rounded-3xl border border-(--color-border)/70 bg-(--color-surface) p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <span className="absolute right-6 top-5 font-mono text-5xl font-bold text-(--color-brand)/10">
                    0{i + 1}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-brand-subtle) text-(--color-brand)">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-(--color-ink)">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-(--color-ink-muted)">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="px-4 pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-14 text-center shadow-lift sm:px-12">
            <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your store could be live today
            </h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/80">
              Design it in two minutes. See it before you sign up. Pay nothing until you sell.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 font-semibold text-(--color-brand) shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
              >
                Design your store free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/store/amara-books"
                className="inline-flex h-13 items-center rounded-full border border-white/40 px-7 font-medium text-white transition-colors hover:bg-white/10"
              >
                See Amara Books, a live store
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--color-border)/60 px-4 py-8 text-center text-sm text-(--color-ink-muted)">
        <div className="mb-3 flex justify-center">
          <PlatformLogo iconSize={20} />
        </div>
        <p>Storefronts, orders and payments for small businesses.</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Link href="/sell" className="rounded-full px-3 py-1 hover:bg-(--color-surface-subtle) hover:text-(--color-ink)">
            For sellers
          </Link>
          <Link href="/contact" className="rounded-full px-3 py-1 hover:bg-(--color-surface-subtle) hover:text-(--color-ink)">
            Talk to us
          </Link>
        </div>
      </footer>
    </div>
  );
}
