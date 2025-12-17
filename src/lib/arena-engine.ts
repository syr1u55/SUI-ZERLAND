
import { useEffect, useRef, useState } from "react";
import { HeroItemNFT, getShooterStats, getRpgStats } from "@/lib/mock-data";

interface ArenaState {
    hero: {
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        angle: number;
    };
    boss: {
        x: number;
        y: number;
        hp: number;
        maxHp: number;
        phase: number;
        color: string;
    };
    projectiles: {
        id: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
        owner: "hero" | "boss";
        damage: number;
        color: string;
        size: number;
    }[];
    particles: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        color: string;
    }[];
    status: "playing" | "victory" | "defeat";
}

export function useArenaEngine(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    asset: HeroItemNFT,
    gameType: "RPG" | "SHOOTER",
    containerRef: React.RefObject<HTMLDivElement | null>
) {
    const [gameState, setGameState] = useState<"playing" | "victory" | "defeat">("playing");

    // We use refs for the game loop state to avoid React re-renders slowing down 60fps loop
    const stateRef = useRef<ArenaState>({
        hero: { x: 400, y: 500, hp: 100, maxHp: 100, angle: 0 },
        boss: { x: 400, y: 100, hp: 1000, maxHp: 1000, phase: 1, color: "#ef4444" },
        projectiles: [],
        particles: [],
        status: "playing"
    });

    const inputRef = useRef({
        w: false, a: false, s: false, d: false,
        space: false, click: false,
        mouseX: 0, mouseY: 0
    });

    // Reset Game
    const resetGame = () => {
        const isRpg = gameType === "RPG";
        // Explicitly cast or handle types to avoid union ref errors
        const rpg = isRpg ? getRpgStats(asset) : null;
        const shooter = !isRpg ? getShooterStats(asset) : null;

        const startHp = isRpg ? 100 + (rpg?.magic || 0) : 100 + (shooter?.shield || 0);

        stateRef.current = {
            hero: { x: 400, y: 500, hp: startHp, maxHp: startHp, angle: 0 },
            boss: { x: 400, y: 150, hp: 1000, maxHp: 1000, phase: 1, color: isRpg ? "#7f1d1d" : "#ef4444" },
            projectiles: [],
            particles: [],
            status: "playing"
        };
        setGameState("playing");
    };

    // Initialize inputs
    useEffect(() => {
        if (!typeof window) return;

        const onKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === "w") inputRef.current.w = true;
            if (key === "a") inputRef.current.a = true;
            if (key === "s") inputRef.current.s = true;
            if (key === "d") inputRef.current.d = true;
            if (key === " ") inputRef.current.space = true;
        };
        const onKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === "w") inputRef.current.w = false;
            if (key === "a") inputRef.current.a = false;
            if (key === "s") inputRef.current.s = false;
            if (key === "d") inputRef.current.d = false;
            if (key === " ") inputRef.current.space = false;
        };
        const onMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            inputRef.current.mouseX = e.clientX - rect.left;
            inputRef.current.mouseY = e.clientY - rect.top;
        };
        const onMouseDown = () => { inputRef.current.click = true; };
        const onMouseUp = () => { inputRef.current.click = false; };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    // Game Loop
    useEffect(() => {
        let animationId: number;
        let lastTime = performance.now();
        let shootCooldown = 0;
        let bossAttackCooldown = 0;

        const loop = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.1);
            lastTime = time;

            const state = stateRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");

            if (!canvas || !ctx || state.status !== "playing") {
                if (canvas && ctx && state.status !== "playing") {
                    // Draw End Screen
                    renderGame(ctx, canvas, state, asset, gameType);
                }
                animationId = requestAnimationFrame(loop);
                return;
            }

            // Sync Canvas Size
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
                    canvas.width = clientWidth;
                    canvas.height = clientHeight;
                    // Keep entities in bounds after resize
                    state.boss.x = canvas.width / 2;
                }
            }

            // --- UPDATE IS HERE ---

            // 1. Hero Movement
            const speed = 300;
            let dx = 0;
            let dy = 0;
            if (inputRef.current.w) dy -= 1;
            if (inputRef.current.s) dy += 1;
            if (inputRef.current.a) dx -= 1;
            if (inputRef.current.d) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                state.hero.x += (dx / len) * speed * dt;
                state.hero.y += (dy / len) * speed * dt;
            }

            // Clamp Hero
            state.hero.x = Math.max(20, Math.min(canvas.width - 20, state.hero.x));
            state.hero.y = Math.max(20, Math.min(canvas.height - 20, state.hero.y));

            // Hero Angle (aim at mouse)
            state.hero.angle = Math.atan2(
                inputRef.current.mouseY - state.hero.y,
                inputRef.current.mouseX - state.hero.x
            );

            // 2. Hero Shooting
            if (shootCooldown > 0) shootCooldown -= dt;
            if ((inputRef.current.click || inputRef.current.space) && shootCooldown <= 0) {
                shootCooldown = gameType === "RPG" ? 0.4 : 0.15; // RPG slower but melee; Shooter fast

                const isRpg = gameType === "RPG";
                let damage = 20; // Default
                if (isRpg) {
                    damage = getRpgStats(asset).strength;
                } else {
                    damage = getShooterStats(asset).firepower;
                }

                if (isRpg) {
                    // Melee Swing (Short range projectile basically)
                    state.projectiles.push({
                        id: Math.random(),
                        x: state.hero.x,
                        y: state.hero.y,
                        vx: Math.cos(state.hero.angle) * 400,
                        vy: Math.sin(state.hero.angle) * 400,
                        owner: "hero",
                        damage: damage * 2, // Higher dmg for melee
                        color: "#fbbf24", // Gold
                        size: 20 // Big swing
                    });
                } else {
                    // Shooter Projectile
                    state.projectiles.push({
                        id: Math.random(),
                        x: state.hero.x,
                        y: state.hero.y,
                        vx: Math.cos(state.hero.angle) * 800,
                        vy: Math.sin(state.hero.angle) * 800,
                        owner: "hero",
                        damage: damage,
                        color: "#3b82f6", // Blue
                        size: 5
                    });
                }
            }

            // 3. Boss Logic
            // Simple Boss AI: Float horizontally and shoot at player
            state.boss.x += Math.sin(time / 1000) * 100 * dt;

            // Boss Attack
            if (bossAttackCooldown > 0) bossAttackCooldown -= dt;
            if (bossAttackCooldown <= 0) {
                bossAttackCooldown = 1.5; // Every 1.5s

                // Shoot at player
                const angle = Math.atan2(state.hero.y - state.boss.y, state.hero.x - state.boss.x);
                state.projectiles.push({
                    id: Math.random(),
                    x: state.boss.x,
                    y: state.boss.y,
                    vx: Math.cos(angle) * 400,
                    vy: Math.sin(angle) * 400,
                    owner: "boss",
                    damage: 15,
                    color: "#ef4444",
                    size: 15 // Big boss Ball
                });

                // Spread shot if HP low
                if (state.boss.hp < 500) {
                    state.projectiles.push({
                        id: Math.random(),
                        x: state.boss.x,
                        y: state.boss.y,
                        vx: Math.cos(angle - 0.3) * 400,
                        vy: Math.sin(angle - 0.3) * 400,
                        owner: "boss",
                        damage: 15,
                        color: "#ef4444",
                        size: 12
                    });
                    state.projectiles.push({
                        id: Math.random(),
                        x: state.boss.x,
                        y: state.boss.y,
                        vx: Math.cos(angle + 0.3) * 400,
                        vy: Math.sin(angle + 0.3) * 400,
                        owner: "boss",
                        damage: 15,
                        color: "#ef4444",
                        size: 12
                    });
                }
            }

            // 4. Projectiles & Collision
            state.projectiles.forEach((p, i) => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Remove OOB
                if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
                    state.projectiles.splice(i, 1);
                    return;
                }

                if (gameType === 'RPG' && p.owner === 'hero' && Math.abs(p.x - state.hero.x) > 100) {
                    // Melee range limit
                    state.projectiles.splice(i, 1);
                    return;
                }

                // Hit Logic
                if (p.owner === "hero") {
                    // Hit Boss?
                    const d = Math.sqrt((p.x - state.boss.x) ** 2 + (p.y - state.boss.y) ** 2);
                    if (d < 50) { // Boss radius approx
                        state.boss.hp -= p.damage;
                        spawnParticles(state, p.x, p.y, p.color, 5);
                        state.projectiles.splice(i, 1);
                        if (state.boss.hp <= 0) {
                            state.status = "victory";
                            setGameState("victory");
                        }
                    }
                } else {
                    // Hit Hero?
                    const d = Math.sqrt((p.x - state.hero.x) ** 2 + (p.y - state.hero.y) ** 2);
                    if (d < 20) { // Hero radius approx
                        state.hero.hp -= p.damage;
                        spawnParticles(state, p.x, p.y, "#ff0000", 5);
                        state.projectiles.splice(i, 1);
                        if (state.hero.hp <= 0) {
                            state.status = "defeat";
                            setGameState("defeat");
                        }
                    }
                }
            });

            // 5. Particles
            for (let i = state.particles.length - 1; i >= 0; i--) {
                const p = state.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= dt * 2;
                if (p.life <= 0) state.particles.splice(i, 1);
            }


            // --- RENDER ---
            renderGame(ctx, canvas, state, asset, gameType);

            animationId = requestAnimationFrame(loop);
        };

        animationId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationId);
    }, [gameType, asset]); // Re-init on game type switch

    return {
        gameState,
        resetGame,
        heroHp: stateRef.current.hero.hp, // Note: This won't update UI reactively efficiently without specific state, but for canvas it's fine
        bossHp: stateRef.current.boss.hp
    };
}

