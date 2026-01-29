"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Portal } from "./ui/Portal";

export type MicroConfettiParticle = {
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

export function createMicroConfettiParticles(x: number, y: number, color?: string): MicroConfettiParticle[] {
    return Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x,
        y,
        color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 6 + 4,
        targetX: x + (Math.random() - 0.5) * 100,
        targetY: y + (Math.random() - 0.5) * 100 - 40,
        rotation: Math.random() * 360,
    }));
}

export function MicroConfetti({ particles }: { particles: MicroConfettiParticle[] }) {
    return (
        <Portal>
            <AnimatePresence>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ x: p.x - p.size / 2, y: p.y - p.size / 2, opacity: 1, scale: 0, rotate: 0 }}
                        animate={{
                            x: p.targetX - p.size / 2,
                            y: p.targetY - p.size / 2,
                            opacity: 0,
                            scale: 1,
                            rotate: p.rotation
                        }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="pointer-events-none fixed z-[9999] rounded-full"
                        style={{
                            width: p.size,
                            height: p.size,
                            background: p.color,
                            left: 0,
                            top: 0,
                        }}
                    />
                ))}
            </AnimatePresence>
        </Portal>
    );
}
