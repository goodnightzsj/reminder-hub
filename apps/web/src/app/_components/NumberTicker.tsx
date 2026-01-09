"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion, useInView } from "framer-motion";

type NumberTickerProps = {
    value: number;
    direction?: "up" | "down";
    delay?: number; // seconds
    className?: string;
};

export function NumberTicker({
    value,
    direction = "up",
    delay = 0,
    className = "",
}: NumberTickerProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "0px" });

    const motionValue = useMotionValue(direction === "down" ? value : 0);
    const springValue = useSpring(motionValue, {
        damping: 40,
        stiffness: 120,
    });

    const displayValue = useTransform(springValue, (latest) =>
        latest.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    );

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionValue.set(value);
            }, delay * 1000);
        }
    }, [motionValue, isInView, delay, value]);

    return (
        <motion.span
            ref={ref}
            className={`inline-block tabular-nums tracking-tighter ${className}`}
        >
            {displayValue}
        </motion.span>
    );
}
