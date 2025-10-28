# Advocu MCP Server

A Model Context Protocol (MCP) server for submitting activities to the Advocu platform.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Available Tools

The MCP server exposes the following tools for submitting activities:

### 1. submit_feedback_session
Submit a feedback session activity.

**Required fields:**
- `activityDate` (string, format: YYYY-MM-DD)
- `dockerRepresentative` (string, 3-100 characters)
- `modeOfCommunication` (enum: "Captains Briefing session", "Direct call", "Slack", "Other")
- `metrics.timeSpent` (integer, minimum 1)
- `title` (string, 3-200 characters)
- `description` (string, max 2000 characters)

**Optional fields:**
- `private` (boolean)

### 2. submit_resource
Submit a resource activity.

**Required fields:**
- `title` (string, 3-200 characters)
- `description` (string, max 2000 characters)
- `activityDate` (string, format: YYYY-MM-DD)
- `metrics.views` (integer, minimum 1)
- `contentType` (enum: Blog post, Newsletter, Social media post, Code sample, Sketch, Book or e-book, Video, Documentation, Open-source library, Use case, Other)

**Optional fields:**
- `tags` (array of strings)
- `activityUrl` (string, max 500 characters, must be a valid URL)
- `additionalInfo` (string, max 2000 characters)
- `private` (boolean)

### 3. submit_public_speaking
Submit a public speaking activity.

**Required fields:**
- `title` (string, 3-200 characters)
- `description` (string, max 2000 characters)
- `activityDate` (string, format: YYYY-MM-DD)
- `format` (enum: "In-person event", "Virtual event", "Recorded video", "Live video")
- `duration` (integer, minimum 1 minutes)
- `metrics.attendees` (integer, minimum 1)

**Optional fields:**
- `tags` (array of strings)
- `activityUrl` (string, max 500 characters, must be a valid URL)
- `additionalInfo` (string, max 2000 characters)
- `private` (boolean)

### 4. submit_event
Submit an event activity.

**Required fields:**
- `title` (string, 3-200 characters)
- `description` (string, max 2000 characters)
- `dates.start` (string, format: YYYY-MM-DD)
- `dates.end` (string, format: YYYY-MM-DD)
- `type` (enum: Hackathon, Meetup, Study Jam, Workshop, Training, Speaker session, Networking session, Conference, Trade shows, Other)
- `format` (enum: "In-person", "Virtual", "Hybrid")
- `duration` (enum: "Full-day event", "Half-day event", "Multiple days event", "Evening event", "Other")
- `metrics.attendees` (integer, minimum 1)

**Optional fields:**
- `tags` (array of strings)
- `activityUrl` (string, max 500 characters, must be a valid URL)
- `additionalInfo` (string, max 2000 characters)
- `private` (boolean)

### 5. submit_amplification
Submit an amplification activity.

**Required fields:**
- `activityDate` (string, format: YYYY-MM-DD)
- `metrics.views` (integer, minimum 1)
- `title` (string, 3-200 characters)
- `description` (string, max 2000 characters)
- `type` (array, 1-3 items from: "Repost", "Comment Engagement", "Other")
- `channel` (array, 1-4 items from: "HackerNews", "Social Media", "Own channel", "Other")

**Optional fields:**
- `url` (string, max 100 characters)
- `private` (boolean)

## Usage

This server is designed to be used with MCP clients. Configure your MCP client to use this server.

### Configuration Example

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "advocu": {
      "command": "node",
      "args": ["path/to/advocu-mcp/dist/index.js"]
    }
  }
}
```

## Authentication

The server supports API key authentication through environment variables:

- `ADVOCU_API_KEY`: Your Advocu API key for authentication
- `ADVOCU_API_URL`: The base URL for the Advocu API (defaults to `https://api.advocu.com`)

These can be set either in your environment or in the MCP client configuration as shown in the example below.

## License

MIT
