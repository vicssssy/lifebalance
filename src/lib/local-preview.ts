const PUBLIC_DEMO_MODE = true;
const LOCAL_PREVIEW_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/**
 * Temporary public demo mode. Authentication is bypassed, personal planner
 * queries are replaced by fixtures, and planner mutations are disabled.
 * Set PUBLIC_DEMO_MODE to false when account access is ready to come back;
 * the original local launcher bypass remains available for development.
 */
export function isLocalPreviewAuthBypassEnabled(): boolean {
  if (PUBLIC_DEMO_MODE) return true;
  if (!import.meta.env.DEV || import.meta.env["VITE_SKIP_AUTH"] !== "true") return false;
  if (typeof window === "undefined") return true;
  return LOCAL_PREVIEW_HOSTS.has(window.location.hostname);
}
