# Peso Tracker Backend - Claude Context

## 🎯 **STACK ACTUAL (2025)**
- **NestJS + Prisma + PostgreSQL** (VPS local)
- **ImageProcessingService** → WebP universal format optimization
- **JWT-Secured Images** → 15min tokens, auto Cloudflare detection
- **Universal Format** → WebP images, mobile-first pagination

## ⚡ **COMANDOS ESENCIALES**
```bash
npm run dev:start     # Development (Docker)
npm run prod:start    # VPS deployment  
npm run lint          # Code quality
```

## 📱 **IMAGE OPTIMIZATIONS**
- **WebP universal format** → 70% smaller files, cross-platform
- **JWT tokens 15min** + 7-day refresh (vs 1h anterior)  
- **Mobile pagination** → Max 5 items (protege diseño app)
- **Photo proportions** → Real aspect ratios (no crop en medium/full)
- **Cloudflare headers** → Auto-detection, optimized caching

## 📱 **API CHANGES (BREAKING)**
```typescript
// AUTH: ANTES vs AHORA
// ANTES: { user, token }
// AHORA: { user, accessToken, refreshToken, expiresIn, tokenType }

// NEW ENDPOINT: POST /auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken, expiresIn }
```

## 🗃️ **DATABASE CONSTRAINTS**
- **Weight:** `@@unique([userId, date])` - One per date
- **Photo:** `weightId Int @unique` - One per weight  
- **Goal:** Simple model, one active goal per user

## 📊 **CURRENT SCHEMA**
```prisma
model Weight {
  id     Int     @id @default(autoincrement())
  userId Int
  weight Decimal @db.Decimal(5, 2)
  date   DateTime @db.Date
  notes  String?
  photos Photo?
  @@unique([userId, date])
}

model Photo {
  id           Int    @id @default(autoincrement())
  userId       Int
  weightId     Int    @unique
  thumbnailUrl String // 300x300 WebP (cuadrado)
  mediumUrl    String // 800px max WebP (proporción real)  
  fullUrl      String // 1600px max WebP (proporción real)
}
```

## 🛠️ **STANDARD PATTERNS**
```typescript
// Controller Pattern
@UseGuards(JwtAuthGuard)
@CurrentUser() user: { id: number }

// Service Pattern
async findOne(id: number, userId: number) {
  // Always verify ownership
}

// Error Handling
throw new NotFoundException('Resource not found');
```

## 🔗 **ENDPOINTS QUICK REF**
- **Auth:** `/auth/{register,login,refresh,forgot-password}` 
- **Weights:** `/weights` (CRUD + pagination + progress)
- **Photos:** `/photos/secure/:token` (JWT-signed, 15min expiry)
- **Health:** `/health/{,database,storage}`

## ⚙️ **IMPORTANT NOTES**
- **Pagination limit:** Always max 5 items (app design protection)
- **File storage:** Local filesystem, JWT-secured URLs
- **User isolation:** Critical - always filter by userId
- **Cloudflare ready:** Auto-detection via cf-ray headers

## 🏗️ **PRODUCTION INFRASTRUCTURE**

### **📡 Architecture Overview**
```
📱 Client App
    ↓ HTTPS requests
🌐 Cloudflare (CDN + Security)
    ↓ Cloudflare Tunnels
🖥️  VPS Server (Ubuntu/Debian)
    ↓ Port 80
🔧 Nginx (Reverse Proxy)
    ↓ Port 3001
🐳 Docker Container
    ↓ Internal
⚙️  Node.js App (NestJS + Prisma)
    ↓ Local connection
🗄️  PostgreSQL Database
```

### **🔧 Critical Nginx Configuration**
```nginx
# REQUIRED for image uploads (iPhone photos 2.3MB+)
client_max_body_size 50M;
proxy_request_buffering off;  # CRITICAL: prevents buffering
proxy_read_timeout 300s;     # For Sharp image processing
proxy_send_timeout 300s;
proxy_connect_timeout 60s;

# API endpoint with upload support
location /peso-tracker/v1/ {
    limit_req zone=api burst=30 nodelay;  # Permissive for uploads
    rewrite ^/peso-tracker/v1/(.*)$ /$1 break;
    proxy_pass http://127.0.0.1:3001;
    # ... headers
}
```

### **🐳 Docker Configuration**
```dockerfile
# Memory optimization for high-res image processing
ENV NODE_OPTIONS="--max-old-space-size=1024"  # 1GB for Sharp

# Required for uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads
```

