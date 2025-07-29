# Peso Tracker API

A comprehensive weight tracking application backend built with NestJS, Prisma, and Supabase.

## 🚀 Quick Start

### Option 1: Fast Setup (Recommended)
```bash
# Install dependencies
npm install

# Start everything with one command (recommended for daily use)
npm run go                    # Starts Supabase + applies schema + starts dev server
```

### Option 2: Clean Start (When you need fresh data)
```bash
# Install dependencies
npm install

# Start with database reset (clean slate)
npm run go:reset             # Stops all + starts + resets DB + starts dev server
```

### Option 3: Manual Setup
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

### Development Commands

| Command | Description | When to use |
|---------|-------------|-------------|
| `npm run go` | Quick start (preserves data) | Daily development |
| `npm run go:reset` | Clean start with DB reset | New schema, fresh start |
| `npm run dev:reset` | Reset database only | Clear data, keep services |
| `npm run restart` | Restart all services | After system changes |

## 🌟 Features

- **JWT Authentication**: Secure user registration and login
- **Weight Management**: Complete CRUD for weight records with date constraints
- **📊 Temporal Pagination**: Advanced time-based navigation for charts
- **📋 Table Pagination**: Traditional record-based pagination for data tables
- **📸 Visual Progress Tracking**: Dedicated endpoint for weights with photos (NEW)
- **Photo Management**: One photo per weight with multiple sizes (consolidated into weights)
- **🎯 Dashboard Analytics**: Overview and statistics endpoints
- **Goal System**: Simplified goal management system
- **Data Validation**: Robust input validation using class-validator
- **Security**: Helmet, CORS, and Rate Limiting protection
- **Health Monitoring**: Comprehensive health checks for app dependencies
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Local Development**: Streamlined Supabase local setup

## 📖 API Documentation

Base URL: `http://localhost:3000`

### 📋 Quick Reference

| Endpoint              | Method   | Description                           | Auth Required |
| --------------------- | -------- | ------------------------------------- | ------------- |
| `/auth/register`      | POST     | Register new user                     | ❌            |
| `/auth/login`         | POST     | User login                            | ❌            |
| `/health`             | GET      | General health check                  | ❌            |
| `/weights`            | POST     | Create weight record                  | ✅            |
| `/weights/chart-data` | GET      | Chart data with temporal pagination   | ✅            |
| `/weights/paginated`  | GET      | Table data with record pagination     | ✅            |
| `/weights/progress`   | GET      | Visual progress (weights with photos) | ✅            |
| `/weights/:id`        | GET      | Get specific weight                   | ✅            |
| `/weights/:id`        | PATCH    | Update weight                         | ✅            |
| `/weights/:id`        | DELETE   | Delete weight                         | ✅            |
| `/goals`              | GET/POST | Manage goals                          | ✅            |
| `/dashboard/stats`    | GET      | Dashboard statistics                  | ✅            |

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

#### Create Weight Record (with optional photo)

```bash
# With photo
curl -X POST http://localhost:3000/weights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "weight=75.5" \
  -F "date=2025-07-28" \
  -F "notes=Morning weight after breakfast" \
  -F "photo=@/path/to/your/image.jpg" \
  -F "photoNotes=Progress photo"

# Without photo
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
  "photo": {
    "id": 1,
    "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
    "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
    "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg"
  }
}
```

#### 📊 Get Chart Data (NEW - Temporal Pagination)

Navigate through complete time periods for chart visualization:

```bash
# Current month
curl "http://localhost:3000/weights/chart-data?timeRange=1month&page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Previous month
curl "http://localhost:3000/weights/chart-data?timeRange=1month&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Current year
curl "http://localhost:3000/weights/chart-data?timeRange=1year&page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Parameters:**

- `timeRange`: `1week`, `1month`, `3months`, `6months`, `1year`
- `page`: Period index (0 = most recent, 1 = previous, etc.)

**Response:**

```json
{
  "data": [{ "weight": 72.5, "date": "2024-01-15T00:00:00.000Z" }],
  "pagination": {
    "currentPeriod": "Enero 2025",
    "hasNext": true,
    "hasPrevious": true,
    "totalPeriods": 25,
    "currentPage": 5
  }
}
```

#### 📋 Get Paginated Data (NEW - Table Pagination)

Traditional record-based pagination for table views:

```bash
# First page, 5 records
curl "http://localhost:3000/weights/paginated?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Second page, 10 records
curl "http://localhost:3000/weights/paginated?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "weight": 72.5,
      "date": "2024-01-15T00:00:00.000Z",
      "notes": "Morning weight",
      "hasPhoto": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

#### 📸 Get Weight Progress (NEW - Visual Progress)

Get all weight records that have photos for visual progress tracking:

```bash
curl http://localhost:3000/weights/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**

```json
[
  {
    "id": 1,
    "weight": 72.5,
    "date": "2024-01-15T00:00:00.000Z",
    "notes": "Starting weight",
    "photo": {
      "id": 1,
      "userId": 1,
      "weightId": 1,
      "notes": "Progress photo",
      "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/thumbnail.jpg",
      "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/medium.jpg",
      "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/full.jpg",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
]
```

**Features:**

- Only returns weights with associated photos
- Ordered chronologically from oldest to newest
- Perfect for creating visual progress galleries
- Includes complete photo information with all sizes

#### Get All Weights (Legacy endpoint)

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

### 🎯 Dashboard Analytics (NEW)

Get aggregated data and statistics:

#### Get Dashboard Statistics

```bash
curl http://localhost:3000/dashboard/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Dashboard Overview

```bash
curl http://localhost:3000/dashboard/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Photos Management (Consolidated)

> 📝 **Note**: Photo management has been consolidated into the weights module. Photos are now managed through weight endpoints with a one-photo-per-weight constraint.

- **Upload photos**: Use the weight creation/update endpoints with photo form data
- **Get photos**: Access photos through weight endpoints (`/weights/:id/photo`)
- **Delete photos**: Photos are deleted when their associated weight is deleted

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

### ⏰ Temporal Pagination

- **Chart Data**: Uses 0-based page indexing (0 = most recent period)
- **Table Data**: Uses 1-based page indexing (1 = first page)
- **Period Navigation**: `hasNext`/`hasPrevious` indicate available periods
- **Period Labels**: Human-readable period descriptions in Spanish

### 📸 Visual Progress Tracking

- **Progress Endpoint**: `/weights/progress` returns only weights with photos
- **Chronological Order**: Results ordered from oldest to newest for progress visualization
- **Complete Photo Data**: Includes all photo sizes and metadata
- **Perfect for Galleries**: Ideal for creating before/after photo galleries

### Photo Constraints

- Only **one photo per weight record** is allowed (database constraint)
- Photos are now managed through weight endpoints (consolidated)
- Uploading to existing weight replaces the previous photo
- Photos support three sizes: thumbnail (150x150), medium (400x400), full (800x800)

### Storage Setup

Before using photo functionality, ensure the Supabase storage bucket exists:

1. Open Supabase Dashboard: `http://127.0.0.1:54323`
2. Go to Storage > Create bucket
3. Name: `peso-tracker-photos`
4. Mark as **Public bucket**
5. Save

### Date Constraints

- Only **one weight record per date per user** (database constraint)
- Dates should be in ISO format: `YYYY-MM-DD`
- Attempting duplicate dates will return a 409 error

### API Changes

- **Photos module removed**: Functionality moved to weights module
- **Dashboard module added**: New analytics endpoints
- **Progress endpoint added**: New `/weights/progress` for visual tracking
- **Enhanced validation**: Better error handling and type safety

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
