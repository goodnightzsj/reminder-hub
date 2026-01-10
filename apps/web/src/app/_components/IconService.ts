import { type IconifyIcon } from '@iconify/react';

// Define the data structure for our icon mapping
export type BrandIconData = {
    icon: string; // Iconify ID (e.g., "ri:wechat-fill", "simple-icons:netflix")
    color: string; // Brand color hex
    title: string;
};

// 1. Chinese Aliases Map (Name -> Key)
// Maps various Chinese/English input names to a canonical key

const DEFAULT_ICON: BrandIconData = {
    icon: "", 
    color: "#64748b", // slate-500
    title: "Service"
};

export function findServiceIcon(name: string): BrandIconData {
    return {
        ...DEFAULT_ICON,
        title: name
    };
}
