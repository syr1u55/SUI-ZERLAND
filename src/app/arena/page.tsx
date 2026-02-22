"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap, Shield, Swords, Crosshair, Heart, Skull, User, Trophy, Star, Sparkles, Hexagon, HelpCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { MOCK_ASSETS, type HeroItemNFT, getRpgStats, getShooterStats } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useArenaEngine } from "@/lib/arena-engine";
import { useOwnedAssets } from "@/lib/hooks/use-assets";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import HeroStage from "@/components/3d/HeroStage";

// ─── Pressed-key tracker ──────────────────────────────────────────────────────
function useKeyTracker(keys: string[]) {
    const [pressed, setPressed] = useState<Set<string>>(new Set());
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const k = e.key.toUpperCase();
            if (keys.includes(k)) setPressed(prev => new Set(prev).add(k));
        };
        const up = (e: KeyboardEvent) => {
            const k = e.key.toUpperCase();
            setPressed(prev => { const n = new Set(prev); n.delete(k); return n; });
        };
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    }, [keys]);
    return pressed;
}

// ─── Virtual key dispatcher ───────────────────────────────────────────────────
function fireKey(key: string, type: "keydown" | "keyup") {
    const codes: Record<string, string> = {
        "W": "KeyW", "A": "KeyA", "S": "KeyS", "D": "KeyD",
        "ARROWUP": "ArrowUp", "ARROWDOWN": "ArrowDown", "ARROWLEFT": "ArrowLeft", "ARROWRIGHT": "ArrowRight",
        " ": "Space",
    };
    window.dispatchEvent(new KeyboardEvent(type, {
        key, code: codes[key.toUpperCase()] ?? key, bubbles: true, cancelable: true,
    }));
}