### **☁️ Cloudflare Tunnels Setup**
```yaml
# ~/.cloudflared/config.yml
tunnel: tunnel-name
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: api.domain.com
    service: http://localhost:80  # → Nginx → Docker
    originRequest:
      httpHostHeader: api.domain.com
```

### **🚨 Troubleshooting Guide**

#### **502 Bad Gateway - Image Uploads**
**Symptoms:** Large iPhone photos fail with 502
**Root Cause:** Nginx upload limits + buffering
**Solution:**
```nginx
client_max_body_size 50M;
proxy_request_buffering off;  # ← Most important
proxy_read_timeout 300s;
```

#### **Out of Memory - Image Processing**
**Symptoms:** App crashes on large images
**Root Cause:** Sharp processing 12MP+ photos
**Solution:**
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=1024"
```
```typescript
// Pre-process images >3MP before Sharp processing
const isLargeImage = megapixels > 3 || buffer.length > 5242880;
```

#### **Upload Timeouts**
**Symptoms:** Request hangs then 504/502
**Root Cause:** Default timeouts too short
**Solution:** Increase all timeout layers
- Nginx: `proxy_read_timeout 300s`
- Node.js: `req.setTimeout(120000)`
- Cloudflare: Check tunnel timeout settings

### **📋 Deployment Checklist**

#### **VPS Prerequisites**
- [ ] Ubuntu/Debian with Docker + Docker Compose
- [ ] Nginx installed and configured
- [ ] Cloudflare Tunnels setup and running
- [ ] PostgreSQL accessible (local or remote)
- [ ] Domain DNS pointing to Cloudflare

#### **Application Setup**
- [ ] Environment variables configured (.env.vps)
- [ ] Database migrations applied
- [ ] Docker containers built and running
- [ ] Nginx config includes upload optimizations
- [ ] SSL/TLS working through Cloudflare

#### **Testing Validation**
- [ ] Small image upload works (< 1MB)
- [ ] Large iPhone photo upload works (2-3MB)
- [ ] API endpoints respond correctly
- [ ] Database operations successful
- [ ] Photos display correctly in app

### **⚡ Performance Optimizations**

#### **Image Processing**
- WebP universal format (70% smaller than JPEG)
- Pre-processing for images >3MP
- Memory monitoring and cleanup
- Parallel processing for multiple sizes

#### **Nginx Caching**
```nginx
# Static assets (photos served via JWT)
location /photos/ {
    proxy_cache_valid 200 15m;  # Short cache for security
    add_header X-Cache-Status $upstream_cache_status;
}
```

#### **Rate Limiting Strategy**
- API endpoints: 20r/s, burst=30
- Photo uploads: No rate limiting (handled by auth)
- Public assets: 5r/s, burst=10

### **🔒 Security Considerations**
- Photos served via JWT tokens (15min expiry)
- User isolation enforced at all levels
- CORS configured for specific origins
- Real IP detection through Cloudflare
- File type validation (JPEG, PNG, WebP only)
- Path traversal protection

---

## 📖 **API REFERENCE & DEVELOPMENT GUIDE**

### **🔗 Base URL**
```
Development: http://localhost:3000
Production:  https://api.stevenacz.com/peso-tracker/v1
```

### **🔐 Authentication**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Token Lifetimes:**
- **Access Token:** 24 hours
- **Refresh Token:** 7 days
- **Photo URLs:** 15 minutes (signed JWT)

---

## **📱 API ENDPOINTS**

### **🔑 Authentication**

#### **POST /auth/register**
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}

// Response (201)
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": false,
    "createdAt": "2025-01-12T10:30:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400,
  "tokenType": "Bearer"
}
```

#### **POST /auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response (200) - Same as register
```

#### **POST /auth/refresh**
```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response (200)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400
}
```

### **⚖️ Weight Management**

#### **POST /weights** (Create with Photo)
```http
POST /weights
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
  weight: "72.5"
  date: "2025-01-12"
  notes: "Morning weight"
  photo: <File> (optional, max 10MB)
