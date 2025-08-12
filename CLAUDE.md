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