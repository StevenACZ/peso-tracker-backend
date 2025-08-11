# Peso Tracker Backend - Claude Context

## 🎯 **STACK ACTUAL (2025)**
- **NestJS + Prisma + PostgreSQL** (VPS local)
- **ImageProcessingService** → HEIF/WebP optimization for Apple apps
- **JWT-Secured Images** → 15min tokens, auto Cloudflare detection
- **Apple-Optimized** → Headers, formats, mobile-first pagination

## ⚡ **COMANDOS ESENCIALES**
```bash
npm run dev:start     # Development (Docker)
npm run prod:start    # VPS deployment  
npm run lint          # Code quality
```

## 🍎 **APPLE OPTIMIZATIONS (NUEVAS)**
- **HEIF/WebP images** → 70% smaller files
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
  thumbnailUrl String // 300x300 (cuadrado)
  mediumUrl    String // 800px max (proporción real)  
  fullUrl      String // 1600px max (proporción real)
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