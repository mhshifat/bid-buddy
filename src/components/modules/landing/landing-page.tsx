"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Search,
  FileText,
  BarChart3,
  Shield,
  BrainCircuit,
  Chrome,
  Bell,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  MousePointerClick,
  ScanSearch,
  MessageSquareText,
  Layers,
  ChevronDown,
} from "lucide-react";

/* ─────────────────────── scroll-reveal hook ─────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

/* ─────────────────────── animated background ─────────────────────── */

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* gradient orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03]">
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      {/* floating shapes */}
      <svg className="landing-float-shape landing-float-1" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="38" stroke="url(#g1)" strokeWidth="1.5" opacity="0.25" />
        <defs><linearGradient id="g1" x1="0" y1="0" x2="80" y2="80"><stop stopColor="#818cf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient></defs>
      </svg>
      <svg className="landing-float-shape landing-float-2" viewBox="0 0 60 60" fill="none">
        <rect x="4" y="4" width="52" height="52" rx="14" stroke="url(#g2)" strokeWidth="1.5" opacity="0.2" />
        <defs><linearGradient id="g2" x1="0" y1="0" x2="60" y2="60"><stop stopColor="#a78bfa" /><stop offset="1" stopColor="#7c3aed" /></linearGradient></defs>
      </svg>
      <svg className="landing-float-shape landing-float-3" viewBox="0 0 70 70" fill="none">
        <polygon points="35,2 68,55 2,55" stroke="url(#g3)" strokeWidth="1.5" opacity="0.18" />
        <defs><linearGradient id="g3" x1="0" y1="0" x2="70" y2="70"><stop stopColor="#60a5fa" /><stop offset="1" stopColor="#3b82f6" /></linearGradient></defs>
      </svg>
    </div>
  );
}

/* ─────────────────────── nav ─────────────────────── */

function Nav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-white/80 shadow-sm backdrop-blur-xl dark:bg-black/70"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span>Bid<span className="text-primary">Buddy</span></span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#extension" className="landing-nav-link">Extension</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="landing-btn-primary">
              Dashboard
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="landing-btn-primary"
              >
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────── hero ─────────────────────── */

function HeroSection() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden pt-16">
      <HeroBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center">
        {/* badge */}
        <div className="landing-reveal stagger-1 mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Freelance Assistant
        </div>

        <h1 className="landing-reveal stagger-2 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Win More Upwork
          <br />
          <span className="landing-gradient-text">Contracts with AI</span>
        </h1>

        <p className="landing-reveal stagger-3 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Analyze jobs in seconds, generate winning proposals, auto-scan for
          opportunities, and manage your pipeline — all from one dashboard
          and a powerful browser extension.
        </p>

        <div className="landing-reveal stagger-4 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login" className="landing-btn-primary landing-btn-lg group">
            Start Free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#features" className="landing-btn-secondary landing-btn-lg">
            See Features
            <ChevronDown className="ml-1.5 h-4 w-4 animate-bounce" />
          </a>
        </div>

        {/* trust signals */}
        <div className="landing-reveal stagger-5 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Free to use</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Chrome extension</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> AI-powered analysis</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Auto-scan jobs</span>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="landing-scroll-indicator" />
      </div>
    </section>
  );
}

/* ─────────────────────── features ─────────────────────── */

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "AI Job Analysis",
    description: "Get instant fit scores, red-flag detection, and actionable recommendations for every job posting.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: FileText,
    title: "Proposal Generator",
    description: "AI writes personalised, winning proposals tailored to each job's requirements and your profile.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: ScanSearch,
    title: "Auto-Scan",
    description: "Periodically scans Upwork for new jobs matching your skills and categories — hands-free lead gen.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: Shield,
    title: "Scope Shield",
    description: "Detect scope creep from client messages, generate diplomatic responses, and create change orders.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: BarChart3,
    title: "Analytics & Pipeline",
    description: "Track your bids, win rate, connects ROI, and job pipeline from discovery to payment.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageSquareText,
    title: "Interview Prep & Follow-up",
    description: "AI generates interview questions, talking points, and strategic follow-up messages.",
    gradient: "from-indigo-500 to-blue-600",
  },
] as const;

