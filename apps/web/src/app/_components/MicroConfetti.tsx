"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Particle = {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    targetX: number;
    targetY: number;
    rotation: number;
};

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export function MicroConfetti({
    trigger,
    x = 0,
    y = 0
}: {
    trigger: boolean;
    x?: number;
    y?: number
}) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (trigger) {
            const newParticles = Array.from({ length: 12 }, (_, i) => ({
                id: Date.now() + i,
                x,
                y,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: Math.random() * 6 + 4,
                targetX: x + (Math.random() - 0.5) * 100,
                targetY: y + (Math.random() - 0.5) * 100 - 40,
                rotation: Math.random() * 360,
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => setParticles([]), 1000);
            return () => clearTimeout(timer);
        }
    }, [trigger, x, y]);

    return (
        <AnimatePresence>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: p.x, y: p.y, opacity: 1, scale: 0, rotate: 0 }}
                    animate={{
                        x: p.targetX,
                        y: p.targetY,
                        opacity: 0,
                        scale: 1,
                        rotate: p.rotation
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="pointer-events-none fixed z-[100] rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        left: 0,
                        top: 0,
                    }}
                />
            ))}
        </AnimatePresence>
    );
}
