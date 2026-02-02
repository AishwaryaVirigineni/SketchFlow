#!/bin/bash

# 1. Build the image
echo "🐳 Building Docker Image..."
sudo docker build -t sketchflow-backend .

# 2. Stop existing PM2 process (if running) to free port 4000
echo "🛑 Stopping PM2 backend..."
pm2 stop backend || true

# 3. Remove old container (if exists)
echo "🧹 Removing old container..."
sudo docker rm -f sketchflow-container || true

# 4. Run new container
# We map (-v) the certs from the HOST to the CONTAINER so HTTPS works.
echo "🚀 Starting Container..."
sudo docker run -d \
  --name sketchflow-container \
  -p 4000:4000 \
  -v $(pwd)/server.key:/app/server.key \
  -v $(pwd)/server.cert:/app/server.cert \
  -e FRONTEND_URL="https://main.d1kzbh6gr5zmmo.amplifyapp.com" \
  -e JWT_SECRET="supersecret123" \
  -e DATABASE_URL="postgresql://postgres:postgres@database-1.czkg0sqmkmrz.us-east-2.rds.amazonaws.com:5432/whiteboard?schema=public" \
  sketchflow-backend

echo "✅ Deployment Complete! Check logs with: sudo docker logs -f sketchflow-container"
