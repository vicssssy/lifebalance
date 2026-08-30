const CLOUD_WORKSPACE_MODE = true;

/**
 * Permanent sign-in-free application mode. Personal planner data is stored in
 * a private Cloudflare D1 workspace identified by an HttpOnly browser cookie.
 */
export function isCloudWorkspaceModeEnabled(): boolean {
  return CLOUD_WORKSPACE_MODE;
}
