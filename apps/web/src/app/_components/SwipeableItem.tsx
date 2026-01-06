"use client";

import { useRef, useState, ReactNode } from "react";

type SwipeableItemProps = {
    children: ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftAction?: ReactNode;
    rightAction?: ReactNode;
    threshold?: number;
    className?: string;
};

export function SwipeableItem({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftAction,
    rightAction,
    threshold = 80,
    className = "",
}: SwipeableItemProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        startXRef.current = e.touches[0].clientX;
        currentXRef.current = e.touches[0].clientX;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        currentXRef.current = e.touches[0].clientX;
        const diff = currentXRef.current - startXRef.current;
        // Limit the drag distance
        const limitedDiff = Math.max(-150, Math.min(150, diff));
        setTranslateX(limitedDiff);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        if (translateX < -threshold && onSwipeLeft) {
            onSwipeLeft();
        } else if (translateX > threshold && onSwipeRight) {
            onSwipeRight();
        }

        setTranslateX(0);
    };

    const showLeftAction = translateX > 30;
    const showRightAction = translateX < -30;

    return (
        <div className={`relative overflow-hidden ${className}`} ref={containerRef}>
            {/* Left Action Background (shown when swiping right) */}
            {leftAction && (
                <div
                    className={[
                        "absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity",
                        "bg-success text-success",
                        showLeftAction ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    style={{ width: Math.abs(translateX) }}
                >
                    {leftAction}
                </div>
            )}

            {/* Right Action Background (shown when swiping left) */}
            {rightAction && (
                <div
                    className={[
                        "absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity",
                        "bg-danger text-danger",
                        showRightAction ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    style={{ width: Math.abs(translateX) }}
                >
                    {rightAction}
                </div>
            )}

            {/* Main Content */}
            <div
                className={[
                    "relative bg-elevated",
                    isDragging ? "" : "transition-transform duration-200",
                ].join(" ")}
                style={{ transform: `translateX(${translateX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}
