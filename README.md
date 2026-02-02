# SketchFlow - High-Performance Collaborative Whiteboard

![SketchFlow Banner](https://via.placeholder.com/1200x400?text=SketchFlow+Real-Time+Collaboration)

**SketchFlow** is a distributed, real-time collaborative whiteboard platform designed for high scalability and low-latency interaction. It allows multiple users to draw, sketch, and brainstorm on shared digital canvases with instant synchronization across devices.

Built with **Next.js 14**, **Node.js**, **WebSockets**, and **Redis**, this application demonstrates a modern approach to handling stateful connections in a stateless cloud environment.

---

## 🚀 Key Features

*   **Real-Time API**: Custom WebSocket implementation (using `ws`) for sub-50ms latency updates.
*   **Multi-User Collaboration**: Live cursor tracking and concurrent drawing for unlimited users per room.
*   **Room Isolation**: Independent whiteboard sessions securely isolated by UUIDs.
*   **Smart State Management**:
    *   **Undo/Redo**: Per-user history stacks.
    *   **Persistence**: Auto-saving of strokes to PostgreSQL.
    *   **Snapshots**: Efficient loading of board state for new joiners.
*   **Authentication**: Secure JWT-based auth flow (HttpOnly cookies) with custom middleware.
*   **Responsive Design**: Fluid UI built with TailwindCSS and Glassmorphism aesthetics.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Zustand (Local Client State)
- **Drawing Engine**: HTML5 Canvas API (Custom Engine)

### Backend
- **Runtime**: Node.js (Express)
- **Transport**: WebSockets (`ws` library) - *Chosen over Socket.io for raw performance control.*
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Scaling**: Redis Pub/Sub

### Infrastructure (AWS)
- **Compute**: AWS EC2 (Dockerized Containers)
- **Traffic**: AWS Application Load Balancer (ALB)
- **Database**: AWS RDS (Managed Postgres)
- **Hosting**: AWS Amplify (Frontend CI/CD)
- **Security**: Self-Signed SSL / Reverse Proxy, JWT Authentication, Security Groups
- **IaC**: Terraform (Infrastructure as Code) configurations included.

---

## 📈 Architecture & Scalability

SketchFlow is architected to solve the **"Stateful Scaling Problem"** inherent in WebSocket applications.

### The Problem
In a traditional monolithic WebSocket app, all users must connect to the same server to "see" each other. If that server fills up (e.g., max 10k connections), you cannot simply add a second server, because users on Server A cannot talk to Server B.

### The Solution: Redis Pub/Sub Adapter & Vertical Scaling
SketchFlow implements a **Distributed Event Bus** using Redis and a Load Balanced architecture.

![AWS Architecture Diagram](frontend/public/aws-architecture.png)

1.  **Traffic Routing (AWS ALB)**: An **Application Load Balancer** sits at the edge, terminating SSL (HTTPS/WSS) and distributing WebSocket connections across the backend fleet using a Round-Robin algorithm.
2.  **Vertical Scaling (Docker)**: Node.js is single-threaded. To maximize the CPU utilization of our EC2 instances, we deploy **multiple Node.js containers per instance**. This allows the application to use all available CPU cores efficiently.
3.  **Event Broadcasting (Redis)**: When a user draws on 'Container A', the event is published to Redis. All other containers subscribe to updates and forward the event to their local users, ensuring global synchronization.

---

## 💻 Local Development

Run SketchFlow on your local machine without AWS dependencies.

See the full guide here: [👉 LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

**Quick Start:**
```bash
# 1. Start Infrastructure (Docker)
docker run --name local-postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres
docker run --name local-redis -d -p 6379:6379 redis:alpine

# 2. Install dependencies
cd backend && npm install && npx prisma db push
cd frontend && npm install

# 3. Run
# Term 1: cd backend && npm run dev
# Term 2: cd frontend && npm run dev
```

---

## 🔮 Future Roadmap

While the current version is production-grade, the following improvements are planned for Enterprise scale:

*   **S3 Snapshotting**: Currently, stroke history is replayed from SQL. For boards with 10k+ strokes, we plan to periodically dump the canvas state to a JSON file in AWS S3 for instant loading.
*   **Vector Conflict Resolution**: Implement CRDTs (Conflict-free Replicated Data Types) like Y.js for decentralized conflict handling on unreliable networks.
*   **Kubernetes (EKS)**: Migrate from raw Docker/EC2 to Kubernetes for auto-scaling capabilities based on CPU/Connection load.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

**Author**: [Aishwarya Virigineni]
