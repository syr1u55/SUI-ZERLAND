"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Zap, Shield, Swords, Crosshair, Heart, Skull, Play, User, Trophy, Star, Sparkles, Hexagon } from "lucide-react";
import { MOCK_ASSETS, type HeroItemNFT, getRpgStats, getShooterStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useArenaEngine } from "@/lib/arena-engine";

export default function ArenaPage() {
    const account = useCurrentAccount();
    const [selectedGame, setSelectedGame] = useState<"RPG" | "SHOOTER">("RPG");
    const [activeAsset, setActiveAsset] = useState<HeroItemNFT>(MOCK_ASSETS[0]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isRpg = selectedGame === "RPG";
    const [isClaiming, setIsClaiming] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);

    // Initialize Game Engine
    const { gameState, resetGame } = useArenaEngine(canvasRef, activeAsset, selectedGame, containerRef);

    const [stats, setStats] = useState({ wins: 0, losses: 0 });
    const lastProcessedState = useRef<string>("playing");

    // Load stats on mount
    useEffect(() => {
        const stored = localStorage.getItem("nexus_arena_stats");
        if (stored) {
            setStats(JSON.parse(stored));
        }
    }, []);

    // Update stats on game over
    useEffect(() => {
        if (gameState === lastProcessedState.current) return;

        let newStats = { ...stats };
        let updated = false;

        if (gameState === "victory") {
            newStats.wins += 1;
            updated = true;
        } else if (gameState === "defeat") {
            newStats.losses += 1;
            updated = true;
        }

        if (updated) {
            setStats(newStats);
            localStorage.setItem("nexus_arena_stats", JSON.stringify(newStats));
        }

        lastProcessedState.current = gameState;
    }, [gameState, stats]);

    // Calculate Derived Stats
    const totalGames = stats.wins + stats.losses;
    const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : "0.0";
    const kdRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins.toFixed(1);

    // Simple rank logic
    const getRank = (wins: number) => {
        if (wins < 5) return { name: "Rookie", color: "text-gray-400" };
        if (wins < 15) return { name: "Soldier", color: "text-green-400" };
        if (wins < 30) return { name: "Veteran", color: "text-blue-400" };
        if (wins < 50) return { name: "Elite", color: "text-purple-400" };
        return { name: "Legend", color: "text-amber-400" };
    };

    const rank = getRank(stats.wins);



    // Reset local claim state when game resets
    const handleReset = () => {
        setHasClaimed(false);
        resetGame();
        // Reset processed state so next game can be counted
        // Note: useArenaEngine resets gameState to 'playing', so the effect will run again but safely match 'playing'
    };


    const handleClaim = async () => {
        if (!account) {
            alert("Please connect your wallet to claim rewards.");
            return;
        }
        setIsClaiming(true);
        try {
            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: account.address })
            });
            const data = await res.json();

            if (res.ok) {
                setHasClaimed(true);
                alert("Victory Reward: 1 SUI has been sent to your wallet!");
            } else {
                const errorMessage = data?.error || JSON.stringify(data);
                if (errorMessage.toLowerCase().includes("rate-limited")) {
                    alert("Faucet is cooling down. Please wait a moment.");
                } else {
                    alert(`Claim Failed: ${errorMessage}`);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Network error while claiming.");
        } finally {
            setIsClaiming(false);
        }
    };

    // Contextual Stats
    const rpgStats = getRpgStats(activeAsset);
    const shooterStats = getShooterStats(activeAsset);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30 font-sans">
            {/* HUD Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold tracking-tight">
                        <Swords className="w-5 h-5 text-purple-500" />
                        <span>NEXUS<span className="text-purple-500">ARENA</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                            <button
                                onClick={() => setSelectedGame("RPG")}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                    isRpg ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Swords className="w-4 h-4" />
                                Fantasy RPG
                            </button>
                            <button
                                onClick={() => setSelectedGame("SHOOTER")}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                    !isRpg ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Crosshair className="w-4 h-4" />
                                Sci-Fi Shooter
                            </button>
                        </div>
                        <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-white/20 !h-[38px]" />
                    </div>
                </div>
            </header>

            <main className="container pt-32 pb-24 grid lg:grid-cols-12 gap-8 items-start">

                {/* Left Col: Asset Selection (Inventory) */}
                {/* Left Col: Profile & Arsenal */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Premium Profile Card */}
                    <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden relative group">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

                        {/* Profile Header */}
                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-[2px]">
                                        <div className="w-full h-full bg-[#151515] rounded-xl flex items-center justify-center">
                                            <User className="w-10 h-10 text-white/80" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#111] p-1 rounded-lg">
                                        <div className="bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-black" /> 42
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        {account ? "Commander" : "Guest Operator"}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                            account
                                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                : "bg-white/5 text-white/40 border-white/10"
                                        )}>
                                            <Hexagon className="w-3 h-3" />
                                            {account ? "Online" : "Offline Mode"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Player Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                    <div className="text-xs text-white/40 font-mono mb-1">WR%</div>
                                    <div className="text-lg font-bold text-white">{winRate}%</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                    <div className="text-xs text-white/40 font-mono mb-1">K/D</div>
                                    <div className="text-lg font-bold text-green-400">{kdRatio}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                    <div className="text-xs text-white/40 font-mono mb-1">RANK</div>
                                    <div className={cn("text-lg font-bold", rank.color)}>{rank.name}</div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px w-full bg-white/10" />

                        {/* Inventory Section */}
                        <div className="p-6 bg-white/[0.02]">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                Select Loadout
                            </h3>

                            <div className="space-y-3">
                                {MOCK_ASSETS.map((asset) => {
                                    const isActive = activeAsset.id === asset.id;
                                    return (
                                        <button
                                            key={asset.id}
                                            onClick={() => setActiveAsset(asset)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left relative overflow-hidden group/item",
                                                isActive
                                                    ? "bg-white/10 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)]"
                                                    : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5"
                                            )}
                                        >
                                            {/* Rarity Stripe */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1 transition-all",
                                                isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-50",
                                                asset.rarity === "legendary" ? "bg-amber-500" :
                                                    asset.rarity === "rare" ? "bg-blue-500" :
                                                        "bg-gray-500"
                                            )} />

                                            <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner ml-2">
                                                {asset.image}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h3 className={cn("font-bold text-sm truncate", isActive ? "text-white" : "text-white/70")}>
                                                        {asset.name}
                                                    </h3>
                                                    {isActive && <div className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-bold">EQUIPPED</div>}
                                                </div>

                                                <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                                                    <span className={cn(
                                                        "uppercase",
                                                        asset.rarity === "legendary" ? "text-amber-500" :
                                                            asset.rarity === "rare" ? "text-blue-400" : "text-gray-400"
                                                    )}>{asset.rarity}</span>
                                                    <span>•</span>
                                                    <span>ATK {asset.attack}</span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: The Game Canvas */}
                <div className="lg:col-span-8 relative flex flex-col gap-4 h-full">

                    {/* Game Controls & Info Bar */}
                    <div className="bg-[#111] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20 font-bold text-xs">W</span>
                                    <div className="flex gap-1">
                                        <span className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20 font-bold text-xs">A</span>
                                        <span className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20 font-bold text-xs">S</span>
                                        <span className="w-8 h-8 rounded bg-white/10 flex items-center justify-center border border-white/20 font-bold text-xs">D</span>
                                    </div>
                                </div>
                                <span className="text-xs text-white/40 font-mono uppercase">Move</span>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div className="flex items-center gap-3">
                                <span className="h-8 px-3 rounded bg-white/10 flex items-center justify-center border border-white/20 font-bold text-xs">SPACE / CLICK</span>
                                <span className="text-xs text-white/40 font-mono uppercase">Attack</span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="text-right">
                            <div className="text-xs text-white/40 uppercase font-mono">Current Weapon</div>
                            <div className="font-bold text-purple-400 flex items-center justify-end gap-2">
                                {isRpg ? <Swords className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
                                {activeAsset.name}
                            </div>
                        </div>
                    </div>

                    {/* Canvas Container */}
                    <motion.div
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "w-full aspect-[16/9] bg-black rounded-3xl border-2 relative overflow-hidden shadow-2xl",
                            isRpg ? "border-purple-500/30" : "border-blue-500/30"
                        )}
                    >
                        {/* Background Layer (CSS) */}
                        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                            {isRpg ? (
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />
                            ) : (
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />
                            )}
                            <div className="absolute inset-0 bg-black/40" />
                        </div>

                        {/* The Game Canvas */}
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none"
                        />

                        {/* Overlay: Game Over */}
                        {gameState !== "playing" && (
                            <div className="absolute inset-0 z-20 flex flex-col gap-4 items-center justify-center bg-black/80 backdrop-blur-sm">

                                {gameState === "victory" && !hasClaimed && (
                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={handleClaim}
                                        disabled={isClaiming}
                                        className="px-8 py-3 bg-yellow-500 text-black font-black text-xl rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.5)]"
                                    >
                                        {isClaiming ? (
                                            <>Converting Loot...</>
                                        ) : (
                                            <>
                                                <Trophy className="w-6 h-6" />
                                                CLAIM SUI REWARD
                                            </>
                                        )}
                                    </motion.button>
                                )}

                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform"
                                >
                                    {gameState === "victory" ? (hasClaimed ? "PLAY AGAIN" : "SKIP REWARD") : "RETRY MISSION"}
                                </motion.button>
                            </div>
                        )}

                    </motion.div>
                </div>
            </main>
        </div>
    );
}
