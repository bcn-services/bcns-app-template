/**
 * storage.ts — Storage adapter interface (template contract).
 *
 * File access always goes through this interface so a client-specific backend
 * (e.g. a client's self-hosted Nextcloud over WebDAV) never hardens into the
 * platform template. The platform default is Supabase Storage in the client's
 * own project; the database stores references (keys), storage holds bytes,
 * and anything private is served via signed, expiring URLs.
 *
 * Keys are ALWAYS derived from canonical business ids (e.g. job id) — no
 * name-based lookups.
 */

export interface StorageAdapter {
  /** Store bytes under a canonical key (e.g. `jobs/<jobId>/photos/<file>`). */
  putFile(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** Signed, expiring URL for private content. */
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  /** List keys under a canonical prefix. */
  listKeys(prefix: string): Promise<string[]>;
}

/**
 * Resolve the configured adapter, or null when storage is unconfigured (the
 * keyless template runs with file features disabled, not crashing).
 *
 * Client builds implement and return a real adapter here — the platform
 * default is a Supabase Storage adapter; a WebDAV adapter is the documented
 * alternative when a client keeps their own file server.
 */
export function getStorageAdapter(): StorageAdapter | null {
  return null;
}
