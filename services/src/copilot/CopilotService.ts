/**
 * Facade over the Microsoft 365 Copilot Chat and Retrieval services.
 *
 * Backend routes and the Electron shell should depend on `CopilotService`
 * rather than reaching into the chat/retrieval classes directly, keeping a
 * single integration seam for the future real Copilot API client.
 */

import { CopilotChatService } from "./CopilotChatService";
import { CopilotRetrievalService } from "./CopilotRetrievalService";
import { CopilotSessionManager } from "./CopilotSessionManager";

export class CopilotService {
  readonly chat: CopilotChatService;
  readonly retrieval: CopilotRetrievalService;
  readonly sessions: CopilotSessionManager;

  constructor() {
    this.sessions = new CopilotSessionManager();
    this.chat = new CopilotChatService(this.sessions);
    this.retrieval = new CopilotRetrievalService();
  }
}

export * from "./CopilotModels";

