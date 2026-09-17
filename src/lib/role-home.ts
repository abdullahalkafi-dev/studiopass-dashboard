/**
 * Post-login / post-denial home route per dashboard role.
 * Presenter must never land on `/` (studio ops / revenue surface).
 */
export function getRoleHomePath(role?: string | null): string {
  switch (role) {
    case "presenter":
      return "/presenter";
    default:
      return "/";
  }
}
