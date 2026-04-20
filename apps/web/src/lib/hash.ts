/**
 * FNV-1a 32-bit + MurmurHash3 finalizer。
 * 对短字符串（尤其 CJK 2-4 字分类名）的分散性显著优于经典 djb2，
 * 且输出 uint32，便于后续做 % N 或映射到连续区间使用。
 */
export function getStableHashCode(value: string): number {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    // FNV 素数 16777619（0x01000193），Math.imul 避免 JS number 溢出 overflow。
    h = Math.imul(h, 0x01000193);
  }
  // MurmurHash3 finalizer，进一步打散前 16 位与后 16 位的相关性。
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
