export type LogLevel = "off" | "error" | "warn" | "info" | "debug" | "all";

const LEVEL_RANK: Record<LogLevel, number> = {
  off: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  all: 5,
};

function normalizeLevel(level: string | number | undefined): LogLevel {
  if (typeof level === "number") {
    if (level <= 0) return "off";
    if (level === 1) return "error";
    if (level === 2) return "warn";
    if (level === 3) return "info";
    if (level === 4) return "debug";
    return "all";
  }
  const v = String(level ?? "info").toLowerCase();
  if (v === "warning") return "warn";
  if (v in LEVEL_RANK) return v as LogLevel;
  return "info";
}

export interface Logger {
  level: LogLevel;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

/**
 * Lightweight logger for proxy runtimes.
 * Sensitive coordinates are only printed when level is debug/all.
 */
export function createLogger(level: string | number | undefined = "info"): Logger {
  let current = normalizeLevel(level);
  const rank = () => LEVEL_RANK[current];

  const write = (min: number, prefix: string, args: unknown[]) => {
    if (rank() < min || rank() === 0) return;
    const parts = args.map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    });
    // Proxy tools capture console.log
    console.log(`[qpin-nl]${prefix} ${parts.join(" ")}`);
  };

  return {
    get level() {
      return current;
    },
    set level(v: LogLevel) {
      current = normalizeLevel(v);
    },
    error: (...args) => write(1, "[error]", args),
    warn: (...args) => write(2, "[warn]", args),
    info: (...args) => write(3, "[info]", args),
    debug: (...args) => write(4, "[debug]", args),
  };
}

export function redactCoords(lon: number | null | undefined, lat: number | null | undefined): string {
  if (lon == null || lat == null) return "(none)";
  // Round for logs to avoid dumping full precision in non-debug contexts when needed
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
}
