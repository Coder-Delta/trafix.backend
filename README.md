# 🚦 Trafix AI Backend

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Ready-red?style=flat-square&logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-ISC-yellow?style=flat-square)](LICENSE)

> 🤖 AI-powered traffic analytics backend. Processes vehicle detection events, manages global identity, tracks trajectories, and provides real-time traffic insights.

---

## ✨ Features

- 🎥 **Camera Management** – Register and monitor CCTV feeds
- 🚗 **Global Vehicle Identity** – Track unique vehicles across camera feeds using AI embeddings
- 📍 **Trajectory Tracking** – Reconstruct vehicle routes and movements
- 🚦 **Traffic Analytics** – Real-time congestion metrics and flow analysis
- 🔍 **Detection Events API** – Accept AI-generated vehicle detection payloads
- 🔐 **JWT Authentication** – Role-based operator and admin access
- 🔄 **WebSocket Support** – Live traffic and vehicle event streams
- 📦 **PostgreSQL + PostGIS** – Geospatial data persistence
- ⚡ **Redis-Ready** – Caching and session management (scaffolded)
- 🏥 **Health Checks** – Service liveness and diagnostic endpoints

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 5.x |
| Database | PostgreSQL | 15+ |
| Geospatial | PostGIS | 3.x |
| Cache | Redis | 6+ |
| Auth | JWT | jsonwebtoken 9.x |
| WebSocket | WS | 8.x |
| Config | dotenv | 17.x |
| Dev Tool | nodemon | 3.x |

---

## 📦 Installation

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **PostgreSQL** 15+ (optional for development)
- **Redis** (optional for development)

### Setup

```bash
# Clone repository
git clone https://github.com/Coder-Delta/trafix.backend.git
cd trafix.backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (optional)
```

---

## 🚀 Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server starts on `http://localhost:8000` by default.

**Output:**
```
[database] PostgreSQL credentials not configured. Database layer is scaffolded but disabled.
[redis] Redis credentials not configured. Redis layer is scaffolded but disabled.
Trafix AI backend listening on http://localhost:8000
```

---

## 📡 API Endpoints

### 🏥 Health & Diagnostics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service status |
| `GET` | `/api/v1/openapi` | OpenAPI specification |

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/login` | Operator login | Public |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | Public |
| `GET` | `/api/v1/auth/me` | Current user profile | Operator+ |

### 🎥 Cameras

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/cameras` | List all cameras | Public |
| `GET` | `/api/v1/cameras/:camera_id` | Get camera details | Public |
| `GET` | `/api/v1/cameras/:camera_id/status` | Camera health status | Public |
| `POST` | `/api/v1/cameras/:camera_id/heartbeat` | Camera heartbeat | Operator+ |

### 🤖 Detection Events (AI → Backend)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/events/detection` | Single detection event | Public |
| `POST` | `/api/v1/events/batch` | Batch detection events | Public |

### 🚗 Vehicles

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/vehicles/search` | Search vehicles by plate | Public |
| `GET` | `/api/v1/vehicles/:vehicle_id` | Get vehicle profile | Public |
| `GET` | `/api/v1/vehicles/:vehicle_id/events` | Vehicle detection history | Public |
| `GET` | `/api/v1/vehicles/:vehicle_id/trajectory` | Vehicle trajectory | Public |

### 🚦 Traffic

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/traffic` | Network traffic overview | Public |
| `GET` | `/api/v1/traffic/:camera_id` | Camera traffic metrics | Public |
| `GET` | `/api/v1/traffic/route/:route_id` | Route traffic metrics | Public |

### 📊 Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/analytics/overview` | Analytics dashboard | Public |

### 🔌 WebSocket (Real-time)

| Endpoint | Description | Auth |
|----------|-------------|------|
| `WS /api/v1/ws/traffic` | Live traffic stream | Required |
| `WS /api/v1/ws/vehicle/:vehicle_id` | Live vehicle updates | Required |

---

## 📁 Project Structure