export default function ArenaPage() {
    const account = useCurrentAccount();
    const { assets } = useOwnedAssets();
    const [selectedGame, setSelectedGame] = useState<"RPG" | "SHOOTER">("RPG");
    const [activeAsset, setActiveAsset] = useState<HeroItemNFT>(assets[0]);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        if (!activeAsset && assets.length > 0) setActiveAsset(assets[0]);
    }, [assets, activeAsset]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isRpg = selectedGame === "RPG";
    const [isClaiming, setIsClaiming] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);

    const { gameState, resetGame } = useArenaEngine(canvasRef, activeAsset, selectedGame, containerRef);

    const [stats, setStats] = useState({ wins: 0, losses: 0 });
    const lastProcessedState = useRef<string>("playing");

    const pressedKeys = useKeyTracker(["W", "A", "S", "D", " "]);

    // ── Load stats ──
    useEffect(() => {
        const stored = localStorage.getItem("nexus_arena_stats");
        if (stored) setStats(JSON.parse(stored));
    }, []);

    // ── Update stats on game over ──
    useEffect(() => {
        if (gameState === lastProcessedState.current) return;
        let newStats = { ...stats };
        let updated = false;
        if (gameState === "victory") { newStats.wins += 1; updated = true; }
        else if (gameState === "defeat") { newStats.losses += 1; updated = true; }
        if (updated) {
            setStats(newStats);
            localStorage.setItem("nexus_arena_stats", JSON.stringify(newStats));
        }
        lastProcessedState.current = gameState;
    }, [gameState, stats]);

    const totalGames = stats.wins + stats.losses;
    const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : "0.0";
    const kdRatio = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : stats.wins.toFixed(1);

    const getRank = (wins: number) => {
        if (wins < 5) return { name: "Rookie", color: "text-gray-400" };
        if (wins < 15) return { name: "Soldier", color: "text-green-400" };
        if (wins < 30) return { name: "Veteran", color: "text-blue-400" };
        if (wins < 50) return { name: "Elite", color: "text-purple-400" };
        return { name: "Legend", color: "text-amber-400" };
    };
    const rank = getRank(stats.wins);

    const handleReset = () => {
        setHasClaimed(false);
        resetGame();
    };

    const handleClaim = async () => {
        if (!account) { alert("Please connect your wallet to claim rewards."); return; }
        setIsClaiming(true);
        try {
            // PHASE 1: Generate Proof (Simulated)
            const proof = `win_proof_arena_${Date.now()}_${account.address.substring(0, 6)}`;

            const res = await fetch('/api/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account.address,
                    game: "Nexus Arena",
                    amount: 1,
                    proof: proof,
                })
            });
            const data = await res.json();
            if (res.ok) {
                setHasClaimed(true);
                alert("Reward Request Sent! Your payout is being processed (Verified).");
            } else {
                const errorMessage = data?.error || JSON.stringify(data);
                alert(`Verification Failed: ${errorMessage}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error while claiming.");
        } finally {
            setIsClaiming(false);
        }
    };

    const rpgStats = getRpgStats(activeAsset);
    const shooterStats = getShooterStats(activeAsset);

    // ── Virtual D-Pad handlers ──
    const dpadButtons = [
        { key: "W", icon: <ChevronUp className="w-5 h-5" />, style: "col-start-2 row-start-1" },
        { key: "A", icon: <ChevronLeft className="w-5 h-5" />, style: "col-start-1 row-start-2" },
        { key: "S", icon: <ChevronDown className="w-5 h-5" />, style: "col-start-2 row-start-2" },
        { key: "D", icon: <ChevronRight className="w-5 h-5" />, style: "col-start-3 row-start-2" },
    ];

    // HP/XP derived from asset stats (for cosmetic display)
    const maxHp = 100 + activeAsset.defense;
    const hp = gameState === "defeat" ? 0 : gameState === "victory" ? maxHp : Math.round(0.65 * maxHp);
    const xp = Math.min(100, stats.wins * 12);

    return (
        <div className="min-h-screen bg-[#080810] text-white selection:bg-purple-500/30 font-rajdhani">

            {/* ── HUD Header ─────────────────────────────────────────── */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                <div className="container h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </Link>
                        <div className="flex items-center gap-2 font-orbitron font-bold tracking-tight">
                            <Swords className="w-5 h-5 text-purple-400" />
                            <span>NEXUS<span className="text-purple-400" style={{ textShadow: "0 0 10px #a855f7" }}>ARENA</span></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                            <button
                                onClick={() => setSelectedGame("RPG")}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-orbitron font-bold transition-all flex items-center gap-2 uppercase tracking-wide",
                                    isRpg ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Swords className="w-4 h-4" /> Fantasy RPG
                            </button>
                            <button
                                onClick={() => setSelectedGame("SHOOTER")}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-orbitron font-bold transition-all flex items-center gap-2 uppercase tracking-wide",
                                    !isRpg ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Crosshair className="w-4 h-4" /> Sci-Fi Shooter
                            </button>
                        </div>
                        <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-white/20 !h-[38px]" />
                    </div>
                </div>
            </header>

            <main className="container pt-32 pb-24 grid lg:grid-cols-12 gap-8 items-start">

                {/* ── Left Col: Profile & Arsenal ─────────────────────── */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-[#0f0f1a] border border-white/10 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60" />

                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-[2px]">
                                        <div className="w-full h-full bg-[#151525] rounded-xl flex items-center justify-center">
                                            <User className="w-10 h-10 text-white/80" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#111] p-1 rounded-lg">
                                        <div className="bg-yellow-500 text-black text-[10px] font-orbitron font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-black" /> 42
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-orbitron font-bold text-white tracking-tight">
                                        {account ? "Commander" : "Guest Operator"}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase tracking-wider border",
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

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[
                                    { label: "WR%", value: `${winRate}%`, color: "text-white" },
                                    { label: "K/D", value: kdRatio, color: "text-green-400" },
                                    { label: "RANK", value: rank.name, color: rank.color },
                                ].map(({ label, value, color }) => (
                                    <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                                        <div className="text-xs text-white/40 font-orbitron mb-1">{label}</div>
                                        <div className={cn("text-lg font-orbitron font-bold", color)}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* HP Bar */}
                            <div className="space-y-2 mb-2">
                                <div className="flex justify-between text-xs font-orbitron text-white/40">
                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> HP</span>
                                    <span>{hp} / {maxHp}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }}
                                        animate={{ width: `${(hp / maxHp) * 100}%` }}
                                        transition={{ duration: 0.6 }}
                                    />
                                </div>
                            </div>

                            {/* XP Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-orbitron text-white/40">
                                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400" /> XP</span>
                                    <span>{xp} / 100</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ background: "linear-gradient(90deg, #a855f7, #00f5ff)" }}
                                        animate={{ width: `${xp}%` }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                            <HeroStage asset={activeAsset} />
                        </div>

                        {/* Inventory */}
                        <div className="p-6 bg-white/[0.02]">
                            <h3 className="text-xs font-orbitron font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-purple-500" /> Select Loadout
                            </h3>
                            <div className="space-y-3">
                                {assets.map((asset) => {
                                    const isActive = activeAsset.id === asset.id;
                                    return (
                                        <button
                                            key={asset.id}
                                            onClick={() => setActiveAsset(asset)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left relative overflow-hidden group/item",
                                                isActive
                                                    ? "bg-white/10 border-purple-500/50 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]"
                                                    : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/5"
                                            )}
                                        >
                                            {asset.isVerified && (
                                                <div className="absolute top-0 right-0 bg-blue-500/80 text-[8px] font-black px-1.5 py-0.5 rounded-bl font-orbitron flex items-center gap-1 z-10 backdrop-blur-sm">
                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                    ON-CHAIN
                                                </div>
                                            )}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1 transition-all",
                                                isActive ? "opacity-100" : "opacity-0 group-hover/item:opacity-50",
                                                asset.rarity === "legendary" ? "bg-amber-500" :
                                                    asset.rarity === "rare" ? "bg-blue-500" : "bg-gray-500"
                                            )} />
                                            <div className="w-12 h-12 rounded-lg bg-black border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner ml-2">
                                                {asset.image}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <h3 className={cn("font-orbitron font-bold text-sm truncate", isActive ? "text-white" : "text-white/70")}>
                                                            {asset.name}
                                                        </h3>
                                                    </div>
                                                    {isActive && <div className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-orbitron font-bold shrink-0">EQUIPPED</div>}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-orbitron text-white/40">
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

                {/* ── Center: Game Canvas ──────────────────────────────── */}
                <div className="lg:col-span-8 relative flex flex-col gap-4">

                    {/* Controls Bar */}
                    <div className="bg-[#0f0f1a] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* WASD Key Display */}
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex justify-center">
                                    <span className={cn("key-cap", pressedKeys.has("W") && "active")}>W</span>
                                </div>
                                <div className="flex gap-1">
                                    <span className={cn("key-cap", pressedKeys.has("A") && "active")}>A</span>
                                    <span className={cn("key-cap", pressedKeys.has("S") && "active")}>S</span>
                                    <span className={cn("key-cap", pressedKeys.has("D") && "active")}>D</span>
                                </div>
                                <span className="text-[10px] text-white/30 font-orbitron uppercase tracking-wider mt-1">Move</span>
                            </div>

                            <div className="h-10 w-px bg-white/10" />

                            <div className="flex flex-col items-center gap-1">
                                <span className={cn("key-cap px-4", pressedKeys.has(" ") && "active")}>SPACE / CLICK</span>
                                <span className="text-[10px] text-white/30 font-orbitron uppercase tracking-wider mt-1">Attack</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Weapon info */}
                            <div className="text-right hidden sm:block">
                                <div className="text-xs text-white/40 uppercase font-orbitron">Weapon</div>
                                <div className="font-orbitron font-bold text-purple-400 flex items-center justify-end gap-2">
                                    {isRpg ? <Swords className="w-4 h-4" /> : <Crosshair className="w-4 h-4" />}
                                    {activeAsset.name}
                                </div>
                            </div>

                            {/* Controls toggle */}
                            <button
                                onClick={() => setShowControls(!showControls)}
                                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                title="Controls"
                            >
                                <HelpCircle className="w-5 h-5 text-white/50" />
                            </button>
                        </div>
                    </div>

                    {/* Controls Legend (expandable) */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-[#0f0f1a] border border-purple-500/30 rounded-2xl overflow-hidden"
                                style={{ boxShadow: "0 0 20px rgba(168,85,247,0.1)" }}
                            >
                                <div className="p-4">
                                    <h4 className="font-orbitron font-bold text-sm text-purple-400 uppercase tracking-widest mb-4">Controls Legend</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-orbitron">
                                        {[
                                            { label: "Move Up", keys: ["W"] },
                                            { label: "Move Left", keys: ["A"] },
                                            { label: "Move Down", keys: ["S"] },
                                            { label: "Move Right", keys: ["D"] },
                                            { label: "Attack", keys: ["SPACE"] },
                                            { label: "Aim & Fire", keys: ["CLICK"] },
                                            { label: "Switch Mode", keys: ["TAB"] },
                                            { label: "Pause", keys: ["ESC"] },
                                        ].map(({ label, keys }) => (
                                            <div key={label} className="flex flex-col gap-1">
                                                <span className="text-white/40 text-[10px] uppercase">{label}</span>
                                                <div className="flex gap-1 flex-wrap">
                                                    {keys.map(k => <span key={k} className="key-cap">{k}</span>)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Canvas Container */}
                    <motion.div
                        ref={containerRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "w-full aspect-[16/9] bg-black rounded-3xl border-2 relative overflow-hidden shadow-2xl",
                            isRpg ? "border-purple-500/30" : "border-blue-500/30"
                        )}
                        style={{ boxShadow: isRpg ? "0 0 40px rgba(168,85,247,0.15)" : "0 0 40px rgba(96,165,250,0.15)" }}
                    >
                        {/* Background */}
                        <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                            {isRpg ? (
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />
                            ) : (
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center" />
                            )}
                            <div className="absolute inset-0 bg-black/40" />
                        </div>

                        {/* Game Canvas */}
                        <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full cursor-crosshair touch-none" />

                        {/* Virtual D-Pad (mobile) */}
                        <div className="absolute bottom-4 left-4 z-20 grid grid-cols-3 grid-rows-2 gap-1 md:hidden">
                            {dpadButtons.map(({ key, icon, style }) => (
                                <button
                                    key={key}
                                    onPointerDown={() => fireKey(key, "keydown")}
                                    onPointerUp={() => fireKey(key, "keyup")}
                                    onPointerLeave={() => fireKey(key, "keyup")}
                                    className={cn(
                                        "w-12 h-12 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center backdrop-blur active:bg-purple-600/40 active:border-purple-500 transition-colors",
                                        style
                                    )}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>

                        {/* Virtual Attack Button (mobile) */}
                        <button
                            onPointerDown={() => fireKey(" ", "keydown")}
                            onPointerUp={() => fireKey(" ", "keyup")}
                            onPointerLeave={() => fireKey(" ", "keyup")}
                            className="absolute bottom-4 right-4 z-20 w-16 h-16 bg-purple-600/60 border border-purple-400/60 rounded-full flex items-center justify-center backdrop-blur active:bg-purple-500 transition-colors md:hidden shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                        >
                            <Zap className="w-7 h-7 text-white" />
                        </button>

                        {/* Game Over Overlay */}
                        {gameState !== "playing" && (
                            <div className="absolute inset-0 z-20 flex flex-col gap-4 items-center justify-center bg-black/85 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center gap-5"
                                >
                                    {gameState === "victory" ? (
                                        <>
                                            <Trophy className="w-20 h-20 text-yellow-400" style={{ filter: "drop-shadow(0 0 20px rgba(250,204,21,0.6))" }} />
                                            <h2 className="text-4xl font-orbitron font-black text-yellow-400 uppercase">Victory!</h2>
                                        </>
                                    ) : (
                                        <>
                                            <Skull className="w-20 h-20 text-red-500" style={{ filter: "drop-shadow(0 0 20px rgba(239,68,68,0.5))" }} />
                                            <h2 className="text-4xl font-orbitron font-black text-red-400 uppercase">Defeated</h2>
                                        </>
                                    )}

                                    {gameState === "victory" && !hasClaimed && (
                                        <motion.button
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            onClick={handleClaim}
                                            disabled={isClaiming}
                                            className="px-8 py-3 bg-yellow-500 text-black font-orbitron font-black text-lg rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_30px_rgba(234,179,8,0.5)] uppercase"
                                        >
                                            <Trophy className="w-5 h-5" />
                                            {isClaiming ? "Converting Loot..." : "CLAIM SUI REWARD"}
                                        </motion.button>
                                    )}

                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        onClick={handleReset}
                                        className="px-8 py-3 bg-white/10 border border-white/20 text-white font-orbitron font-black text-lg rounded-full hover:bg-white/20 transition-all uppercase"
                                    >
                                        {gameState === "victory" ? (hasClaimed ? "Play Again" : "Skip Reward") : "Retry Mission"}
                                    </motion.button>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>

                    {/* Stat bar below canvas */}
                    {isRpg ? (
                        <div className="grid grid-cols-2 gap-4">
                            <StatBadge label="Strength" value={rpgStats.strength} max={200} color="from-red-500 to-orange-400" icon={<Swords className="w-4 h-4 text-red-400" />} />
                            <StatBadge label="Magic" value={rpgStats.magic} max={200} color="from-purple-500 to-blue-400" icon={<Sparkles className="w-4 h-4 text-purple-400" />} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <StatBadge label="Firepower" value={shooterStats.firepower} max={200} color="from-blue-500 to-cyan-400" icon={<Crosshair className="w-4 h-4 text-blue-400" />} />
                            <StatBadge label="Shield" value={shooterStats.shield} max={200} color="from-green-500 to-emerald-400" icon={<Shield className="w-4 h-4 text-green-400" />} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ label, value, max, color, icon }: {
    label: string; value: number; max: number; color: string; icon: React.ReactNode;
}) {
    const pct = Math.min(100, (value / max) * 100);
    return (
        <div className="bg-[#0f0f1a] border border-white/8 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-orbitron text-xs text-white/50 uppercase">{icon}{label}</div>
                <span className="font-orbitron font-bold text-sm text-white">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-r", color)}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}
