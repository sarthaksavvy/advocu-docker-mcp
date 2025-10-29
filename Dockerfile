# Use Node.js LTS version
FROM node:20-slim

# Install curl (required for scraping content)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Install dev dependencies for building
RUN npm ci

# Build the TypeScript code
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Remove source files to keep image small
RUN rm -rf src tsconfig.json

# Expose port (MCP servers typically use stdio but keeping for consistency)
# We don't actually need to expose anything for stdio-based servers

# Set the command to run the built server
CMD ["node", "dist/index.js"]

# Metadata
LABEL maintainer="Advocu MCP Server"
LABEL description="MCP server for submitting activities to Advocu platform"
