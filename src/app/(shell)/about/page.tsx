"use client";

import Image from "next/image";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bookmark,
  ChevronDown,
  ClipboardList,
  Code2,
  Compass,
  Filter,
  Heart,
  LayoutGrid,
  Quote,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Theme tokens (light + dark) ─────────────────────────────────────────────────
// Centralized class fragments so every section stays consistent across both modes.
const T = {
  page: "bg-slate-50 text-slate-900 dark:bg-[#060610] dark:text-white",
  sectionBorder: "border-slate-200 dark:border-white/[0.05]",
  heading: "text-slate-900 dark:text-white",
  textFaint: "text-slate-400 dark:text-white/30",
  textMuted: "text-slate-500 dark:text-white/40",
  textBody: "text-slate-600 dark:text-white/50",
  textStrong: "text-slate-700 dark:text-white/70",
  eyebrow: "bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-white/40",
  chip: "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-white/50",
  card: "border border-slate-200 bg-white dark:border-white/[0.07] dark:bg-[#0d0d1c]",
  cardSubtle: "border border-slate-200 bg-white dark:border-white/[0.06] dark:bg-white/[0.025]",
  cardHover:
    "hover:border-slate-300 hover:shadow-md dark:hover:border-white/[0.14] dark:hover:bg-white/[0.04] dark:hover:shadow-none",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type StatDef = { value: number; suffix: string; label: string; Icon: LucideIcon };
type MemberDef = {
  id: number;
  photo: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
};
type FeatureDef = {
  Icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  gradient: string;
};
type MilestoneDef = {
  date: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  gradient: string;
};
type ValueDef = { Icon: LucideIcon; title: string; description: string; gradient: string };
type StepDef = { Icon: LucideIcon; step: string; title: string; description: string };
type FaqDef = { question: string; answer: string };

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS: StatDef[] = [
  { value: 6, suffix: "", label: "Team Members", Icon: Users },
  { value: 24, suffix: "+", label: "Features Shipped", Icon: Zap },
  { value: 98, suffix: "%", label: "Uptime", Icon: Trophy },
];

const FEATURES: FeatureDef[] = [
  {
    Icon: Search,
    title: "Your profile",
    description: "Keep your account details, avatar, and CVs in one place.",
    href: "/profile",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    Icon: Filter,
    title: "Secure credentials",
    description: "Store secrets in an encrypted vault that only you can manage.",
    href: "/credentials",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    Icon: LayoutGrid,
    title: "Account access",
    description: "Sign in, verify your email, and manage your password from your profile.",
    href: "/profile",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    Icon: Bookmark,
    title: "About the team",
    description: "Meet the people who build and maintain TrackCod.",
    href: "/about",
    gradient: "from-rose-500 to-pink-500",
  },
];

const TEAM: MemberDef[] = [
  {
    id: 1,
    photo: "/pm.png",
    name: "Eduard Ferney Suarez Avella",
    role: "Product Manager & Team Lead",
    bio: "The visionary force behind TrackCod. From the earliest whiteboard sketch to every production-ready feature, Eduard keeps the team focused, motivated, and shipping with purpose — every single sprint.",
    skills: ["Product Strategy", "Roadmapping", "Team Leadership"],
  },
  {
    id: 2,
    photo: "/workflow-specialist.png",
    name: "Kamil Luis Maria Ponce",
    role: "Product / Workflow Specialist",
    bio: "The operational backbone of the team. Kamil bridges product thinking and execution — designing the workflows and processes that keep everything running smoothly, even as complexity scales.",
    skills: ["Workflow Design", "Process Optimization", "Product Ops"],
  },
  {
    id: 3,
    photo: "/QA-engineer.png",
    name: "Liam Smith",
    role: "DevOps / QA Engineer",
    bio: "The guardian of reliability. Liam ensures every deployment is solid and every edge case is caught before it reaches users. Our CI/CD pipeline and infrastructure quality reflect his meticulous work.",
    skills: ["DevOps", "CI/CD Pipelines", "Quality Assurance"],
  },
  {
    id: 4,
    photo: "/backend.png",
    name: "Liam Eduardo Freitas Brandao",
    role: "Backend Lead",
    bio: "The architect of TrackCod's core systems. Liam designed and built the APIs and data infrastructure that power the platform — balancing performance, reliability, and clean design at every layer.",
    skills: ["Python", "FastAPI", "System Architecture"],
  },
  {
    id: 5,
    photo: "/scraper.png",
    name: "Howard Johnson",
    role: "Platform Engineer",
    bio: "Howard keeps TrackCod's infrastructure resilient — from background services to operational tooling that the rest of the team relies on every day.",
    skills: ["Automation", "Data Pipelines", "Reliability"],
  },
  {
    id: 6,
    photo: "/frontend.png",
    name: "Kian Arnold",
    role: "Senior Frontend Developer",
    bio: "The craftsman behind every interface. Kian turns designs into fast, accessible experiences — from profile and credentials to the subtle micro-interactions that make TrackCod feel polished.",
    skills: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
];

const MILESTONES: MilestoneDef[] = [
  {
    date: "Q1 2024",
    title: "The Spark",
    description:
      "We wanted a focused place for people to manage their account, documents, and secrets — without juggling spreadsheets and password notes. TrackCod started there.",
    Icon: Rocket,
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    date: "Q2 2024",
    title: "First Commit",
    description:
      "Stack chosen, team assembled. The first lines of code were pushed and a scrappy prototype began to take shape late on a Friday night.",
    Icon: Code2,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    date: "Q3 2024",
    title: "Alpha Launch",
    description:
      "Internal alpha went live. Rough edges, big ambitions, and the first real signal that users wanted a clean profile and vault experience.",
    Icon: Zap,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    date: "Q4 2024",
    title: "Credentials Vault",
    description:
      "Encrypted credentials landed in production — a secure place for secrets that only the account owner can manage.",
    Icon: Trophy,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    date: "2025",
    title: "Scaling Up",
    description:
      "Stronger auth, profile tools, and a team that ships with confidence every sprint. The best chapters are still ahead.",
    Icon: TrendingUp,
    gradient: "from-rose-500 to-pink-500",
  },
];

const VALUES: ValueDef[] = [
  {
    Icon: Heart,
    title: "User-First Always",
    description:
      "Every decision starts and ends with the person managing their profile and credentials.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    Icon: Zap,
    title: "Ship, Then Iterate",
    description:
      "We move quickly, deploy often, and let real usage guide us toward the right solution.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    Icon: Star,
    title: "Craft at Every Layer",
    description:
      "Speed never comes at the cost of quality. We take pride in the details no one notices — until they are missing.",
    gradient: "from-violet-500 to-indigo-500",
  },
];

const STEPS: StepDef[] = [
  {
    Icon: Compass,
    step: "01",
    title: "Create an account",
    description: "Register and verify your email so your profile is ready to use.",
  },
  {
    Icon: ClipboardList,
    step: "02",
    title: "Complete your profile",
    description: "Add your details, avatar, and CVs from the profile page.",
  },
  {
    Icon: Target,
    step: "03",
    title: "Store credentials",
    description: "Keep secrets in the encrypted vault instead of scattered notes.",
  },
];

const ROLE_CATEGORIES: string[] = [
  "Profile",
  "CVs",
  "Credentials vault",
  "Email verification",
  "Passwords",
  "Admin users",
  "Permissions",
];

const TECH_STACK: string[] = [
  "Next.js",
  "TypeScript",
  "React",
  "Tailwind CSS",
  "React Query",
  "FastAPI",
  "Python",
  "PostgreSQL",
];

const FAQS: FaqDef[] = [
  {
    question: "What can I do in TrackCod?",
    answer:
      "Sign in, manage your profile and CVs, and store secrets in an encrypted credentials vault.",
  },
  {
    question: "Who can see my credentials?",
    answer: "You manage your own vault. Administrators can manage the admin vault separately.",
  },
  {
    question: "How do I update my account?",
    answer: "Open Profile to change your details, password, avatar, and uploaded CVs.",
  },
];

// ─── Hook ──────────────────────────────────────────────────────────────────────

function useInView<E extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<E>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView<HTMLSpanElement>(0.3);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const totalFrames = 80;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const id = setInterval(() => {
      frame++;
      setCount(Math.round(ease(Math.min(frame / totalFrames, 1)) * target));
      if (frame >= totalFrames) clearInterval(id);
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function SectionReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(26px)",
        transition: `opacity 0.65s ease-out ${delay}s, transform 0.65s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <SectionReveal className="mb-16 text-center">
      <div
        className={`mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${T.eyebrow}`}
      >
        {eyebrow}
      </div>
      <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl ${T.heading}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mx-auto mt-4 max-w-xl text-[0.96rem] ${T.textMuted}`}>{subtitle}</p>
      )}
    </SectionReveal>
  );
}

