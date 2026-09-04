/**
 * Real Copilot Studio API integration.
 *
 * Replaces CopilotChatService mock with authenticated calls to
 * Copilot Studio REST API endpoints.
 *
 * API Reference: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
 */

import { Logger, EntityId, generateId, nowISO } from "@muse/shared";
import { CopilotStudioAuth } from "./CopilotStudioAuth";
import {
  CopilotChatMessage,
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotCitation,
  CopilotSessionManager,
} from "./CopilotSessionManager";

export interface CopilotStudioChatRequest {
  conversationId: EntityId;
  prompt: string;
  context?: string;
}

export interface CopilotStudioChatChunk {
  conversationId: EntityId;
  delta: string;
  done: boolean;
  message?: {
    content: string;
    sources: CopilotCitation[];
    citations: CopilotCitation[];
  };
}

export class CopilotStudioAdapter {
  private auth: CopilotStudioAuth;
  private sessionManager: CopilotSessionManager;
  private logger: Logger;
  private apiEndpoint: string;

  constructor(auth: CopilotStudioAuth, sessionManager: CopilotSessionManager, apiEndpoint?: string) {
    this.auth = auth;
    this.sessionManager = sessionManager;
    this.logger = new Logger("muse:copilot:studio");
    this.apiEndpoint = apiEndpoint || process.env.COPILOT_STUDIO_ENDPOINT || "https://copilot.microsoft.com/api";
  }

  /**
   * Send a message to Copilot Studio and get a response.
   * Returns full response (backward compatible with Phase 2).
   */
  async sendPrompt(request: CopilotStudioChatRequest): Promise<{
    conversation: { conversationId: EntityId; startedAt: string };
    message: { content: string; sources: CopilotCitation[]; citations: CopilotCitation[] };
  }> {
    const session = this.sessionManager.getOrCreate(request.conversationId);

    this.logger.debug("sendPrompt", {
      conversationId: session.conversationId,
      promptLength: request.prompt.length,
    });

    // Add user message to history
    this.sessionManager.appendMessage(session.conversationId, {
      role: "user",
      content: request.prompt,
      timestamp: nowISO(),
    });

    // Collect all streamed chunks
    const chunks: string[] = [];
    const sources: CopilotCitation[] = [];

    try {
      for await (const chunk of this.streamResponse(request)) {
        if (chunk.delta) {
          chunks.push(chunk.delta);
        }
        if (chunk.message?.sources) {
          sources.push(...chunk.message.sources);
        }
      }
    } catch (error) {
      this.logger.error("streamResponse failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    const content = chunks.join("");

    // Add assistant message to history
    this.sessionManager.appendMessage(session.conversationId, {
      role: "assistant",
      content,
      timestamp: nowISO(),
    });

    return {
      conversation: {
        conversationId: session.conversationId,
        startedAt: session.startedAt,
      },
      message: {
        content,
        sources,
        citations: sources, // Backward compat: citations and sources are the same
      },
    };
  }

  /**
   * Stream a response from Copilot Studio as async chunks.
   * Each chunk is a delta of the response, plus metadata.
   */
  async *streamResponse(request: CopilotStudioChatRequest): AsyncGenerator<CopilotStudioChatChunk> {
    const session = this.sessionManager.getOrCreate(request.conversationId);
    const url = `${this.apiEndpoint}/conversations/${session.conversationId}/messages`;

    const payload = {
      conversationId: session.conversationId,
      prompt: request.prompt,
      context: request.context,
      systemPrompt: this.buildSystemPrompt(),
      conversationHistory: this.sessionManager.getHistory(session.conversationId),
    };

    this.logger.debug("Calling Copilot Studio API", { url, payloadSize: JSON.stringify(payload).length });

    try {
      const response = await this.auth.createAuthenticatedRequest(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Copilot Studio API error: ${response.status} ${errorText}`);
      }

      // Handle streaming response (text/event-stream or application/x-ndjson)
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const sources: CopilotCitation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const data = JSON.parse(line);

            if (data.delta) {
              yield {
                conversationId: session.conversationId,
                delta: data.delta,
                done: false,
              };
            }

            if (data.sources) {
              sources.push(...data.sources);
            }
          } catch (parseError) {
            this.logger.debug("Failed to parse chunk line", { line });
          }
        }
      }

      // Final chunk with complete message
      yield {
        conversationId: session.conversationId,
        delta: "",
        done: true,
        message: {
          content: "", // Already streamed as deltas
          sources,
          citations: sources,
        },
      };
    } catch (error) {
      this.logger.error("streamResponse error", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build system prompt that instructs Copilot Studio on Muse's behavior.
   */
  private buildSystemPrompt(): string {
    return `You are MUSE (Michael's Unified Strategy Engine), a personal AI assistant designed to help with enterprise work, strategy, and decision-making.

Your personality:
- Professional but approachable
- Detail-oriented and strategic
- Grounded in data and context
- Proactive in offering insights

Your role:
- Assist with project management, customer relationships, and business strategy
- Reference available documents, meetings, and organizational context
- Suggest actions based on work priorities and personal preferences
- Maintain conversation context across sessions

When responding:
1. Use available context (vault, M365 data) to ground your answers
2. Cite sources when referencing documents or data
3. Offer next steps or recommendations
4. Ask clarifying questions if needed
5. Be concise but thorough

You have access to personal vault data (projects, customers, decisions, learning notes) and Microsoft 365 context (Teams, Outlook, Planner). Always respect privacy and security guidelines.`;
  }

  /**
   * Get conversation history for a session.
   */
  getConversationHistory(conversationId: EntityId): CopilotChatMessage[] {
    return this.sessionManager.getHistory(conversationId);
  }

  /**
   * Summarize a conversation (calls Copilot Studio summarization).
   */
  async summarizeConversation(conversationId: EntityId): Promise<{ summary: string; keyPoints: string[] }> {
    const history = this.getConversationHistory(conversationId);
    if (history.length === 0) {
      return { summary: "No messages to summarize.", keyPoints: [] };
    }

    const conversation = history.map((m) => `${m.role}: ${m.content}`).join("\n");

    try {
      const result = await this.sendPrompt({
        conversationId: generateId("conv"),
        prompt: `Please summarize this conversation in 2-3 sentences and extract 3-5 key points:\n\n${conversation}`,
      });

      const lines = result.message.content.split("\n").filter((l) => l.trim());
      const summary = lines[0] || result.message.content;
      const keyPoints = lines.slice(1).filter((l) => l.trim());

      return { summary, keyPoints };
    } catch (error) {
      this.logger.error("summarizeConversation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new conversation session.
   */
  createSession() {
    return this.sessionManager.createSession();
  }

  /**
   * Get active session (latest one).
   */
  getActiveSession() {
    // In a real implementation, track which session is "active"
    // For now, this is a placeholder
    return null;
  }

  /**
   * Test authentication by making a simple API call.
   */
  async testConnection(): Promise<boolean> {
    try {
      const status = this.auth.getStatus();
      this.logger.info("Auth status", status);

      // Try to refresh token to verify auth works
      await this.auth.getAccessToken();
      return true;
    } catch (error) {
      this.logger.error("testConnection failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

export * from "./CopilotStudioAuth";
