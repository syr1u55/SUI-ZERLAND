"use client";

import { useEffect, useRef, useState } from "react";
import { HeroItemNFT, getShooterStats } from "@/lib/mock-data";

interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    hp: number;
    maxHp: number;
    velocity: { x: number; y: number };
    weapon: "sword" | "blaster";
    isBot: boolean;
    target?: { x: number; y: number };
}
interface Projectile {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ownerId: string;
    damage: number;
    color: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface Loot {
    id: number;
    x: number;
    y: number;
    type: "coin" | "health";
    value: number;
}

interface GameState {
    players: Player[];
    projectiles: Projectile[];
    particles: Particle[];
    loot: Loot[];
    zoneRadius: number;
    gameOver: boolean;
    winner: string | null;
    cameraShake: number;
}

export function useBattleRoyaleEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>, myAsset: HeroItemNFT) {
    const [gameState, setGameState] = useState<"lobby" | "playing" | "dead" | "victory">("lobby");
    const [stats, setStats] = useState({ kills: 0, alive: 0, coins: 0 });

    // Game Loop Refs (to avoid re-renders)
    const stateRef = useRef<GameState>({
        players: [],
        projectiles: [],
        particles: [],
        loot: [],
        zoneRadius: 2000,
        gameOver: false,
        winner: null,
        cameraShake: 0,
    });
    const inputRef = useRef({ w: false, a: false, s: false, d: false, click: false, mouseX: 0, mouseY: 0 });
    const reqRef = useRef<number>(0);

    const MAP_SIZE = 2000;

    // Helper to create a bot
    const createBot = (index: number, mapSize: number): Player => ({
        id: `Bot-${index}`,
        name: `Bot-${index}`,
        x: Math.random() * mapSize,
        y: Math.random() * mapSize,
        radius: 20,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        hp: 100,
        maxHp: 100,
        velocity: { x: 0, y: 0 },
        weapon: Math.random() > 0.5 ? "sword" : "blaster",
        isBot: true,
        target: { x: Math.random() * mapSize, y: Math.random() * mapSize }
    });

    // Initialize Game
    const startGame = (playerName: string) => {
        const players: Player[] = [];

        // Determine stats
        const shooterStats = getShooterStats(myAsset);
        const weaponType = myAsset.name.includes("Blade") ? "sword" : "blaster";

        // Create "Me"
        players.push({
            id: "me",
            name: playerName || "Hero",
            x: MAP_SIZE / 2,
            y: MAP_SIZE / 2,
            radius: 20,
            color: "#a855f7", // Purple
            hp: 100 + shooterStats.shield, // Shield adds to HP
            maxHp: 100 + shooterStats.shield,
            velocity: { x: 0, y: 0 },
            weapon: weaponType,
            isBot: false,
        });

        // Create Bots
        for (let i = 0; i < 29; i++) {
            players.push(createBot(i, MAP_SIZE));
        }

        stateRef.current = {
            players,
            projectiles: [],
            particles: [],
            loot: [],
            zoneRadius: MAP_SIZE,
            gameOver: false,
            winner: null,
            cameraShake: 0,
        };

        setStats({ kills: 0, alive: players.length, coins: 0 });
        setGameState("playing");
    };

    useEffect(() => {
        if (gameState !== "playing" || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle Input Listeners
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'w') inputRef.current.w = true;
            if (e.key === 'a') inputRef.current.a = true;
            if (e.key === 's') inputRef.current.s = true;
            if (e.key === 'd') inputRef.current.d = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'w') inputRef.current.w = false;
            if (e.key === 'a') inputRef.current.a = false;
            if (e.key === 's') inputRef.current.s = false;
            if (e.key === 'd') inputRef.current.d = false;
        };
        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            inputRef.current.mouseX = e.clientX - rect.left;
            inputRef.current.mouseY = e.clientY - rect.top;
        };
        const handleMouseDown = () => { inputRef.current.click = true; };
        const handleMouseUp = () => { inputRef.current.click = false; };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        // Use window listener for mouse to track better
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        let lastTime = performance.now();
        let killCount = 0;
        let coinCount = 0;

        const createExplosion = (x: number, y: number, color: string, count: number = 10) => {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 200 + 50;
                stateRef.current.particles.push({
                    id: Math.random(),
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    color: color,
                    size: Math.random() * 4 + 2
                });
            }
        };

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.1); // Limit dt
            lastTime = time;

            const state = stateRef.current;

            // 1. UPDATE LOGIC
            if (state.cameraShake > 0) state.cameraShake = Math.max(0, state.cameraShake - dt * 20);

            // Shrink Zone
            state.zoneRadius -= 15 * dt; // Faster zone
            if (state.zoneRadius < 100) state.zoneRadius = 100;

            // Update Particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2; // Fade out
                if (p.life <= 0) state.particles.splice(i, 1);
            }

            // Update Players
            state.players.forEach(p => {
                if (p.hp <= 0) return;

                // Movement
                const speed = 250; // Faster movement
                if (p.isBot) {
                    // Simple Bot AI: Move to target, pick new target if close
                    if (p.target) {
                        const dx = p.target.x - p.x;
                        const dy = p.target.y - p.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 50) {
                            p.target = { x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE };
                        } else {
                            // Move towards target
                            p.x += (dx / dist) * speed * dt;
                            p.y += (dy / dist) * speed * dt;
                        }

                        // Bot Attack Logic: Shoot at nearest player if close
                        state.players.forEach(other => {
                            if (other.id !== p.id && other.hp > 0) {
                                const d = Math.sqrt((other.x - p.x) ** 2 + (other.y - p.y) ** 2);
                                if (d < 400 && Math.random() < 0.03) { // Slightly lower fire rate
                                    // Shoot
                                    const angle = Math.atan2(other.y - p.y, other.x - p.x);
                                    state.projectiles.push({
                                        id: Math.random(),
                                        x: p.x,
                                        y: p.y,
                                        vx: Math.cos(angle) * 800,
                                        vy: Math.sin(angle) * 800,
                                        ownerId: p.id,
                                        damage: p.weapon === "sword" ? 25 : 15,
                                        color: p.color
                                    });
                                }
                            }
                        });
                    }
                } else {
                    // Human Player Control
                    let dx = 0;
                    let dy = 0;
                    if (inputRef.current.w) dy -= 1;
                    if (inputRef.current.s) dy += 1;
                    if (inputRef.current.a) dx -= 1;
                    if (inputRef.current.d) dx += 1;

                    // Normalize
                    if (dx !== 0 || dy !== 0) {
                        const len = Math.sqrt(dx * dx + dy * dy);
                        p.x += (dx / len) * speed * dt;
                        p.y += (dy / len) * speed * dt;
                    }

                    // Player Shooting
                    if (inputRef.current.click) {
                        // Rate limit handled by pure cooldown or just simple frame check for prototype
                        // For better feel, let's just do "every frame" if automatic or "on click" if semi.
                        // Making it automatic for arcade feel, but rate limited
                        if (Math.random() < 0.2) { // crude fire rate
                            const rect = canvas.getBoundingClientRect();
                            // Mouse is screen relative, player is world relative. 
                            // We need the camera offset. Camera is centered on player.
                            // Screen Center = Player Pos
                            // Mouse Pos relative to Center = World Dir

                            const centerX = canvas.width / 2;
                            const centerY = canvas.height / 2;
                            // const worldMouseX = p.x + (inputRef.current.mouseX - centerX);
                            // const worldMouseY = p.y + (inputRef.current.mouseY - centerY);

                            const dirX = inputRef.current.mouseX - centerX;
                            const dirY = inputRef.current.mouseY - centerY;
                            const angle = Math.atan2(dirY, dirX);

                            state.projectiles.push({
                                id: Math.random(),
                                x: p.x,
                                y: p.y,
                                vx: Math.cos(angle) * 800,
                                vy: Math.sin(angle) * 800,
                                ownerId: p.id,
                                damage: p.weapon === "sword" ? 34 : 20,
                                color: p.color
                            });
                        }
                    }
                }

                // Keep in bounds
                p.x = Math.max(0, Math.min(MAP_SIZE, p.x));
                p.y = Math.max(0, Math.min(MAP_SIZE, p.y));

                // Zone Damage
                const distWait = Math.sqrt((p.x - MAP_SIZE / 2) ** 2 + (p.y - MAP_SIZE / 2) ** 2);
                if (distWait > state.zoneRadius && p.id !== "me") {
                    p.hp -= 20 * dt; // Higher zone damage
                }

                // Loot Pickup (only for ME)
                if (p.id === "me") {
                    for (let i = state.loot.length - 1; i >= 0; i--) {
                        const item = state.loot[i];
                        const d = Math.sqrt((p.x - item.x) ** 2 + (p.y - item.y) ** 2);
                        if (d < p.radius + 15) {
                            // Pickup
                            if (item.type === "coin") coinCount += item.value;
                            if (item.type === "health") p.hp = Math.min(p.maxHp, p.hp + item.value);
                            state.loot.splice(i, 1);
                            createExplosion(item.x, item.y, "#fbbf24", 5); // Gold burst
                        }
                    }
                }
            });



            // Update Projectiles
            for (let i = state.projectiles.length - 1; i >= 0; i--) {
                const proj = state.projectiles[i];
                proj.x += proj.vx * dt;
                proj.y += proj.vy * dt;

                // Remove if out of bounds or too old
                if (proj.x < 0 || proj.x > MAP_SIZE || proj.y < 0 || proj.y > MAP_SIZE) {
                    state.projectiles.splice(i, 1);
                    continue;
                }

                // Collision
                for (const p of state.players) {
                    if (p.hp <= 0 || p.id === proj.ownerId) continue;
                    const d = Math.sqrt((p.x - proj.x) ** 2 + (p.y - proj.y) ** 2);
                    if (d < p.radius + 5) {
                        // Hit!
                        if (p.id !== "me") {
                            p.hp -= proj.damage;
                        }

                        state.projectiles.splice(i, 1);
                        createExplosion(proj.x, proj.y, proj.color, 3);

                        if (p.id === "me") state.cameraShake = 5;

                        if (p.hp <= 0) {
                            createExplosion(p.x, p.y, p.color, 20); // Big death explosion

                            // Drop Loot
                            state.loot.push({
                                id: Math.random(),
                                x: p.x,
                                y: p.y,
                                type: Math.random() > 0.3 ? "coin" : "health",
                                value: 10
                            });

                            if (proj.ownerId === "me") {
                                killCount++;
                                state.cameraShake = 10;
                            }
                        }
                        break;
                    }
                }
            }

            // Clean dead players
            state.players = state.players.filter(p => p.hp > 0);
            const alivePlayers = state.players;

            // Check Player Death
            const me = state.players.find(p => p.id === "me");
            if (!me || me.hp <= 0) {
                setGameState("dead");
                return; // Stop Loop
            }

            // Check Victory
            if (alivePlayers.length === 1 && alivePlayers[0].id === "me") {
                setGameState("victory");
                return;
            }

            setStats({ kills: killCount, alive: alivePlayers.length, coins: coinCount });

            // 2. RENDER LOGIC
            if (me) {
                // Shake Offset
                const shakeX = (Math.random() - 0.5) * state.cameraShake;
                const shakeY = (Math.random() - 0.5) * state.cameraShake;

                // Clear
                ctx.fillStyle = "#1a1a1a";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Camera Transform
                ctx.save();
                ctx.translate(canvas.width / 2 - me.x + shakeX, canvas.height / 2 - me.y + shakeY);

                // Draw Map Grid
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x <= MAP_SIZE; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_SIZE); }
                for (let y = 0; y <= MAP_SIZE; y += 100) { ctx.moveTo(0, y); ctx.lineTo(MAP_SIZE, y); }
                ctx.stroke();

                // Draw Zone
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 10 + Math.sin(time / 200) * 2; // Pulse
                ctx.beginPath();
                ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, state.zoneRadius, 0, Math.PI * 2);
                ctx.stroke();
                // Zone Fog (outside) - Simple semi-transparent overlay just for visual indication
                // (Complex to draw "inverse circle" easily in 2d context without composite ops, skipping for perf prototype)

                // Draw Loot
                state.loot.forEach(item => {
                    ctx.fillStyle = item.type === "coin" ? "#fbbf24" : "#ef4444";
                    ctx.beginPath();
                    ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    // Glow
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = ctx.fillStyle;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });

                // Draw Projectiles
                state.projectiles.forEach(proj => {
                    ctx.fillStyle = proj.color;
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Draw Particles
                state.particles.forEach(p => {
                    ctx.globalAlpha = p.life;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                });

                // Draw Players
                state.players.forEach(p => {
                    if (p.hp <= 0) return;

                    // Body
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Weapon Indicator
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    // If it's me, rotate towards mouse
                    if (p.id === "me") {
                        const centerX = canvas.width / 2;
                        const centerY = canvas.height / 2;
                        const angle = Math.atan2(inputRef.current.mouseY - centerY, inputRef.current.mouseX - centerX);
                        ctx.rotate(angle);
                    } else if (p.target) {
                        // Bot rotation approximation (towards target)
                        const angle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
                        ctx.rotate(angle);
                    }
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(10, -5, 20, 10); // Simple gun/sword rect
                    ctx.restore();

                    // Health Bar
                    ctx.fillStyle = "red";
                    ctx.fillRect(p.x - 20, p.y - 35, 40, 5);
                    ctx.fillStyle = "#22c55e";
                    ctx.fillRect(p.x - 20, p.y - 35, 40 * (p.hp / p.maxHp), 5);

                    // Name
                    ctx.fillStyle = "white";
                    ctx.font = "bold 12px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(p.name, p.x, p.y - 45);
                });

                ctx.restore();
            }

            reqRef.current = requestAnimationFrame(loop);
        };

        reqRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            cancelAnimationFrame(reqRef.current);
        };

    }, [gameState, myAsset]); // Re-run if gamestate changes

    return { gameState, startGame, stats };
}
