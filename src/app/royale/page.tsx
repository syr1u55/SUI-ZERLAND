"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Skull, Trophy, AlertTriangle, Coins, Wallet, Users, Zap, ArrowLeft, Radio } from "lucide-react";
import { MOCK_ASSETS, type HeroItemNFT } from "@/lib/mock-data";
import { useBattleRoyaleEngine } from "@/lib/game-engine";
import { cn } from "@/lib/utils";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useOwnedAssets } from "@/lib/hooks/use-assets";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import HeroStage from "@/components/3d/HeroStage";

// ─── Kill Feed Names ──────────────────────────────────────────────────────────
const BOT_NAMES = ["CyberNinja", "VoidWalker", "SuiSniper", "BlockMaster", "CryptoKing", "DarkCode", "NeonFury", "GhostByte", "HexHunter", "ZeroDay"];
const WEAPONS = ["Plasma Rifle", "Void Blade", "Quantum Shot", "Arc Cannon", "Nova Burst"];

function randomKillEvent() {
    const killer = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    let victim = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    while (victim === killer) victim = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    return { id: Date.now() + Math.random(), killer, victim, weapon };
}

type KillEvent = { id: number; killer: string; victim: string; weapon: string };

// ─── Static leaderboard ───────────────────────────────────────────────────────
const LB_PLAYERS = [
    { name: "CyberNinja", score: 2450 },
    { name: "CryptoKing", score: 2100 },
    { name: "VoidWalker", score: 1850 },
    { name: "SuiSniper", score: 1620 },
    { name: "BlockMaster", score: 1400 },
];

