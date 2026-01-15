type ProgressRingProps = {
    radius: number;
    stroke: number;
    progress: number;
    color: string;
};

// Simple Circular Progress Component
export function ProgressRing({ radius, stroke, progress, color }: ProgressRingProps) {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-muted/40"
                />
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + " " + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={`${color} transition-all duration-500`}
                />
            </svg>
        </div>
    );
}

