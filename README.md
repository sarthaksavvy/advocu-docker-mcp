# Advocu MCP Server

A Model Context Protocol (MCP) server for submitting activities to the Advocu platform.

## Support

If you find this project useful, please consider supporting my work through [GitHub Sponsors](https://github.com/sponsors/sarthaksavvy) 🙏

## Follow Me

Scan the QR code below to visit my website and follow my work:

![QR Code](https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://sarthaksavvy.com)

**Website:** [https://sarthaksavvy.com](https://sarthaksavvy.com)

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

This server is designed to be used with MCP clients. There are several ways to use it:

### Option 1: Using with Agent Configuration (Recommended)

For agent frameworks like Cagent/Cline, you can use the provided agent configuration file. See [`advocu_activity_agent.yaml`](./advocu_activity_agent.yaml) for a complete example.

This agent configuration:
- Automatically detects activity types from your descriptions
- Extracts and infers dates, titles, descriptions, and metrics
- Uses Playwright MCP to scrape content from URLs (blog posts, YouTube videos, etc.)
- Helps complete all required fields intelligently

**Setup:**

1. Copy `advocu_activity_agent.yaml` to your agent configuration directory
2. Set the `ADVOCU_API_KEY` environment variable:
   ```bash
   export ADVOCU_API_KEY="your-api-key-here"
   ```
3. Make sure Docker is running (required for the Docker-based MCP server)
4. The agent will automatically use the MCP server via Docker

**Example usage with the agent:**

Just describe your activity naturally, and the agent will handle the rest:

- "I published a blog post about Docker yesterday at https://example.com/docker-blog"
- "I gave a talk at DockerCon last week, 45 minutes, 200 attendees, virtual event"
- "I had a feedback session with John from Docker today, 30 minutes via Slack"

The agent will automatically:
- Detect the activity type
- Extract information from URLs using Playwright
- Fill in required fields
- Ask for any missing information

### Option 2: Direct MCP Client Configuration

For traditional MCP clients, add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "advocu": {
      "command": "node",
      "args": ["path/to/advocu-mcp/dist/index.js"],
      "env": {
        "ADVOCU_API_KEY": "your-api-key-here",
        "ADVOCU_API_URL": "https://api.advocu.com"
      }
    }
  }
}
```

### Option 3: Docker-based Usage

You can also run the MCP server directly via Docker (as shown in the agent config):

```bash
docker run -i --rm -e ADVOCU_API_KEY=your-api-key-here sarthaksavvy/advocu-mcp-server:latest
```

## Authentication

The server supports API key authentication through environment variables:

- `ADVOCU_API_KEY`: Your Advocu API key for authentication
- `ADVOCU_API_URL`: The base URL for the Advocu API (defaults to `https://api.advocu.com`)

These can be set either in your environment or in the MCP client configuration as shown in the example below.

## License

MIT
