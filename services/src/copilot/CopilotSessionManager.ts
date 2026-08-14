/**
 * Tracks active Microsoft 365 Copilot conversation sessions.
 *
 * A thin bookkeeping layer today (in-memory map of conversationId ->
 * message history). Once real Copilot Chat API access is available, this
 * is where auth-scoped session/token lifecycle management would live.
 */

import { EntityId, generateId, nowISO } from "@muse/shared";
import { CopilotChatMessage } from "./CopilotModels";

export interface CopilotSession {
  conversationId: EntityId;
  startedAt: string;
  messages: CopilotChatMessage[];
}

export class CopilotSessionManager {
  private readonly sessions: Map<EntityId, CopilotSession> = new Map();

  createSession(): CopilotSession {
    const session: CopilotSession = {
      conversationId: generateId("copilot-conv"),
      startedAt: nowISO(),
      messages: [],
    };
    this.sessions.set(session.conversationId, session);
    return session;
  }

  getOrCreate(conversationId?: EntityId): CopilotSession {
    if (conversationId && this.sessions.has(conversationId)) {
      return this.sessions.get(conversationId) as CopilotSession;
    }
    return this.createSession();
  }

  appendMessage(conversationId: EntityId, message: CopilotChatMessage): void {
    const session = this.sessions.get(conversationId);
    if (session) {
      session.messages.push(message);
    }
  }

  getHistory(conversationId: EntityId): CopilotChatMessage[] {
    return this.sessions.get(conversationId)?.messages ?? [];
  }

  endSession(conversationId: EntityId): boolean {
    return this.sessions.delete(conversationId);
  }
}