```

```json
// Response (201)
{
  "id": 16,
  "userId": 2,
  "weight": "72.5",
  "date": "2025-01-12T00:00:00.000Z",
  "notes": "Morning weight",
  "createdAt": "2025-01-12T10:30:00Z",
  "updatedAt": "2025-01-12T10:30:00Z",
  "photo": {
    "id": 32,
    "userId": 2,
    "weightId": 16,
    "thumbnailUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN",
    "mediumUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN",
    "fullUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN",
    "createdAt": "2025-01-12T10:30:00Z",
    "updatedAt": "2025-01-12T10:30:00Z"
  }
}
```

#### **GET /weights** (Paginated List)
```http
GET /weights?page=1&limit=5&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

```json
// Response (200)
{
  "data": [
    {
      "id": 16,
      "userId": 2,
      "weight": "72.5",
      "date": "2025-01-12T00:00:00.000Z",
      "notes": "Morning weight",
      "createdAt": "2025-01-12T10:30:00Z",
      "updatedAt": "2025-01-12T10:30:00Z",
      "photo": {
        "id": 32,
        "thumbnailUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN",
        "mediumUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN",
        "fullUrl": "https://api.stevenacz.com/peso-tracker/v1/photos/secure/JWT_TOKEN"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### **GET /weights/:id** (Single Weight)
```json
// Response (200) - Same structure as POST response
```

#### **PATCH /weights/:id** (Update with Photo)
```http
PATCH /weights/16
Content-Type: multipart/form-data
Authorization: Bearer <token>

FormData:
  weight: "73.0" (optional)
  notes: "Updated notes" (optional)
  photo: <File> (optional, replaces existing)
```

#### **DELETE /weights/:id**
```json
// Response (200)
{
  "message": "Registro eliminado exitosamente"
}
```

### **📊 Analytics & Charts**

#### **GET /weights/chart-data**
```http
GET /weights/chart-data?period=3M&page=1&limit=50
Authorization: Bearer <token>
```

```json
// Response (200)
{
  "data": [
    {
      "id": 16,
      "weight": "72.5",
      "date": "2025-01-12T00:00:00.000Z"
    }
  ],
  "summary": {
    "currentWeight": "72.5",
    "previousWeight": "73.0",
    "difference": "-0.5",
    "trend": "down",
    "totalRecords": 25
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "hasNext": false
  }
}
```

#### **GET /weights/progress**
```json
// Response (200)
{
  "currentWeight": "72.5",
  "startWeight": "75.0",
  "goalWeight": "70.0",
  "totalLoss": "2.5",
  "remainingToGoal": "2.5",
  "progressPercentage": 50,
  "trend": "down",
  "lastWeekChange": "-0.3",
  "recordCount": 25
}
```

### **🏥 Health Checks**

#### **GET /health**
```json
// Response (200)
{
  "status": "ok",
  "timestamp": "2025-01-12T10:30:00Z",
  "uptime": 86400,
  "environment": "production",
  "version": "1.0.0"
}
```

---

## **🏗️ APPLICATION STRUCTURE**

### **📁 Directory Structure**
```
src/
├── auth/                 # Authentication & Authorization
│   ├── guards/          # JWT Guards, Role Guards
│   ├── strategies/      # Passport JWT Strategy
│   └── dto/            # Login, Register DTOs
├── weights/             # Core Weight Management
│   ├── dto/            # Create, Update, Query DTOs
│   └── weights.service.ts  # Business logic
├── photos/              # Secure Photo Serving
│   └── photos.controller.ts  # JWT-signed URL handling
├── storage/             # File Management
│   └── storage.service.ts    # Upload, JWT signing
├── image/               # Image Processing
│   └── image-processing.service.ts  # Sharp WebP conversion
├── prisma/              # Database Layer
├── config/              # Environment Configuration
└── common/              # Shared Utilities
    ├── decorators/      # @CurrentUser()
    ├── interfaces/      # Response types
    └── pipes/          # Validation pipes
