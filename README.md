# Social Media Microservices Platform

A scalable social media backend platform built with Node.js microservices architecture. This project demonstrates modern microservices patterns including API Gateway, event-driven communication, caching, and media handling.

## 🏗️ Architecture Overview

The platform consists of 5 microservices:

```
┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Identity       │
│   Port: 3000    │◄──►│  Service        │
│                 │    │  Port: 3001     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Post Service  │    │  Media Service  │
│   Port: 3002    │    │  Port: 3003     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Search Service  │    │   RabbitMQ      │
│ Port: 3004      │    │ Event Bus       │
└─────────────────┘    └─────────────────┘
```

## 🚀 Services

### 1. API Gateway (`api-gateway/`)
- **Port**: 3000
- **Purpose**: Central entry point, request routing, authentication
- **Features**:
  - JWT token validation
  - Rate limiting with Redis
  - Request proxying to microservices
  - Security headers with Helmet
  - Request/response logging

### 2. Identity Service (`identity-service/`)
- **Port**: 3001
- **Purpose**: User authentication and authorization
- **Features**:
  - User registration and login
  - JWT access token generation
  - Refresh token management
  - Password hashing with Argon2
  - Rate limiting for sensitive endpoints
  - Redis-based session management

### 3. Post Service (`post-service/`)
- **Port**: 3002
- **Purpose**: Post creation, retrieval, and management
- **Features**:
  - CRUD operations for posts
  - Redis caching for performance
  - Event publishing via RabbitMQ
  - Pagination support
  - Content validation with Joi

### 4. Media Service (`media-service/`)
- **Port**: 3003
- **Purpose**: File upload and media management
- **Features**:
  - File upload with Multer
  - Cloudinary integration for storage
  - Event-driven media cleanup
  - Multi-format media support
  - Media metadata storage

### 5. Search Service (`search-service/`)
- **Port**: 3004 (In Development)
- **Purpose**: Content search and indexing
- **Status**: Service structure ready for implementation

## 🛠️ Tech Stack

### Core Technologies
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **File Storage**: Cloudinary

### Key Dependencies
- **Authentication**: JWT, Argon2
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Rate Limiting**: express-rate-limit, rate-limiter-flexible
- **Logging**: Winston
- **File Upload**: Multer
- **Image Processing**: Cloudinary

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Redis server
- RabbitMQ server
- Cloudinary account (for media service)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd social-media-microservices
```

### 2. Install Dependencies
```bash
# Install dependencies for each service
cd api-gateway && npm install
cd ../identity-service && npm install
cd ../post-service && npm install
cd ../media-service && npm install
cd ../search-service && npm install
```

### 3. Environment Configuration

Create `.env` files for each service based on the following templates:

#### API Gateway (`.env`)
```env
PORT=3000
NODE_ENV=development
IDENTITY_SERVICE_URL=http://localhost:3001
POSTS_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here
```

#### Identity Service (`.env`)
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

#### Post Service (`.env`)
```env
PORT=3002
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
REDIS_HOST=redis://localhost:6379
RABBITMQ_URL=amqp://127.0.0.1:5672
```

#### Media Service (`.env`)
```env
PORT=3003
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
RABBITMQ_URL=amqp://127.0.0.1:5672
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 4. Start Required Services

```bash
# Start MongoDB (if running locally)
mongod

# Start Redis
redis-server

# Start RabbitMQ
rabbitmq-server
```

### 5. Run the Microservices

Start each service in separate terminals:

```bash
# Terminal 1 - API Gateway
cd api-gateway && npm run dev

# Terminal 2 - Identity Service
cd identity-service && npm run dev

# Terminal 3 - Post Service
cd post-service && npm run dev

# Terminal 4 - Media Service
cd media-service && npm run dev

# Terminal 5 - Search Service (when ready)
cd search-service && npm run dev
```

## 📡 API Endpoints

### Authentication (via API Gateway)
```
POST /v1/auth/register     - User registration
POST /v1/auth/login        - User login
POST /v1/auth/refresh-token - Refresh access token
POST /v1/auth/logout       - User logout
```

### Posts (via API Gateway)
```
POST /v1/posts/create-post - Create new post
GET  /v1/posts/all-posts   - Get all posts (paginated)
GET  /v1/posts/:id         - Get specific post
DELETE /v1/posts/:id       - Delete post
```

### Media (via API Gateway)
```
POST /v1/media/upload      - Upload media file
GET  /v1/media/get         - Get all media files
```

## 🔄 Event-Driven Architecture

The platform uses RabbitMQ for asynchronous communication:

### Event Types
- `post.deleted` - Published when a post is deleted
  - **Producer**: Post Service
  - **Consumer**: Media Service (cleans up associated media)

### Message Flow
1. User deletes a post via API Gateway
2. Post Service deletes the post from database
3. Post Service publishes `post.deleted` event to RabbitMQ
4. Media Service consumes the event and removes associated media files

## 📊 Data Models

### User Model (Identity Service)
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  timestamps: true
}
```

### Post Model (Post Service)
```javascript
{
  user: ObjectId (ref: User),
  content: String,
  mediaIds: [String],
  createdAt: Date,
  timestamps: true
}
```

### Media Model (Media Service)
```javascript
{
  publicId: String,
  originalName: String,
  mimeType: String,
  url: String,
  userId: ObjectId,
  timestamps: true
}
```

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based authentication
- **Rate Limiting**: Per-IP request limiting with Redis storage
- **Password Security**: Argon2 hashing algorithm
- **Request Validation**: Joi schema validation
- **Security Headers**: Helmet.js for HTTP security
- **CORS Protection**: Configurable cross-origin resource sharing

## 🚄 Performance Optimizations

- **Redis Caching**: Post data caching with TTL
- **Database Indexing**: Optimized MongoDB queries
- **Request Logging**: Structured logging with Winston
- **Error Handling**: Centralized error management
- **Connection Pooling**: Efficient database connections

## 📝 Development Scripts

Each service includes the following npm scripts:
```json
{
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

## 🧪 Testing

Currently, test suites are not implemented. To add testing:

1. Install testing frameworks (Jest, Mocha, etc.)
2. Create test files for each service
3. Add test scripts to package.json
4. Implement unit and integration tests

## 🚀 Deployment Considerations

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Use environment-specific configuration
- [ ] Implement proper logging levels
- [ ] Set up monitoring and health checks
- [ ] Configure load balancing
- [ ] Implement CI/CD pipelines
- [ ] Set up database backups
- [ ] Configure SSL/TLS certificates

### Scaling Options
- **Horizontal Scaling**: Multiple instances behind load balancer
- **Database Sharding**: Distribute data across multiple databases
- **Caching Layers**: CDN for media, Redis clusters
- **Message Queue Clusters**: RabbitMQ clustering
- **Container Orchestration**: Docker + Kubernetes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔮 Future Enhancements

- [ ] Complete Search Service implementation
- [ ] Real-time notifications with WebSockets
- [ ] User profiles and following system
- [ ] Content recommendation engine
- [ ] API versioning
- [ ] GraphQL API layer
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] Comprehensive test coverage
- [ ] API documentation with Swagger/OpenAPI

## 📞 Support

For questions and support, please create an issue in the repository or contact the development team.

---

**Built with ❤️ using Node.js and Microservices Architecture**
