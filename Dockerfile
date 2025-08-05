# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (only if not in development)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files for production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Install ONLY production dependencies (cleaner than copying node_modules)
RUN npm ci --only=production && npm cache clean --force && rm -rf /tmp/*

# Copy built application and essential files  
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/scripts ./scripts

# Ensure nestjs user owns everything including node_modules for Prisma generate
RUN chown -R nestjs:nodejs /app/node_modules

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Memory optimization for VPS deployment (adjustable based on available RAM)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Environment variable to trigger database reset on first deploy
ENV RESET_DATABASE=false

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Start script that handles database reset and app startup
CMD ["sh", "-c", "if [ \"$RESET_DATABASE\" = \"true\" ]; then echo 'Resetting database...' && npx prisma db push --force-reset; else npx prisma db push; fi && dumb-init node dist/main"]