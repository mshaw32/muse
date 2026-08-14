/**
 * Mock implementation of the Microsoft 365 Copilot Retrieval API surface.
 *
 * Retrieval represents Copilot's enterprise-grounded search — work context,
 * files, meetings, projects, and tasks — scoped and security-trimmed to the
 * signed-in user. MUSE never performs its own Graph crawling; it only calls
 * through this abstraction.
 */

import { Logger, nowISO } from "@muse/shared";
import {
  CopilotFileItem,
  CopilotFileResponse,
  CopilotMeetingItem,
  CopilotMeetingResponse,
  CopilotProjectItem,
  CopilotProjectResponse,
  CopilotRetrievalRequest,
  CopilotTaskItem,
  CopilotTaskResponse,
  CopilotWorkContextResponse,
  WorkContextItem,
} from "./CopilotModels";

export class CopilotRetrievalService {
  private readonly logger: Logger;

  constructor(logger: Logger = new Logger("muse:copilot:retrieval")) {
    this.logger = logger;
  }

  async retrieveWorkContext(request: CopilotRetrievalRequest = {}): Promise<CopilotWorkContextResponse> {
    this.logger.debug("retrieveWorkContext", { scope: request.scope });
    const limit = request.limit ?? 5;

    const items: WorkContextItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `work-context-${index + 1}`,
      type: (["file", "meeting", "task", "project", "person"] as const)[index % 5],
      title: `[Mock] Work context item ${index + 1}`,
      summary: `Relevant to query: "${request.query ?? "general context"}"`,
      updatedAt: nowISO(),
    }));

    return { items };
  }

  async retrieveFiles(request: CopilotRetrievalRequest = {}): Promise<CopilotFileResponse> {
    this.logger.debug("retrieveFiles");
    const limit = request.limit ?? 5;

    const files: CopilotFileItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `file-${index + 1}`,
      name: `Mock Document ${index + 1}.docx`,
      path: `/Documents/Mock Document ${index + 1}.docx`,
      webUrl: `https://m365.example.com/documents/mock-${index + 1}`,
      lastModified: nowISO(),
    }));

    return { files };
  }

  async retrieveMeetings(request: CopilotRetrievalRequest = {}): Promise<CopilotMeetingResponse> {
    this.logger.debug("retrieveMeetings");
    const limit = request.limit ?? 3;

    const meetings: CopilotMeetingItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `meeting-${index + 1}`,
      subject: `[Mock] Meeting ${index + 1}`,
      start: nowISO(),
      end: nowISO(),
      organizer: "mock.organizer@contoso.com",
      hasTranscript: index % 2 === 0,
    }));

    return { meetings };
  }

  async retrieveProjects(request: CopilotRetrievalRequest = {}): Promise<CopilotProjectResponse> {
    this.logger.debug("retrieveProjects");
    const limit = request.limit ?? 3;
    const statuses = ["on-track", "at-risk", "blocked", "complete"] as const;

    const projects: CopilotProjectItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `project-${index + 1}`,
      name: `[Mock] Project ${index + 1}`,
      status: statuses[index % statuses.length],
      owner: "mock.owner@contoso.com",
    }));

    return { projects };
  }

  async retrieveTasks(request: CopilotRetrievalRequest = {}): Promise<CopilotTaskResponse> {
    this.logger.debug("retrieveTasks");
    const limit = request.limit ?? 5;

    const tasks: CopilotTaskItem[] = Array.from({ length: limit }, (_, index) => ({
      id: `task-${index + 1}`,
      title: `[Mock] Task ${index + 1}`,
      dueDate: nowISO(),
      completed: false,
    }));

    return { tasks };
  }
}