```
src/
├── config/
│   ├── database.js          # PostgreSQL connection pool
│   ├── redis.js             # Redis client factory
│   └── swagger.js           # OpenAPI specification
├── controllers/
│   ├── auth.controller.js      # Auth endpoints
│   ├── camera.controller.js     # Camera CRUD
│   ├── event.controller.js      # Detection event handling
│   ├── vehicle.controller.js    # Vehicle identity & search
│   ├── traffic.controller.js    # Traffic metrics
│   └── analytics.controller.js  # Analytics aggregation
├── middleware/
│   ├── auth.middleware.js       # JWT verification & roles
│   ├── error.middleware.js      # Centralized error handling
│   └── validate.middleware.js   # Request validation
├── models/
│   ├── cameras.model.js           # Camera schema
│   ├── vehicles.model.js          # Vehicle schema
│   ├── detection_events.model.js  # Detection event schema
│   ├── trajectories.model.js      # Trajectory schema
│   ├── traffic_metrics.model.js   # Traffic metrics schema
│   ├── users.model.js             # User schema
│   └── alerts.model.js            # Alert schema
├── routes/
│   ├── auth.routes.js       # Auth route handlers
│   ├── camera.routes.js     # Camera route handlers
│   ├── event.routes.js      # Event route handlers
│   ├── vehicle.routes.js    # Vehicle route handlers
│   ├── traffic.routes.js    # Traffic route handlers
│   └── analytics.routes.js  # Analytics route handlers
├── services/
│   ├── identity.service.js     # Global vehicle identity logic
│   ├── trajectory.service.js   # Trajectory computation
│   ├── traffic.service.js      # Traffic metrics aggregation
│   └── analytics.service.js    # Analytics pipeline
├── websocket/
│   └── traffic.ws.js        # WebSocket server setup
├── utils/
│   ├── httpError.js         # Error class definitions
│   └── requestContext.js    # Request ID tracking
├── app.js                   # Express app configuration
└── server.js                # HTTP server startup

.env.example                 # Environment variable template
.gitignore                   # Git ignore rules
package.json                 # Project metadata & dependencies
README.md                    # This file
```

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=8000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/trafix_ai
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trafix_ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_USERNAME=
REDIS_URL=

# CORS
CORS_ORIGIN=http://localhost:3000
```

See [.env.example](.env.example) for all available variables.

---

## 🔐 Authentication

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@example.com",
    "password": "secret"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "operator_placeholder",
      "email": "operator@example.com",
      "role": "operator"
    }
  }
}
```

### Using Token

Include the token in request headers:

```bash
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <your-access-token>"
```

---

## 🚗 Detection Event Format

### Single Detection

```bash
curl -X POST http://localhost:8000/api/v1/events/detection \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "evt_123",
    "camera_id": "cam_001",
    "observed_at": "2026-09-01T12:00:00Z",
    "local_track_id": "track_123",
    "vehicle_type": "car",
    "plate_number": "ABC123",
    "plate_confidence": 0.98,
    "vehicle_embedding": "base64-encoded-vector",
    "embedding_model": "yolov8",
    "embedding_version": "v1",
    "vehicle_confidence": 0.95,
    "bounding_box": { "x1": 10, "y1": 20, "x2": 200, "y2": 180 },
    "frame_reference": "frame_001.jpg"
  }'
```

### Batch Detection

```bash
curl -X POST http://localhost:8000/api/v1/events/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      { /* detection 1 */ },
      { /* detection 2 */ }
    ]
  }'
```

---

## 🔌 WebSocket Connection

### Traffic Stream

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/traffic');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Traffic update:', message);
};
```

### Vehicle Stream

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/vehicle/veh_001');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Vehicle update:', message);
};
```

---

## 🐛 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "request_id": "req_1234567890_abc123",
    "details": [
      {
        "field": "email",
        "message": "email is required"
      }
    ]
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request format |
| `UNAUTHORIZED` | 401 | Missing/invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## ✅ TODO - Implementation Roadmap

- [ ] PostgreSQL migrations and real database queries
- [ ] User authentication with real password hashing (bcryptjs)
- [ ] Global vehicle identity and deduplication logic
- [ ] Trajectory reconstruction and map matching
- [ ] Traffic aggregation and congestion algorithms
- [ ] Redis caching and session management
- [ ] WebSocket authentication and subscription management
- [ ] Rate limiting middleware
- [ ] Request logging and monitoring
- [ ] Database connection pooling and retry logic
- [ ] Analytics aggregation pipeline
- [ ] Alert system for traffic incidents
- [ ] Production-grade error handling and logging
- [ ] API documentation with Swagger UI
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline (GitHub Actions)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

---

## 📜 License

This project is licensed under the **ISC License** – see [LICENSE](LICENSE) for details.

---

## 👥 Team

- **Backend Engineer** – [Coder-Delta](https://github.com/Coder-Delta)

---

## 📞 Support

For issues, questions, or suggestions:
- 🐛 [Open an Issue](https://github.com/Coder-Delta/trafix.backend/issues)
- 💬 [Start a Discussion](https://github.com/Coder-Delta/trafix.backend/discussions)

---

<div align="center">

**Built with ❤️ for smarter traffic analytics**

[![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)

</div>