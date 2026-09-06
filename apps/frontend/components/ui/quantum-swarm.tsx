"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Physics & Geometry Types ---
interface SwarmParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    baseX: number;
    baseY: number;
    angle: number;       // Angle in the spiral
    distance: number;    // Distance from center
    size: number;
    excitation: number;  // Used for glow/color pulsing
}

interface PointerState {
    x: number;
    y: number;
    isDown: boolean;
    radius: number;
    shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; strength: number }>;
}

export interface QuantumSwarmProps {
    headline?: string;
    tagline?: string;
    className?: string;
    particleCount?: number;
    children?: React.ReactNode;
}

export function QuantumSwarm({
    headline = "QUANTUM",
    tagline = "SWARM DYNAMICS",
    className = "",
    particleCount = 280, // High enough for density, low enough to keep O(N^2) line drawing smooth
    children,
}: QuantumSwarmProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isRunning, setIsRunning] = useState(true);

    // Pointer state tracking
    const pointerRef = useRef<PointerState>({
        x: -2000,
        y: -2000,
        isDown: false,
        radius: 150,
        shockwaves: [],
    });

    const particlesRef = useRef<SwarmParticle[]>([]);
    const dimensionsRef = useRef({ width: 0, height: 0, cx: 0, cy: 0 });

    // --------------------------------------------------------
    // MESH / SWARM INITIALIZATION
    // --------------------------------------------------------
    const buildSwarm = useCallback((w?: number, h?: number) => {
        const width = w ?? dimensionsRef.current.width ?? (typeof window !== 'undefined' ? window.innerWidth : 0);
        const height = h ?? dimensionsRef.current.height ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
        if (width === 0 || height === 0) return;

        const cx = width / 2;
        const cy = height / 2;
        const particles: SwarmParticle[] = [];

        // Use the Golden Angle to create a beautiful, organic spiral distribution (like a sunflower)
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = Math.PI * 2 * goldenRatio;

        // Scale the galaxy to fit the screen
        const maxRadius = Math.max(width, height) * 0.45;

        for (let i = 0; i < particleCount; i++) {
            // Distribute particles with density focused slightly towards the center
            const dst = Math.pow(i / (particleCount - 1), 0.6) * maxRadius;
            const angle = i * angleIncrement;
            const x = cx + Math.cos(angle) * dst;
            const y = cy + Math.sin(angle) * dst;

            particles.push({
                x,
                y,
                vx: 0,
                vy: 0,
                baseX: x,
                baseY: y,
                angle: angle,
                distance: dst,
                size: Math.random() * 1.5 + 0.6,
                excitation: 0.2, // Subtle initial excitation so particles and constellation are immediately visible on frame 1
            });
        }

        particlesRef.current = particles;
    }, [particleCount]);

    // --------------------------------------------------------
    // CANVAS SIZING & RESIZE OBSERVER (INSTANT FIRST FRAME)
    // --------------------------------------------------------
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const applyDimensions = (w: number, h: number) => {
            const width = Math.max(1, Math.round(w));
            const height = Math.max(1, Math.round(h));
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR for performance

            dimensionsRef.current = {
                width,
                height,
                cx: width / 2,
                cy: height / 2
            };

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            buildSwarm(width, height);
        };

        // 1. Measure and initialize IMMEDIATELY upon mount (no delay!)
        const initialRect = container.getBoundingClientRect();
        const initialWidth = initialRect.width || container.clientWidth || window.innerWidth;
        const initialHeight = initialRect.height || container.clientHeight || window.innerHeight;
        applyDimensions(initialWidth, initialHeight);

        // 2. ResizeObserver for responsive layout updates
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const rect = entry.contentRect;
                if (rect.width > 0 && rect.height > 0) {
                    applyDimensions(rect.width, rect.height);
                }
            }
        });

        resizeObserver.observe(container);

        // 3. Fallback window resize listener
        const handleResize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                applyDimensions(rect.width, rect.height);
            }
        };
        window.addEventListener("resize", handleResize);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, [buildSwarm]);

    // --------------------------------------------------------
    // PHYSICS & RENDER LOOP
    // --------------------------------------------------------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let animId = 0;
        let time = 0;

        const loop = () => {
            if (!isRunning) {
                animId = requestAnimationFrame(loop);
                return;
            }

            time += 0.002; // Global rotation speed
            const { width, height, cx, cy } = dimensionsRef.current;
            const particles = particlesRef.current;
            const pointer = pointerRef.current;

            if (width === 0 || height === 0 || particles.length === 0) {
                animId = requestAnimationFrame(loop);
                return;
            }

            const themeAttr = (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null) || 'light';
            
            const THEME_PALETTES: Record<string, { stroke: string; particle: string; glow: string; isDark: boolean; bgDefault: string }> = {
                light: { stroke: "79, 70, 229", particle: "#4f46e5", glow: "rgba(99, 102, 241, 0.6)", isDark: false, bgDefault: "#ffffff" },
                cream: { stroke: "217, 119, 6", particle: "#d97706", glow: "rgba(245, 158, 11, 0.6)", isDark: false, bgDefault: "#faf6ee" },
                indigo: { stroke: "129, 140, 248", particle: "#818cf8", glow: "rgba(165, 180, 252, 0.8)", isDark: true, bgDefault: "#0b0f19" },
                emerald: { stroke: "16, 185, 129", particle: "#059669", glow: "rgba(52, 211, 153, 0.8)", isDark: false, bgDefault: "#f6fbf9" },
                ruby: { stroke: "195, 71, 106", particle: "#c3476a", glow: "rgba(251, 113, 133, 0.8)", isDark: false, bgDefault: "#faf8f9" },
            };

            const palette = THEME_PALETTES[themeAttr] || THEME_PALETTES.light;
            const strokeBase = palette.stroke;
            const particleBaseColor = palette.particle;
            const particleGlowColor = palette.glow;

            const computedBg = typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim() : '';
            const bgColor = computedBg || palette.bgDefault;

            // 1. Draw Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            // 2. Process Shockwaves (from clicks)
            for (let s = pointer.shockwaves.length - 1; s >= 0; s--) {
                const sw = pointer.shockwaves[s];
                sw.radius += 15;
                sw.strength *= 0.92;
                if (sw.radius > sw.maxRadius || sw.strength < 0.01) {
                    pointer.shockwaves.splice(s, 1);
                } else {
                    ctx.strokeStyle = `rgba(${strokeBase}, ${sw.strength * 0.35})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // 3. Physics Pass: Update Positions and Velocities
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Calculate current target position (slowly rotating the entire spiral)
                const currentAngle = p.angle + time * (1 + 100 / (p.distance + 100)); // Inner particles rotate slightly faster
                p.baseX = cx + Math.cos(currentAngle) * p.distance;
                p.baseY = cy + Math.sin(currentAngle) * p.distance;

                // --- Forces ---
                // a. Spring force towards their orbital base position
                const dxBase = p.baseX - p.x;
                const dyBase = p.baseY - p.y;
                p.vx += dxBase * 0.02; // Spring constant
                p.vy += dyBase * 0.02;

                // b. Pointer interaction (Repulsion / Mouse Magnet)
                const dxPointer = p.x - pointer.x;
                const dyPointer = p.y - pointer.y;
                const distPointer = Math.sqrt(dxPointer * dxPointer + dyPointer * dyPointer);

                if (distPointer < pointer.radius && distPointer > 0) {
                    // Repulse away from pointer
                    const force = (pointer.radius - distPointer) / pointer.radius;
                    // If mouse is down, pull them in slightly instead, creating a tension effect
                    const directionMultiplier = pointer.isDown ? -0.5 : 1.5;
                    p.vx += (dxPointer / distPointer) * force * directionMultiplier;
                    p.vy += (dyPointer / distPointer) * force * directionMultiplier;
                    p.excitation = Math.max(p.excitation, force);
                }

                // c. Shockwave force
                for (let s = 0; s < pointer.shockwaves.length; s++) {
                    const sw = pointer.shockwaves[s];
                    const dxSw = p.x - sw.x;
                    const dySw = p.y - sw.y;
                    const distSw = Math.sqrt(dxSw * dxSw + dySw * dySw);
                    const ringDelta = Math.abs(distSw - sw.radius);

                    if (ringDelta < 30) {
                        const impulse = (1 - ringDelta / 30) * sw.strength * 15;
                        p.vx += (dxSw / distSw) * impulse;
                        p.vy += (dySw / distSw) * impulse;
                        p.excitation = Math.max(p.excitation, 1.0);
                    }
                }

                // d. Apply velocity and friction
                p.vx *= 0.88; // Friction/damping
                p.vy *= 0.88;
                p.x += p.vx;
                p.y += p.vy;

                // e. Cool down excitation
                p.excitation *= 0.95;
            }

            // 4. Render Pass: Connections (Constellation lines)
            const connectionDistanceSq = 3600; // 60px * 60px
            ctx.lineWidth = 0.6;

            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];

                // Draw lines to nearby particles
                // Optimization: Only check a limited set ahead to save CPU on O(N^2)
                const limit = Math.min(particles.length, i + 15);
                for (let j = i + 1; j < limit; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connectionDistanceSq) {
                        const dist = Math.sqrt(distSq);
                        const opacity = 1 - (dist / 60);

                        // If particles are excited, lines glow
                        const combinedExcitation = Math.max(p1.excitation, p2.excitation);
                        const dynamicAlpha = Math.min(1, (opacity * 0.2) + (combinedExcitation * 0.5));

                        ctx.strokeStyle = `rgba(${strokeBase}, ${dynamicAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            }

            // 5. Render Pass: Particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                const radius = p.size + (p.excitation * 2.5);
                ctx.fillStyle = particleBaseColor;

                // For highly excited particles, add an outer glow with the theme accent
                if (p.excitation > 0.3) {
                    ctx.save();
                    ctx.globalAlpha = p.excitation * 0.5;
                    ctx.fillStyle = particleGlowColor;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, radius * 3.2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            animId = requestAnimationFrame(loop);
        };

        // Kick off first frame immediately on mount (zero delay)
        loop();
        return () => cancelAnimationFrame(animId);
    }, [isRunning]);

    // --------------------------------------------------------
    // EVENT HANDLERS
    // --------------------------------------------------------
    const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        pointerRef.current.x = e.clientX - rect.left;
        pointerRef.current.y = e.clientY - rect.top;
    };

    const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;

        pointerRef.current.isDown = true;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Create a localized shockwave at pointer
        pointerRef.current.shockwaves.push({
            x, y,
            radius: 10,
            maxRadius: 200,
            strength: 0.8,
        });
    };

    const handlePointerUp = () => {
        pointerRef.current.isDown = false;
    };

    const handlePointerLeave = () => {
        // Move pointer far off screen so forces drop to zero
        pointerRef.current.x = -2000;
        pointerRef.current.y = -2000;
        pointerRef.current.isDown = false;
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handlePointerMove}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerLeave}
            className={cn(
                "group relative flex h-full w-full select-none flex-col items-center justify-center overflow-hidden bg-transparent",
                className
            )}
        >
            {/* The active rendering canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block h-full w-full cursor-crosshair"
            />

            {/* UI Overlay */}
            <div className="relative z-20 flex h-full w-full flex-col items-center justify-center p-5 md:p-8 pointer-events-none">
                {/* Centered Content or Typography */}
                <main className="flex flex-col items-center justify-center text-center w-full">
                    {children ? (
                        children
                    ) : headline ? (
                        <h1 className="font-mono text-5xl font-black tracking-tighter uppercase sm:text-7xl md:text-9xl text-neutral-900 dark:text-white pointer-events-none mix-blend-difference opacity-90 dark:mix-blend-normal">
                            {headline}
                        </h1>
                    ) : null}
                </main>
            </div>
        </div>
    );
}

export default QuantumSwarm;
