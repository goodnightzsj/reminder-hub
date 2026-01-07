"use client";

import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        // Simple fade-in effect on mount
        const raf = requestAnimationFrame(() => setOpacity(1));
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div
            className="transition-opacity duration-300 ease-in-out"
            style={{ opacity }}
        >
            {children}
        </div>
    );
}
