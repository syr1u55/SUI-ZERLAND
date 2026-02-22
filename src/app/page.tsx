"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Sword, Swords, Coins, ShieldCheck, ArrowRight, Layers, Repeat, Zap, Users, Crosshair, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@mysten/dapp-kit";
import NeonGrid from "@/components/3d/NeonGrid";

export default function Home() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate stars only on the client to avoid hydration mismatch
    const generatedStars = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, // 0.5px to 2.5px
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 3,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white selection:bg-purple-500/30 overflow-x-hidden scanline-overlay">

      {/* ── 3D Neon Grid Background ──────────────────────────────── */}
      <NeonGrid />

      {/* ── Star Field (Overlay) ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden text-white/0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
            }}
          />
        ))}
        {/* Nebula gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="relative z-50 container py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-orbitron font-black text-xl tracking-tighter">
          <Gamepad2 className="w-6 h-6 text-purple-400" />
          <span>
            NEXUS<span className="text-purple-400" style={{ textShadow: "0 0 12px #a855f7" }}>GAMES</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/60 font-rajdhani tracking-wide">
          <a href="#vision" className="hover:text-white hover:text-shadow transition-colors uppercase">Vision</a>
          <a href="#assets" className="hover:text-white transition-colors uppercase">Assets</a>
          <a href="#ecosystem" className="hover:text-white transition-colors uppercase">Ecosystem</a>
        </div>

        <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-purple-900/40 hover:!border-purple-500/50 !transition-all" />
      </nav>

      <main className="relative z-10 w-full overflow-hidden">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="container pt-20 pb-16 md:pt-28 md:pb-24 flex flex-col items-center text-center">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-orbitron text-purple-400 mb-8 uppercase tracking-widest"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            The Future of Digital Ownership
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-orbitron font-black tracking-tight mb-8 glitch-text"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, rgba(168,85,247,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Play to Own.<br />
            Not Just to Play.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed font-rajdhani font-medium"
          >
            Stop renting your achievements. In the Nexus ecosystem, every sword, skin, and achievement is a verifiably owned asset that lives on the blockchain — forever yours to trade, sell, or take to the next game.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <a
              href="/arena"
              className="group relative px-8 py-4 bg-purple-600 text-white rounded-full font-orbitron font-bold text-base hover:bg-purple-500 transition-all flex items-center gap-2 uppercase tracking-wide shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_36px_rgba(168,85,247,0.7)]"
            >
              Launch Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="/royale"
              className="px-8 py-4 bg-white/5 border border-white/15 text-white rounded-full font-orbitron font-bold text-base hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm flex items-center gap-2 uppercase tracking-wide"
            >
              <Swords className="w-5 h-5" />
              Casual Royale
            </a>

            <a
              href="/racing"
              className="group px-8 py-4 rounded-full font-orbitron font-bold text-base transition-all backdrop-blur-sm flex items-center gap-2 uppercase tracking-wide text-pink-200 border border-pink-500/50 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))",
                boxShadow: "0 0 20px rgba(236,72,153,0.2)",
              }}
            >
              <Zap className="w-5 h-5 text-pink-400" />
              Neon Drift
            </a>
          </motion.div>
        </section>

        {/* ── Live Stats Ticker ─────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden border-y border-white/8 bg-black/40 backdrop-blur-sm py-3 mb-8">
          <div
            className="flex gap-16 whitespace-nowrap text-sm font-orbitron uppercase tracking-widest text-white/50"
            style={{ animation: "ticker-scroll 28s linear infinite" }}
          >
            {[...Array(3)].map((_, rep) => (
              <span key={rep} className="flex gap-16 shrink-0">
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-green-400" /><span className="text-green-400">1,247</span> PLAYERS ONLINE</span>
                <span className="text-white/20">///</span>
                <span className="flex items-center gap-2"><Crosshair className="w-4 h-4 text-blue-400" /><span className="text-blue-400">342</span> MATCHES LIVE</span>
                <span className="text-white/20">///</span>
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400">12 SUI</span> WON TODAY</span>
                <span className="text-white/20">///</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-pink-400" /><span className="text-pink-400">NEON DRIFT</span> RACE LIVE NOW</span>
                <span className="text-white/20">///</span>
                <span className="flex items-center gap-2"><Sword className="w-4 h-4 text-purple-400" /><span className="text-purple-400">89 NFT ITEMS</span> TRADED THIS HOUR</span>
                <span className="text-white/20">///</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Problem vs Solution ───────────────────────────────────── */}
        <section id="vision" className="container py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">

            {/* Traditional */}
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-xl group-hover:bg-red-500/10 transition-colors" />
              <div className="relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-6 text-red-500">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-orbitron font-bold mb-4">The Old Model</h3>
                <ul className="space-y-4 text-white/60 font-rajdhani text-lg">
                  <li className="flex items-start gap-3"><span className="text-red-500 text-xl">×</span> Assets are locked in one game server</li>
                  <li className="flex items-start gap-3"><span className="text-red-500 text-xl">×</span> Developers can delete your items anytime</li>
                  <li className="flex items-start gap-3"><span className="text-red-500 text-xl">×</span> Time &amp; money spent = $0 when servers close</li>
                </ul>
              </div>
            </div>

            {/* Web3 Solution */}
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/10 rounded-3xl blur-xl group-hover:bg-green-500/20 transition-colors" />
              <div
                className="relative p-8 rounded-3xl border border-green-500/30 bg-black/40 backdrop-blur-md"
                style={{ boxShadow: "0 0 40px rgba(34,197,94,0.08)" }}
              >
                <div className="absolute -top-4 -right-4 bg-green-500 text-black text-xs font-orbitron font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  THE FUTURE
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 text-green-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-orbitron font-bold mb-4 text-green-400">The Nexus Model</h3>
                <ul className="space-y-4 text-white/80 font-rajdhani text-lg">
                  <li className="flex items-start gap-3"><ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span>True ownership via NFTs on Sui</span></li>
                  <li className="flex items-start gap-3"><Repeat className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span>Interoperable assets across games</span></li>
                  <li className="flex items-start gap-3"><Coins className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span>Sell, trade, or lend your gear openly</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ─────────────────────────────────────────── */}
        <section id="ecosystem" className="container py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-orbitron font-bold mb-6">Built for the Players</h2>
            <p className="text-white/60 font-rajdhani text-lg">
              We leverage blockchain not for buzzwords, but to solve real problems in the gaming industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sword className="w-6 h-6 text-purple-400" />}
              glowColor="rgba(168,85,247,0.3)"
              title="Cross-Game Items"
              description="Your 'Dragon Slayer' sword in an RPG becomes a 'Dragon Skin' weapon in the FPS, automatically."
            />
            <FeatureCard
              icon={<Coins className="w-6 h-6 text-amber-400" />}
              glowColor="rgba(251,191,36,0.3)"
              title="Liquid Economy"
              description="A global marketplace where item values are determined by players, not set arbitrarily by developers."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-blue-400" />}
              glowColor="rgba(96,165,250,0.3)"
              title="Immutable Legacy"
              description="Your achievements are carved into the blockchain. No server wipe can ever erase your history."
            />
          </div>
        </section>

        {/* ── Controls Reference ──────────────────────────────────── */}
        <section id="assets" className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-orbitron font-bold mb-3">Game Controls</h2>
            <p className="text-white/50 font-rajdhani text-lg">Jump in and play — here&apos;s all you need to know.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ControlCard
              game="NEXUS ARENA"
              color="purple"
              controls={[
                { keys: ["W", "A", "S", "D"], label: "Move" },
                { keys: ["SPACE"], label: "Attack" },
                { keys: ["CLICK"], label: "Aim & Fire" },
              ]}
            />
            <ControlCard
              game="NEXUS ROYALE"
              color="blue"
              controls={[
                { keys: ["W", "A", "S", "D"], label: "Move" },
                { keys: ["CLICK"], label: "Shoot" },
                { keys: ["R"], label: "Reload" },
              ]}
            />
            <ControlCard
              game="NEON DRIFT"
              color="pink"
              controls={[
                { keys: ["↑", "↓"], label: "Accelerate / Brake" },
                { keys: ["←", "→"], label: "Steer" },
                { keys: ["SHIFT"], label: "Turbo Boost" },
              ]}
            />
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t border-white/10 py-12 bg-black/50 backdrop-blur-xl">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-orbitron font-bold text-lg">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span>NEXUS<span className="text-purple-400">GAMES</span></span>
            </div>
            <p className="text-sm text-white/40 font-rajdhani">© 2026 Nexus Gaming Protocol. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, glowColor, title, description }: {
  icon: React.ReactNode;
  glowColor: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 transition-all hover:bg-white/[0.08] cursor-default relative overflow-hidden"
      style={{ "--glow": glowColor } as React.CSSProperties}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 30px ${glowColor}` }}
      />
      <div
        className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
        style={{ boxShadow: `0 0 16px ${glowColor}` }}
      >
        {icon}
      </div>
      <h3 className="text-xl font-orbitron font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed font-rajdhani">{description}</p>
    </div>
  );
}

// ─── Control Card ─────────────────────────────────────────────────────────────
const colorMap: Record<string, { border: string; glow: string; text: string }> = {
  purple: { border: "border-purple-500/30", glow: "rgba(168,85,247,0.2)", text: "text-purple-400" },
  blue: { border: "border-blue-500/30", glow: "rgba(96,165,250,0.2)", text: "text-blue-400" },
  pink: { border: "border-pink-500/30", glow: "rgba(236,72,153,0.2)", text: "text-pink-400" },
};

function ControlCard({ game, color, controls }: {
  game: string;
  color: "purple" | "blue" | "pink";
  controls: { keys: string[]; label: string }[];
}) {
  const c = colorMap[color];
  return (
    <div
      className={cn("p-6 rounded-2xl bg-black/40 border backdrop-blur-sm", c.border)}
      style={{ boxShadow: `0 0 24px ${c.glow}` }}
    >
      <h3 className={cn("font-orbitron font-bold text-sm mb-5 uppercase tracking-widest", c.text)}>{game}</h3>
      <div className="space-y-3">
        {controls.map(({ keys, label }) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <div className="flex gap-1 flex-wrap">
              {keys.map((k) => (
                <span key={k} className="key-cap">{k}</span>
              ))}
            </div>
            <span className="text-xs text-white/50 font-rajdhani font-semibold uppercase tracking-wider shrink-0">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
