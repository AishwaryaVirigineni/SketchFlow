# Use a lightweight Node.js version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the TypeScript code to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 4000

# Start the application
# We use CMD to invoke the compiled JS
CMD ["npm", "run", "start"]
