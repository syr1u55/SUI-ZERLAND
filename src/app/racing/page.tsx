"use client";

import { motion } from "framer-motion";
import { Flag, Timer, Zap, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";

export default function RacingPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-pink-500/30">
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2 font-bold tracking-tight">
                            <Zap className="w-5 h-5 text-pink-500" />
                            <span>NEON<span className="text-pink-500">DRIFT</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-white/20 !h-[38px]" />
                    </div>
                </div>
            </header>

            <main className="container pt-32 pb-24 flex flex-col items-center justify-center min-h-screen text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 relative"
                >
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full" />
                    <Zap className="w-24 h-24 text-pink-500 relative z-10" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-pink-500"
                >
                    NEON DRIFT
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-white/60 max-w-2xl mb-12"
                >
                    High-octane racing on the blockchain. Compete for pink slips, trade parts, and dominate the leaderboards.
                </motion.p>

                <div className="grid md:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <Timer className="w-8 h-8 text-pink-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Time Attack</h3>
                        <p className="text-sm text-white/40">Race against the clock to set world records.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <Flag className="w-8 h-8 text-purple-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">PvP Drift</h3>
                        <p className="text-sm text-white/40">Real-time drift battles against other players.</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <Trophy className="w-8 h-8 text-yellow-500 mb-4" />
                        <h3 className="text-xl font-bold mb-2">Tournaments</h3>
                        <p className="text-sm text-white/40">Weekly tournaments with massive SUI prize pools.</p>
                    </div>
                </div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="px-8 py-3 rounded-full bg-white/10 border border-white/20 text-sm font-mono tracking-widest uppercase"
                >
                    Coming Soon • Q1 2026
                </motion.div>
            </main>
        </div>
    );
}
