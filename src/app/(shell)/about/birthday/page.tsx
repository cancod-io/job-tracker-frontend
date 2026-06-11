"use client";

import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import {
  Code2,
  Crown,
  Globe,
  Heart,
  Quote,
  Rocket,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

// ─── Update these values ───────────────────────────────────────────────────────
/** First name of the birthday person shown in headline, badge, and closing card. */
const BIRTHDAY_NAME = "Eduard"; // ← update to actual name

// ─── Types ─────────────────────────────────────────────────────────────────────
type StatDef = { value: number; suffix: string; label: string; Icon: LucideIcon };
type MemberDef = {
  id: number;
  photo: string;
  name: string;
  role: string;
  bio: string;
  skills: string[];
  isBirthday: boolean;
};
type MilestoneDef = {
  date: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  gradient: string;
};
type ValueDef = { Icon: LucideIcon; title: string; description: string; gradient: string };

// ─── Data ──────────────────────────────────────────────────────────────────────

const STATS: StatDef[] = [
  { value: 12000, suffix: "+", label: "Jobs Indexed", Icon: Globe },
  { value: 6, suffix: "", label: "Team Members", Icon: Users },
  { value: 24, suffix: "+", label: "Features Shipped", Icon: Zap },
  { value: 98, suffix: "%", label: "Uptime", Icon: Trophy },
];

const TEAM: MemberDef[] = [
  {
    id: 1,
    photo: "/pm.png",
    name: BIRTHDAY_NAME, // ← update to full name
    role: "Product Manager & Team Lead",
    bio: "The visionary force behind TrackCod. From the earliest whiteboard sketch to every production-ready feature, your leadership has kept the team focused, motivated, and shipping with purpose — every single sprint.",
    skills: ["Product Strategy", "Roadmapping", "Team Leadership"],
    isBirthday: true,
  },
  {
    id: 2,
    photo: "/workflow-specialist.png",
    name: "Kamil Luis Maria Ponce",
    role: "Product / Workflow Specialist",
    bio: "The operational backbone of the team. Kamil bridges product thinking and execution — designing the workflows and processes that keep everything running smoothly, even as complexity scales.",
    skills: ["Workflow Design", "Process Optimization", "Product Ops"],
    isBirthday: false,
  },
  {
    id: 3,
    photo: "/QA-engineer.png",
    name: "Liam Smith",
    role: "Devops / QA Engineer",
    bio: "The guardian of reliability. Liam ensures every deployment is solid and every edge case is caught before it reaches users. Our CI/CD pipeline and infrastructure quality are a direct reflection of his meticulous work.",
    skills: ["DevOps", "CI/CD Pipelines", "Quality Assurance"],
    isBirthday: false,
  },
  {
    id: 4,
    photo: "/backend.png",
    name: "Liam Eduardo Freitas Brandao",
    role: "Backend Lead",
    bio: "The architect of TrackCod's core systems. Liam designed and built the APIs and data infrastructure that power the platform — balancing performance, reliability, and clean design at every layer.",
    skills: ["Python", "FastAPI", "System Architecture"],
    isBirthday: false,
  },
  {
    id: 5,
    photo: "/scraper.png",
    name: "Howard Johnson",
    role: "Senior Scraper Engineer",
    bio: "The engine behind our data. Howard built and maintains the scraping pipelines that aggregate thousands of Shopify job listings daily — with precision, resilience, and the kind of reliability the team depends on.",
    skills: ["Web Scraping", "Data Pipelines", "Automation"],
    isBirthday: false,
  },
  {
    id: 6,
    photo: "/frontend.png",
    name: "Kian Arnold",
    role: "Senior Frontend Developer",
    bio: "The craftsman behind every interface. Kian turns designs into fast, accessible, and delightful user experiences — from the job listing feed to every subtle micro-interaction that makes TrackCod feel polished.",
    skills: ["Next.js", "TypeScript", "Tailwind CSS"],
    isBirthday: false,
  },
];

const TEAM_AVATARS_FOR_HERO = [
  "/workflow-specialist.png",
  "/QA-engineer.png",
  "/backend.png",
  "/scraper.png",
  "/frontend.png",
];

const MILESTONES: MilestoneDef[] = [
  {
    date: "Q1 2024",
    title: "The Spark",
    description:
      "Frustrated by scattered Shopify job listings, we asked: what if there was one place for everything? The idea for TrackCod was born over a 30-minute conversation.",
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
      "Internal alpha went live. Rough edges, big ambitions, and the first real signal that users wanted exactly this — and more.",
    Icon: Zap,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    date: "Q4 2024",
    title: "10,000 Jobs",
    description:
      "A milestone worth celebrating — TrackCod crossed 10,000 curated Shopify jobs. The scrappy weekend pipeline was now a production-grade system.",
    Icon: Trophy,
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    date: "2025",
    title: "Scaling Up",
    description:
      "New features, growing users, advanced filtering, and a team that ships with confidence every sprint. The best chapters are still ahead.",
    Icon: TrendingUp,
    gradient: "from-rose-500 to-pink-500",
  },
];

const VALUES: ValueDef[] = [
  {
    Icon: Heart,
    title: "User-First Always",
    description: "Every decision starts and ends with the person looking for their next Shopify role.",
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
      "Speed never comes at the cost of quality. We take pride in the details no one notices — until they're missing.",
    gradient: "from-violet-500 to-indigo-500",
  },
];

// ─── Hook ──────────────────────────────────────────────────────────────────────

function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
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

function TeamCard({ member, delay }: { member: MemberDef; delay: number }) {
  const cardContent = (
    <div
      className={`flex h-full flex-col ${
        member.isBirthday ? "rounded-[15px] bg-[#0c0c1a]" : "rounded-2xl"
      }`}
    >
      {/* Photo area */}
      <div className="relative overflow-hidden rounded-t-[inherit]">
        <div className="relative h-[300px] w-full overflow-hidden">
          <Image
            src={member.photo}
            alt={member.name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {/* gradient overlay at bottom of photo */}
          <div
            className={`absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t ${
              member.isBirthday ? "from-[#0c0c1a]" : "from-[#0d0d1c]"
            } to-transparent`}
          />
        </div>

        {/* Birthday badge on photo */}
        {member.isBirthday && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-sm">
            <Crown className="h-3 w-3" />
            Birthday Star
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-6 pb-7 pt-4">
        <p
          className={`mb-0.5 font-bold text-white ${member.isBirthday ? "text-xl" : "text-lg"}`}
        >
          {member.name}
        </p>
        <p
          className={`mb-4 text-xs font-semibold uppercase tracking-wider ${
            member.isBirthday ? "text-amber-400/80" : "text-white/35"
          }`}
        >
          {member.role}
        </p>
        <p className="mb-5 flex-1 text-sm leading-relaxed text-white/50">{member.bio}</p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-white/50"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (member.isBirthday) {
    return (
      <SectionReveal delay={delay} className="group h-full">
        <div
          className="h-full rounded-2xl p-px"
          style={{
            background:
              "linear-gradient(135deg, #f59e0b 0%, #ef4444 30%, #8b5cf6 60%, #06b6d4 100%)",
            backgroundSize: "300% 300%",
            animation: "shimmer-border 3s ease-in-out infinite, glow-pulse 3s ease-in-out infinite",
          }}
        >
          {cardContent}
        </div>
      </SectionReveal>
    );
  }

  return (
    <SectionReveal delay={delay} className="group h-full">
      <div className="h-full rounded-2xl border border-white/[0.07] bg-[#0d0d1c] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]">
        {cardContent}
      </div>
    </SectionReveal>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

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

  const confetti = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        size: 4 + ((i * 1.5) % 9),
        top: (i * 7.2) % 96,
        left: (i * 7.9) % 96,
        color: ["#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981", "#f472b6"][i % 6],
        opacity: 0.2 + ((i * 0.038) % 0.2),
        duration: 4 + ((i * 0.9) % 4),
        delay: i * 0.28,
      })),
    [],
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060610] text-white">
      {/* ── Ambient background orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -left-56 -top-56 h-[750px] w-[750px] rounded-full bg-violet-700/20 blur-[160px]"
          style={{ animation: "float-orb 9s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-56 top-1/3 h-[640px] w-[640px] rounded-full bg-blue-700/15 blur-[150px]"
          style={{ animation: "float-orb 11s ease-in-out infinite reverse" }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-[520px] w-[520px] rounded-full bg-rose-700/10 blur-[130px]"
          style={{ animation: "float-orb 13s ease-in-out infinite 1.5s" }}
        />
        {/* Mouse-tracking glow */}
        <div
          className="absolute h-72 w-72 rounded-full bg-amber-500/[0.06] blur-[80px]"
          style={{
            left: mouseX - 144,
            top: mouseY - 144,
            transition: "left 1.1s ease-out, top 1.1s ease-out",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* ─────────────────── HERO — two-column ──────────────────────────────── */}
        <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden px-6 py-20">
          {/* Floating particles */}
          {particles.map((p) => (
            <span
              key={p.id}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-white"
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

          <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-6xl flex-col items-center gap-14 md:flex-row md:gap-12 lg:gap-20">
            {/* ── Left: PM photo ── */}
            <div
              className="flex w-full flex-shrink-0 flex-col items-center md:w-[42%]"
              style={{ animation: "fade-in-up 0.65s ease-out both" }}
            >
              {/* Outer glow ring */}
              <div className="relative">
                <div
                  className="absolute inset-0 scale-105 rounded-3xl blur-2xl"
                  style={{
                    background:
                      "radial-gradient(ellipse, rgba(251,191,36,0.22) 0%, rgba(239,68,68,0.1) 50%, transparent 75%)",
                  }}
                  aria-hidden
                />

                {/* Animated gradient border frame */}
                <div
                  className="relative overflow-hidden rounded-3xl p-px"
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #ef4444 28%, #8b5cf6 60%, #06b6d4 100%)",
                    backgroundSize: "300% 300%",
                    animation:
                      "shimmer-border 3s ease-in-out infinite, glow-pulse 3s ease-in-out infinite",
                  }}
                >
                  <div className="relative overflow-hidden rounded-[23px]">
                    <Image
                      src="/pm.png"
                      alt="Our PM & Leader"
                      width={420}
                      height={480}
                      className="block w-full max-w-[340px] object-cover object-center md:max-w-none"
                      priority
                    />
                    {/* Bottom overlay with label */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0b18] via-[#0b0b18]/70 to-transparent pb-5 pt-20 text-center">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-sm">
                        <Crown className="h-3 w-3" />
                        PM &amp; Team Lead
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating sparkle dots around the photo */}
                {[
                  { top: "-6%", left: "-4%", size: 8, delay: "0s" },
                  { top: "12%", right: "-6%", size: 6, delay: "0.8s" },
                  { bottom: "20%", left: "-7%", size: 10, delay: "1.4s" },
                  { bottom: "-4%", right: "10%", size: 7, delay: "0.4s" },
                ].map((dot, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="pointer-events-none absolute rounded-full bg-amber-400"
                    style={{
                      width: dot.size,
                      height: dot.size,
                      top: dot.top,
                      left: "left" in dot ? dot.left : undefined,
                      right: "right" in dot ? dot.right : undefined,
                      bottom: "bottom" in dot ? dot.bottom : undefined,
                      opacity: 0.55,
                      animation: `particle-float 4s ease-in-out infinite ${dot.delay}`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Right: Birthday message ── */}
            <div
              className="flex w-full flex-col items-center text-center md:items-start md:text-left"
              style={{ animation: "fade-in-up 0.65s ease-out 0.15s both" }}
            >
              {/* Celebration badge */}
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-5 py-2 text-sm font-medium text-amber-300 backdrop-blur-sm">
                <span aria-hidden>🎉</span>
                <span>A Special Celebration</span>
                <span aria-hidden>🎂</span>
              </div>

              {/* Main headline */}
              <h1 className="mb-3 text-[clamp(2.6rem,6vw,5.2rem)] font-extrabold leading-[1.05] tracking-tight">
                <span className="block text-white/90">Happy Birthday,</span>
                <span
                  className="block bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent"
                  style={{
                    backgroundSize: "200% auto",
                    animation: "gradient-pan 4s linear infinite",
                  }}
                >
                  {BIRTHDAY_NAME}!
                </span>
              </h1>

              {/* Sub-role line */}
              <p className="mb-6 text-base font-medium text-white/40 md:text-lg">
                To our PM &amp; Leader — from the entire TrackCod Team
              </p>

              {/* Decorative divider */}
              <div className="mb-7 h-px w-20 bg-gradient-to-r from-amber-400/60 to-transparent" />

              {/* Creative message */}
              <blockquote className="relative mb-9">
                <Quote
                  className="mb-3 h-7 w-7 text-amber-400/35"
                  aria-hidden
                />
                <p className="text-[1rem] leading-loose text-white/50 md:text-[1.08rem]">
                  This project wasn&apos;t just built — it was{" "}
                  <span className="font-semibold text-white/80">driven</span>. Every sprint, every
                  feature, every late-night push carries your vision at its core. TrackCod exists
                  because you believed in turning a real frustration into something the Shopify
                  community could rely on.
                </p>
                <p className="mt-4 text-[1rem] leading-loose md:text-[1.08rem]">
                  <span className="font-semibold text-amber-300/90">
                    Today, we built this page — for you. 🚀
                  </span>
                </p>
              </blockquote>

              {/* Team avatar stack + signature */}
              <div className="flex flex-col items-center gap-3 md:items-start">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {TEAM_AVATARS_FOR_HERO.map((src, i) => (
                      <div
                        key={i}
                        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#060610]"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover object-top"
                          sizes="40px"
                          aria-hidden
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-white/35">
                    with love,{" "}
                    <span className="font-semibold text-white/60">the TrackCod Team</span> ♥
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── VIDEO ──────────────────────────────────────────── */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <SectionReveal>
              <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02] shadow-2xl">
                <video
                  src="/video.mp4"
                  controls
                  playsInline
                  className="h-auto w-full"
                />
              </div>
            </SectionReveal>
          </div>
        </section>

        {/* ─────────────────── STATS ──────────────────────────────────────────── */}
        <section className="border-y border-white/[0.05] bg-white/[0.015] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((stat, i) => {
                const Icon = stat.Icon;
                return (
                  <SectionReveal key={stat.label} delay={i * 0.1} className="text-center">
                    <div className="mb-3 flex justify-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-white/40" />
                      </div>
                    </div>
                    <div className="mb-1.5 text-[2.5rem] font-extrabold leading-none tracking-tight text-white md:text-5xl">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                      {stat.label}
                    </div>
                  </SectionReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────── MISSION ────────────────────────────────────────── */}
        <section className="py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              {/* Left */}
              <SectionReveal>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                  Our Mission
                </div>
                <h2 className="mb-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Built for people who{" "}
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                    build with Shopify
                  </span>
                </h2>
                <p className="mb-5 text-[0.96rem] leading-loose text-white/45">
                  TrackCod exists because finding great Shopify jobs shouldn&apos;t require scrolling
                  through five different job boards, a dozen LinkedIn searches, and a folder full of
                  browser bookmarks.
                </p>
                <p className="text-[0.96rem] leading-loose text-white/45">
                  We built the tool we wished existed — one that aggregates, curates, and tracks
                  Shopify ecosystem jobs so developers and designers can spend their energy on what
                  actually matters: landing the right role.
                </p>
              </SectionReveal>

              {/* Right: core values */}
              <div className="flex flex-col gap-4">
                {VALUES.map((val, i) => {
                  const Icon = val.Icon;
                  return (
                    <SectionReveal key={val.title} delay={0.1 + i * 0.1}>
                      <div className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
                        <div
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${val.gradient} shadow-md`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-bold text-white">{val.title}</p>
                          <p className="text-sm leading-relaxed text-white/45">{val.description}</p>
                        </div>
                      </div>
                    </SectionReveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────── TEAM ───────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05] py-28">
          <div className="mx-auto max-w-6xl px-6">
            <SectionReveal className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                The Team
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Built by people who care
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[0.96rem] text-white/40">
                Small by design. Every person here was chosen for their craft, their curiosity, and
                their commitment to shipping things that actually matter.
              </p>
            </SectionReveal>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.map((member, i) => (
                <TeamCard key={member.id} member={member} delay={i * 0.08} />
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────── TIMELINE ───────────────────────────────────────── */}
        <section className="border-t border-white/[0.05] py-28">
          <div className="mx-auto max-w-4xl px-6">
            <SectionReveal className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">
                What We&apos;ve Built
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Our story so far
              </h2>
            </SectionReveal>

            <div className="relative">
              {/* Mobile vertical line */}
              <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-violet-500/40 via-white/10 to-transparent md:hidden" />
              {/* Desktop center line */}
              <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-px bg-gradient-to-b from-violet-500/40 via-white/10 to-transparent md:block" />

              <div className="flex flex-col gap-10">
                {MILESTONES.map((m, i) => {
                  const Icon = m.Icon;
                  const isEven = i % 2 === 0;

                  const card = (
                    <div className="max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/[0.13] hover:bg-white/[0.055]">
                      <span className="mb-2.5 inline-block rounded-lg bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold text-white/45">
                        {m.date}
                      </span>
                      <p className="mb-1.5 text-sm font-bold text-white">{m.title}</p>
                      <p className="text-sm leading-relaxed text-white/45">{m.description}</p>
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

        {/* ─────────────────── BIRTHDAY CLOSER ───────────────────────────────── */}
        <section className="pb-24 pt-8">
          <div className="mx-auto max-w-4xl px-6">
            <SectionReveal>
              <div
                className="rounded-3xl p-px"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #ef4444 28%, #8b5cf6 58%, #06b6d4 100%)",
                  backgroundSize: "300% 300%",
                  animation: "shimmer-border 4s ease-in-out infinite",
                }}
              >
                <div className="relative overflow-hidden rounded-3xl bg-[#080816] px-8 py-20 text-center md:px-16">
                  {/* Confetti dots */}
                  {confetti.map((dot) => (
                    <span
                      key={dot.id}
                      aria-hidden
                      className="pointer-events-none absolute rounded-full"
                      style={{
                        width: `${dot.size}px`,
                        height: `${dot.size}px`,
                        top: `${dot.top}%`,
                        left: `${dot.left}%`,
                        background: dot.color,
                        opacity: dot.opacity,
                        animation: `particle-float ${dot.duration}s ease-in-out infinite ${dot.delay}s`,
                      }}
                    />
                  ))}
                  {/* Inner top glow */}
                  <div
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    aria-hidden
                    style={{
                      background:
                        "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,0.1) 0%, transparent 70%)",
                    }}
                  />

                  <div className="relative z-10">
                    <span className="mb-5 block text-6xl" role="img" aria-label="Birthday cake">
                      🎂
                    </span>
                    <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                      Happy Birthday,{" "}
                      <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent">
                        {BIRTHDAY_NAME}!
                      </span>
                    </h2>
                    <p className="mx-auto mb-4 max-w-2xl text-base leading-loose text-white/55 md:text-lg">
                      From the first conversation that sparked this idea, to every late-night standup,
                      every feature shipped, every blocker cleared — your leadership and vision have
                      been the foundation everything else is built on.
                    </p>
                    <p className="mx-auto max-w-xl text-base leading-loose text-white/55 md:text-lg">
                      Here&apos;s to another year of building great things together.{" "}
                      <span className="font-semibold text-amber-300/90">
                        Thank you for everything.
                      </span>{" "}
                      🚀
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-2 text-sm font-medium text-white/30">
                      <span>With appreciation,</span>
                      <span className="font-semibold text-white/55">the TrackCod Team</span>
                    </div>
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
