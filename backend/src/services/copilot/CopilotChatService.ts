/**
 * CopilotChatService — Phase 3 mock implementation of the Microsoft 365
 * Copilot Chat API surface.
 *
 * Provides prompt/response, conversation continuation, reset, streaming,
 * and summarization. Every method is backed by the mock grounding engine
 * (`CopilotMockEngine`) rather than any real network call.
 */

import { EntityId, Logger, generateId, nowISO } from "@muse/shared";
import { Conversation, Message } from "./CopilotModels";
import { buildCitations, buildMockSources, chunkAnswer, generateMockAnswer } from "./CopilotMockEngine";
import { CopilotLogger, copilotLogger } from "./CopilotLogger";

export interface SendPromptOptions {
  conversationId?: EntityId;
  prompt: string;
}

export interface StreamChunk {
  conversationId: EntityId;
  delta: string;
  done: boolean;
  message?: Message;
}

const STREAM_CHUNK_DELAY_MS = 60;

export class CopilotChatService {
  private readonly conversations: Map<EntityId, Conversation> = new Map();
  private readonly logger: Logger;
  private readonly telemetry: CopilotLogger;

  constructor(logger: Logger = new Logger("muse:copilot:chat"), telemetry: CopilotLogger = copilotLogger) {
    this.logger = logger;
    this.telemetry = telemetry;
  }

  private getOrCreateConversation(conversationId?: EntityId): Conversation {
    if (conversationId && this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId) as Conversation;
    }

    const conversation: Conversation = {
      id: conversationId || generateId("conv"),
      title: "New Conversation",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      state: "idle",
      messages: [],
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  getConversation(conversationId: EntityId): Conversation | undefined {
    return this.conversations.get(conversationId);
  }

  listConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  /** Sends a new prompt (creating a conversation if needed) and returns the full response. */
  async sendPrompt(options: SendPromptOptions): Promise<{ conversation: Conversation; message: Message }> {
    const start = Date.now();
    const conversation = this.getOrCreateConversation(options.conversationId);
    this.telemetry.logPrompt(conversation.id, options.prompt);

    const userMessage: Message = {
      id: generateId("msg"),
      role: "user",
      content: options.prompt,
      createdAt: nowISO(),
    };
    conversation.messages.push(userMessage);

    const sources = buildMockSources(options.prompt);
    const citations = buildCitations(sources);
    const answer = generateMockAnswer(options.prompt, citations);

    const assistantMessage: Message = {
      id: generateId("msg"),
      role: "assistant",
      content: answer,
      createdAt: nowISO(),
      sources,
      citations,
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = nowISO();
    conversation.state = "complete";

    if (conversation.title === "New Conversation") {
      conversation.title = options.prompt.slice(0, 60);
    }

    this.telemetry.logSources(conversation.id, sources.length);
    this.telemetry.logResponse(conversation.id, answer.length);
    this.telemetry.logLatency(conversation.id, Date.now() - start);

    return { conversation, message: assistantMessage };
  }

  /** Continues an existing conversation. Requires a known conversationId. */
  async continueConversation(conversationId: EntityId, prompt: string): Promise<{ conversation: Conversation; message: Message }> {
    if (!this.conversations.has(conversationId)) {
      this.logger.warn("continueConversation called with unknown conversationId; creating new conversation", {
        conversationId,
      });
    }
    return this.sendPrompt({ conversationId, prompt });
  }

  /** Clears all messages for a conversation and resets its state, preserving its id/title. */
  resetConversation(conversationId: EntityId): Conversation {
    const conversation = this.getOrCreateConversation(conversationId);
    conversation.messages = [];
    conversation.state = "idle";
    conversation.updatedAt = nowISO();
    conversation.title = "New Conversation";
    this.logger.info("Conversation reset", { conversationId });
    return conversation;
  }

  /**
   * Simulates a streaming Copilot response as an async generator of chunks.
   * The caller (an Express route) is responsible for writing each chunk to
   * the response stream (e.g. as Server-Sent Events).
   */
  async *streamResponse(options: SendPromptOptions): AsyncGenerator<StreamChunk> {
    const start = Date.now();
    const conversation = this.getOrCreateConversation(options.conversationId);
    this.telemetry.logPrompt(conversation.id, options.prompt);

    const userMessage: Message = {
      id: generateId("msg"),
      role: "user",
      content: options.prompt,
      createdAt: nowISO(),
    };
    conversation.messages.push(userMessage);
    conversation.state = "streaming";
    conversation.updatedAt = nowISO();

    const sources = buildMockSources(options.prompt);
    const citations = buildCitations(sources);
    const answer = generateMockAnswer(options.prompt, citations);
    const chunks = chunkAnswer(answer);

    let accumulated = "";

    for (const chunk of chunks) {
      accumulated += chunk;
      await delay(STREAM_CHUNK_DELAY_MS);
      yield { conversationId: conversation.id, delta: chunk, done: false };
    }

    const assistantMessage: Message = {
      id: generateId("msg"),
      role: "assistant",
      content: accumulated,
      createdAt: nowISO(),
      sources,
      citations,
    };
    conversation.messages.push(assistantMessage);
    conversation.state = "complete";
    conversation.updatedAt = nowISO();

    if (conversation.title === "New Conversation") {
      conversation.title = options.prompt.slice(0, 60);
    }

    this.telemetry.logSources(conversation.id, sources.length);
    this.telemetry.logResponse(conversation.id, accumulated.length);
    this.telemetry.logLatency(conversation.id, Date.now() - start);

    yield { conversationId: conversation.id, delta: "", done: true, message: assistantMessage };
  }

  /** Produces a mock summary of the conversation so far. */
  async summarizeConversation(conversationId: EntityId): Promise<{ summary: string; keyPoints: string[] }> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation "${conversationId}" not found.`);
    }

    const messageCount = conversation.messages.length;
    const summary = `[Mock Copilot Summary] "${conversation.title}" — ${messageCount} message${messageCount === 1 ? "" : "s"} exchanged.`;

    const keyPoints = conversation.messages
      .filter((message) => message.role === "user")
      .slice(-3)
      .map((message) => `Discussed: ${message.content.slice(0, 80)}`);

    return { summary, keyPoints };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
