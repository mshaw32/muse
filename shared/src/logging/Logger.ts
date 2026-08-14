/**
 * Lightweight structured logger for MUSE.
 *
 * Designed to run identically inside the Express backend, the Electron
 * main process, and any Node-based service module. Ships with a console
 * transport by default; additional transports (file, telemetry) can be
 * attached without changing call sites.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  scope: string;
}

export type LogTransport = (entry: LogEntry) => void;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const consoleTransport: LogTransport = (entry) => {
  const line = `[${entry.timestamp}] [${entry.scope}] [${entry.level.toUpperCase()}] ${entry.message}`;
  const payload = entry.context ? [line, entry.context] : [line];

  switch (entry.level) {
    case "debug":
      // eslint-disable-next-line no-console
      console.debug(...payload);
      break;
    case "info":
      // eslint-disable-next-line no-console
      console.info(...payload);
      break;
    case "warn":
      // eslint-disable-next-line no-console
      console.warn(...payload);
      break;
    case "error":
      // eslint-disable-next-line no-console
      console.error(...payload);
      break;
    default:
      break;
  }
};

export class Logger {
  private transports: LogTransport[] = [consoleTransport];
  private minLevel: LogLevel;
  private readonly scope: string;

  constructor(scope: string, minLevel: LogLevel = "debug") {
    this.scope = scope;
    this.minLevel = minLevel;
  }

  /** Create a child logger namespaced under this logger's scope. */
  child(childScope: string): Logger {
    const logger = new Logger(`${this.scope}:${childScope}`, this.minLevel);
    logger.transports = this.transports;
    return logger;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.emit("error", message, context);
  }

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      scope: this.scope,
    };

    for (const transport of this.transports) {
      transport(entry);
    }
  }
}

/** Root application logger. Use `.child()` to scope loggers per module. */
export const rootLogger = new Logger("muse");
