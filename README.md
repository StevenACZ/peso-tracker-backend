# Peso Tracker API

A comprehensive weight tracking application backend built with NestJS, Prisma, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.development .env

# Start Supabase (requires Docker)
npx supabase start

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## 🌟 Features

- **JWT Authentication**: Secure user registration and login
- **Weight Management**: Complete CRUD for weight records with date constraints
- **Photo Management**: One photo per weight with multiple sizes (thumbnail, medium, full)
- **Goal System**: Hierarchical goal management with milestones
- **Data Validation**: Robust input validation using class-validator
- **Security**: Helmet, CORS, and Rate Limiting protection
- **Health Monitoring**: Comprehensive health checks for app dependencies
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Local Development**: Streamlined Supabase local setup

## 📖 API Documentation

Base URL: `http://localhost:3000`

### Authentication

#### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2025-07-28T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Health Checks

#### General Health
```bash
curl http://localhost:3000/health
```

#### Database Health
```bash
curl http://localhost:3000/health/database
```

#### Supabase Health
```bash
curl http://localhost:3000/health/supabase
```

### Weights Management

> 🔐 **All weight endpoints require authentication**. Include the JWT token in the Authorization header.

#### Create Weight Record
```bash
curl -X POST http://localhost:3000/weights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "weight": 75.5,
    "date": "2025-07-28",
    "notes": "Morning weight after breakfast"
  }'
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "weight": "75.5",
  "date": "2025-07-28T00:00:00.000Z",
  "notes": "Morning weight after breakfast",
  "createdAt": "2025-07-28T12:00:00.000Z",
  "updatedAt": "2025-07-28T12:00:00.000Z",
  "photos": []
}
```

#### Get All Weights
```bash
# Basic request
curl http://localhost:3000/weights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With pagination and date filters
curl "http://localhost:3000/weights?page=1&limit=10&startDate=2025-07-01&endDate=2025-07-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Weight by ID
```bash
curl http://localhost:3000/weights/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Weight Photo
```bash
curl http://localhost:3000/weights/1/photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "weightId": 1,
  "notes": "Progress photo",
  "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
  "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
  "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg",
  "createdAt": "2025-07-28T12:00:00.000Z",
  "updatedAt": "2025-07-28T12:00:00.000Z"
}
```

#### Update Weight
```bash
curl -X PATCH http://localhost:3000/weights/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "weight": 74.8,
    "notes": "Updated weight measurement"
  }'
```

#### Delete Weight
```bash
curl -X DELETE http://localhost:3000/weights/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Photos Management

#### Upload Photo
```bash
curl -X POST http://localhost:3000/photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/your/image.jpg" \
  -F "weightId=1" \
  -F "notes=Progress photo"
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "weightId": 1,
  "notes": "Progress photo",
  "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
  "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
  "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg",
  "createdAt": "2025-07-28T12:00:00.000Z",
  "updatedAt": "2025-07-28T12:00:00.000Z",
  "weight": {
    "id": 1,
    "weight": "75.5",
    "date": "2025-07-28T00:00:00.000Z"
  }
}
```

#### Get All Photos
```bash
# Get all user photos
curl http://localhost:3000/photos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by weight ID
curl "http://localhost:3000/photos?weightId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With pagination
curl "http://localhost:3000/photos?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Photo by ID
```bash
curl http://localhost:3000/photos/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Delete Photo
```bash
curl -X DELETE http://localhost:3000/photos/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Goals Management

#### Create Goal
```bash
curl -X POST http://localhost:3000/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetWeight": 70.0,
    "targetDate": "2025-12-31",
    "type": "main"
  }'
```

#### Get All Goals
```bash
curl http://localhost:3000/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Goal by ID
```bash
curl http://localhost:3000/goals/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Goal
```bash
curl -X PATCH http://localhost:3000/goals/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetWeight": 68.0,
    "targetDate": "2025-11-30"
  }'
```