function FeaturesSection() {
  const { ref, visible } = useReveal();

  return (
    <section id="features" className="relative py-28" ref={ref}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything you need to
            <span className="landing-gradient-text"> win on Upwork</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From discovering the right jobs to closing contracts — Bid Buddy covers the full freelancer workflow.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`landing-feature-card ${visible ? "landing-reveal-visible" : "landing-reveal-hidden"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className={`mb-4 inline-flex rounded-xl bg-linear-to-br ${f.gradient} p-3 text-white shadow-lg`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── extension showcase ─────────────────────── */

const EXT_FEATURES = [
  { icon: MousePointerClick, label: "One-Click Capture", desc: "Capture job details from any Upwork page instantly." },
  { icon: Layers, label: "Batch Capture", desc: "Capture entire search pages of jobs at once." },
  { icon: Bell, label: "Auto-Scan Sync", desc: "Syncs with your web settings — scans while you work." },
  { icon: TrendingUp, label: "Quick Score Badges", desc: "See AI fit-scores overlaid on Upwork listings." },
  { icon: Globe, label: "Works Everywhere", desc: "Job detail, search, feed, and saved-jobs pages." },
  { icon: Search, label: "Smart Detection", desc: "Detects page type and adapts capture automatically." },
] as const;

function ExtensionSection() {
  const { ref, visible } = useReveal();

  return (
    <section
      id="extension"
      className="relative overflow-hidden py-28"
      ref={ref}
    >
      {/* bg accent */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/3 via-transparent to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* left: browser mockup */}
          <div
            className={`landing-ext-mockup ${visible ? "landing-reveal-visible" : "landing-reveal-hidden"}`}
          >
            <div className="landing-browser-frame">
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
                  upwork.com/nx/search/jobs
                </div>
                <div className="landing-ext-badge">
                  <Zap className="h-3 w-3" /> Bid Buddy
                </div>
              </div>

              {/* fake extension popup */}
              <div className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚡</span>
                    <div>
                      <p className="text-sm font-bold">Bid Buddy</p>
                      <p className="text-[10px] text-muted-foreground">Upwork AI Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Connected to Bid Buddy
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium">Auto-Scan</span>
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-600">ON</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-center">
                      <p className="text-lg font-bold">12</p>
                      <p className="text-[9px] text-muted-foreground">Jobs Found</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-center">
                      <p className="text-lg font-bold text-green-500">5</p>
                      <p className="text-[9px] text-muted-foreground">New Sent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* right: text + feature list */}
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Browser Extension
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Capture jobs
              <span className="landing-gradient-text"> while you browse</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Bid Buddy Chrome extension works on every Upwork page — capture single jobs or entire search results, sync auto-scan, and see AI scores without leaving Upwork.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {EXT_FEATURES.map((f, i) => (
                <div
                  key={f.label}
                  className={`landing-ext-feature ${visible ? "landing-reveal-visible" : "landing-reveal-hidden"}`}
                  style={{ transitionDelay: `${200 + i * 80}ms` }}
                >
                  <f.icon className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── how it works ─────────────────────── */

const STEPS = [
  { num: "01", title: "Install the Extension", desc: "Add Bid Buddy to Chrome and sign in with your account." },
  { num: "02", title: "Browse Upwork", desc: "Visit any Upwork page — the extension auto-detects job listings." },
  { num: "03", title: "Capture & Analyze", desc: "One click captures jobs. AI instantly scores fit, flags risks, and writes proposals." },
  { num: "04", title: "Win Contracts", desc: "Use AI insights, polished proposals, and pipeline tracking to close more deals." },
] as const;

function HowItWorksSection() {
  const { ref, visible } = useReveal();

  return (
    <section id="how-it-works" className="relative py-28" ref={ref}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From browse to
            <span className="landing-gradient-text"> bid in minutes</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className={`landing-step-card ${visible ? "landing-reveal-visible" : "landing-reveal-hidden"}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="landing-step-num">{s.num}</span>
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── stats ─────────────────────── */

function StatsSection() {
  const { ref, visible } = useReveal();
  const stats = [
    { value: "10+", label: "AI Tools" },
    { value: "< 30s", label: "To Analyse a Job" },
    { value: "Auto", label: "Job Scanning" },
    { value: "100%", label: "Open Source" },
  ];

  return (
    <section className="relative py-20" ref={ref}>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-primary/3 to-transparent" aria-hidden />
      <div className="relative mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`text-center ${visible ? "landing-reveal-visible" : "landing-reveal-hidden"}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <p className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">{s.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── CTA ─────────────────────── */

function CtaSection() {
  const { ref, visible } = useReveal();

  return (
    <section className="relative py-28" ref={ref}>
      <div
        className={`mx-auto max-w-4xl rounded-3xl border border-primary/10 bg-linear-to-br from-primary/5 via-primary/2 to-transparent px-6 py-20 text-center shadow-2xl shadow-primary/5 backdrop-blur-sm ${
          visible ? "landing-reveal-visible" : "landing-reveal-hidden"
        }`}
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Ready to win your next
          <span className="landing-gradient-text"> Upwork contract?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Join freelancers who use AI to find better jobs, write better proposals, and close more deals.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login" className="landing-btn-primary landing-btn-lg group">
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── footer ─────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          Bid<span className="text-primary">Buddy</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Bid Buddy. Built for freelancers.</p>
        <div className="flex gap-6">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#extension" className="hover:text-foreground transition-colors">Extension</a>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── main export ─────────────────────── */

export function LandingPage({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <div className="landing-page min-h-screen">
      <Nav isLoggedIn={isLoggedIn} />
      <HeroSection />
      <FeaturesSection />
      <ExtensionSection />
      <HowItWorksSection />
      <StatsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
