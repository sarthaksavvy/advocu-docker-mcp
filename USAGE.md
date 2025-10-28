# How to Use the Advocu MCP Server

## Running the Server

### Option 1: Direct Execution (for testing)
```bash
cd advocu-mcp
npm run start
```

### Option 2: Development Mode
```bash
cd advocu-mcp
npm run dev
```

The server communicates via stdio (standard input/output), so it's ready to receive MCP protocol messages.

## Configuring with Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "advocu": {
      "command": "node",
      "args": ["/Users/sarthak/Desktop/cagent/advocu-mcp/dist/index.js"],
      "env": {
        "ADVOCU_API_KEY": "your-api-key-here",
        "ADVOCU_API_URL": "https://api.advocu.com"
      }
    }
  }
}
```

**Important**: Update the path to your server location.

## Using the Tools

Once connected to your MCP client, you can ask Claude to use the tools. Here are example prompts:

### Submit a Feedback Session
"I had a feedback session with John Smith from Docker today about their container orchestration features. It was a 30-minute Direct call on Slack. The session was on 2024-01-15. Please submit this using the Advocu MCP server."

**Mode options**: "Captains Briefing session", "Direct call", "Slack", "Other"

### Submit a Resource (Blog Post, Video, etc.)
"I just published a blog post about Docker best practices. It has 150 views so far and was published on 2024-01-15. The URL is https://example.com/blog and it's about container optimization. Content type is Blog post. Please submit this."

**Content type options**: "Blog post", "Newsletter", "Social media post", "Code sample", "Sketch", "Book or e-book", "Video", "Documentation", "Open-source library", "Use case", "Other"

### Submit a Public Speaking Event
"I gave a talk at DockerCon 2024 titled 'Scaling with Containers'. It was a 45-minute In-person event with 200 attendees on 2024-02-10. Please submit this to Advocu."

**Format options**: "In-person event", "Virtual event", "Recorded video", "Live video"

### Submit an Event
"I organized a Docker Meetup from 2024-02-01 to 2024-02-01. It was a Full-day event In-person with 50 attendees. It was about container networking. Please submit this."

**Event type options**: "Hackathon", "Meetup", "Study Jam", "Workshop", "Training", "Speaker session", "Networking session", "Conference", "Trade shows", "Other"
**Format options**: "In-person", "Virtual", "Hybrid"
**Duration options**: "Full-day event", "Half-day event", "Multiple days event", "Evening event", "Other"

### Submit an Amplification
"I made a Repost on Social Media about Docker's new features. It got 500 views. Posted on 2024-01-20. Please submit this amplification."

**Type options**: "Repost", "Comment Engagement", "Other"
**Channel options**: "HackerNews", "Social Media", "Own channel", "Other"

## Testing the Server

You can test the server manually by sending it an MCP request. However, this is complex as it requires understanding the MCP protocol.

A better approach is to use the server with an MCP client (like Claude Desktop) and test through natural language interactions.

## Troubleshooting

### Server won't start
- Make sure you've run `npm install` and `npm run build`
- Check that Node.js is installed (`node --version`)

### Authentication errors
- Verify your `ADVOCU_API_KEY` is correct
- Check that `ADVOCU_API_URL` is set correctly

### Tool calls failing
- Check the API endpoint is accessible
- Verify your API key has the necessary permissions
- Look at the error messages returned by the server

## Example Tool Call Flow

When you ask Claude to submit an activity, the MCP server will:

1. Receive the tool call request
2. Validate the input parameters against the schema
3. Make an HTTP POST request to the Advocu API
4. Return the result back to Claude
5. Display the response to you

## Environment Variables

You can set these environment variables before running:

```bash
export ADVOCU_API_KEY="your-key-here"
export ADVOCU_API_URL="https://api.advocu.com"
npm run start
```

Or set them in your MCP client configuration as shown above.