#### Delete Goal
```bash
curl -X DELETE http://localhost:3000/goals/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **File Storage**: [Supabase Storage](https://supabase.com/storage)
- **Authentication**: [JWT](https://jwt.io/)
- **Validation**: [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer)
- **Security**: [Helmet](https://helmetjs.github.io/), [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), [Throttler](https://docs.nestjs.com/security/rate-limiting)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)

## 🛠️ Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Supabase (Local Development)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=peso-tracker-photos

# JWT
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
JWT_EXPIRES_IN=24h

# Security
BCRYPT_SALT_ROUNDS=10

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_TTL=300
RATE_LIMIT_LIMIT=1000
```

## 📊 Database Schema

### Users
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `createdAt`, `updatedAt`: Timestamps

### Weights
- `id`: Primary key
- `userId`: Foreign key to Users
- `weight`: Decimal weight value
- `date`: Date of measurement (unique per user)
- `notes`: Optional notes
- `createdAt`, `updatedAt`: Timestamps

### Photos
- `id`: Primary key
- `userId`: Foreign key to Users
- `weightId`: Foreign key to Weights (unique - one photo per weight)
- `notes`: Optional notes
- `thumbnailUrl`, `mediumUrl`, `fullUrl`: Image URLs
- `createdAt`, `updatedAt`: Timestamps

### Goals
- `id`: Primary key
- `userId`: Foreign key to Users
- `targetWeight`: Target weight
- `targetDate`: Target date
- `type`: Goal type (main, milestone)
- `isAutoGenerated`: Boolean flag
- `parentGoalId`: Self-referencing for goal hierarchy
- `milestoneNumber`: Milestone order
- `createdAt`, `updatedAt`: Timestamps

## 🔧 Key Features

### Photo Management
- **One photo per weight**: Database constraint ensures data integrity
- **Multiple sizes**: Automatic generation of thumbnail, medium, and full-size images
- **Supabase Storage**: Secure cloud storage with public URLs
- **Direct weight access**: Get photo directly via weight ID

### Weight Tracking
- **Date uniqueness**: One weight record per date per user
- **Photo integration**: Seamless photo association
- **Pagination**: Efficient data retrieval with pagination
- **Date filtering**: Query weights by date range

### Authentication & Security
- **JWT tokens**: Secure authentication with configurable expiration
- **Route protection**: All user data endpoints require authentication
- **User isolation**: Users can only access their own data
- **Password hashing**: Bcrypt for secure password storage

### Goal System
- **Hierarchical goals**: Support for main goals and milestones
- **Auto-generation**: System can create milestone goals
- **Flexible targeting**: Date and weight-based goals

## 🚨 Important Notes

### Photo Constraints
- Only **one photo per weight record** is allowed
- Attempting to upload multiple photos will return a 400 error
- Delete existing photo before uploading a new one

### Storage Setup
Before using photo functionality, ensure the Supabase storage bucket exists:

1. Open Supabase Dashboard: `http://127.0.0.1:54323`
2. Go to Storage > Create bucket
3. Name: `peso-tracker-photos`
4. Mark as **Public bucket**
5. Save

### Date Constraints
- Only **one weight record per date per user**
- Dates should be in ISO format: `YYYY-MM-DD`
- Attempting duplicate dates will return a 409 error

## 🌐 Development URLs

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api
- **Supabase Studio**: http://127.0.0.1:54323
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

## 🔍 Testing

The project includes Bruno API tests in `/api-tests/` directory for comprehensive endpoint testing.

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 📝 Development

```bash
# Install dependencies
npm install

# Start development with hot reload
npm run start:dev

# Build for production
npm run build

# Run production
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

## 🤝 Contributing

1. Follow existing code patterns and conventions
2. Use the existing DTOs and validation rules
3. Maintain the one-photo-per-weight constraint
4. Update documentation for new endpoints
5. Add appropriate error handling and validation

## 📄 License

This project is licensed under the [MIT License](LICENSE).
