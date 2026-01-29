"use client";

import { motion, AnimatePresence } from "framer-motion";

import { Icon } from "@iconify/react";
import { MicroConfetti } from "./MicroConfetti";
import { Magnetic } from "./shared/Magnetic";
import {
    COLOR_THEMES,
    type ColorThemeId,
} from "@/lib/color-theme";
import { useColorTheme } from "./hooks/useColorTheme";
import { useThemeConfetti } from "./hooks/useThemeConfetti";

const themes = COLOR_THEMES;

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
};

export function ThemeSwitcher() {
    const { theme, setTheme, mounted } = useColorTheme();
    const { confetti, triggerConfetti } = useThemeConfetti();

    if (!mounted) {
        return (
            <div className="flex flex-wrap gap-4">
                {themes.map((t) => (
                    <div
                        key={t.id}
                        className="h-9 w-9 rounded-full bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    const handleThemeChange = (e: React.MouseEvent, id: ColorThemeId, color: string) => {
        setTheme(id);
        const rect = e.currentTarget.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        triggerConfetti(x, y, color);
    };

    return (
        <>
            <MicroConfetti particles={confetti} />
            <motion.div
                className="flex flex-wrap gap-5 p-1"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {themes.map((t) => {
                    const isActive = theme === t.id;
                    return (
                        <Magnetic key={t.id} strength={0.4}>
                            <motion.button
                                onClick={(e) => handleThemeChange(e, t.id, t.color)}
                                className="group relative flex flex-col items-center gap-2"
                                title={t.name}
                                variants={item}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                {/* 容器 */}
                                <div className="relative flex h-9 w-9 items-center justify-center">

                                    {/* 选中态：外圈圆环 (支持渐变 + 光晕 Glow) - 使用 layoutId 实现滑动效果 */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="theme-selection-ring"
                                            className="absolute inset-0 rounded-full overflow-hidden"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            style={{
                                                background: t.color,
                                                maskImage: "radial-gradient(circle closest-side, transparent 83%, black 85%)",
                                                WebkitMaskImage: "radial-gradient(circle closest-side, transparent 83%, black 85%)",
                                                boxShadow: `0 0 12px -2px ${t.color}`, // 光晕效果
                                            }}
                                        >
                                            {/* Shimmer Effect: 旋转的流光 */}
                                            <motion.div
                                                className="absolute inset-[-150%]"
                                                style={{
                                                    background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 100deg, rgba(255,255,255,0.3) 180deg, transparent 240deg)",
                                                }}
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            />
                                        </motion.div>
                                    )}

                                    {/* 颜色圆球 (isActive时缩小) */}
                                    <motion.div
                                        className="absolute inset-0 rounded-full flex items-center justify-center"
                                        initial={false}
                                        animate={{
                                            scale: isActive ? [1, 1.15, 0.78] : 1, // 选中时：先放大(吸气) -> 再缩小(锁定)
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            ease: "easeInOut",
                                            delay: isActive ? 0.3 : 0, // 等圆环大致到位后再开始
                                            times: [0, 0.4, 1] // 控制关键帧时间点
                                        }}
                                        style={{ background: t.color }}
                                    >
                                        {/* 选中态：对号 (仅在选中且缩小后显示) */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0, rotate: -30 }} // 初始稍微偏转
                                                    animate={{
                                                        opacity: 1,
                                                        scale: [0, 1.2, 1], // Overshoot 弹射效果
                                                        rotate: 0
                                                    }}
                                                    exit={{ opacity: 0, scale: 0, rotate: -30 }}
                                                    transition={{ delay: 0.4, duration: 0.3 }} // 延迟显示
                                                >
                                                    <Icon icon="ri:check-line" className="text-white h-4 w-4" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>

                                {/* 文本标签 */}
                                <span className={`text-[11px] font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-primary"}`}>
                                    {t.name}
                                </span>
                            </motion.button>
                        </Magnetic>
                    );
                })}
            </motion.div>
        </>
    );
}
