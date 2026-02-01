# Deploying to AWS (The "Interview-Ready" Architecture)

This guide deploys a professional, scalable architecture that is perfect for system design interviews.

**Architecture:**
*   **Frontend**: AWS Amplify (CI/CD, High availability)
*   **Backend**: AWS EC2 (Dockerized) behind an **Application Load Balancer (ALB)**.
    *   *Why ALB?* Handles HTTPS/SSL termination and allows for future auto-scaling.
*   **Database**: AWS RDS (Managed PostgreSQL).

**Estimated Cost**: ~$40/month (Fully covered by your credits).

---

## Step 1: Network & Security (The Foundation)
We need security groups to allow traffic to flow correctly.

1.  Go to **EC2 Console** -> **Reference** (left sidebar) -> **Security Groups**.
2.  **Create Security Group 1 (ALB-SG)**:
    *   **Name**: `whiteboard-alb-sg`
    *   **Inbound Rules**:
        *   Type: **HTTPS** (443) -> Source: `0.0.0.0/0` (Anywhere)
        *   Type: **HTTP** (80) -> Source: `0.0.0.0/0`
3.  **Create Security Group 2 (Backend-SG)**:
    *   **Name**: `whiteboard-backend-sg`
    *   **Inbound Rules**:
        *   Type: **Custom TCP** (Port 4000) -> Source: **Custom** -> Select `whiteboard-alb-sg` (The group you just made).
        *   Type: **SSH** (22) -> Source: **My IP** (For your access).
4.  **Create Security Group 3 (Database-SG)**:
    *   **Name**: `whiteboard-db-sg`
    *   **Inbound Rules**:
        *   Type: **PostgreSQL** (5432) -> Source: **Custom** -> Select `whiteboard-backend-sg`.

---

## Step 2: Database (AWS RDS)
1.  Go to **RDS Console** -> **Create database**.
2.  **Engine**: PostgreSQL.
3.  **Template**: **Dev/Test** (or Free Tier).
4.  **Settings**: Set Master Username/Password.
5.  **Connectivity**:
    *   **Public Access**: **No** (Best practice! Only EC2 can access it).
    *   **VPC Security Group**: Choose `whiteboard-db-sg`.
6.  **Create**.
7.  Copy the **Endpoint** (URL) when ready.
8.  Construct `DATABASE_URL`: `postgresql://USER:PASSWORD@ENDPOINT:5432/whiteboard?schema=public`

---

## Step 3: Backend Instance (EC2)
1.  **Launch Instance**.
2.  **Name**: `Whiteboard-Backend`.
3.  **OS**: Ubuntu 24.04 LTS.
4.  **Instance Type**: `t3.micro`.
5.  **Key Pair**: Create/Select one.
6.  **Network Settings**: Select **Existing security group** -> `whiteboard-backend-sg`.
7.  **Launch**.
8.  **SSH into the instance** and setup the environment:
    ```bash
    # Update
    sudo apt update && sudo apt install -y git

    # Install Node 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs

    # Install PM2
    sudo npm install -g pm2

    # Clone Code
    git clone https://github.com/YOUR_GITHUB_USER/YOUR_REPO.git
    cd YOUR_REPO/backend
    npm install
    npx prisma generate
    ```
9.  **Start the Server**:
    ```bash
    # Replace URL below with your RDS Endpoint
    DATABASE_URL="postgresql://USER:PASS@ENDPOINT:5432/whiteboard?schema=public" PORT=4000 pm2 start npx --name "backend" -- tsx src/index.ts
    ```

---

## Step 4: Load Balancer (ALB)
This is the professional layer that gives you HTTPS without hacking.

1.  **Target Groups** (EC2 Sidebar):
    *   **Create target group**.
    *   **Type**: Instances.
    *   **Port**: `4000` (Your backend port).
    *   **Protocol**: HTTP.
    *   **Health Check path**: `/health` (or `/` if you don't have a health route).
    *   **Next** -> Select your running instance -> **Include as pending below** -> **Create**.
2.  **Load Balancers** (EC2 Sidebar):
    *   **Create Load Balancer** -> **Application Load Balancer**.
    *   **Name**: `whiteboard-alb`.
    *   **Scheme**: Internet-facing.
    *   **Security Groups**: Select `whiteboard-alb-sg`.
    *   **Listeners**:
        *   **HTTP (80)** -> Forward to `target-group-you-created`.
        *   *(Note: For real HTTPS, you need a domain + ACM Certificate. For now, use HTTP port 80 or setup a self-signed cert if you just want to test).*
    *   **Create**.
3.  **Result**: You get a DNS Name (e.g., `whiteboard-alb-123.us-east-1.elb.amazonaws.com`).
    *   This is your **API URL**.

---

## Step 5: Frontend (Amplify)
1.  Go to **Amplify**.
2.  **Create App** -> GitHub.
3.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `http://YOUR-ALB-DNS-NAME` (Note: It will be HTTP unless you attached a real domain/cert to the ALB).
    *   `NEXT_PUBLIC_WS_URL`: `ws://YOUR-ALB-DNS-NAME`
4.  **Deploy**.

---

## Interview Story (Cheat Sheet)
**"Why did you choose this architecture?"**

"I designed a 3-tier architecture focused on security and scalability:
1.  **Frontend**: Deployed on **Amplify** for global CDN caching and ease of CI/CD.
2.  **Backend**: Running on **EC2** behind an **Application Load Balancer**. The ALB allows me to handle traffic spikes in the future by simply adding more EC2 instances to the Target Group (Auto Scaling).
3.  **Database**: **RDS PostgreSQL** in a private subnet. I deliberately blocked public access and only allowed the Backend Security Group to talk to it, ensuring data security."

