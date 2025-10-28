#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Constants
const ADVOCU_API_URL = "https://api.advocu.com/personal-api/v1/dockercaptains";

// Define types for the activity submissions
interface BaseActivity {
  title: string;
  description: string;
  activityDate: string;
  tags?: string[];
  activityUrl?: string;
  private?: boolean;
}

interface FeedbackSessionActivity extends BaseActivity {
  dockerRepresentative: string;
  modeOfCommunication: "Captains Briefing session" | "Direct call" | "Slack" | "Other";
  metrics: {
    timeSpent: number;
  };
}

interface ResourceActivity extends BaseActivity {
  contentType:
    | "Blog post"
    | "Newsletter"
    | "Social media post"
    | "Code sample"
    | "Sketch"
    | "Book or e-book"
    | "Video"
    | "Documentation"
    | "Open-source library"
    | "Use case"
    | "Other";
  metrics: {
    views: number;
  };
  additionalInfo?: string;
}

interface PublicSpeakingActivity extends BaseActivity {
  format: "In-person event" | "Virtual event" | "Recorded video" | "Live video";
  duration: number;
  metrics: {
    attendees: number;
  };
  additionalInfo?: string;
}

interface EventActivity extends BaseActivity {
  dates: {
    start: string;
    end: string;
  };
  type:
    | "Hackathon"
    | "Meetup"
    | "Study Jam"
    | "Workshop"
    | "Training"
    | "Speaker session"
    | "Networking session"
    | "Conference"
    | "Trade shows"
    | "Other";
  format: "In-person" | "Virtual" | "Hybrid";
  duration: "Full-day event" | "Half-day event" | "Multiple days event" | "Evening event" | "Other";
  metrics: {
    attendees: number;
  };
  additionalInfo?: string;
}

interface AmplificationActivity extends BaseActivity {
  type: ("Repost" | "Comment Engagement" | "Other")[];
  channel: ("HackerNews" | "Social Media" | "Own channel" | "Other")[];
  url?: string;
  metrics: {
    views: number;
  };
}

