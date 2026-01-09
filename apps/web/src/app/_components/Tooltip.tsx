"use client";

import { useState, useRef, type ReactNode, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type TooltipProps = {
    content: string;
    children: ReactNode;
    delay?: number;
    side?: "top" | "bottom" | "left" | "right";
};

export function Tooltip({ content, children, delay = 0.05, side: preferredSide = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, x: 0, y: 0 });
    const [computedSide, setComputedSide] = useState<"top" | "bottom" | "left" | "right">(preferredSide);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay * 1000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    useLayoutEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const margin = 8;

            let newSide = preferredSide;
            let finalLeft = 0;
            let finalTop = 0;
            let offsetX = 0;
            let offsetY = 0;

            // 1. 垂直避障 (Vertical Flip)
            if (preferredSide === "top" && triggerRect.top < tooltipRect.height + margin) {
                newSide = "bottom";
            } else if (preferredSide === "bottom" && window.innerHeight - triggerRect.bottom < tooltipRect.height + margin) {
                newSide = "top";
            }

            // 2. 水平避障 (Horizontal Flip for left/right sides)
            if (preferredSide === "left" && triggerRect.left < tooltipRect.width + margin) {
                newSide = "right";
            } else if (preferredSide === "right" && window.innerWidth - triggerRect.right < tooltipRect.width + margin) {
                newSide = "left";
            }

            // 3. 计算基础坐标 (Absolute position relative to viewport)
            if (newSide === "top") {
                finalLeft = triggerRect.left + triggerRect.width / 2;
                finalTop = triggerRect.top - margin;
            } else if (newSide === "bottom") {
                finalLeft = triggerRect.left + triggerRect.width / 2;
                finalTop = triggerRect.bottom + margin;
            } else if (newSide === "left") {
                finalLeft = triggerRect.left - margin;
                finalTop = triggerRect.top + triggerRect.height / 2;
            } else if (newSide === "right") {
                finalLeft = triggerRect.right + margin;
                finalTop = triggerRect.top + triggerRect.height / 2;
            }

            // 4. 边缘自动修正 (Viewport Shift)
            if (newSide === "top" || newSide === "bottom") {
                const halfWidth = tooltipRect.width / 2;
                const leftBoundary = finalLeft - halfWidth;
                const rightBoundary = finalLeft + halfWidth;

                if (leftBoundary < margin) {
                    offsetX = margin - leftBoundary;
                } else if (rightBoundary > window.innerWidth - margin) {
                    offsetX = window.innerWidth - margin - rightBoundary;
                }
            } else {
                const halfHeight = tooltipRect.height / 2;
                const topBoundary = finalTop - halfHeight;
                const bottomBoundary = finalTop + halfHeight;

                if (topBoundary < margin) {
                    offsetY = margin - topBoundary;
                } else if (bottomBoundary > window.innerHeight - margin) {
                    offsetY = window.innerHeight - margin - bottomBoundary;
                }
            }

            setComputedSide(newSide);
            setCoords({ top: finalTop, left: finalLeft, x: offsetX, y: offsetY });
        }
    }, [isVisible, preferredSide]);

    const translateStyles = {
        top: "-translate-x-1/2 -translate-y-full",
        bottom: "-translate-x-1/2",
        left: "-translate-x-full -translate-y-1/2",
        right: "-translate-y-1/2",
    };

    const arrowStyles = {
        top: "top-full left-1/2 -ml-1 border-t-zinc-800",
        bottom: "bottom-full left-1/2 -ml-1 border-b-zinc-800",
        left: "left-full top-1/2 -mt-1 border-l-zinc-800",
        right: "right-full top-1/2 -mt-1 border-r-zinc-800",
    };

    return (
        <div
            ref={triggerRef}
            className="inline-flex items-center justify-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {mounted && createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            ref={tooltipRef}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: coords.x,
                                y: coords.y
                            }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                            style={{
                                position: 'fixed',
                                top: coords.top,
                                left: coords.left,
                                zIndex: 9999,
                            }}
                            className={`pointer-events-none ${translateStyles[computedSide]}`}
                        >
                            <div className="bg-zinc-800 text-white text-[11px] font-medium px-2 py-1 rounded shadow-xl whitespace-nowrap border border-zinc-700/50">
                                {content}
                            </div>
                            {/* Arrow */}
                            <div
                                className={`absolute border-4 border-transparent ${arrowStyles[computedSide]}`}
                                style={{
                                    transform: (computedSide === 'top' || computedSide === 'bottom')
                                        ? `translateX(${-coords.x}px)`
                                        : `translateY(${-coords.y}px)`
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
