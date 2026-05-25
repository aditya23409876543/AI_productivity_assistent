# Use an official lightweight Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy backend package configuration files
COPY backend/package*.json ./backend/

# Install production dependencies for backend
RUN npm ci --prefix backend --only=production

# Copy backend application source code
COPY backend ./backend

# Change working directory to the backend subdirectory
WORKDIR /usr/src/app/backend

# Set environment variables
ENV PORT=5000
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server.js"]
