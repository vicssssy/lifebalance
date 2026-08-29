const BROWSER_LOCAL_APP_MODE = true;
const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Permanent sign-in-free application mode. Personal planner data is stored in
 * the current browser while the original authenticated Supabase path remains
 * available for a future account-enabled release.
 */
export function isLocalPreviewAuthBypassEnabled(): boolean {
  if (BROWSER_LOCAL_APP_MODE) return true;
  if (!import.meta.env.DEV || import.meta.env["VITE_SKIP_AUTH"] !== "true") return false;
  if (typeof window === "undefined") return true;
  return LOCAL_PREVIEW_HOSTS.has(window.location.hostname);
}
