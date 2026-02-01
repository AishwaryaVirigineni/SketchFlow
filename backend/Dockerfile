FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for tsx)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose the port
EXPOSE 4000

# Start the application using tsx for robust TS execution
CMD ["npx", "tsx", "src/index.ts"]