```

### **🔄 Data Flow**

#### **Photo Upload Flow:**
```
1. Client POST → FormData with photo
2. Multer intercepts → Validates file (10MB, types)
3. ImageProcessingService → WebP conversion (3 sizes)
4. StorageService → Save to filesystem
5. Database → Store relative paths
6. Response → Signed URLs (15min expiry)
```

#### **Photo Access Flow:**
```
1. Client requests photo URL
2. JWT validation → User ownership
3. Path security check → No traversal
4. File system access → Serve image
5. Cache headers → Optimized delivery
```

---

## **⚙️ CONFIGURATION & LIMITS**

### **📊 File Limits**
- **Max File Size:** 10MB
- **Allowed Types:** JPEG, PNG, WebP (converted to WebP)
- **Image Sizes Generated:**
  - Thumbnail: 300x300px (square, for grids)
  - Medium: 800px max (preserves aspect ratio)
  - Full: 1600px max (preserves aspect ratio)

### **⏰ Timeouts & Expiry**
- **JWT Access Token:** 24 hours
- **JWT Refresh Token:** 7 days
- **Photo URLs:** 15 minutes (security)
- **Upload Timeout:** 2 minutes (large images)
- **API Rate Limit:** 20 req/sec, burst 30

### **🎯 Pagination**
- **Default Limit:** 5 items (mobile-optimized)
- **Max Limit:** 50 items
- **Weight History:** Date-based ordering (newest first)

### **🔒 Security Settings**
- **Password:** Min 8 chars, complexity required
- **CORS:** Configurable origins
- **Headers:** Cloudflare-optimized
- **Rate Limiting:** Per-IP, per-endpoint

---

## **📱 FRONTEND INTEGRATION GUIDE**

### **🔧 Required Headers**
```javascript
// All authenticated requests
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

// File uploads
const formData = new FormData();
formData.append('weight', '72.5');
formData.append('photo', fileBlob);

fetch('/weights', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }, // No Content-Type!
  body: formData
});
```

### **🔄 Token Management**
```javascript
// Token refresh pattern
async function refreshToken() {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (response.ok) {
    const { accessToken, refreshToken: newRefresh } = await response.json();
    // Update stored tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefresh);
    return accessToken;
  }
  
  // Redirect to login
  window.location.href = '/login';
}
```

### **📸 Photo URL Handling**
```javascript
// Photo URLs expire in 15 minutes
const PhotoComponent = ({ photoUrl }) => {
  const [currentUrl, setCurrentUrl] = useState(photoUrl);
  
  useEffect(() => {
    // Refresh URL every 10 minutes (before expiry)
    const interval = setInterval(async () => {
      // Re-fetch the weight to get new signed URLs
      const weight = await fetchWeight(weightId);
      setCurrentUrl(weight.photo.thumbnailUrl);
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return <img src={currentUrl} alt="Progress photo" />;
};
```

### **📱 Mobile Optimizations**
```javascript
// Pagination for mobile
const MOBILE_PAGE_SIZE = 5;

// Image quality selection
const getImageUrl = (photo, screenSize) => {
  if (screenSize === 'small') return photo.thumbnailUrl;
  if (screenSize === 'medium') return photo.mediumUrl;
  return photo.fullUrl;
};
```

---

## **🚀 DEPLOYMENT WORKFLOW**

### **🔄 Development Cycle**
1. **Code Changes** → Push to `latest-security-version`
2. **Local Testing** → `npm run dev:start`
3. **Build Verification** → `npm run build`
4. **VPS Deployment** → `npm run prod:start`
5. **Health Check** → `/health` endpoint

### **📦 Production Deployment**
```bash
# VPS Commands
git pull origin latest-security-version
npm run build
docker-compose down
docker-compose up -d --build
sudo systemctl reload nginx

# Verify deployment
curl https://api.stevenacz.com/peso-tracker/v1/health
```

### **🔍 Monitoring**
- **Health Endpoints:** `/health`, `/health/database`, `/health/storage`
- **Logs:** Docker logs + Nginx logs
- **Performance:** Memory usage, response times
- **Security:** Rate limiting, failed auth attempts

---

## **🛡️ SECURITY MODEL**

### **🔐 Authentication Flow**
1. **Register/Login** → JWT pair (access + refresh)
2. **API Requests** → Bearer token in Authorization header
3. **Token Expiry** → Auto-refresh via refresh token
4. **Logout** → Client discards tokens (stateless)

### **📸 Photo Security**
- **Upload:** Authenticated users only
- **Storage:** User-isolated directories
- **Access:** JWT-signed URLs with ownership validation
- **Expiry:** 15-minute automatic expiration
- **Validation:** Path traversal protection, MIME type checking

### **🚧 Rate Limiting**
```
API Endpoints: 20 req/sec, burst 30
Photo Access: No limit (handled by JWT expiry)
Public Assets: 5 req/sec, burst 10
```

### **🔒 Data Protection**
- **User Isolation:** All queries filtered by userId
- **Input Validation:** DTO validation on all endpoints
- **SQL Injection:** Prisma ORM protection
- **XSS Protection:** Content-Type validation
- **CSRF:** Stateless JWT (no cookies)