export default function BattleRoyalePage() {
    const { assets } = useOwnedAssets();
    const [selectedAsset, setSelectedAsset] = useState<HeroItemNFT>(assets[0]);
    const [username, setUsername] = useState("Commander");

    useEffect(() => {
        if (!selectedAsset && assets.length > 0) setSelectedAsset(assets[0]);
    }, [assets, selectedAsset]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const account = useCurrentAccount();

    const [claiming, setClaiming] = useState(false);
    const [killFeed, setKillFeed] = useState<KillEvent[]>([]);

    // ── Matchmaking fake counter ──
    const [matchPlayers, setMatchPlayers] = useState(1);
    const [matchReady, setMatchReady] = useState(false);
    useEffect(() => {
        if (matchPlayers >= 20) { setMatchReady(true); return; }
        const t = setTimeout(() => setMatchPlayers(p => Math.min(20, p + Math.ceil(Math.random() * 3))), 600);
        return () => clearTimeout(t);
    }, [matchPlayers]);

    const claimReward = async () => {
        if (!account) return;
        setClaiming(true);
        try {
            // PHASE 1: Generate Proof (Simulated)
            const proof = `win_proof_royale_${Date.now()}_${account.address.substring(0, 6)}`;

            const res = await fetch('/api/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account.address,
                    game: "Nexus Royale",
                    amount: stats.kills * 10,
                    proof: proof,
                })
            });
            let data;
            try { data = await res.json(); } catch { data = { error: "Invalid response" }; }
            if (res.ok) {
                alert("Reward Request Sent! Your payout is being processed (Verified).");
                window.location.reload();
            } else {
                const errorMessage = data?.error || JSON.stringify(data);
                alert(`Verification failed: ${errorMessage || "Unknown error"}`);
            }
        } catch {
            alert("Failed to reach the server.");
        } finally {
            setClaiming(false);
        }
    };

    const { gameState, startGame, stats } = useBattleRoyaleEngine(canvasRef, selectedAsset);

    // ── Auto-resize canvas ──
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ── Kill feed while playing ──
    useEffect(() => {
        if (gameState !== "playing") return;
        const interval = setInterval(() => {
            setKillFeed(prev => [randomKillEvent(), ...prev].slice(0, 6));
        }, 2800 + Math.random() * 1500);
        return () => clearInterval(interval);
    }, [gameState]);

    return (
        <div className="fixed inset-0 bg-[#080810] overflow-hidden font-rajdhani">

            {/* ── Game Canvas ────────────────────────────────────────── */}
            <canvas ref={canvasRef} className="absolute inset-0 z-0 touch-none cursor-crosshair" />

            {/* ── UI Overlay ─────────────────────────────────────────── */}
            <div className="relative z-10 h-full flex flex-col justify-between p-4 md:p-6 pointer-events-none">

                {/* ── Top HUD ────────────────────────────────── */}
                <div className="flex justify-between items-start gap-4">

                    {/* Logo + Stats */}
                    <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white">
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/" className="p-1 hover:bg-white/10 rounded-full transition-colors pointer-events-auto">
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <h1 className="font-orbitron font-black text-lg italic tracking-tighter">
                                NEXUS<span className="text-purple-400" style={{ textShadow: "0 0 10px #a855f7" }}>ROYALE</span>
                            </h1>
                        </div>
                        <div className="flex gap-4 text-sm font-orbitron text-white/70">
                            <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-green-400" />
                                <motion.span key={stats.alive} animate={{ scale: [1.3, 1] }} transition={{ duration: 0.3 }}>
                                    ALIVE: {stats.alive}/20
                                </motion.span>
                            </span>
                            <span className="flex items-center gap-1.5"><Skull className="w-4 h-4 text-red-400" /> KILLS: {stats.kills}</span>
                            <span className="flex items-center gap-1.5 text-amber-400"><Coins className="w-4 h-4" /> {stats.coins}</span>
                        </div>
                    </div>

                    {/* Zone warning */}
                    {gameState === "playing" && stats.alive > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-600/80 backdrop-blur text-white px-5 py-2 rounded-full font-orbitron font-bold flex items-center gap-2 animate-pulse text-sm"
                        >
                            <AlertTriangle className="w-4 h-4" /> ZONE SHRINKING
                        </motion.div>
                    )}
                </div>

                {/* ── Kill Feed ──────────────────────────────── */}
                {gameState === "playing" && (
                    <div className="absolute top-24 right-4 md:right-6 w-64 space-y-1 pointer-events-none">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                            <span className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest">Kill Feed</span>
                        </div>
                        <AnimatePresence mode="popLayout">
                            {killFeed.map((e) => (
                                <motion.div
                                    key={e.id}
                                    initial={{ opacity: 0, x: 40, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 40 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-xs font-orbitron"
                                >
                                    <span className="text-red-400">{e.killer}</span>
                                    <span className="text-white/30 mx-1">⚡</span>
                                    <span className="text-white/60 line-through">{e.victim}</span>
                                    <div className="text-[10px] text-white/30 mt-0.5">{e.weapon}</div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Mini-Map ─────────── (bottom-right, game only) ─── */}
                {gameState === "playing" && (
                    <div className="absolute bottom-24 right-4 md:right-6 pointer-events-none">
                        <div
                            className="w-28 h-28 rounded-xl overflow-hidden relative"
                            style={{ border: "1px solid rgba(168,85,247,0.4)", boxShadow: "0 0 12px rgba(168,85,247,0.2)" }}
                        >
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                            {/* Zone rings */}
                            <div className="absolute inset-[15%] rounded-full border border-red-500/40 animate-ping" style={{ animationDuration: "3s" }} />
                            <div className="absolute inset-[25%] rounded-full border border-red-500/20" />
                            {/* Enemy dots */}
                            {Array.from({ length: Math.max(0, stats.alive - 1) }, (_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1.5 h-1.5 rounded-full bg-red-500"
                                    style={{
                                        left: `${20 + Math.sin(i * 1.3) * 30 + 30}%`,
                                        top: `${20 + Math.cos(i * 1.1) * 25 + 30}%`,
                                        boxShadow: "0 0 4px red",
                                    }}
                                />
                            ))}
                            {/* Player dot */}
                            <div className="absolute w-2 h-2 rounded-full bg-purple-400 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ boxShadow: "0 0 8px #a855f7" }} />
                            <div className="absolute bottom-1 left-1 text-[8px] font-orbitron text-white/40 uppercase">MAP</div>
                        </div>
                    </div>
                )}

                {/* ── Lobby Overlay ──────────────────────────── */}
                {gameState === "lobby" && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-20 flex flex-col items-center overflow-y-auto pt-24 pb-12 pointer-events-auto">
                        <div className="flex gap-8 items-start">

                            {/* Main Lobby Card */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="max-w-2xl w-full bg-[#0f0f1a] border border-white/10 rounded-3xl p-8 shadow-2xl"
                                style={{ boxShadow: "0 0 60px rgba(168,85,247,0.1)" }}
                            >
                                <h2 className="text-4xl font-orbitron font-black text-white mb-1 text-center uppercase tracking-tight">Ready for Battle?</h2>
                                <p className="text-white/40 text-center mb-4 font-rajdhani text-lg">Select your loadout. Your NFT determines weapon stats.</p>

                                <div className="mb-8 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <HeroStage asset={selectedAsset} />
                                </div>

                                {/* Callsign */}
                                <div className="mb-6">
                                    <label className="block text-xs font-orbitron font-bold text-white/50 mb-2 uppercase tracking-widest">Operator Callsign</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-orbitron focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Enter your callsign..."
                                    />
                                </div>

                                {/* Asset Selection */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {assets.map((asset) => (
                                        <button
                                            key={asset.id}
                                            onClick={() => setSelectedAsset(asset)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all text-left group relative overflow-hidden",
                                                selectedAsset.id === asset.id
                                                    ? "bg-purple-900/25 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
                                            )}
                                        >
                                            {asset.isVerified && (
                                                <div className="absolute top-0 right-0 bg-blue-500 text-[8px] font-black px-1.5 py-0.5 rounded-bl font-orbitron flex items-center gap-1 z-10">
                                                    <ShieldCheck className="w-2.5 h-2.5" />
                                                    OWNED
                                                </div>
                                            )}
                                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform inline-block">{asset.image}</div>
                                            <div className="font-orbitron font-bold text-white text-sm mb-1">{asset.name.split("/")[0]}</div>
                                            <div className="text-xs font-orbitron text-white/40">ATK: {asset.attack}</div>
                                            <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-purple-500"
                                                    style={{ width: `${(asset.attack / 100) * 100}%` }}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Matchmaking counter */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-orbitron text-white/40 mb-2 uppercase">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-green-400" />
                                            {matchReady ? "Players Ready" : "Finding Players..."}
                                        </span>
                                        <span className={cn(matchReady ? "text-green-400" : "text-white/40")}>{matchPlayers} / 20</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn("h-full rounded-full", matchReady ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-blue-500")}
                                            animate={{ width: `${(matchPlayers / 20) * 100}%` }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                </div>

                                {/* Deploy Button */}
                                <button
                                    onClick={() => startGame(username)}
                                    className={cn(
                                        "w-full py-5 text-white font-orbitron font-black text-xl rounded-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-wide",
                                        matchReady
                                            ? "bg-purple-600 hover:bg-purple-500 hover:scale-[1.02] shadow-xl shadow-purple-900/40"
                                            : "bg-white/10 border border-white/10 cursor-wait"
                                    )}
                                >
                                    <Swords className="w-6 h-6" />
                                    {matchReady ? "DEPLOY INTO WARZONE" : `MATCHMAKING... ${matchPlayers}/20`}
                                </button>
                            </motion.div>

                            {/* Leaderboard */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-72 bg-[#0f0f1a]/90 border border-white/10 rounded-3xl p-6 backdrop-blur-md hidden xl:block"
                            >
                                <h3 className="font-orbitron font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
                                    <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
                                </h3>
                                <div className="space-y-3">
                                    {LB_PLAYERS.map((player, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className={cn("font-rajdhani font-semibold", i === 0 ? "text-yellow-400" : "text-white/60")}>
                                                #{i + 1} {player.name}
                                            </span>
                                            <span className="font-orbitron text-yellow-500 text-xs">{player.score}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-white/10 my-3" />
                                    <div className="flex items-center justify-between text-sm font-orbitron font-bold bg-white/5 p-2 rounded-lg">
                                        <span className="text-white flex items-center gap-2">
                                            {username}
                                            {account && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">LIVE</span>}
                                        </span>
                                        <span className="text-purple-400 text-xs">{stats.kills * 100}</span>
                                    </div>
                                    <div className="mt-4 flex justify-center">
                                        <ConnectButton />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* ── Game Over Screen ────────────────────────── */}
                {(gameState === "dead" || gameState === "victory") && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center pointer-events-auto text-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-6"
                        >
                            {gameState === "victory" ? (
                                <>
                                    <Trophy className="w-28 h-28 text-yellow-400 mx-auto" style={{ filter: "drop-shadow(0 0 30px rgba(250,204,21,0.6))" }} />
                                    <h2 className="text-5xl font-orbitron font-black bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase">
                                        Victory Royale!
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <Skull className="w-28 h-28 text-red-500 mx-auto" style={{ filter: "drop-shadow(0 0 24px rgba(239,68,68,0.5))" }} />
                                    <h2 className="text-5xl font-orbitron font-black text-red-400 uppercase">Eliminated</h2>
                                </>
                            )}

                            <div className="text-xl text-white/50 font-orbitron">
                                Kills: <span className="text-white">{stats.kills}</span> &nbsp;•&nbsp; Rank: <span className="text-white">#{stats.alive + 1}</span>
                            </div>

                            {gameState === "victory" && (
                                <div className="flex flex-col gap-4 items-center">
                                    <div className="text-yellow-400 font-orbitron font-bold animate-pulse text-lg">
                                        REWARD: {stats.kills * 10} SUI
                                    </div>
                                    {!account ? (
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                                            <p className="text-white/50 text-sm mb-2 font-rajdhani">Connect Wallet to Claim</p>
                                            <ConnectButton />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={claimReward}
                                            disabled={claiming}
                                            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-orbitron font-black rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 uppercase"
                                        >
                                            <Wallet className="w-5 h-5" />
                                            {claiming ? "CLAIMING..." : "CLAIM REWARD"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => window.location.reload()}
                                className="px-10 py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-orbitron font-bold rounded-full transition-all mt-4 uppercase"
                            >
                                Play Again
                            </button>
                        </motion.div>
                    </div>
                )}

            </div>
        </div>
    );
}
