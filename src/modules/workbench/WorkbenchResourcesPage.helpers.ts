export function textValue(value?: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanIDList(values?: unknown) {
  const result: string[] = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = textValue(value);
    if (normalized && !result.includes(normalized)) {
      result.push(normalized);
    }
  }
  return result;
}

export function stringListValue(values?: unknown) {
  return cleanIDList(values);
}

export function isValidWorkbenchHTTPURL(rawURL: string) {
  try {
    const parsed = new URL(rawURL);
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    return !!parsed.hostname && (scheme === "http" || scheme === "https");
  } catch {
    return false;
  }
}

export function buildWorkbenchResourcePathSuffix(resourceID?: unknown) {
  const id = textValue(resourceID);
  return id ? `/${encodeURIComponent(id)}` : "";
}

export function normalizedWorkbenchAssetPath(pathname?: string) {
  pathname = textValue(pathname);
  if (!pathname) return "";
  pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const apiAssetPrefix = "/api/workbench/assets/";
  const assetPrefix = "/workbench/assets/";
  const apiIndex = pathname.indexOf(apiAssetPrefix);
  if (apiIndex >= 0) {
    return pathname.slice(apiIndex + "/api".length);
  }
  const assetIndex = pathname.indexOf(assetPrefix);
  if (assetIndex >= 0) {
    return pathname.slice(assetIndex);
  }
  return "";
}

export function workbenchAssetPath(iconUrl?: string) {
  const normalized = normalizedWorkbenchAssetPath(iconUrl);
  if (normalized) return normalized;
  const value = textValue(iconUrl);
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return normalizedWorkbenchAssetPath(parsed.pathname);
  } catch {
    return "";
  }
}

export function safeWorkbenchIconDisplayURL(rawURL?: string) {
  const value = textValue(rawURL);
  if (!value) return "";
  if (value.startsWith("blob:")) return value;
  if (value.startsWith("data:image/")) return value;
  try {
    const parsed = new URL(value);
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    return parsed.hostname && (scheme === "http" || scheme === "https")
      ? value
      : "";
  } catch {
    return "";
  }
}
