# Use Node.js LTS version
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Copy prisma schema and config (needed for postinstall)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies (this will also run prisma generate via postinstall)
RUN npm install

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source files
COPY src ./src/

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Copy prisma schema and config for postinstall
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/prisma.config.ts ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy generated client
COPY --from=builder /app/generated ./generated/

# Copy compiled JavaScript
COPY --from=builder /app/dist ./dist/

# Generate Prisma Client for production
RUN npx prisma generate

# Expose the port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Start the application
CMD ["npm", "start"]
