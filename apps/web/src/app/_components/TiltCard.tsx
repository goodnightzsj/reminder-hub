"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    maxRotation?: number;
    perspective?: number;
    scale?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
    children,
    className = "",
    maxRotation = 8,
    perspective = 1000,
    scale = 1.02,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    // Mouse position inside the card (0 to 1)
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    // Smooth springs for rotation
    const rotateX = useSpring(useTransform(y, [0, 1], [maxRotation, -maxRotation]), {
        stiffness: 150,
        damping: 25,
    });
    const rotateY = useSpring(useTransform(x, [0, 1], [-maxRotation, maxRotation]), {
        stiffness: 150,
        damping: 25,
    });

    // Glare effect movement
    const glareX = useSpring(useTransform(x, [0, 1], ["0%", "100%"]), {
        stiffness: 150,
        damping: 25,
    });
    const glareY = useSpring(useTransform(y, [0, 1], ["0%", "100%"]), {
        stiffness: 150,
        damping: 25,
    });
    const glareOpacity = useSpring(0, { stiffness: 150, damping: 25 });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        x.set(mouseX / width);
        y.set(mouseY / height);
        glareOpacity.set(0.4);
    };

    const handleMouseLeave = () => {
        x.set(0.5);
        y.set(0.5);
        glareOpacity.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ scale: 1 }}
            whileHover={{ scale }}
            style={{
                perspective,
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
            }}
            className={`relative h-full w-full ${className}`}
        >
            <div style={{ transform: "translateZ(0px)" }} className="h-full w-full">
                {children}
            </div>

            {/* Glare Overlay */}
            <motion.div
                className="pointer-events-none absolute inset-0 z-50 rounded-[inherit]"
                style={{
                    opacity: glareOpacity,
                    background: useTransform(
                        [glareX, glareY],
                        ([gx, gy]) =>
                            `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.25) 0%, transparent 60%)`
                    ),
                }}
            />
        </motion.div>
    );
};
