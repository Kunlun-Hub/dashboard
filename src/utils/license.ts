export function normalizeDashboardServerURL(value?: string) {
  if (!value) return "";

  let normalized = value.trim().toLowerCase().replace(/\/+$/, "");
  if (!normalized) return "";

  try {
    if (normalized.includes("://")) {
      normalized = new URL(normalized).hostname;
    }
  } catch {
    // Keep the original value and continue with lightweight cleanup.
  }

  normalized = normalized.replace(/^https?:\/\//, "");
  normalized = normalized.split("/")[0] ?? "";
  normalized = normalized.replace(/:\d+$/, "");
  return normalized.replace(/^\[/, "").replace(/\]$/, "");
}

export function getDashboardServerURL() {
  if (typeof window === "undefined") return "";
  return normalizeDashboardServerURL(
    window.location.hostname || window.location.host,
  );
}
