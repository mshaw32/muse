/**
 * Audit trail for security-sensitive and user-consequential events.
 *
 * Distinct from the general purpose Logger: entries here are intended to be
 * durable, queryable, and retained for compliance/debugging of actions taken
 * on the user's behalf (conversations, executed actions, voice sessions).
 */

import { EntityId, ISOTimestamp, nowISO, generateId } from "../types/Common";
import { Logger } from "./Logger";

export type AuditCategory =
  | "conversation"
  | "action"
  | "voice"
  | "memory"
  | "copilot"
  | "system"
  | "security";

export interface AuditEvent {
  id: EntityId;
  category: AuditCategory;
  message: string;
  actor: string;
  timestamp: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

export interface AuditSink {
  write(event: AuditEvent): void;
}

/** Default in-memory sink. Suitable for dev/mock mode; production sinks
 * (file, database) can be attached via `AuditLogger.addSink`. */
class InMemoryAuditSink implements AuditSink {
  private events: AuditEvent[] = [];
  private readonly maxEvents: number;

  constructor(maxEvents = 2000) {
    this.maxEvents = maxEvents;
  }

  write(event: AuditEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  list(): AuditEvent[] {
    return [...this.events];
  }
}

export class AuditLogger {
  private readonly sinks: AuditSink[];
  private readonly memorySink: InMemoryAuditSink;
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:audit")) {
    this.memorySink = new InMemoryAuditSink();
    this.sinks = [this.memorySink];
    this.logger = logger;
  }

  addSink(sink: AuditSink): void {
    this.sinks.push(sink);
  }

  record(
    category: AuditCategory,
    message: string,
    actor = "muse-user",
    metadata?: Record<string, unknown>,
  ): AuditEvent {
    const event: AuditEvent = {
      id: generateId("audit"),
      category,
      message,
      actor,
      timestamp: nowISO(),
      metadata,
    };

    for (const sink of this.sinks) {
      sink.write(event);
    }

    this.logger.info(`[audit:${category}] ${message}`, metadata);
    return event;
  }

  recent(): AuditEvent[] {
    return this.memorySink.list();
  }
}

export const rootAuditLogger = new AuditLogger();