class AdvocuMCPServer {
  private server: Server;
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.server = new Server(
      {
        name: "advocu-mcp-server",
        version: "1.0.1",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    this.baseUrl = baseUrl || ADVOCU_API_URL;
    this.apiKey = apiKey || process.env.ADVOCU_API_KEY;

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "submit_feedback_session",
          description: "Submit a feedback session activity to Advocu",
          inputSchema: {
            type: "object",
            properties: {
              activityDate: { type: "string", format: "date" },
              dockerRepresentative: {
                type: "string",
                minLength: 3,
                maxLength: 100,
              },
              modeOfCommunication: {
                type: "string",
                enum: ["Captains Briefing session", "Direct call", "Slack", "Other"],
              },
              metrics: {
                type: "object",
                properties: {
                  timeSpent: { type: "integer", minimum: 1 },
                },
                required: ["timeSpent"],
              },
              title: {
                type: "string",
                minLength: 3,
                maxLength: 200,
              },
              description: {
                type: "string",
                maxLength: 2000,
              },
              private: { type: "boolean" },
            },
            required: [
              "activityDate",
              "dockerRepresentative",
              "modeOfCommunication",
              "metrics",
              "title",
              "description",
            ],
          },
        },
        {
          name: "submit_resource",
          description: "Submit a resource activity to Advocu",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                minLength: 3,
                maxLength: 200,
              },
              description: {
                type: "string",
                maxLength: 2000,
              },
              tags: {
                type: "array",
                items: { type: "string" },
                minItems: 0,
              },
              activityUrl: {
                type: "string",
                maxLength: 500,
                pattern: "^https?://(www.)?.*$",
              },
              activityDate: { type: "string", format: "date" },
              metrics: {
                type: "object",
                properties: {
                  views: { type: "integer", minimum: 1 },
                },
                required: ["views"],
              },
              contentType: {
                type: "string",
                enum: [
                  "Blog post",
                  "Newsletter",
                  "Social media post",
                  "Code sample",
                  "Sketch",
                  "Book or e-book",
                  "Video",
                  "Documentation",
                  "Open-source library",
                  "Use case",
                  "Other",
                ],
              },
              additionalInfo: {
                type: "string",
                maxLength: 2000,
              },
              private: { type: "boolean" },
            },
            required: [
              "title",
              "description",
              "activityDate",
              "metrics",
              "contentType",
            ],
          },
        },
        {
          name: "submit_public_speaking",
          description: "Submit a public speaking activity to Advocu",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                minLength: 3,
                maxLength: 200,
              },
              description: {
                type: "string",
                maxLength: 2000,
              },
              tags: {
                type: "array",
                items: { type: "string" },
                minItems: 0,
              },
              activityUrl: {
                type: "string",
                maxLength: 500,
                pattern: "^https?://(www.)?.*$",
              },
              activityDate: { type: "string", format: "date" },
              format: {
                type: "string",
                enum: ["In-person event", "Virtual event", "Recorded video", "Live video"],
              },
              duration: { type: "integer", minimum: 1 },
              additionalInfo: {
                type: "string",
                maxLength: 2000,
              },
              metrics: {
                type: "object",
                properties: {
                  attendees: { type: "integer", minimum: 1 },
                },
                required: ["attendees"],
              },
              private: { type: "boolean" },
            },
            required: [
              "title",
              "description",
              "activityDate",
              "format",
              "duration",
              "metrics",
            ],
          },
        },
        {
          name: "submit_event",
          description: "Submit an event activity to Advocu",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                minLength: 3,
                maxLength: 200,
              },
              description: {
                type: "string",
                maxLength: 2000,
              },
              tags: {
                type: "array",
                items: { type: "string" },
                minItems: 0,
              },
              activityUrl: {
                type: "string",
                maxLength: 500,
                pattern: "^https?://(www.)?.*$",
              },
              dates: {
                type: "object",
                properties: {
                  start: { type: "string", format: "date" },
                  end: { type: "string", format: "date" },
                },
                required: ["start", "end"],
              },
              type: {
                type: "string",
                enum: [
                  "Hackathon",
                  "Meetup",
                  "Study Jam",
                  "Workshop",
                  "Training",
                  "Speaker session",
                  "Networking session",
                  "Conference",
                  "Trade shows",
                  "Other",
                ],
              },
              format: {
                type: "string",
                enum: ["In-person", "Virtual", "Hybrid"],
              },
              duration: {
                type: "string",
                enum: [
                  "Full-day event",
                  "Half-day event",
                  "Multiple days event",
                  "Evening event",
                  "Other",
                ],
              },
              additionalInfo: {
                type: "string",
                maxLength: 2000,
              },
              metrics: {
                type: "object",
                properties: {
                  attendees: { type: "integer", minimum: 1 },
                },
                required: ["attendees"],
              },
              private: { type: "boolean" },
            },
            required: [
              "title",
              "description",
              "dates",
              "type",
              "format",
              "duration",
              "metrics",
            ],
          },
        },
        {
          name: "submit_amplification",
          description: "Submit an amplification activity to Advocu",
          inputSchema: {
            type: "object",
            properties: {
              activityDate: { type: "string", format: "date" },
              metrics: {
                type: "object",
                properties: {
                  views: { type: "integer", minimum: 1 },
                },
                required: ["views"],
              },
              title: {
                type: "string",
                minLength: 3,
                maxLength: 200,
              },
              description: {
                type: "string",
                maxLength: 2000,
              },
              type: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["Repost", "Comment Engagement", "Other"],
                },
                minItems: 1,
                maxItems: 3,
              },
              channel: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["HackerNews", "Social Media", "Own channel", "Other"],
                },
                minItems: 1,
                maxItems: 4,
              },
              url: {
                type: "string",
                maxLength: 100,
              },
              private: { type: "boolean" },
            },
            required: [
              "activityDate",
              "metrics",
              "title",
              "description",
              "type",
              "channel",
            ],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "submit_feedback_session":
            return await this.submitFeedbackSession(
              args as unknown as FeedbackSessionActivity
            );
          case "submit_resource":
            return await this.submitResource(args as unknown as ResourceActivity);
          case "submit_public_speaking":
            return await this.submitPublicSpeaking(
              args as unknown as PublicSpeakingActivity
            );
          case "submit_event":
            return await this.submitEvent(args as unknown as EventActivity);
          case "submit_amplification":
            return await this.submitAmplification(
              args as unknown as AmplificationActivity
            );
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async submitActivity(
    endpoint: string,
    data: unknown
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const result = await response.json();

    return {
      content: [
        {
          type: "text",
          text: `Successfully submitted activity: ${JSON.stringify(
            result,
            null,
            2
          )}`,
        },
      ],
    };
  }

  private async submitFeedbackSession(
    data: FeedbackSessionActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.submitActivity("/activity-drafts/feedbackSession", data);
  }

  private async submitResource(
    data: ResourceActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.submitActivity("/activity-drafts/resources", data);
  }

  private async submitPublicSpeaking(
    data: PublicSpeakingActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.submitActivity("/activity-drafts/public-speaking", data);
  }

  private async submitEvent(
    data: EventActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.submitActivity("/activity-drafts/event", data);
  }

  private async submitAmplification(
    data: AmplificationActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.submitActivity("/activity-drafts/amplification", data);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Advocu MCP server running on stdio");
  }
}

// Run the server
const server = new AdvocuMCPServer();
server.run().catch(console.error);
