# How to Resume Your Work (AWS)

## 1. Start Database
1. Go to **AWS Console** -> **RDS** -> **Databases**.
2. Select `database-1`.
3. Actions -> **Start**.
4. *Wait ~5 minutes* until status is "Available".

## 2. Start Backend Server
1. Go to **AWS Console** -> **EC2** -> **Instances**.
2. Select `Whiteboard-Backend`.
3. Instance state -> **Start instance**.
4. *Wait ~1 minute* until "Running".

## 3. Verify Backend (Optional)
The backend should start automatically on boot (if PM2 startup script was configured, which we might not have explicitly run `pm2 startup` for).
**If it doesn't work immediately:**
1. Connect to EC2 (SSH).
2. Run: `pm2 resurrect` (if you saved) OR run the start command again:
   ```bash
   cd ~/SketchFlow/backend
   pm2 delete backend
   FRONTEND_URL="https://main.d1kzbh6gr5zmmo.amplifyapp.com" JWT_SECRET="supersecret123" DATABASE_URL="postgresql://postgres:postgres@database-1.czkg0sqmkmrz.us-east-2.rds.amazonaws.com:5432/whiteboard?schema=public" PORT=4000 pm2 start npx --name "backend" -- tsx src/index.ts
   ```

## 4. Work Locally (If developing features)
*   **Frontend**: `cd frontend && npm run dev`
*   **Backend**: `cd backend && npm run dev`

## 5. Deploy Updates
*   **Frontend**: `git push` (Auto-deploys via Amplify).
*   **Backend**: 
    1. `git push`
    2. SSH into EC2.
    3. `cd ~/SketchFlow/backend`
    4. `git pull`
    5. `pm2 restart backend`
