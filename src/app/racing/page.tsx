"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flag, Trophy, Timer, ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import Link from "next/link";
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { MIST_PER_SUI } from "@mysten/sui/utils";

// ─── Track waypoints (normalized 0–1 coords, scaled at runtime) ───────────────
const WAYPOINTS_NORM = [
    { x: 0.50, y: 0.12 },
    { x: 0.78, y: 0.18 },
    { x: 0.88, y: 0.38 },
    { x: 0.82, y: 0.62 },
    { x: 0.65, y: 0.82 },
    { x: 0.50, y: 0.88 },
    { x: 0.35, y: 0.82 },
    { x: 0.18, y: 0.62 },
    { x: 0.12, y: 0.38 },
    { x: 0.22, y: 0.18 },
];

const TRACK_WIDTH = 90;
const TOTAL_LAPS = 3;
const NEON_COLORS = ["#00f5ff", "#ff00a8", "#ffd700", "#39ff14"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function dist(ax: number, ay: number, bx: number, by: number) {
    return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}
function angleTo(ax: number, ay: number, bx: number, by: number) {
    return Math.atan2(by - ay, bx - ax);
}
function normalizeAngle(a: number) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
}

interface Car {
    x: number; y: number;
    angle: number; speed: number;
    wpIdx: number; lapCount: number;
    color: string; name: string;
    trail: { x: number; y: number }[];
    isPlayer: boolean;
    finished: boolean;
    finishTime: number;
    drift: number;
}

function makeWaypoints(W: number, H: number) {
    return WAYPOINTS_NORM.map(p => ({ x: p.x * W, y: p.y * H }));
}

