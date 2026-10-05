/**
 * MUSE SYSTEM PROMPT - Personality & Behavior Definition
 * 
 * This prompt instructs Copilot Studio on how to behave as "Muse",
 * a personal AI assistant integrated with Microsoft 365.
 */

export class MuseSystemPrompt {
  /**
   * Build the system prompt for Muse
   * Incorporates vault context, conversation history, and personality
   */
  static buildSystemPrompt(options: {
    vaultContext?: string;
    conversationSummary?: string;
    userPreferences?: Record<string, string>;
  }): string {
    const basePersonality = `You are Muse, a personal AI assistant for Microsoft 365. You are designed to be:

1. INTELLIGENT & HELPFUL
   - Provide thoughtful, well-reasoned responses
   - Anticipate needs based on context
   - Offer proactive suggestions when relevant
   - Be concise but thorough

2. INTEGRATED WITH MICROSOFT 365
   - You have access to the user's Teams, Outlook, Planner, SharePoint, and OneDrive
   - You can help with: creating meetings, sending emails, managing tasks, accessing files
   - You understand M365 workflows and best practices
   - You can interpret natural language requests as M365 actions

3. PERSONALITY
   - Professional but warm and approachable
   - Respectful of the user's time and preferences
   - Adaptable to different communication styles
   - Maintain context across conversations

4. MEMORY & CONTEXT
   - Reference previous conversations when relevant
   - Learn user preferences and patterns
   - Maintain awareness of ongoing projects and priorities
   - Treat the vault (personal knowledge base) as your institutional memory

5. RESPONSIBLE & SAFE
   - Confirm important actions (emails, calendar invites, task creation)
   - Ask for clarification when ambiguous
   - Respect privacy and security
   - Don't make assumptions about sensitive operations`;

    // Add vault context if available
    let contextBlock = '';
    if (options.vaultContext) {
      contextBlock = `

PERSONAL VAULT CONTEXT:
The following is the user's personal knowledge base, organized by topics and projects:

${options.vaultContext}

When responding, reference relevant vault content to provide personalized, informed responses.`;
    }

    // Add conversation summary if available
    let conversationBlock = '';
    if (options.conversationSummary) {
      conversationBlock = `

RECENT CONVERSATION HISTORY:
${options.conversationSummary}

Use this context to maintain continuity and reference previous discussion points.`;
    }

    // Add user preferences if available
    let preferencesBlock = '';
    if (options.userPreferences && Object.keys(options.userPreferences).length > 0) {
      const prefs = Object.entries(options.userPreferences)
        .map(([key, value]) => `  - ${key}: ${value}`)
        .join('\n');
      preferencesBlock = `

USER PREFERENCES:
${prefs}

Apply these preferences to your responses and suggestions.`;
    }

    return basePersonality + contextBlock + conversationBlock + preferencesBlock;
  }

  /**
   * Build a brief system prompt for quick interactions
   * Used when vault context isn't available
   */
  static buildQuickPrompt(): string {
    return `You are Muse, a personal AI assistant for Microsoft 365. You are intelligent, helpful, and integrated with Teams, Outlook, Planner, SharePoint, and OneDrive. Be professional yet warm. Provide concise but thorough responses. When appropriate, offer to help with M365 tasks like creating meetings, sending emails, or managing tasks.`;
  }

  /**
   * Extract M365 action intent from a prompt
   * Identifies if the user is asking for an actionable M365 operation
   */
  static extractActionIntent(userMessage: string): {
    hasIntent: boolean;
    actionType?: 'email' | 'meeting' | 'task' | 'file' | 'chat' | 'other';
    confidence: number;
    description?: string;
  } {
    const message = userMessage.toLowerCase();

    // Email patterns
    if (
      message.includes('email') ||
      message.includes('send') ||
      message.includes('message') ||
      message.includes('mail')
    ) {
      return {
        hasIntent: true,
        actionType: 'email',
        confidence: 0.7,
        description: 'User may want to send an email',
      };
    }

    // Meeting/Calendar patterns
    if (
      message.includes('meeting') ||
      message.includes('calendar') ||
      message.includes('schedule') ||
      message.includes('appointment') ||
      message.includes('event')
    ) {
      return {
        hasIntent: true,
        actionType: 'meeting',
        confidence: 0.8,
        description: 'User may want to create a calendar event',
      };
    }

    // Task/Todo patterns
    if (
      message.includes('task') ||
      message.includes('todo') ||
      message.includes('reminder') ||
      message.includes('assign') ||
      message.includes('create a task')
    ) {
      return {
        hasIntent: true,
        actionType: 'task',
        confidence: 0.8,
        description: 'User may want to create or manage a task',
      };
    }

    // File patterns
    if (
      message.includes('file') ||
      message.includes('document') ||
      message.includes('sharepoint') ||
      message.includes('onedrive') ||
      message.includes('upload') ||
      message.includes('download')
    ) {
      return {
        hasIntent: true,
        actionType: 'file',
        confidence: 0.7,
        description: 'User may want to access or manage files',
      };
    }

    // Chat/Teams patterns
    if (
      message.includes('teams') ||
      message.includes('chat') ||
      message.includes('channel') ||
      message.includes('send a message')
    ) {
      return {
        hasIntent: true,
        actionType: 'chat',
        confidence: 0.7,
        description: 'User may want to send a Teams message',
      };
    }

    // No clear intent
    return {
      hasIntent: false,
      confidence: 0.0,
    };
  }
}
