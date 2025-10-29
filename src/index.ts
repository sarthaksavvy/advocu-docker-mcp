#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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
        {
          name: "scrape_content",
          description: "Scrape content from a URL (YouTube video, article, or any link) to extract metadata like title, description, publish date, views, creator, etc.",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                pattern: "^https?://(www.)?.*$",
                description: "The URL to scrape (YouTube video, article, or any link)",
              },
            },
            required: ["url"],
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
          case "scrape_content":
            return await this.scrapeContent(
              (args as { url: string }).url
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
    if (data.private === undefined) {
      return {
        content: [
          {
            type: "text",
            text: "Do you want to submit publicly or keep it in draft? (yes for public, no for draft)",
          },
        ],
      };
    }
    return this.submitActivity("/activity-drafts/feedbackSession", data);
  }

  private async submitResource(
    data: ResourceActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (data.private === undefined) {
      return {
        content: [
          {
            type: "text",
            text: "Do you want to submit publicly or keep it in draft? (yes for public, no for draft)",
          },
        ],
      };
    }
    return this.submitActivity("/activity-drafts/resources", data);
  }

  private async submitPublicSpeaking(
    data: PublicSpeakingActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (data.private === undefined) {
      return {
        content: [
          {
            type: "text",
            text: "Do you want to submit publicly or keep it in draft? (yes for public, no for draft)",
          },
        ],
      };
    }
    return this.submitActivity("/activity-drafts/public-speaking", data);
  }

  private async submitEvent(
    data: EventActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (data.private === undefined) {
      return {
        content: [
          {
            type: "text",
            text: "Do you want to submit publicly or keep it in draft? (yes for public, no for draft)",
          },
        ],
      };
    }
    return this.submitActivity("/activity-drafts/event", data);
  }

  private async submitAmplification(
    data: AmplificationActivity
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (data.private === undefined) {
      return {
        content: [
          {
            type: "text",
            text: "Do you want to submit publicly or keep it in draft? (yes for public, no for draft)",
          },
        ],
      };
    }
    return this.submitActivity("/activity-drafts/amplification", data);
  }

  private async scrapeContent(
    url: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      // Check if it's a YouTube URL
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      const videoId = youtubeMatch ? youtubeMatch[1] : null;

      if (videoId) {
        // For YouTube, use a simpler, more direct approach
        return await this.extractYouTubeMetadataDirect(videoId, url);
      } else {
        // For other URLs, use the generic extraction
        const { stdout: html } = await execFileAsync("curl", [
          "-s",
          "-L",
          "-A",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "--max-time",
          "30",
          url,
        ], {
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        if (!html || html.trim().length === 0) {
          throw new Error("Failed to fetch content from URL");
        }

        const metadata = this.extractGenericMetadata(html, url);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(metadata, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to scrape content: ${errorMessage}`);
    }
  }

  private async extractYouTubeMetadataDirect(
    videoId: string,
    url: string
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const metadata: Record<string, unknown> = {
      url,
      videoId,
      type: "youtube_video",
    };

    try {
      // Step 1: Try YouTube oEmbed API first (simple, clean data)
      try {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const { stdout: oEmbedData } = await execFileAsync("curl", [
          "-s",
          "--max-time",
          "10",
          oEmbedUrl,
        ], {
          maxBuffer: 1024 * 1024, // 1MB is enough for oEmbed
        });

        if (oEmbedData) {
          const oEmbed = JSON.parse(oEmbedData);
          metadata.title = oEmbed.title || "";
          metadata.channelName = oEmbed.author_name || "";
          metadata.channelUrl = oEmbed.author_url || "";
          metadata.thumbnailUrl = oEmbed.thumbnail_url || "";
        }
      } catch (e) {
        // oEmbed failed, continue with HTML scraping
      }

      // Step 2: Fetch HTML to get view count and other metadata
      // Use a larger chunk but limit processing to avoid buffer issues
      const { stdout: html } = await execFileAsync("curl", [
        "-s",
        "-L",
        "-A",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "--max-time",
        "30",
        url,
      ], {
        maxBuffer: 5 * 1024 * 1024, // 5MB buffer - enough for YouTube
      });

      if (html) {
        // Extract view count using direct pattern search (most reliable)
        // Search for all occurrences and use the first valid numeric one
        const viewCountMatches = Array.from(html.matchAll(/"viewCount"\s*:\s*"?(\d+)"/g));
        for (const match of viewCountMatches) {
          if (match[1]) {
            const count = parseInt(match[1]);
            if (!isNaN(count) && count > 0) {
              metadata.viewCount = count;
              break; // Use first valid match
            }
          }
        }

        // Extract title from Open Graph if not already set
        if (!metadata.title) {
          const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i);
          if (ogTitleMatch) {
            metadata.title = ogTitleMatch[1].trim();
          } else {
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
            if (titleMatch) {
              metadata.title = titleMatch[1]
                .replace(/\s*\|\s*YouTube\s*$/, "")
                .trim();
            }
          }
        }

        // Extract description from Open Graph
        if (!metadata.description) {
          const ogDescMatch = html.match(
            /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i
          );
          if (ogDescMatch) {
            metadata.description = ogDescMatch[1].trim();
          }
        }

        // Extract channel name from page if not set
        if (!metadata.channelName) {
          const channelMatch = html.match(/<link[^>]*itemprop=["']name["'][^>]*content=["']([^"']+)/i);
          if (channelMatch) {
            metadata.channelName = channelMatch[1].trim();
          }
        }

        // Extract publish date
        const dateMatch = html.match(/<meta[^>]*itemprop=["']uploadDate["'][^>]*content=["']([^"']+)/i);
        if (dateMatch) {
          metadata.uploadDate = dateMatch[1].trim();
        }

        // Extract thumbnail if not set
        if (!metadata.thumbnailUrl) {
          const ogImageMatch = html.match(
            /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i
          );
          if (ogImageMatch) {
            metadata.thumbnailUrl = ogImageMatch[1].trim();
          }
        }
      }
    } catch (error) {
      // If extraction fails, return what we have
      console.error("Error extracting YouTube metadata:", error);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(metadata, null, 2),
        },
      ],
    };
  }

  private extractYouTubeMetadata(
    html: string,
    videoId: string,
    url: string
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      url,
      videoId,
      type: "youtube_video",
    };

    // Extract JSON-LD structured data
    const jsonLdMatches = html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs
    );
    for (const jsonLdMatch of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData["@type"] === "VideoObject") {
          metadata.title = jsonData.name || jsonData.headline || metadata.title || "";
          metadata.description = jsonData.description || metadata.description || "";
          metadata.uploadDate = jsonData.uploadDate || metadata.uploadDate || "";
          metadata.thumbnailUrl = jsonData.thumbnailUrl || metadata.thumbnailUrl || "";
          // Extract view count from interactionCount (aggregateRating.interactionCount)
          if (jsonData.aggregateRating?.interactionCount) {
            const count = parseInt(jsonData.aggregateRating.interactionCount);
            if (!isNaN(count)) {
              metadata.viewCount = count;
            }
          }
        }
        // Also check for nested video objects in arrays
        if (Array.isArray(jsonData) || (jsonData["@graph"] && Array.isArray(jsonData["@graph"]))) {
          const items = jsonData["@graph"] || jsonData;
          for (const item of items) {
            if (item["@type"] === "VideoObject" && item.aggregateRating?.interactionCount) {
              const count = parseInt(item.aggregateRating.interactionCount);
              if (!isNaN(count)) {
                metadata.viewCount = count;
              }
            }
          }
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }

    // Extract from ytInitialData (more efficient regex to avoid matching too much)
    // Look for the start of ytInitialData and find a reasonable end point
    const ytInitialDataStart = html.indexOf('var ytInitialData = ');
    if (ytInitialDataStart !== -1) {
      try {
        // Find the end of the JSON object by matching braces
        let braceCount = 0;
        let jsonStart = ytInitialDataStart + 'var ytInitialData = '.length;
        let i = jsonStart;
        let foundStart = false;

        // Find the opening brace
        while (i < html.length && i < jsonStart + 50000) { // Limit search to prevent issues
          if (html[i] === '{') {
            foundStart = true;
            braceCount = 1;
            jsonStart = i;
            i++;
            break;
          }
          i++;
        }

        // Match braces to find the end
        if (foundStart) {
          while (i < html.length && i < jsonStart + 2000000 && braceCount > 0) {
            if (html[i] === '{') braceCount++;
            else if (html[i] === '}') braceCount--;
            i++;
          }

          if (braceCount === 0) {
            const jsonStr = html.substring(jsonStart, i);
            const data = JSON.parse(jsonStr);
        const videoDetails =
          data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]
            ?.videoPrimaryInfoRenderer;

        if (videoDetails) {
          if (!metadata.title) {
            metadata.title =
              videoDetails?.title?.runs?.[0]?.text ||
              videoDetails?.title?.simpleText ||
              "";
          }

          // Extract view count - try multiple paths
          let viewCountText =
            videoDetails?.viewCount?.videoViewCountRenderer?.viewCount
              ?.simpleText ||
            videoDetails?.viewCount?.videoViewCountRenderer?.viewCount?.runs?.[0]
              ?.text ||
            "";

          // Try alternative path for view count
          if (!viewCountText) {
            viewCountText = videoDetails?.viewCount?.runs?.[0]?.text || "";
          }

          // Parse the view count text
          const parsedCount = this.parseViewCount(viewCountText);

          // Only set if we don't already have a view count from JSON-LD
          if (parsedCount && !metadata.viewCount) {
            metadata.viewCount = parsedCount;
          }

          // Extract publish date
          const dateText =
            videoDetails?.dateText?.simpleText || "";
          metadata.publishDate = dateText;
        }

        // Extract channel info
        const channelInfo =
          data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]
            ?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer;
        if (channelInfo) {
          metadata.channelName =
            channelInfo?.title?.runs?.[0]?.text ||
            channelInfo?.title?.simpleText ||
            "";
          metadata.channelUrl =
            channelInfo?.title?.runs?.[0]?.navigationEndpoint?.commandMetadata
              ?.webCommandMetadata?.url ||
            "";
        }
          }
        }
      } catch (e) {
        // Ignore parse errors - fall back to other methods
      }
    }

    // Fallback: Extract title from meta tags
    if (!metadata.title) {
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
      if (titleMatch) {
        metadata.title = titleMatch[1]
          .replace(/\s*\|\s*YouTube\s*$/, "")
          .trim();
      }
    }

    // Extract description from meta tags
    if (!metadata.description) {
      const descMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i
      );
      if (descMatch) {
        metadata.description = descMatch[1];
      } else {
        // Try Open Graph description
        const ogDescMatch = html.match(
          /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i
        );
        if (ogDescMatch) {
          metadata.description = ogDescMatch[1];
        }
      }
    }

    // Extract thumbnail
    if (!metadata.thumbnailUrl) {
      const ogImageMatch = html.match(
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i
      );
      if (ogImageMatch) {
        metadata.thumbnailUrl = ogImageMatch[1];
      }
    }

    // Fallback: Extract view count from raw HTML patterns
    if (!metadata.viewCount || metadata.viewCount === null) {
      // Try to find viewCount in various patterns
      const viewCountPatterns = [
        /"viewCount"\s*:\s*"?(\d+)"?/g,
        /"interactionCount"\s*:\s*"?(\d+)"?/g,
        /"viewCountText"[^}]*"text"\s*:\s*"([^"]+)"/g,
      ];

      for (const pattern of viewCountPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const match of matches) {
          if (match[1]) {
            const count = parseInt(match[1]);
            if (!isNaN(count) && count > 0) {
              metadata.viewCount = count;
              break;
            }
            // If it's text format, try parsing it
            const parsedCount = this.parseViewCount(match[1]);
            if (parsedCount && parsedCount > 0) {
              metadata.viewCount = parsedCount;
              break;
            }
          }
        }
        if (metadata.viewCount) break;
      }
    }

    return metadata;
  }

  private extractGenericMetadata(
    html: string,
    url: string
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      url,
      type: "article",
    };

    // Extract title from Open Graph or meta tags (prioritize Open Graph)
    const ogTitleMatch = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i
    );
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);

    if (ogTitleMatch) {
      metadata.title = ogTitleMatch[1].trim();
    } else if (titleMatch) {
      // Clean up title - remove site name suffixes
      let title = titleMatch[1].trim();
      // Remove common patterns like " | Site Name", " - Site Name"
      title = title.replace(/\s*[|-]\s*[^-|]+$/, "");
      metadata.title = title.trim();
    }

    // Extract description (prioritize Open Graph)
    const ogDescMatch = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i
    );
    const descMatch = html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i
    );

    if (ogDescMatch) {
      metadata.description = ogDescMatch[1].trim();
    } else if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract publish date - try multiple patterns
    let publishDate: string | undefined;

    // Try Open Graph first
    const ogPublishMatch = html.match(
      /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)/i
    );
    if (ogPublishMatch) {
      publishDate = ogPublishMatch[1].trim();
    }

    // Try meta tags
    if (!publishDate) {
      const metaPublishMatch = html.match(
        /<meta[^>]*(?:name=["']publish-date["']|name=["']pubdate["']|name=["']date["']|property=["']published_time["'])[^>]*content=["']([^"']+)/i
      );
      if (metaPublishMatch) {
        publishDate = metaPublishMatch[1].trim();
      }
    }

    // Try JSON-LD structured data
    if (!publishDate) {
      const jsonLdMatches = html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs
      );
      for (const jsonLdMatch of jsonLdMatches) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);

          // Check direct datePublished
          if (jsonData.datePublished) {
            publishDate = jsonData.datePublished;
            break;
          }

          // Check in @graph array
          if (jsonData["@graph"] && Array.isArray(jsonData["@graph"])) {
            for (const item of jsonData["@graph"]) {
              if (item.datePublished) {
                publishDate = item.datePublished;
                break;
              }
            }
          }

          // Check if it's an array
          if (Array.isArray(jsonData)) {
            for (const item of jsonData) {
              if (item.datePublished) {
                publishDate = item.datePublished;
                break;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
        if (publishDate) break;
      }
    }

    if (publishDate) {
      metadata.publishDate = publishDate;
    }

    // Extract author/creator - try multiple patterns
    let author: string | undefined;

    // Try Open Graph article:author
    const ogAuthorMatch = html.match(
      /<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']+)/i
    );
    if (ogAuthorMatch) {
      author = ogAuthorMatch[1].trim();
    }

    // Try meta name author
    if (!author) {
      const metaAuthorMatch = html.match(
        /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)/i
      );
      if (metaAuthorMatch) {
        author = metaAuthorMatch[1].trim();
      }
    }

    // Try JSON-LD for author
    if (!author) {
      const jsonLdMatches = html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs
      );
      for (const jsonLdMatch of jsonLdMatches) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);

          // Check author field (could be string or object)
          if (jsonData.author) {
            if (typeof jsonData.author === 'string') {
              author = jsonData.author;
            } else if (jsonData.author.name) {
              author = jsonData.author.name;
            }
          }

          // Check in @graph
          if (!author && jsonData["@graph"] && Array.isArray(jsonData["@graph"])) {
            for (const item of jsonData["@graph"]) {
              if (item.author) {
                if (typeof item.author === 'string') {
                  author = item.author;
                } else if (item.author.name) {
                  author = item.author.name;
                }
                break;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
        if (author) break;
      }
    }

    if (author) {
      metadata.author = author;
    }

    // Extract site name
    const siteNameMatch = html.match(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)/i
    );
    if (siteNameMatch) {
      metadata.siteName = siteNameMatch[1].trim();
    }

    // Extract image (prioritize Open Graph)
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i
    );
    if (ogImageMatch) {
      metadata.imageUrl = ogImageMatch[1].trim();
    }

    // Extract type
    const ogTypeMatch = html.match(
      /<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']+)/i
    );
    if (ogTypeMatch) {
      metadata.contentType = ogTypeMatch[1].trim();
    }

    // Extract canonical URL if different from current URL
    const canonicalMatch = html.match(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i
    );
    if (canonicalMatch) {
      metadata.canonicalUrl = canonicalMatch[1].trim();
    }

    return metadata;
  }

  private parseViewCount(viewCountText: string): number | null {
    if (!viewCountText) return null;

    // Extract numbers and multipliers (e.g., "1.2M views", "500K views")
    const match = viewCountText.match(/([\d.,]+)\s*([KMBkmb]?)/);
    if (!match) return null;

    const number = parseFloat(match[1].replace(/,/g, ""));
    const multiplier = match[2].toUpperCase();

    let multiplierValue = 1;
    if (multiplier === "K") multiplierValue = 1000;
    else if (multiplier === "M") multiplierValue = 1000000;
    else if (multiplier === "B") multiplierValue = 1000000000;

    return Math.round(number * multiplierValue);
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
