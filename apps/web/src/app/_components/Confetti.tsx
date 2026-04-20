"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

type ConfettiPiece = {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    scale: number;
    velocityX: number;
    velocityY: number;
};

const colors = [
    "#10B981", // green
    "#8B5CF6", // purple
    "#F59E0B", // amber
    "#3B82F6", // blue
    "#EF4444", // red
    "#EC4899", // pink
];

function createPiece(id: number): ConfettiPiece {
    return {
        id,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.5 + Math.random() * 0.5,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: -10 - Math.random() * 5,
    };
}

type ConfettiProps = {
    trigger: boolean;
    onComplete?: () => void;
};

export function Confetti({ trigger, onComplete }: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        if (!trigger) return;

        // prefers-reduced-motion：跳过粒子动画，立即回调通知完成
        if (prefersReducedMotion) {
            onComplete?.();
            return;
        }

        if (trigger) {
            const newPieces = Array.from({ length: 50 }, (_, i) => createPiece(i));
            setPieces(newPieces);

            // Animate
            let frame = 0;
            const maxFrames = 120; // 2 seconds at 60fps
            const interval = setInterval(() => {
                frame++;
                if (frame >= maxFrames) {
                    clearInterval(interval);
                    setPieces([]);
                    onComplete?.();
                    return;
                }

                setPieces((prev) =>
                    prev.map((p) => ({
                        ...p,
                        x: p.x + p.velocityX * 0.2, // Slow down horizontal movement
                        y: p.y + p.velocityY * 0.2, // Slow down vertical movement
                        velocityY: p.velocityY + 0.8, // Add gravity
                        rotation: p.rotation + 5,
                    }))
                );
            }, 16);

            return () => clearInterval(interval);
        }
    }, [trigger, onComplete, prefersReducedMotion]);

    if (pieces.length === 0) return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden flex items-center justify-center">
            {pieces.map((piece) => (
                <div
                    key={piece.id}
                    className="absolute h-3 w-3 rounded-sm shadow-sm"
                    style={{
                        left: `${piece.x}%`,
                        top: `${piece.y}%`,
                        transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
                        backgroundColor: piece.color,
                        opacity: frameToOpacity(piece.y),
                    }}
                />
            ))}
        </div>
    );
}

function frameToOpacity(y: number): number {
    // Fade out if it goes too low
    if (y > 90) return Math.max(0, 1 - (y - 90) / 10);
    return 1;
}
