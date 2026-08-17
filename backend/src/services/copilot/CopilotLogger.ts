/**
 * Structured logger for the Copilot integration layer.
 *
 * Tracks prompts, responses, sources, errors, and latency for every Copilot
 * interaction so this seam can later be swapped for real telemetry once the
 * genuine Microsoft 365 Copilot API is wired in (Phase 4).
 */

import { Logger, nowISO } from "@muse/shared";

export interface CopilotLogEvent {
  event: "prompt" | "response" | "sources" | "error" | "latency";
  conversationId?: string;
  detail?: Record<string, unknown>;
  timestamp: string;
}

export class CopilotLogger {
  private readonly logger: Logger;
  private readonly events: CopilotLogEvent[] = [];
  private readonly maxEvents = 200;

  constructor(logger: Logger = new Logger("muse:copilot")) {
    this.logger = logger;
  }

  logPrompt(conversationId: string, prompt: string): void {
    this.record({ event: "prompt", conversationId, detail: { prompt } });
    this.logger.info("Prompt received", { conversationId, length: prompt.length });
  }

  logResponse(conversationId: string, responseLength: number): void {
    this.record({ event: "response", conversationId, detail: { responseLength } });
    this.logger.info("Response generated", { conversationId, responseLength });
  }

  logSources(conversationId: string, sourceCount: number): void {
    this.record({ event: "sources", conversationId, detail: { sourceCount } });
    this.logger.debug("Sources attached", { conversationId, sourceCount });
  }

  logError(conversationId: string | undefined, error: string): void {
    this.record({ event: "error", conversationId, detail: { error } });
    this.logger.error("Copilot error", { conversationId, error });
  }

  logLatency(conversationId: string, durationMs: number): void {
    this.record({ event: "latency", conversationId, detail: { durationMs } });
    this.logger.debug("Latency", { conversationId, durationMs });
  }

  recentEvents(limit = 50): CopilotLogEvent[] {
    return this.events.slice(-limit);
  }

  private record(partial: Omit<CopilotLogEvent, "timestamp">): void {
    this.events.push({ ...partial, timestamp: nowISO() });
    if (this.events.length > this.maxEvents) {
      this.events.splice(0, this.events.length - this.maxEvents);
    }
  }
}

export const copilotLogger = new CopilotLogger();
