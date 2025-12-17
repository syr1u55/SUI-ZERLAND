"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Crosshair, Skull, Trophy, AlertTriangle, Coins, Wallet } from "lucide-react";
import { MOCK_ASSETS, type HeroItemNFT } from "@/lib/mock-data";
import { useBattleRoyaleEngine } from "@/lib/game-engine";
import { cn } from "@/lib/utils";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function BattleRoyalePage() {
    const [selectedAsset, setSelectedAsset] = useState<HeroItemNFT>(MOCK_ASSETS[0]);
    const [username, setUsername] = useState("Commander");
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [claiming, setClaiming] = useState(false);

    const claimReward = async () => {
        if (!account) return;
        setClaiming(true);

        try {
            const res = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: account.address })
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                console.error("Failed to parse JSON response");
                const text = await res.text().catch(() => "No text body");
                console.error("Raw response:", text);
                throw new Error(`Server returned ${res.status} but invalid JSON: ${text}`);
            }

            if (res.ok) {
                alert("Reward Claimed! 1 Testnet SUI has been airdropped to your wallet.");
                window.location.reload(); // Reload to reset state and maybe update balance UI if we had one
            } else {
                console.error("Claim failed with status:", res.status);

                // Inspect data carefully
                console.log("Full error data:", JSON.stringify(data, null, 2));

                const errorMessage = data?.error || (typeof data === 'string' ? data : JSON.stringify(data));

                // If the error message mentions rate limiting, show specific advice
                if (errorMessage &&
                    (errorMessage.toLowerCase().includes("too many requests") ||
                        errorMessage.toLowerCase().includes("rate-limited"))) {
                    alert("Faucet is rate-limited (too many requests). Please wait a few seconds/minutes and try again. Or try a different wallet.");
                } else {
                    alert(`Claim failed: ${errorMessage || "Unknown error occurred"}`);
                }
            }
        } catch (err) {
            console.error("Claim error:", err);
            alert("Failed to reach the server.");
        } finally {
            setClaiming(false);
        }
    };

    // Initialize Engine
    const { gameState, startGame, stats } = useBattleRoyaleEngine(canvasRef, selectedAsset);

    // Auto-resize canvas
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

    return (
        <div className="fixed inset-0 bg-black overflow-hidden font-sans">

            {/* Game Layer */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-0 touch-none cursor-crosshair"
            />

            {/* UI Overlay */}
            <div className="relative z-10 pointer-events-none h-full flex flex-col justify-between p-6">

                {/* Top HUD */}
                <div className="flex justify-between items-start">
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white">
                        <h1 className="font-black text-xl italic tracking-tighter">NEXUS<span className="text-purple-500">ROYALE</span></h1>
                        <div className="flex gap-4 mt-2 text-sm font-mono text-white/70">
                            <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" /> ALIVE: {stats.alive}/20</span>
                            <span className="flex items-center gap-2"><Skull className="w-4 h-4 text-red-500" /> KILLS: {stats.kills}</span>
                            <span className="flex items-center gap-2 text-amber-400"><Coins className="w-4 h-4" /> COINS: {stats.coins}</span>
                        </div>
                    </div>

                    {/* Zone Warning */}
                    {gameState === "playing" && stats.alive > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/80 backdrop-blur text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 animate-pulse"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            ZONE SHRINKING
                        </motion.div>
                    )}
                </div>

                {/* Lobby Overlay */}
                {gameState === "lobby" && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center pointer-events-auto">
                        <div className="flex gap-8 items-start">

                            {/* Main Lobby */}
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="max-w-2xl w-full bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
                            >
                                <h2 className="text-4xl font-black text-white mb-2 text-center">Ready for Battle?</h2>
                                <p className="text-white/40 text-center mb-8">Select your loadout. Your NFT determines your weapon stats.</p>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-white/60 mb-2">OPERATOR NAME</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                                        placeholder="Enter your callsign..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {MOCK_ASSETS.map((asset) => (
                                        <button
                                            key={asset.id}
                                            onClick={() => setSelectedAsset(asset)}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all relative overflow-hidden group text-left",
                                                selectedAsset.id === asset.id
                                                    ? "bg-purple-900/20 border-purple-500 ring-1 ring-purple-500"
                                                    : "bg-white/5 border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <div className="text-4xl mb-4">{asset.image}</div>
                                            <div className="font-bold text-white mb-1">{asset.name.split("/")[0]}</div>
                                            <div className="text-xs text-white/40 font-mono">
                                                ATK: {asset.attack} | DEF: {asset.defense}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => startGame(username)}
                                    className="w-full py-6 bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl rounded-2xl transition-all hover:scale-[1.02] shadow-xl shadow-purple-900/40 flex items-center justify-center gap-4"
                                >
                                    <Swords className="w-6 h-6" />
                                    DEPLOY INTO WARZONE
                                </button>
                            </motion.div>

                            {/* Leaderboard Panel */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-80 bg-[#111]/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md hidden xl:block"
                            >
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Leaderboard
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        { name: "CyberNinja", score: 2450 },
                                        { name: "CryptoKing", score: 2100 },
                                        { name: "VoidWalker", score: 1850 },
                                        { name: "SuiSniper", score: 1620 },
                                        { name: "BlockMaster", score: 1400 },
                                    ].map((player, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span className="text-white/60">#{i + 1} {player.name}</span>
                                            <span className="font-mono text-yellow-500">{player.score}</span>
                                        </div>
                                    ))}
                                    <div className="border-t border-white/10 my-3" />
                                    <div className="flex items-center justify-between text-sm font-bold bg-white/5 p-2 rounded">
                                        <span className="text-white flex items-center gap-2">
                                            {username}
                                            {account && <span className="text-[10px] bg-green-500/20 text-green-400 px-1 rounded">CONNECTED</span>}
                                        </span>
                                        <span className="font-mono text-purple-400">
                                            {gameState === "lobby" ? "---" : stats.kills * 100}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex justify-center">
                                        <ConnectButton />
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                )}

                {/* Game Over Screen */}
                {(gameState === "dead" || gameState === "victory") && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center pointer-events-auto text-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="space-y-6"
                        >
                            {gameState === "victory" ? (
                                <>
                                    <Trophy className="w-32 h-32 text-yellow-500 mx-auto" />
                                    <h2 className="text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-600">
                                        VICTORY ROYALE!
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <Skull className="w-32 h-32 text-red-500 mx-auto" />
                                    <h2 className="text-6xl font-black text-white">ELIMINATED</h2>
                                </>
                            )}

                            <div className="text-2xl text-white/60 font-mono">
                                Kills: {stats.kills} • Rank: #{stats.alive + 1}
                            </div>

                            {gameState === "victory" && (
                                <div className="flex flex-col gap-4 items-center">
                                    <div className="text-yellow-400 font-bold animate-pulse">
                                        REWARD AVAILABLE: {stats.kills * 10} SUI
                                    </div>
                                    {!account ? (
                                        <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                                            <p className="text-white/60 text-sm mb-2">Connect Wallet to Claim</p>
                                            <ConnectButton />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={claimReward}
                                            disabled={claiming}
                                            className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Wallet className="w-5 h-5" />
                                            {claiming ? "CLAIMING..." : "CLAIM REWARD"}
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => window.location.reload()}
                                className="px-12 py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold rounded-full transition-all mt-8"
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
