# Project Architecture & Technology Report

## 1. Technology Stack

### Frontend (Client-Side)
*   **Framework**: [Next.js 14+](https://nextjs.org/) (App Router) - Chosen for its robustness, file-based routing, and easy integration with React.
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - Ensures type safety, reducing runtime errors significantly.
*   **Styling**: [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS for rapid, responsive UI development without context switching.
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) - A lightweight, hook-based state manager. chosen over Redux for simplicity and cleaner boilerplate.
*   **Graphics**: **HTML5 Canvas API** - Used directly (via custom React hooks) for high-performance rendering of drawing paths.
*   **Icons**: [Lucide React](https://lucide.dev/) - Consistent, clean SVG icons.

### Backend (Server-Side)
*   **Runtime**: [Node.js](https://nodejs.org/) - Event-driven JavaScript runtime, excellent for I/O heavy tasks.
*   **Framework**: [Express.js](https://expressjs.com/) - Minimalist web framework to handle HTTP routes (`/auth`, `/boards`).
*   **Real-Time**: [ws](https://github.com/websockets/ws) - A native, lightweight WebSocket library. Chosen over Socket.io to demonstrate understanding of the core protocol and avoid polling overhead.
*   **Database**: [PostgreSQL](https://www.postgresql.org/) - Powerful relational database to enforce structured data schemas (Users, Relations).
*   **ORM**: [Prisma](https://www.prisma.io/) - Modern ORM that provides full type safety from the Database schema to the Frontend client.

### Infrastructure (AWS)
*   **Compute**: **EC2 (Elastic Compute Cloud)** - Hosts the backend. Chosen to provide a persistent environment for WebSocket connections (which stateful servers require).
*   **Load Balancing**: **ALB (Application Load Balancer)** - Distributes incoming HTTP/WebSocket traffic and allows for future scaling.
*   **Database Hosting**: **RDS (Relational Database Service)** - Managed PostgreSQL instance. Handles backups, patching, and availability.
*   **Frontend Hosting**: **AWS Amplify** - Connects to GitHub for CI/CD, automatically building and deploying the Next.js frontend globally.
*   **Security/CDN**: **CloudFront** - Provides SSL execution (HTTPS/WSS) at the edge, securing the connection to the backend.

---

## 2. Scalability Assessment

### Current Status
*   **Vertical Scaling (Readiness: High)**: You can easily upgrade the EC2 instance size (t3.micro -> c5.large) or RDS size to handle more users on the single node.
*   **Horizontal Scaling (Readiness: Low)**: The current architecture stores active WebSocket "Rooms" in the server's RAM (`Map<string, Set<WebSocket>>`).
    *   *Bottleneck*: If you add a second backend server, users connected to Server A cannot communicate with users on Server B.

### How to Scale (The "System Design" Answer)
To support 100k+ concurrent users, the following changes would be required:

1.  **Pub/Sub Layer (Redis)**: Implement a Redis adapter. When a message is received on one server, broadcast it to Redis channels so all other servers receive it and forward it to their connected clients.
2.  **Connection State**: Move room state out of RAM and into a fast KV store (Redis) to make the backend stateless.
3.  **Read Replicas**: Configure RDS with a generic "Write" node and multiple "Read" nodes to handle the load of loading dashboards.

---

## 3. Potential Improvements & Alternatives

### Backend Framework
*   **NestJS**: For larger teams, NestJS enforces a strict modular architecture (Controllers, Services, Modules). It would make the codebase more testable and maintainable long-term compared to the loose structure of Express.

### Real-Time Engine
*   **Socket.io**: While `ws` is great for learning, `Socket.io` handles "reconnection" logic, fallbacks, and room broadcasting (with Redis adapter) out of the box. Using it would speed up development of complex features like "Room lists" or "User presence".

### Infrastructure
*   **Docker / ECS**: Currently, the server runs directly on the EC2 OS. Containerizing it with Docker and deploying via AWS ECS (Elastic Container Service) would make updates safer and auto-scaling easier.
*   **Terraform**: Managing infrastructure via code (IaC) instead of the AWS Console ensures the environment can be recreated instantly in a disaster recovery scenario.

### Performance
*   **Canvas Optimization**: For extremely complex drawings, switching from 2D Context to **WebGL** (or libraries like Pixi.js) would allow thousands of strokes without frame drops.
*   **Delta Updates**: Currently, the server might send full snapshots. Implementing a "Operational Transformation" (OT) or CRDT approach would drastically reduce bandwidth.

---

## 4. Key Takeaways for Interviews
*   **"Why EC2 and not Lambda?"**: Lambda has a "warm-up" time and maximum execution duration. WebSockets need long-lived, persistent connections. Putting WebSockets on Lambda is complex and often more expensive than a simple EC2/Container service.
*   **"How do you handle security?"**: We used **Prisma** to prevent SQL Injection. We used **JWTs** (HttpOnly cookies) for stateless authentication. We used **Security Groups** to isolate the Database from the public internet.
