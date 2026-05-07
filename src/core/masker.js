const KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /ssn/i,
  /credit[-_]?card/i,
  /api[-_]?key/i,
  /access[-_]?key/i,
  /private[-_]?key/i,
];

const VALUE_PATTERNS = [
  /^eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+\/=]*$/, // JWT
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // credit card
];

export function deepMask(obj, path = "") {
  if (typeof obj === "string") {
    if (VALUE_PATTERNS.some((p) => p.test(obj))) return "[REDACTED]";
    return obj;
  }
  if (Array.isArray(obj)) return obj.map((item) => deepMask(item, path));
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (KEY_PATTERNS.some((p) => p.test(key))) {
        obj[key] = "[REDACTED]";
      } else {
        obj[key] = deepMask(obj[key], path ? `${path}.${key}` : key);
      }
    }
  }
  return obj;
}

export function maskSensitiveData(data) {
  return deepMask(data);
}
