# Deploying to AWS

This guide covers deploying your Whiteboard App to AWS using **AWS App Runner** (for Backend), **AWS Amplify** (for Frontend), and **AWS RDS** (for Database).

## Prerequisites
1.  **AWS Account**: Create one at [aws.amazon.com](https://aws.amazon.com/).
2.  **GitHub Repository**: Push this code to a GitHub repository.

---

## Step 1: Database (AWS RDS)
1.  Go to the **AWS Console** -> **RDS**.
2.  Click **Create database**.
3.  Choose **PostgreSQL**.
4.  **Template**: Choose **Free tier** (if eligible) or **Dev/Test**.
5.  **Settings**: Set a Master Username and Password (write these down!).
6.  **Connectivity**:
    *   **Public access**: Yes (for easiest setup) or No (if you know how to configure VPC peering for App Runner). *Recommendation: Yes for MVP, prohibitively restrict IP later.*
7.  **Create**.
8.  Once created, copy the **Endpoint** (URL).
9.  Construct your `DATABASE_URL`:
    `postgresql://USER:PASSWORD@ENDPOINT:5432/whiteboard?schema=public`

---

## Step 2: Backend (AWS App Runner)
App Runner is the easiest way to run the backend Docker container.

1.  Go to **AWS App Runner**.
2.  **Create Service**.
3.  **Source**: "Source code repository".
4.  Connect your GitHub and select your repo.
5.  **Source Directory**: `backend`.
6.  **Configuration**:
    *   **Runtime**: Node.js 18+ (or just choose "Configuration via `apprunner.yaml`" if you add one, but UI configuration is fine).
    *   **Build Command**: `npm install && npx prisma generate && npm run build` (Wait, we have a Dockerfile! Use **Container Registry** or **Source Code** -> **Visual Builder**? App Runner supports building from source for Node, but Docker is safer).
    *   *Alternative (Better)*: Choose **Source Code**, select the repo. Under "Configure build", choose "Configure all settings here".
        *   **Runtime**: Nodejs 18
        *   **Build command**: `npm install && npx prisma generate && npm run build`
        *   **Start command**: `npm start`
        *   *Wait, our backend uses `tsx` and isn't fully compiled to JS in a standard way for `node dist/index.js` without issues. The Dockerfile method is safer.*
    
    **Recommended Method: Docker Image**
    If you can push the Docker image to ECR, do that.
    
    **Simpler Method (Source Code)**:
    1. Update `backend/package.json` build script to `tsc` and start to `node --loader ts-node/esm src/index.ts`? No.
    2. Let's stick to the Dockerfile method if you are comfortable with ECR.
    3. **Actually, let's use the UI "Build from source" with `tsx`.**
       *   **Build Command**: `npm install`
       *   **Start Command**: `npx tsx src/index.ts`
       *   **Port**: `4000`
7.  **Environment Variables**:
    Add `DATABASE_URL` = (your RDS URL from Step 1).
    Add `PORT` = `4000`.
    Add `FRONTEND_URL` = (leave blank for now, update later).
8.  **Deploy**.
9.  Copy the **Default domain** (e.g., `https://xyz.awsapprunner.com`). This is your `NEXT_PUBLIC_API_URL`.

---

## Step 3: Frontend (AWS Amplify)
1.  Go to **AWS Amplify**.
2.  **Create new app** -> **Gen 2** (or "Host web app" in Gen 1).
3.  **GitHub**: Connect repo.
4.  **Monorepo settings**:
    *   Root: `frontend`
5.  **Build Settings**: Amplify usually auto-detects Next.js.
    *   It will run `npm run build`.
6.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `https://YOUR-BACKEND-URL-FROM-STEP-2` (No trailing slash).
    *   `NEXT_PUBLIC_WS_URL`: `wss://YOUR-BACKEND-URL-FROM-STEP-2` (Replace `https` with `wss` manually).
        *   *Note: App Runner supports TLS, so `wss://` on port 443 is correct.*
7.  **Deploy**.

---

## Final wiring
1.  Once Frontend is deployed, you get a URL (e.g., `https://main.appId.amplifyapp.com`).
2.  Go back to **App Runner (Backend)**.
3.  Update **Environment Variables**:
    *   `FRONTEND_URL`: `https://main.appId.amplifyapp.com` (Your actual frontend URL).
4.  **Redeploy** Backend.

## Summary of Environment Variables needed

**Backend:**
- `DATABASE_URL`: Connection string to RDS.
- `FRONTEND_URL`: URL of the deployed frontend (for CORS).
- `PORT`: 4000

**Frontend:**
- `NEXT_PUBLIC_API_URL`: URL of the deployed backend (https).
- `NEXT_PUBLIC_WS_URL`: URL of the deployed backend (wss).
