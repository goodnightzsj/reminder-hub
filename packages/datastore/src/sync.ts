import type { RemoteDataStore } from "./remote";
import type { LocalDataStore } from "./local";

const LAST_SYNC_KEY = "last_synced_at";

export type SyncStatus =
  | { kind: "idle" }
  | { kind: "running"; startedAt: string }
  | { kind: "success"; finishedAt: string; uploaded: number; downloaded: number }
  | { kind: "error"; finishedAt: string; message: string };

/**
 * Pulls remote changes since last sync, pushes local changes since last sync,
 * then records the server time as the new watermark.
 *
 * Call order:
 *   1. Collect local unsynced rows.
 *   2. POST /api/v1/sync with them and our `since` watermark.
 *   3. Apply server's returned rows locally (LWW).
 *   4. Persist server time as new watermark.
 *
 * If step 2 fails, watermark is not advanced, so next run retries everything.
 */
export class SyncEngine {
  private status: SyncStatus = { kind: "idle" };
  private inFlight: Promise<SyncStatus> | null = null;

  constructor(
    private readonly local: LocalDataStore,
    private readonly remote: RemoteDataStore,
  ) {}

  getStatus(): SyncStatus {
    return this.status;
  }

  async run(): Promise<SyncStatus> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.runInner().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async runInner(): Promise<SyncStatus> {
    const startedAt = new Date().toISOString();
    this.status = { kind: "running", startedAt };

    try {
      const since = await this.local.getSyncState(LAST_SYNC_KEY);
      const localChanges = await this.local.collectChangesSince(since);
      const uploaded =
        localChanges.todos.length +
        localChanges.anniversaries.length +
        localChanges.subscriptions.length +
        localChanges.items.length;

      const response = await this.remote.sync({
        since,
        changes: localChanges,
      });

      await this.local.applyRemoteChanges(response.changes);
      const downloaded =
        response.changes.todos.length +
        response.changes.anniversaries.length +
        response.changes.subscriptions.length +
        response.changes.items.length;

      await this.local.setSyncState(LAST_SYNC_KEY, response.serverTime);

      this.status = {
        kind: "success",
        finishedAt: new Date().toISOString(),
        uploaded,
        downloaded,
      };
      return this.status;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.status = { kind: "error", finishedAt: new Date().toISOString(), message };
      return this.status;
    }
  }

  /** Reset sync watermark - next run() will re-sync everything. */
  async resetWatermark(): Promise<void> {
    await this.local.setSyncState(LAST_SYNC_KEY, "");
  }
}
