const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_SEGMENT = /^\d+$/;
const HIGH_ENTROPY_SEGMENT = /^(?=.{12,}$)(?=.*[a-z])(?=.*\d)[a-z0-9_-]+$/i;

export export function canonicalizePathname(pathname) {
  const rawSegments = String(pathname || "/")
    .split("/")
    .filter(Boolean);
  const segments = rawSegments.map((seg) => {
    if (UUID_SEGMENT.test(seg)) return ":uuid";
    if (NUMERIC_SEGMENT.test(seg)) return ":id";
    if (HIGH_ENTROPY_SEGMENT.test(seg)) return ":id";
    return seg;
  });

  const joined = `/${segments.join("/")}`;
  return joined.replace(/\/$/, "") || "/";
}

export function canonicalEndpoint(method, urlString) {
  const url = new URL(urlString);
  const path = canonicalizePathname(url.pathname);
  return `${String(method).toUpperCase()} ${path}`;
}

export function normalizeUrl(urlString) {
  const url = new URL(urlString);
  url.search = "";
  url.hash = "";
  url.pathname = canonicalizePathname(url.pathname);
  return url.toString();
}
