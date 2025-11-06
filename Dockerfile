FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["node", "dist/index.js"]

LABEL maintainer="Advocu MCP Server"
LABEL description="MCP server for submitting activities to Advocu platform"
