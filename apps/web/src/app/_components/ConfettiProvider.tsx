"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Confetti } from "./Confetti";

type ConfettiContextType = {
    triggerConfetti: () => void;
};

const ConfettiContext = createContext<ConfettiContextType | null>(null);

export function useConfetti() {
    const context = useContext(ConfettiContext);
    if (!context) {
        // Return no-op if not wrapped in provider
        return { triggerConfetti: () => { } };
    }
    return context;
}

export function ConfettiProvider({ children }: { children: ReactNode }) {
    const [trigger, setTrigger] = useState(false);

    const triggerConfetti = useCallback(() => {
        setTrigger(true);
    }, []);

    const handleComplete = useCallback(() => {
        setTrigger(false);
    }, []);

    return (
        <ConfettiContext.Provider value={{ triggerConfetti }}>
            {children}
            <Confetti trigger={trigger} onComplete={handleComplete} />
        </ConfettiContext.Provider>
    );
}
