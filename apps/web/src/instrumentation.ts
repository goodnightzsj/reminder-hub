export async function register() {
  // Next.js will build the instrumentation hook for both Node.js and Edge.
  // This project relies on Node-only modules (SQLite, fs, crypto) for the internal scheduler,
  // so the Edge instrumentation must be a no-op to avoid bundling Node APIs.
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { ensureInternalSchedulerStarted } = await import("@/server/internal-scheduler");
  ensureInternalSchedulerStarted();
}
