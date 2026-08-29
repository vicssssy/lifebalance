const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Temporary local-only switch used by the one-click preview launcher.
 * Production builds always keep the original authentication flow enabled.
 */
export function isLocalPreviewAuthBypassEnabled(): boolean {
  if (!import.meta.env.DEV || import.meta.env["VITE_SKIP_AUTH"] !== "true") return false;
  if (typeof window === "undefined") return true;
  return LOCAL_PREVIEW_HOSTS.has(window.location.hostname);
}
