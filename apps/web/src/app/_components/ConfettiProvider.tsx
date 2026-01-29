"use client";

import { createContext, useContext, useRef, useState, ReactNode, useCallback } from "react";
import { Confetti } from "./Confetti";
import { MicroConfetti, createMicroConfettiParticles, type MicroConfettiParticle } from "./MicroConfetti";
import { useTimeouts } from "./hooks/useTimeouts";

type ConfettiContextType = {
    triggerConfetti: () => void;
    triggerMicroConfetti: (x: number, y: number) => void;
};

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export function useConfetti() {
    const context = useContext(ConfettiContext);
    if (!context) {
        return {
            triggerConfetti: () => { },
            triggerMicroConfetti: () => { }
        };
    }
    return context;
}

export function ConfettiProvider({ children }: { children: ReactNode }) {
    const [trigger, setTrigger] = useState(false);
    const [microParticles, setMicroParticles] = useState<MicroConfettiParticle[]>([]);
    const clearMicroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { scheduleTimeout, cancelTimeout } = useTimeouts();

    const triggerConfetti = useCallback(() => {
        setTrigger(true);
    }, []);

    const triggerMicroConfetti = useCallback((x: number, y: number) => {
        setMicroParticles(createMicroConfettiParticles(x, y));
        cancelTimeout(clearMicroTimerRef.current);
        clearMicroTimerRef.current = scheduleTimeout(() => setMicroParticles([]), 1000);
    }, [scheduleTimeout, cancelTimeout]);

    const handleComplete = useCallback(() => {
        setTrigger(false);
    }, []);

    return (
        <ConfettiContext.Provider value={{ triggerConfetti, triggerMicroConfetti }}>
            {children}
            <Confetti trigger={trigger} onComplete={handleComplete} />
            <MicroConfetti particles={microParticles} />
        </ConfettiContext.Provider>
    );
}
