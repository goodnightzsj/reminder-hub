"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Confetti } from "./Confetti";
import { MicroConfetti } from "./MicroConfetti";

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
    const [micro, setMicro] = useState({ trigger: false, x: 0, y: 0 });

    const triggerConfetti = useCallback(() => {
        setTrigger(true);
    }, []);

    const triggerMicroConfetti = useCallback((x: number, y: number) => {
        setMicro({ trigger: true, x, y });
        // Reset immediately to allow rapid triggers if needed (handled by the component's internal timer too)
        setTimeout(() => setMicro(prev => ({ ...prev, trigger: false })), 50);
    }, []);

    const handleComplete = useCallback(() => {
        setTrigger(false);
    }, []);

    return (
        <ConfettiContext.Provider value={{ triggerConfetti, triggerMicroConfetti }}>
            {children}
            <Confetti trigger={trigger} onComplete={handleComplete} />
            <MicroConfetti trigger={micro.trigger} x={micro.x} y={micro.y} />
        </ConfettiContext.Provider>
    );
}