function spawnParticles(state: ArenaState, x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        state.particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color
        });
    }
}

function renderGame(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: ArenaState,
    asset: HeroItemNFT,
    gameType: "RPG" | "SHOOTER"
) {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Boss
    if (state.boss.hp > 0) {
        ctx.save();
        ctx.translate(state.boss.x, state.boss.y);

        // Boss Health Bar
        ctx.fillStyle = "black";
        ctx.fillRect(-60, -90, 120, 8);
        ctx.fillStyle = state.boss.color; // "#ef4444"
        ctx.fillRect(-60, -90, 120 * (Math.max(0, state.boss.hp) / state.boss.maxHp), 8);

        // Draw Boss Graphic
        if (gameType === "RPG") {
            // Dark Knight
            // Cape
            ctx.fillStyle = "#1f2937";
            ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.lineTo(40, 60); ctx.lineTo(-40, 60); ctx.fill();
            // Body Armor
            ctx.fillStyle = "#4b5563";
            ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111"; // Inner armor
            ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
            // Helmet Eyes
            ctx.fillStyle = "#ef4444";
            ctx.shadowBlur = 10; ctx.shadowColor = "#ef4444";
            ctx.fillRect(-10, -5, 8, 4); ctx.fillRect(2, -5, 8, 4);
            ctx.shadowBlur = 0;
            // Spikes
            ctx.fillStyle = "#9ca3af";
            ctx.beginPath(); ctx.moveTo(-35, -20); ctx.lineTo(-50, -40); ctx.lineTo(-25, -30); ctx.fill();
            ctx.beginPath(); ctx.moveTo(35, -20); ctx.lineTo(50, -40); ctx.lineTo(25, -30); ctx.fill();
        } else {
            // Cyber Mech
            ctx.rotate(Math.sin(performance.now() / 500) * 0.1); // Idle sway
            // Legs/Treads
            ctx.fillStyle = "#374151";
            ctx.fillRect(-50, 20, 30, 40); ctx.fillRect(20, 20, 30, 40);
            // Main Body
            ctx.fillStyle = "#1f2937";
            ctx.fillRect(-45, -45, 90, 80);
            // Core
            ctx.fillStyle = "#ef4444";
            ctx.shadowBlur = 15; ctx.shadowColor = "#ef4444";
            ctx.beginPath(); ctx.arc(0, -5, 15, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            // Cannons
            ctx.fillStyle = "#4b5563";
            ctx.fillRect(-65, -20, 20, 40); ctx.fillRect(45, -20, 20, 40);
            ctx.fillStyle = "black";
            ctx.beginPath(); ctx.arc(-55, 30, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(55, 30, 8, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
    }

    // Draw Hero
    if (state.hero.hp > 0) {
        ctx.save();
        ctx.translate(state.hero.x, state.hero.y);

        // Hero Walk Bobbing - use time instead of stateRef
        const breathe = Math.sin(performance.now() / 200) * 1;


        // Health Bar (Floating)
        ctx.fillStyle = "black";
        ctx.fillRect(-20, -50, 40, 4);
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-20, -50, 40 * (Math.max(0, state.hero.hp) / state.hero.maxHp), 4);

        // Rotate body to aim
        ctx.rotate(state.hero.angle);

        // --- DRAW HUMAN BODY ---

        // Shoulders / Torso
        ctx.fillStyle = "#3b82f6"; // Blue shirt
        // Rounded rect for shoulders
        ctx.beginPath();
        ctx.roundRect(-20, -15, 30, 30, 10);
        ctx.fill();

        // Head
        ctx.fillStyle = "#ffdbac"; // Skin tone
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Arms (reach out to weapon)
        ctx.fillStyle = "#ffdbac"; // Skin
        ctx.beginPath();
        ctx.arc(15, 10, 6, 0, Math.PI * 2); // Right hand
        ctx.arc(15, -10, 6, 0, Math.PI * 2); // Left hand
        ctx.fill();

        // Weapon
        if (gameType === "SHOOTER") {
            // Gun visualization
            ctx.fillStyle = "#4b5563"; // Gun Metal
            ctx.fillRect(10, 4, 30, 8); // Barrel right
            ctx.fillStyle = "#111"; // Handle
            ctx.fillRect(10, 4, 8, 8);
        } else {
            // Sword visualization
            ctx.save();
            ctx.translate(20, 0);
            ctx.rotate(Math.PI / 4); // Angled sword
            // Hilt
            ctx.fillStyle = "#b45309"; // Brown
            ctx.fillRect(0, -2, 10, 4);
            ctx.fillRect(8, -6, 4, 12); // Guard
            // Blade
            ctx.fillStyle = "#e5e7eb"; // Steel
            ctx.beginPath();
            ctx.moveTo(12, -3);
            ctx.lineTo(45, 0); // Tip
            ctx.lineTo(12, 3);
            ctx.fill();
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = "white";
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    // Draw Projectiles with trails
    state.projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;

        // Trail effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;

        if (p.owner === 'hero' && gameType === 'RPG') {
            // Melee Slash
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(0, 0, p.size, Math.PI * 1.5, Math.PI * 0.5); // Crescent
            ctx.fill();
        } else {
            // Bullet / Orb
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // Game Over Text Overlay
    if (state.status !== "playing") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // Status Title
        ctx.fillStyle = state.status === "victory" ? "#fbbf24" : "#ef4444";
        ctx.font = "900 60px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.fillText(state.status === "victory" ? "VICTORY" : "DEFEAT", 0, 0);

        // Reset Hint
        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.font = "bold 20px monospace";
        ctx.fillText("TAP TO RETRY", 0, 50);

        ctx.restore();
    }
}

