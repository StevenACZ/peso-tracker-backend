# Deployment Guide

## Environment Variables

Make sure to set the following environment variables in your deployment platform:

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection string (for migrations)
- `JWT_SECRET`: Secret key for JWT tokens
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

### Optional Variables
- `PORT`: Port number (default: 3000)
- `NODE_ENV`: Environment (default: development)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 24h)
- `BCRYPT_SALT_ROUNDS`: Bcrypt salt rounds (default: 12)
- `SUPABASE_STORAGE_BUCKET`: Storage bucket name (default: peso-tracker-photos)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `RATE_LIMIT_TTL`: Rate limit time window in seconds (default: 60)
- `RATE_LIMIT_LIMIT`: Rate limit max requests (default: 100)

## Deployment on Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following build and start commands:
   - Build Command: `npm install && npm run deploy:build`
   - Start Command: `npm run deploy:start`
4. Set all required environment variables
5. Deploy

## Docker Deployment

### Build the image:
```bash
docker build -t peso-tracker-backend .
```

### Run the container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e DIRECT_URL="your-direct-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e SUPABASE_URL="your-supabase-url" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  peso-tracker-backend
```

## Health Check

The application provides a health check endpoint at `/api/health` that verifies:
- Database connectivity
- Supabase connectivity
- Application status

## Database Migrations

Migrations are automatically run on deployment using the `deploy:start` script.

For manual migration:
```bash
npm run db:migrate
```

## API Documentation

The API is available at `/api` with the following main endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Weights
- `GET /api/weights` - Get user weights
- `POST /api/weights` - Create weight record
- `GET /api/weights/:id` - Get specific weight
- `PATCH /api/weights/:id` - Update weight
- `DELETE /api/weights/:id` - Delete weight

### Goals
- `GET /api/goals` - Get user goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get specific goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Photos
- `POST /api/photos/upload` - Upload photo
- `GET /api/photos` - Get user photos
- `GET /api/photos/:id` - Get specific photo
- `DELETE /api/photos/:id` - Delete photo

### Health
- `GET /api/health` - Application health check
- `GET /api/health/database` - Database health check
- `GET /api/health/supabase` - Supabase health check