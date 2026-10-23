// Keep installed-app deep links intact. HTTPS redirects use the existing bridge.
export function nativeAuthRedirect(configuredUrl: string | undefined, defaultUrl: string) {
  if (!configuredUrl) return defaultUrl;
  const url = new URL(configuredUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") return configuredUrl;
  url.pathname = "/auth/native-callback";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function nativeCallbackRedirect(configuredUrl: string | undefined) {
  return configuredUrl || "c101://auth/callback";
}
