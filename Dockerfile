# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Copy prisma schema (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (this will also run prisma generate via postinstall)
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client (in case postinstall didn't run)
RUN npx prisma generate

# Expose the port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

# Start the application
CMD ["npm", "start"]
