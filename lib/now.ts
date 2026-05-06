// Demo "now" override. The mockup uses Feb 17, 2026 as the current date.
// Override via env (NOW_OVERRIDE) or query string (?now=ISO8601).
const DEFAULT_NOW = new Date("2026-02-17T12:00:00Z");

export function getNow(override?: string | null): Date {
  if (override) {
    const d = new Date(override);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (process.env.NOW_OVERRIDE) {
    const d = new Date(process.env.NOW_OVERRIDE);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return DEFAULT_NOW;
}
