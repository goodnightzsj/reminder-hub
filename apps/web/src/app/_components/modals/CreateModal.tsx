"use client";

import { useRef } from "react";
import { motion, AnimatePresence, useAnimationControls, useDragControls, type PanInfo } from "framer-motion";
import { IconX } from "../Icons";
import { useCreateModal } from "../hooks/useCreateModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useFocusScrollIntoView } from "../hooks/useFocusScrollIntoView";
import { Portal } from "../ui/Portal";

type CreateModalProps = {
    children: React.ReactNode;
    title: string;
};

// 下滑手势触发关闭的阈值，位移 >120px 或速度 >500 属于"明确意图下滑"
const DISMISS_THRESHOLD_OFFSET = 120;
const DISMISS_THRESHOLD_VELOCITY = 500;

export function CreateModal({ children, title }: CreateModalProps) {
    const { isOpen, close } = useCreateModal();
    const sheetRef = useRef<HTMLDivElement>(null);
    const animation = useAnimationControls();
    // 拖拽只能从 grab bar/header 发起，不让表单内部控件触发拖拽
    const dragControls = useDragControls();

    useBodyScrollLock(isOpen);
    useEscapeKey(close, isOpen);
    useFocusScrollIntoView(isOpen);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > DISMISS_THRESHOLD_OFFSET || info.velocity.y > DISMISS_THRESHOLD_VELOCITY) {
            close();
            return;
        }
        animation.start({ y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={close}
                        />

                        {/* Modal Content */}
                        <motion.div
                            ref={sheetRef}
                            role="dialog"
                            aria-modal="true"
                            aria-label={title}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={animation}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            // 拖动入口由 handle 区的 onPointerDown 显式调用 dragControls.start()，
                            // 表单字段不会被误触成拖拽。
                            drag="y"
                            dragControls={dragControls}
                            dragListener={false}
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            onDragEnd={handleDragEnd}
                            className="relative w-full max-w-lg bg-base sm:rounded-2xl rounded-t-2xl shadow-2xl border border-default flex flex-col max-h-[90dvh]"
                        >
                            {/* Grab bar + header：整块作为拖拽握把 */}
                            <div
                                onPointerDown={(e) => dragControls.start(e)}
                                className="cursor-grab active:cursor-grabbing touch-none"
                            >
                                <div className="flex justify-center pt-2 pb-1 sm:hidden" aria-hidden="true">
                                    <div className="h-1 w-10 rounded-full bg-muted/60" />
                                </div>
                                <div className="flex items-center justify-between px-4 py-2 sm:py-3 border-b border-divider">
                                    <h2 className="text-lg font-semibold">{title}</h2>
                                    <button
                                        type="button"
                                        onClick={close}
                                        aria-label="关闭"
                                        onPointerDown={(e) => e.stopPropagation()}
                                        className="flex h-11 w-11 items-center justify-center text-muted hover:text-primary transition-colors rounded-full hover:bg-surface touch-auto"
                                    >
                                        <IconX aria-hidden="true" className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content — 安全区留底避免被 Home Indicator 遮挡 */}
                            <div className="flex-1 overflow-y-auto p-4 pb-safe overscroll-contain">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
