/**
 * Example plugin registrations demonstrating the MUSE Action Framework's
 * plugin architecture. Each plugin is a mock implementation representing a
 * future real integration. No Microsoft Graph calls are made here.
 */

import { nowISO } from "@muse/shared";
import { ActionDefinition } from "../ActionModels";

export const outlookDraftEmailAction: ActionDefinition = {
  id: "outlook.draft-email",
  name: "Draft Outlook Email",
  description: "Creates a draft email in Outlook for user review before sending.",
  category: "create",
  integration: "outlook",
  requiresApproval: false,
  async execute(request) {
    return {
      actionId: "outlook.draft-email",
      status: "completed",
      approvalStatus: "not_required",
      message: "Draft email created (mock).",
      data: { draftId: "mock-draft-1", parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const outlookSendEmailAction: ActionDefinition = {
  id: "outlook.send-email",
  name: "Send Outlook Email",
  description: "Sends an email on the user's behalf. Always requires approval.",
  category: "approval",
  integration: "outlook",
  requiresApproval: true,
  async execute(request) {
    return {
      actionId: "outlook.send-email",
      status: "completed",
      approvalStatus: "approved",
      message: "Email sent (mock).",
      data: { messageId: "mock-message-1", parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const plannerCreateTaskAction: ActionDefinition = {
  id: "planner.create-task",
  name: "Create Planner Task",
  description: "Creates a new task in Microsoft Planner.",
  category: "create",
  integration: "planner",
  requiresApproval: false,
  async execute(request) {
    return {
      actionId: "planner.create-task",
      status: "completed",
      approvalStatus: "not_required",
      message: "Planner task created (mock).",
      data: { taskId: "mock-task-1", parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const plannerUpdateTaskAction: ActionDefinition = {
  id: "planner.update-task",
  name: "Update Planner Task",
  description: "Updates an existing Planner task. Requires user approval.",
  category: "update",
  integration: "planner",
  requiresApproval: true,
  async execute(request) {
    return {
      actionId: "planner.update-task",
      status: "completed",
      approvalStatus: "approved",
      message: "Planner task updated (mock).",
      data: { parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const onedriveMoveFileAction: ActionDefinition = {
  id: "onedrive.move-file",
  name: "Move OneDrive File",
  description: "Moves a file to a different OneDrive folder. Requires user approval.",
  category: "update",
  integration: "onedrive",
  requiresApproval: true,
  async execute(request) {
    return {
      actionId: "onedrive.move-file",
      status: "completed",
      approvalStatus: "approved",
      message: "File moved (mock).",
      data: { parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const sharepointSearchFilesAction: ActionDefinition = {
  id: "sharepoint.search-files",
  name: "Search SharePoint Files",
  description: "Searches SharePoint document libraries for relevant files.",
  category: "information",
  integration: "sharepoint",
  requiresApproval: false,
  async execute(request) {
    return {
      actionId: "sharepoint.search-files",
      status: "completed",
      approvalStatus: "not_required",
      message: "SharePoint search completed (mock).",
      data: { results: [], parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const teamsPostMessageAction: ActionDefinition = {
  id: "teams.post-message",
  name: "Post Teams Message",
  description: "Posts a message to a Microsoft Teams channel or chat. Requires user approval.",
  category: "approval",
  integration: "teams",
  requiresApproval: true,
  async execute(request) {
    return {
      actionId: "teams.post-message",
      status: "completed",
      approvalStatus: "approved",
      message: "Teams message posted (mock).",
      data: { parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const onenotePageCreateAction: ActionDefinition = {
  id: "onenote.create-page",
  name: "Create OneNote Page",
  description: "Creates a new page in a OneNote notebook.",
  category: "create",
  integration: "onenote",
  requiresApproval: false,
  async execute(request) {
    return {
      actionId: "onenote.create-page",
      status: "completed",
      approvalStatus: "not_required",
      message: "OneNote page created (mock).",
      data: { pageId: "mock-page-1", parameters: request.parameters },
      executedAt: nowISO(),
    };
  },
};

export const ALL_MOCK_PLUGINS: ActionDefinition[] = [
  outlookDraftEmailAction,
  outlookSendEmailAction,
  plannerCreateTaskAction,
  plannerUpdateTaskAction,
  onedriveMoveFileAction,
  sharepointSearchFilesAction,
  teamsPostMessageAction,
  onenotePageCreateAction,
];