function TeamCard({ member, delay }: { member: MemberDef; delay: number }) {
  return (
    <SectionReveal delay={delay} className="group h-full">
      <div
        className={`flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${T.card} ${T.cardHover}`}
      >
        {/* Photo */}
        <div className="relative h-[300px] w-full overflow-hidden">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent dark:from-[#0d0d1c]" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-6 pb-7 pt-4">
          <p className={`mb-0.5 text-lg font-bold ${T.heading}`}>{member.name}</p>
          <p className={`mb-4 text-xs font-semibold uppercase tracking-wider ${T.textMuted}`}>
            {member.role}
          </p>
          <p className={`mb-5 flex-1 text-sm leading-relaxed ${T.textBody}`}>{member.bio}</p>

          <div className="flex flex-wrap gap-2">
            {member.skills.map((skill) => (
              <span
                key={skill}
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${T.chip}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: FaqDef;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
        isOpen
          ? "border-slate-300 bg-white shadow-sm dark:border-white/[0.14] dark:bg-white/[0.045] dark:shadow-none"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-white/[0.07] dark:bg-white/[0.025] dark:hover:border-white/[0.12]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className={`text-sm font-bold md:text-base ${T.heading}`}>{faq.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 dark:text-white/40 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className={`px-6 pb-5 text-sm leading-relaxed ${T.textBody}`}>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Deterministic particles — no Math.random() to avoid hydration mismatch
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: 2 + ((i * 1.618) % 3),
        top: (i * 6.18) % 100,
        left: (i * 11.09) % 100,
        duration: 5 + ((i * 1.3) % 5),
        delay: (i * 0.55) % 4,
        opacity: 0.1 + ((i * 0.041) % 0.22),
      })),
    [],
  );

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${T.page}`}>
      {/* ── Ambient background ──────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-56 -top-56 h-[750px] w-[750px] rounded-full bg-violet-300/30 blur-[160px] dark:bg-violet-700/20"
          style={{ animation: "float-orb 9s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-56 top-1/3 h-[640px] w-[640px] rounded-full bg-blue-300/25 blur-[150px] dark:bg-blue-700/15"
          style={{ animation: "float-orb 11s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[520px] w-[520px] rounded-full bg-indigo-300/20 blur-[130px] dark:bg-indigo-700/10"
          style={{ animation: "float-orb 13s ease-in-out infinite 1.5s" }}
        />
        {/* Mouse-tracking glow */}
        <div
          className="absolute h-72 w-72 rounded-full bg-violet-400/10 blur-[80px] dark:bg-violet-500/[0.06]"
          style={{
            left: mouseX - 144,
            top: mouseY - 144,
            transition: "left 1.1s ease-out, top 1.1s ease-out",
          }}
        />
        {/* Subtle grid — dark lines for light mode, light lines for dark mode */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          className="absolute inset-0 hidden opacity-[0.022] dark:block"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ─────────────────── HERO ───────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pb-20 pt-28 md:pt-36">
          {/* Floating particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-slate-400 dark:bg-white"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                top: `${p.top}%`,
                left: `${p.left}%`,
                opacity: p.opacity,
                animation: `particle-float ${p.duration}s ease-in-out infinite ${p.delay}s`,
              }}
            />
          ))}

          <div
            className="mx-auto flex max-w-4xl flex-col items-center text-center"
            style={{ animation: "fade-in-up 0.65s ease-out both" }}
          >
            <div
              className={`mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05] ${T.textStrong}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
              About TrackCod
            </div>

            <h1 className="mb-6 text-[clamp(2.6rem,6vw,5rem)] font-extrabold leading-[1.05] tracking-tight">
              <span className="block text-slate-900 dark:text-white/90">The home for</span>
              <span
                className="block bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-cyan-300"
                style={{
                  backgroundSize: "200% auto",
                  animation: "gradient-pan 4s linear infinite",
                }}
              >
                your account
              </span>
            </h1>

            <p className={`mb-10 max-w-2xl text-[1.05rem] leading-loose md:text-lg ${T.textBody}`}>
              TrackCod keeps your profile, CVs, and encrypted credentials together so your account
              stays in one place.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/profile"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40"
              >
                Open profile
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#team"
                className="dark:border-white/12 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-bold text-slate-700 backdrop-blur-sm transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 dark:bg-white/[0.04] dark:text-white/70 dark:hover:border-white/25 dark:hover:text-white"
              >
                Meet the team
              </a>
            </div>
          </div>
        </section>

        {/* ─────────────────── STATS ──────────────────────────────────────────── */}
        <section className={`border-y bg-white/60 py-16 dark:bg-white/[0.015] ${T.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((stat, i) => {
                const Icon = stat.Icon;
                return (
                  <SectionReveal key={stat.label} delay={i * 0.1} className="text-center">
                    <div className="mb-3 flex justify-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 dark:border-white/[0.07] dark:bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-slate-400 dark:text-white/40" />
                      </div>
                    </div>
                    <div
                      className={`mb-1.5 text-[2.5rem] font-extrabold leading-none tracking-tight md:text-5xl ${T.heading}`}
                    >
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div
                      className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${T.textFaint}`}
                    >
                      {stat.label}
                    </div>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────── MISSION + VALUES ───────────────────────────────── */}
        <section className="py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              <SectionReveal>
                <div
                  className={`mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] ${T.eyebrow}`}
                >
                  Our Mission
                </div>
                <h2
                  className={`mb-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl ${T.heading}`}
                >
                  Built for people who{" "}
                  <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent dark:from-violet-400 dark:to-fuchsia-400">
                    own their account
                  </span>
                </h2>
                <p className={`mb-5 text-[0.96rem] leading-loose ${T.textBody}`}>
                  TrackCod exists so your profile, documents, and secrets live in one calm place —
                  not scattered across notes apps, inboxes, and browser password managers.
                </p>
                <p className={`text-[0.96rem] leading-loose ${T.textBody}`}>
                  We built the tool we wished existed: verified sign-in, a clear profile with CVs,
                  and an encrypted credentials vault you control.
                </p>
              </SectionReveal>

              <div className="flex flex-col gap-4">
                {VALUES.map((val, i) => {
                  const Icon = val.Icon;
                  return (
                    <SectionReveal key={val.title} delay={0.1 + i * 0.1}>
                      <div
                        className={`flex gap-4 rounded-2xl p-5 transition-all duration-300 ${T.cardSubtle} ${T.cardHover}`}
                      >
                        <div
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${val.gradient} shadow-md`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className={`mb-1 text-sm font-bold ${T.heading}`}>{val.title}</p>
                          <p className={`text-sm leading-relaxed ${T.textBody}`}>
                            {val.description}
                          </p>
                        </div>
                      </div>
                    </SectionReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── WHAT YOU GET ───────────────────────────────────── */}
        <section className={`border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="What You Get"
              title="Everything you need, in one place"
              subtitle="From sign-in to profile and credentials, TrackCod keeps your account organized in one place."
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => {
                const Icon = feature.Icon;
                return (
                  <SectionReveal key={feature.title} delay={i * 0.08} className="h-full">
                    <Link
                      href={feature.href}
                      className={`group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${T.cardSubtle} ${T.cardHover}`}
                    >
                      <div
                        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-md`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className={`mb-2 text-base font-bold ${T.heading}`}>{feature.title}</p>
                      <p className={`mb-5 flex-1 text-sm leading-relaxed ${T.textBody}`}>
                        {feature.description}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors group-hover:text-slate-700 dark:group-hover:text-white/70 ${T.textMuted}`}
                      >
                        Learn more
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────── HOW IT WORKS ───────────────────────────────────── */}
        <section className={`border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="How It Works"
              title="Set up your account"
              subtitle="Three steps: create an account, complete your profile, and store credentials."
            />

            <div className="relative grid gap-6 md:grid-cols-3">
              {/* Connecting line (desktop) */}
              <div className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10 md:block" />

              {STEPS.map((s, i) => {
                const Icon = s.Icon;
                return (
                  <SectionReveal key={s.step} delay={i * 0.12} className="relative">
                    <div
                      className={`flex h-full flex-col items-center rounded-2xl p-7 text-center transition-all duration-300 hover:-translate-y-1 ${T.card} ${T.cardHover}`}
                    >
                      <div className="relative mb-5">
                        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <span className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-500 dark:border-white/15 dark:bg-[#080816] dark:text-white/60">
                          {s.step}
                        </span>
                      </div>
                      <p className={`mb-2 text-lg font-bold ${T.heading}`}>{s.title}</p>
                      <p className={`text-sm leading-relaxed ${T.textBody}`}>{s.description}</p>
                    </div>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────── ROLES WE COVER ─────────────────────────────────── */}
        <section className={`border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading
              eyebrow="What you can do"
              title="Account tools"
              subtitle="The signed-in app covers your profile, files, and encrypted credentials."
            />

            <SectionReveal>
              <div className="flex flex-wrap justify-center gap-3">
                {ROLE_CATEGORIES.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/55 dark:hover:border-violet-400/40 dark:hover:bg-violet-500/[0.08] dark:hover:text-white"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ─────────────────── TEAM ───────────────────────────────────────────── */}
        <section id="team" className={`scroll-mt-24 border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading
              eyebrow="The Team"
              title="Built by people who care"
              subtitle="Small by design. Every person here was chosen for their craft, their curiosity, and their commitment to shipping things that actually matter."
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.map((member, i) => (
                <TeamCard key={member.id} member={member} delay={i * 0.08} />
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────── TIMELINE ───────────────────────────────────────── */}
        <section className={`border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionHeading eyebrow="What We've Built" title="Our story so far" />

            <div className="relative">
              {/* Mobile vertical line */}
              <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-violet-500/40 via-slate-200 to-transparent dark:via-white/10 md:hidden" />
              {/* Desktop center line */}
              <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-px bg-gradient-to-b from-violet-500/40 via-slate-200 to-transparent dark:via-white/10 md:block" />

              <div className="flex flex-col gap-10">
                {MILESTONES.map((m, i) => {
                  const Icon = m.Icon;
                  const isEven = i % 2 === 0;

                  const card = (
                    <div
                      className={`max-w-sm rounded-2xl p-5 transition-all duration-300 ${T.cardSubtle} ${T.cardHover}`}
                    >
                      <span
                        className={`mb-2.5 inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${T.chip}`}
                      >
                        {m.date}
                      </span>
                      <p className={`mb-1.5 text-sm font-bold ${T.heading}`}>{m.title}</p>
                      <p className={`text-sm leading-relaxed ${T.textBody}`}>{m.description}</p>
                    </div>
                  );

                  const icon = (
                    <div
                      className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient} shadow-lg`}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  );

                  return (
                    <SectionReveal key={m.title} delay={i * 0.1}>
                      {/* Mobile */}
                      <div className="flex items-start gap-4 md:hidden">
                        {icon}
                        <div className="flex-1">{card}</div>
                      </div>
                      {/* Desktop alternating */}
                      <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0">
                        <div className={`pr-10 ${isEven ? "invisible" : "flex justify-end"}`}>
                          {!isEven && card}
                        </div>
                        {icon}
                        <div className={`pl-10 ${!isEven ? "invisible" : ""}`}>
                          {isEven && card}
                        </div>
                      </div>
                    </SectionReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── BUILT WITH ─────────────────────────────────────── */}
        <section className={`border-t py-24 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-4xl px-6 text-center">
            <SectionReveal>
              <p
                className={`mb-8 text-[11px] font-bold uppercase tracking-[0.22em] ${T.textFaint}`}
              >
                Powered by a modern stack
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {TECH_STACK.map((tech) => (
                  <span
                    key={tech}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${T.cardSubtle} ${T.textBody}`}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ─────────────────── FAQ ────────────────────────────────────────────── */}
        <section className={`border-t py-28 ${T.sectionBorder}`}>
          <div className="mx-auto max-w-3xl px-6">
            <SectionHeading
              eyebrow="FAQ"
              title="Questions, answered"
              subtitle="Everything you might be wondering about how TrackCod works."
            />

            <SectionReveal className="flex flex-col gap-3">
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={faq.question}
                  faq={faq}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </SectionReveal>
          </div>
        </section>

        {/* ─────────────────── CTA CLOSER ─────────────────────────────────────── */}
        <section className="pb-24 pt-8">
          <div className="mx-auto max-w-4xl px-6">
            <SectionReveal>
              <div
                className="rounded-3xl p-px shadow-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #d946ef 35%, #6366f1 70%, #06b6d4 100%)",
                  backgroundSize: "300% 300%",
                  animation: "shimmer-border 4s ease-in-out infinite",
                }}
              >
                <div className="relative overflow-hidden rounded-3xl bg-white px-8 py-20 text-center dark:bg-[#080816] md:px-16">
                  <div
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%)",
                    }}
                  />

                  <div className="relative z-10">
                    <div
                      className={`mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.05] ${T.textStrong}`}
                    >
                      <Quote className="h-3.5 w-3.5 text-violet-500 dark:text-violet-300" />
                      Your account is ready
                    </div>
                    <h2
                      className={`mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl ${T.heading}`}
                    >
                      Ready to open your{" "}
                      <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-cyan-300">
                        profile?
                      </span>
                    </h2>
                    <p
                      className={`mx-auto mb-10 max-w-2xl text-base leading-loose md:text-lg ${T.textBody}`}
                    >
                      Profile details, uploaded CVs, and an encrypted credentials vault — all in one
                      place.
                    </p>
                    <Link
                      href="/profile"
                      className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/40"
                    >
                      Open profile
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </div>
  );
}
