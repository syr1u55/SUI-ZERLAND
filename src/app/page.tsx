"use client";

import { motion } from "framer-motion";
import { Gamepad2, Sword, Swords, Coins, ShieldCheck, ArrowRight, Layers, Repeat, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[128px]" />
      </div>

      <nav className="relative z-50 container py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <Gamepad2 className="w-6 h-6 text-purple-500" />
          <span>NEXUS<span className="text-purple-500">GAMES</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#vision" className="hover:text-white transition-colors">Vision</a>
          <a href="#assets" className="hover:text-white transition-colors">Assets</a>
          <a href="#ecosystem" className="hover:text-white transition-colors">Ecosystem</a>
        </div>
        <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-white/20" />
      </nav>

      <main className="relative z-10 w-full overflow-hidden">
        {/* Hero Section */}
        <section className="container pt-20 pb-32 md:pt-32 md:pb-48 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-400 mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            The Future of Digital Ownership
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40"
          >
            Play to Own.<br />
            Not Just to Play.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed"
          >
            Stop renting your achievements. In the Nexus ecosystem, every sword, skin, and achievement is a verifiably owned asset that lives on the blockchain, forever yours to trade, sell, or take to the next game.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 items-center"
          >
            <a href="/arena" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-white/90 transition-all flex items-center gap-2">
              Launch Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="/royale" className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Casual Royale
            </a>
            <a href="/racing" className="px-8 py-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50 text-pink-200 rounded-full font-bold text-lg hover:scale-105 transition-all backdrop-blur-sm flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Neon Drift
            </a>
          </motion.div>
        </section>

        {/* Problem vs Solution */}
        <section id="vision" className="container py-24">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Traditional */}
            <div className="relative group">
              <div className="absolute inset-0 bg-red-500/5 rounded-3xl blur-xl group-hover:bg-red-500/10 transition-colors" />
              <div className="relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-6 text-red-500">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">The Old Model</h3>
                <ul className="space-y-4 text-white/60">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">×</span>
                    Assets are locked in one game server
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">×</span>
                    Developers can delete your items anytime
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">×</span>
                    Time & money spent = $0 when servers close
                  </li>
                </ul>
              </div>
            </div>

            {/* Web3 Solution */}
            <div className="relative group">
              <div className="absolute inset-0 bg-green-500/10 rounded-3xl blur-xl group-hover:bg-green-500/20 transition-colors" />
              <div className="relative p-8 rounded-3xl border border-green-500/30 bg-black/40 backdrop-blur-md ring-1 ring-green-500/20">
                <div className="absolute -top-4 -right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  THE FUTURE
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 text-green-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-green-400">The Nexus Model</h3>
                <ul className="space-y-4 text-white/80">
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>True ownership via NFTs on Sui</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Repeat className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Interoperable assets across games</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Coins className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Sell, trade, or lend your gear openly</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="container py-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for the Players</h2>
            <p className="text-white/60">
              We leverage blockchain not for buzzwords, but to solve real problems in the gaming industry.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sword className="w-6 h-6 text-purple-400" />}
              title="Cross-Game Items"
              description="Your 'Dragon Slayer' sword in an RPG becomes a 'Dragon Skin' weapon in the FPS, automatically."
            />
            <FeatureCard
              icon={<Coins className="w-6 h-6 text-amber-400" />}
              title="Liquid Economy"
              description="A global marketplace where item values are determined by players, not set arbitrarily by developers."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-blue-400" />}
              title="Immutable Legacy"
              description="Your achievements are carved into the blockchain. No server wipe can ever erase your history."
            />
          </div>
        </section>

        <footer className="border-t border-white/10 py-12 bg-black/50 backdrop-blur-xl">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Gamepad2 className="w-5 h-5 text-purple-500" />
              <span>NEXUS<span className="text-purple-500">GAMES</span></span>
            </div>
            <p className="text-sm text-white/40">© 2025 Nexus Gaming Protocol. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07]">
      <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
