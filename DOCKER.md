# Running Advocu MCP Server with Docker

The Advocu MCP server is containerized and available on Docker Hub.

## Quick Start

### Pull and Run the Image

```bash
docker pull sarthaksavvy/advocu-mcp-server:latest
docker run -it --rm sarthaksavvy/advocu-mcp-server:latest
```

### Using with Environment Variables

The server accepts the following environment variable:

- `ADVOCU_API_KEY`: Your Advocu API key for authentication (required for submitting activities)

The API URL is hardcoded to `https://api.advocu.com/personal-api/v1/dockercaptains` and cannot be changed.

#### Example with API Key:

```bash
docker run -it --rm \
  -e ADVOCU_API_KEY=your_api_key_here \
  sarthaksavvy/advocu-mcp-server:latest
```

## Using with Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  advocu-mcp:
    image: sarthaksavvy/advocu-mcp-server:latest
    environment:
      - ADVOCU_API_KEY=${ADVOCU_API_KEY}
    stdin_open: true
    tty: true
```

Run it:

```bash
docker-compose up
```

## Integration with MCP Clients

This server uses stdio for communication, so configure your MCP client to use the Docker container:

```json
{
  "mcpServers": {
    "advocu": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "ADVOCU_API_KEY=your_key_here",
        "sarthaksavvy/advocu-mcp-server:latest"
      ]
    }
  }
}
```

## Image Details

- **Base Image**: Node.js 20 LTS (slim)
- **Size**: ~436MB
- **Maintainer**: Advocu MCP Server
- **Port**: Not required (uses stdio)

## Building Locally

If you want to build the image locally:

```bash
docker build -t advocu-mcp-server:latest .
```

## Tags and Versions

- `latest` - Always points to the most recent stable version
- Future versions will be tagged with specific version numbers

## Support

For issues or questions, please refer to the main [README.md](./README.md) file.
