# Use a stable Node image for build and runtime
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for build
COPY package*.json ./
RUN npm install

# Copy source and build the app
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