function makeCar(wpIdx: number, W: number, H: number, color: string, name: string, isPlayer: boolean): Car {
    const wps = makeWaypoints(W, H);
    const start = wps[wpIdx % wps.length];
    return {
        x: start.x + (Math.random() - 0.5) * 30,
        y: start.y + (Math.random() - 0.5) * 30,
        angle: angleTo(start.x, start.y, wps[(wpIdx + 1) % wps.length].x, wps[(wpIdx + 1) % wps.length].y),
        speed: 0, wpIdx: wpIdx,
        lapCount: 0, color, name,
        trail: [], isPlayer, finished: false, finishTime: 0,
        drift: 0,
    };
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function RacingPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const carsRef = useRef<Car[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const rafRef = useRef<number>(0);
    const account = useCurrentAccount();

    const [gamePhase, setGamePhase] = useState<"lobby" | "racing" | "finished">("lobby");
    const [playerLap, setPlayerLap] = useState(1);
    const [playerSpeed, setPlayerSpeed] = useState(0);
    const [positions, setPositions] = useState<{ name: string; lap: number; color: string }[]>([]);
    const [raceTime, setRaceTime] = useState(0);
    const [startTs, setStartTs] = useState(0);
    const [claiming, setClaiming] = useState(false);
    const [hasClaimed, setHasClaimed] = useState(false);
    const [betAmount, setBetAmount] = useState(0.1);
    const [isBetting, setIsBetting] = useState(false);

    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const TREASURY_ADDRESS = "0x76b2f7034cf5fa2b87e224855476a6e76865d1d609bab5767b41e6c3af2c5d57";

    const claimReward = async () => {
        if (!account) return;
        setClaiming(true);
        try {
            const res = await fetch('/api/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: account.address,
                    game: "Neon Drift",
                    amount: betAmount * 2, // Example multiplier
                })
            });
            const data = await res.json();
            if (res.ok) {
                setHasClaimed(true);
                alert("Reward Request Sent! Your payout is being processed.");
            } else {
                alert(`Claim failed: ${data.error || "Unknown error"}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network error while claiming.");
        } finally {
            setClaiming(false);
        }
    };

    const initCars = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const W = canvas.width, H = canvas.height;
        carsRef.current = [
            makeCar(0, W, H, NEON_COLORS[0], "YOU", true),
            makeCar(1, W, H, NEON_COLORS[1], "CyberRacer", false),
            makeCar(2, W, H, NEON_COLORS[2], "NeonDrifter", false),
        ];
    }, []);

    const startRace = useCallback(async () => {
        if (!account) {
            alert("Please connect your wallet to bet and start the race.");
            return;
        }

        setIsBetting(true);
        try {
            const txb = new Transaction();
            const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(Number(betAmount * Number(MIST_PER_SUI)))]);
            txb.transferObjects([coin], txb.pure.address(TREASURY_ADDRESS));

            signAndExecute(
                { transaction: txb },
                {
                    onSuccess: () => {
                        initCars();
                        setGamePhase("racing");
                        setPlayerLap(1);
                        setRaceTime(0);
                        setStartTs(Date.now());
                        setIsBetting(false);
                    },
                    onError: (err) => {
                        console.error("Bet failed:", err);
                        alert("Transaction failed or rejected. Please try again to race.");
                        setIsBetting(false);
                    },
                }
            );
        } catch (err) {
            console.error(err);
            alert("Error creating transaction.");
            setIsBetting(false);
        }
    }, [initCars, account, betAmount, signAndExecute]);

    // ── Key listeners ──
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            keysRef.current.add(e.key);
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key))
                e.preventDefault();
        };
        const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    }, []);

    // ── Canvas resize ──
    useEffect(() => {
        const resize = () => {
            if (!canvasRef.current) return;
            canvasRef.current.width = canvasRef.current.offsetWidth;
            canvasRef.current.height = canvasRef.current.offsetHeight;
            if (gamePhase === "racing") initCars();
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [gamePhase, initCars]);

    // ── Game Loop ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (gamePhase !== "racing") { cancelAnimationFrame(rafRef.current); return; }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        let frameCount = 0;

        const loop = () => {
            frameCount++;
            const W = canvas.width, H = canvas.height;
            const wps = makeWaypoints(W, H);
            const allKeys = new Set([...keysRef.current, ...vkRef.current]);

            // ── Update cars ──
            for (const car of carsRef.current) {
                if (car.finished) continue;

                const targetWp = wps[car.wpIdx % wps.length];
                const d = dist(car.x, car.y, targetWp.x, targetWp.y);

                if (!car.isPlayer) {
                    // AI steering
                    const targetAngle = angleTo(car.x, car.y, targetWp.x, targetWp.y);
                    const diff = normalizeAngle(targetAngle - car.angle);
                    car.angle += diff * 0.12;
                    const aiTopSpeed = 3.8 + (Math.random() < 0.005 ? (Math.random() - 0.5) : 0);
                    car.speed = lerp(car.speed, aiTopSpeed, 0.04);
                } else {
                    // Player steering with Drifting
                    const turnSpeed = 0.06;
                    const prevAngle = car.angle;
                    if (allKeys.has("ArrowLeft") || allKeys.has("a") || allKeys.has("A")) car.angle -= turnSpeed;
                    if (allKeys.has("ArrowRight") || allKeys.has("d") || allKeys.has("D")) car.angle += turnSpeed;

                    const accel = (allKeys.has("ArrowUp") || allKeys.has("w") || allKeys.has("W")) ? 0.28 : 0;
                    const brake = (allKeys.has("ArrowDown") || allKeys.has("s") || allKeys.has("S")) ? -0.22 : 0;
                    car.speed = Math.max(0, Math.min(6.5, car.speed + accel + brake - 0.06));

                    // Drift logic: if turning fast, car "slides"
                    const turnDiff = Math.abs(car.angle - prevAngle);
                    if (turnDiff > 0.01 && car.speed > 3) {
                        car.drift = lerp(car.drift, (car.angle - prevAngle) * 15, 0.1);
                    } else {
                        car.drift = lerp(car.drift, 0, 0.1);
                    }
                }

                // Update position with drift offset
                const moveAngle = car.angle + car.drift * 0.2;
                car.x += Math.cos(moveAngle) * car.speed;
                car.y += Math.sin(moveAngle) * car.speed;

                // Tire Smoke if drifting or braking hard
                if (Math.abs(car.drift) > 0.5 && car.speed > 2) {
                    const smokeX = car.x - Math.cos(car.angle) * 10;
                    const smokeY = car.y - Math.sin(car.angle) * 10;
                    // We don't have a global particle array for the whole game here, 
                    // but we can use the trail as a proxy or just draw them directly if we had a list.
                    // For now, let's just make the trail more intense during drift.
                }

                // Trail
                car.trail.push({ x: car.x, y: car.y });
                if (car.trail.length > (Math.abs(car.drift) > 0.5 ? 40 : 25)) car.trail.shift();

                // Next waypoint
                if (d < 55) {
                    car.wpIdx++;
                    if (car.wpIdx % wps.length === 0) {
                        car.lapCount++;
                        if (car.isPlayer) setPlayerLap(Math.min(TOTAL_LAPS, car.lapCount + 1));
                        if (car.lapCount >= TOTAL_LAPS && !car.finished) {
                            car.finished = true;
                            car.finishTime = Date.now();
                        }
                    }
                }
            }

            // Check race end
            const player = carsRef.current.find(c => c.isPlayer)!;
            if (player?.finished) {
                setRaceTime(Math.round((Date.now() - startTs) / 100) / 10);
                setGamePhase("finished");
                return;
            }

            // Positions for HUD
            if (frameCount % 30 === 0) {
                const sorted = [...carsRef.current].sort((a, b) => (b.lapCount * wps.length + b.wpIdx) - (a.lapCount * wps.length + a.wpIdx));
                setPositions(sorted.map(c => ({ name: c.name, lap: Math.min(TOTAL_LAPS, c.lapCount + 1), color: c.color })));
                const p = carsRef.current.find(c => c.isPlayer);
                if (p) setPlayerSpeed(Math.round(p.speed * 50));
            }

            // ── Draw ──────────────────────────────────────
            ctx.clearRect(0, 0, W, H);

            // Background
            ctx.fillStyle = "#050510";
            ctx.fillRect(0, 0, W, H);

            // Background Grid (More subtle)
            ctx.strokeStyle = "rgba(0,245,255,0.03)";
            ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

            // Track outer glow
            ctx.save();
            ctx.shadowColor = "rgba(0,245,255,0.1)";
            ctx.shadowBlur = 20;

            // Track path
            ctx.beginPath();
            ctx.moveTo(wps[0].x, wps[0].y);
            for (let i = 1; i <= wps.length; i++) ctx.lineTo(wps[i % wps.length].x, wps[i % wps.length].y);
            ctx.closePath();

            // Track Border Glow
            ctx.strokeStyle = "rgba(168,85,247,0.4)";
            ctx.lineWidth = TRACK_WIDTH + 4;
            ctx.stroke();

            // Asphalt Texture Simulation
            ctx.strokeStyle = "#111118";
            ctx.lineWidth = TRACK_WIDTH;
            ctx.lineJoin = "round";
            ctx.stroke();

            // Grainy noise for asphalt (static-ish)
            ctx.save();
            ctx.globalCompositeOperation = "source-atop";
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = i % 2 === 0 ? "#fff" : "#000";
                for (let j = 0; j < 20; j++) {
                    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
                }
            }
            ctx.restore();

            // Track edge lines
            ctx.beginPath();
            ctx.moveTo(wps[0].x, wps[0].y);
            for (let i = 1; i <= wps.length; i++) ctx.lineTo(wps[i % wps.length].x, wps[i % wps.length].y);
            ctx.closePath();
            ctx.strokeStyle = "rgba(0,245,255,0.4)";
            ctx.lineWidth = TRACK_WIDTH;
            ctx.setLineDash([14, 20]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Start/Finish line
            const startWp = wps[0];
            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
            const finishAngle = angleTo(wps[wps.length - 1].x, wps[wps.length - 1].y, startWp.x, startWp.y);
            ctx.translate(startWp.x, startWp.y);
            ctx.rotate(finishAngle + Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(-TRACK_WIDTH / 2, 0);
            ctx.lineTo(TRACK_WIDTH / 2, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Waypoint dots (subtle)
            wps.forEach((wp, i) => {
                if (i === 0) return;
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.08)";
                ctx.fill();
            });

            // Draw cars
            for (const car of carsRef.current) {
                // Trail
                if (car.trail.length > 2) {
                    ctx.save();
                    for (let i = 1; i < car.trail.length; i++) {
                        const alpha = (i / car.trail.length) * 0.55;
                        ctx.beginPath();
                        ctx.moveTo(car.trail[i - 1].x, car.trail[i - 1].y);
                        ctx.lineTo(car.trail[i].x, car.trail[i].y);
                        ctx.strokeStyle = car.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
                        ctx.lineWidth = car.isPlayer ? 4 : 2.5;
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // Car body
                ctx.save();
                ctx.translate(car.x, car.y);
                ctx.rotate(car.angle + car.drift * 0.3); // Lean into the drift

                const CW = car.isPlayer ? 22 : 18;
                const CH = car.isPlayer ? 11 : 9;

                // Headlights
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(CW / 2, -CH / 2 + 2);
                ctx.lineTo(CW / 2 + 80, -CH / 2 - 20);
                ctx.lineTo(CW / 2 + 80, CH / 2 + 20);
                ctx.lineTo(CW / 2, CH / 2 - 2);
                const beam = ctx.createLinearGradient(CW / 2, 0, CW / 2 + 80, 0);
                beam.addColorStop(0, "rgba(255,255,255,0.2)");
                beam.addColorStop(1, "rgba(255,255,255,0)");
                ctx.fillStyle = beam;
                ctx.fill();
                ctx.restore();

                // Tail-lights (Glow red when braking)
                if (car.isPlayer && (allKeys.has("ArrowDown") || allKeys.has("s") || allKeys.has("S"))) {
                    ctx.shadowColor = "#ff0000";
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(-CW / 2 - 2, -CH / 2, 2, CH);
                    ctx.shadowBlur = 0;
                }

                // Outer glow
                ctx.shadowColor = car.color;
                ctx.shadowBlur = car.isPlayer ? 25 : 12;

                ctx.fillStyle = car.color;
                ctx.beginPath();
                ctx.roundRect(-CW / 2, -CH / 2, CW, CH, 4);
                ctx.fill();

                // Windshield
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(0, -CH * 0.35, CW * 0.3, CH * 0.7);

                ctx.restore();

                // Name label (player only)
                if (car.isPlayer) {
                    ctx.save();
                    ctx.font = "bold 11px Orbitron, monospace";
                    ctx.fillStyle = car.color;
                    ctx.textAlign = "center";
                    ctx.shadowColor = car.color;
                    ctx.shadowBlur = 8;
                    ctx.fillText("▲ YOU", car.x, car.y - 20);
                    ctx.restore();
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [gamePhase, startTs]);

    // Virtual dpad helpers
    const vkPress = (key: string) => vkRef.current.add(key);
    const vkRelease = (key: string) => vkRef.current.delete(key);

    return (
        <div className="fixed inset-0 bg-[#050510] text-white font-rajdhani overflow-hidden">

            {/* ── Header ─────────────────────────────────────────────── */}
            <header className="absolute top-0 left-0 right-0 z-50 border-b border-white/8 bg-black/60 backdrop-blur-md">
                <div className="container h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="flex items-center gap-2 font-orbitron font-bold">
                            <Zap className="w-5 h-5 text-pink-400" style={{ filter: "drop-shadow(0 0 8px #ff00a8)" }} />
                            <span>NEON<span className="text-pink-400" style={{ textShadow: "0 0 10px #ff00a8" }}>DRIFT</span></span>
                        </div>
                    </div>
                    <ConnectButton className="!bg-white/10 !text-white !border !border-white/10 !rounded-full !font-medium hover:!bg-white/20 !h-[34px]" />
                </div>
            </header>

            {/* ── Canvas ─────────────────────────────────────────────── */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ cursor: "crosshair" }} />

            {/* ── Race HUD ───────────────────────────────────────────── */}
            {gamePhase === "racing" && (
                <div className="absolute inset-0 z-10 pointer-events-none p-4 pt-20 flex flex-col justify-between">
                    {/* Top: Lap + Time */}
                    <div className="flex justify-between items-start">
                        <div
                            className="bg-black/70 backdrop-blur border border-pink-500/30 rounded-2xl px-5 py-3"
                            style={{ boxShadow: "0 0 20px rgba(255,0,168,0.15)" }}
                        >
                            <div className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-1">Lap</div>
                            <div className="font-orbitron font-black text-2xl text-pink-400">{Math.min(playerLap, TOTAL_LAPS)} <span className="text-white/30 text-base">/ {TOTAL_LAPS}</span></div>
                        </div>

                        {/* Position board */}
                        <div className="bg-black/70 backdrop-blur border border-white/10 rounded-2xl px-4 py-3">
                            <div className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-2">Positions</div>
                            <div className="space-y-1">
                                {positions.map((p, i) => (
                                    <div key={p.name} className="flex items-center gap-2 text-xs font-orbitron">
                                        <span className="text-white/30 w-4">#{i + 1}</span>
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                                        <span className={p.name === "YOU" ? "text-white font-bold" : "text-white/60"}>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Speed */}
                    <div className="flex justify-start mb-2">
                        <div
                            className="bg-black/70 backdrop-blur border border-cyan-500/30 rounded-2xl px-5 py-3"
                            style={{ boxShadow: "0 0 20px rgba(0,245,255,0.12)" }}
                        >
                            <div className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-1">Speed</div>
                            <div className="font-orbitron font-black text-2xl text-cyan-400">{playerSpeed} <span className="text-white/30 text-sm">km/h</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Virtual Controls (mobile) ─── */}
            {gamePhase === "racing" && (
                <div className="absolute bottom-6 z-20 w-full flex justify-between px-6 md:hidden pointer-events-auto">
                    {/* D-Pad */}
                    <div className="grid grid-cols-3 grid-rows-2 gap-1 w-36">
                        <button onPointerDown={() => vkPress("ArrowUp")} onPointerUp={() => vkRelease("ArrowUp")} onPointerLeave={() => vkRelease("ArrowUp")}
                            className="col-start-2 row-start-1 w-11 h-11 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center active:bg-pink-600/40">
                            <ChevronUp className="w-5 h-5" />
                        </button>
                        <button onPointerDown={() => vkPress("ArrowLeft")} onPointerUp={() => vkRelease("ArrowLeft")} onPointerLeave={() => vkRelease("ArrowLeft")}
                            className="col-start-1 row-start-2 w-11 h-11 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center active:bg-pink-600/40">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onPointerDown={() => vkPress("ArrowDown")} onPointerUp={() => vkRelease("ArrowDown")} onPointerLeave={() => vkRelease("ArrowDown")}
                            className="col-start-2 row-start-2 w-11 h-11 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center active:bg-pink-600/40">
                            <ChevronDown className="w-5 h-5" />
                        </button>
                        <button onPointerDown={() => vkPress("ArrowRight")} onPointerUp={() => vkRelease("ArrowRight")} onPointerLeave={() => vkRelease("ArrowRight")}
                            className="col-start-3 row-start-2 w-11 h-11 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center active:bg-pink-600/40">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Boost (no-op but feels nice) */}
                    <button className="w-16 h-16 rounded-full bg-pink-600/50 border border-pink-400/50 flex items-center justify-center self-end shadow-[0_0_20px_rgba(255,0,168,0.4)]">
                        <Zap className="w-7 h-7 text-white" />
                    </button>
                </div>
            )}

            {/* ── Lobby Screen ─────────────────────────────────────────── */}
            {gamePhase === "lobby" && (
                <div className="absolute inset-0 flex items-center justify-center z-30 bg-[#050510]">
                    <div className="flex flex-col items-center text-center px-6 max-w-2xl">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative mb-8"
                        >
                            <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full" />
                            <Zap className="w-20 h-20 text-pink-400 relative z-10" style={{ filter: "drop-shadow(0 0 20px #ff00a8)" }} />
                        </motion.div>

                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="text-5xl md:text-7xl font-orbitron font-black tracking-tight mb-4"
                            style={{ background: "linear-gradient(135deg, #fff 0%, #ff00a8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                        >
                            NEON DRIFT
                        </motion.h1>

                        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                            className="text-lg text-white/50 mb-10 font-rajdhani max-w-md">
                            Race 3 laps on the neon circuit. Beat the AI and claim your SUI reward.
                        </motion.p>

                        {/* Controls cheat sheet */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                            className="flex gap-4 mb-10 flex-wrap justify-center">
                            {[
                                { keys: ["↑", "W"], label: "Accelerate" },
                                { keys: ["↓", "S"], label: "Brake" },
                                { keys: ["←", "→"], label: "Steer" },
                            ].map(({ keys, label }) => (
                                <div key={label} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center">
                                    <div className="flex gap-1 justify-center mb-1.5">
                                        {keys.map(k => <span key={k} className="key-cap">{k}</span>)}
                                    </div>
                                    <div className="text-xs font-orbitron text-white/40 uppercase tracking-wider">{label}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Bet Amount Selection */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                            className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-10 w-full max-w-sm">
                            <div className="text-[10px] font-orbitron text-white/40 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                <Wallet className="w-3 h-3" /> Select Bet Amount (SUI)
                            </div>
                            <div className="flex gap-2 justify-center">
                                {[0.1, 1, 5, 10].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setBetAmount(amt)}
                                        className={`px-4 py-2 rounded-lg font-orbitron text-sm transition-all border ${betAmount === amt
                                            ? "bg-pink-500/20 border-pink-500 text-pink-400 shadow-[0_0_15px_rgba(255,0,168,0.3)]"
                                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                            }`}
                                    >
                                        {amt}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            onClick={startRace}
                            disabled={isBetting}
                            className="px-14 py-5 font-orbitron font-black text-xl rounded-2xl uppercase tracking-wide flex items-center gap-3 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                            style={{
                                background: "linear-gradient(135deg, #ff00a8, #a855f7)",
                                boxShadow: "0 0 40px rgba(255,0,168,0.5), 0 0 80px rgba(168,85,247,0.2)",
                            }}
                        >
                            <Flag className="w-6 h-6" /> {isBetting ? "CONFIRMING BET..." : "PLACE BET & START"}
                        </motion.button>
                    </div>
                </div>
            )}

            {/* ── Finish Screen ─────────────────────────────────────────── */}
            {gamePhase === "finished" && (
                <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center space-y-6 px-8"
                    >
                        <Trophy className="w-24 h-24 text-yellow-400 mx-auto" style={{ filter: "drop-shadow(0 0 30px rgba(250,204,21,0.7))" }} />

                        <h2 className="text-5xl font-orbitron font-black uppercase" style={{ background: "linear-gradient(135deg, #fde68a, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                            Race Complete!
                        </h2>

                        <div className="flex justify-center gap-8 font-orbitron">
                            <div className="text-center">
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Time</div>
                                <div className="text-2xl font-bold text-cyan-400">{raceTime}s</div>
                            </div>
                            <div className="text-center">
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-1">Laps</div>
                                <div className="text-2xl font-bold text-pink-400">{TOTAL_LAPS}</div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            {!account ? (
                                <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                                    <p className="text-white/50 text-sm mb-2 font-rajdhani">Connect wallet to claim SUI</p>
                                    <ConnectButton />
                                </div>
                            ) : (
                                <button
                                    onClick={claimReward}
                                    disabled={claiming || hasClaimed}
                                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-orbitron font-black rounded-xl flex items-center gap-2 hover:scale-105 transition-transform shadow-lg disabled:opacity-50 uppercase"
                                >
                                    <Wallet className="w-5 h-5" />
                                    {claiming ? "Processing..." : hasClaimed ? "REQUESTED" : "CLAIM REWARD"}
                                </button>
                            )}

                            <button
                                onClick={() => setGamePhase("lobby")}
                                className="px-10 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-orbitron font-bold rounded-full transition-all uppercase"
                            >
                                Race Again
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
