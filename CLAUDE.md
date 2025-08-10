# Peso Tracker Backend - Claude Context

## 🎉 MIGRACIÓN COMPLETADA (Enero 2025)
**De Supabase a VPS Independiente - 100% Exitosa**

### ✅ Cambios Implementados
- **📦 Supabase Eliminado Completamente**: Sin dependencias externas
- **⚡ VPS Multi-Servicio Optimizado**: PostgreSQL compartida + storage local  
- **🔥 Performance Ultra-Rápido**: <50ms DB + acceso instantáneo a archivos
- **💰 Cero Costos Externos**: Sin servicios de terceros
- **🛡️ Control Total**: Infraestructura 100% bajo tu control

## Stack & Architecture (NUEVA)
- **NestJS** + **Prisma** + **PostgreSQL** (VPS local database)
- **Local File Storage** + **JWT Signed URLs** + **class-validator** + **Sharp** (image processing)
- **JWT-Secured Images:** URLs firmadas con expiración de 1 hora para máxima seguridad
- **VPS Multi-Service:** Optimized for sharing PostgreSQL across multiple apps
- **Cloudflare Tunnels Ready:** Preparado para acceso externo seguro
- **One DB constraint:** One weight per date per user, one photo per weight

## Quick Command Reference - SÚPER SIMPLE 🐳
```bash
# TODO EN DOCKER - Solo necesitas Docker Desktop
npm run dev:start       # Desarrollo diario (PostgreSQL + API)
npm run dev:reset       # Reset completo DB + rebuild
npm run dev:logs        # Ver logs en tiempo real
npm run dev:stop        # Parar todo

# Producción VPS
npm run prod:start      # Deploy completo
npm run prod:reset      # Deploy con DB reset
npm run lint            # Code quality check
```

## 🚀 Nuevo Flujo: Solo Docker
```bash
# 1. EMPEZAR (Solo la primera vez o cuando necesites reset)
npm run dev:start       # TODO corre en Docker automáticamente

# 2. DESARROLLAR
# Editar archivos .ts → Hot reload automático en Docker
# Ver cambios en: http://localhost:3000

# 3. DEBUG (Si algo no funciona)
npm run dev:logs        # Ver qué está pasando

# 4. TERMINAR
npm run dev:stop        # Al final del día

# 5. RESET (Solo si DB corrupta o cambios de schema)
npm run dev:reset       # Borra todo y reconstruye
```

## ⚡ Performance Optimizations (VPS Production)

**VPS Multi-Service Optimizations:**
- **Database response:** **<50ms** with local PostgreSQL
- **Connection pooling:** 8 connections (production), 5 (development)
- **Memory management:** Configurable limits based on VPS resources
- **Local file storage:** Instant access, no external API latencies
- **Compression:** gzip responses >1KB for faster data transfer

### Docker Optimizations
```dockerfile
# Memory optimization for VPS deployment
ENV NODE_OPTIONS="--max-old-space-size=512"

# Database connection pooling in PrismaService (VPS-optimized)
connection_limit=8, pool_timeout=5s, connect_timeout=15s
SSL conditional (not required for internal PostgreSQL)
```

**VPS Multi-Service Benefits:**
- **Shared PostgreSQL:** Multiple apps use same database instance
- **Local storage:** No external storage service costs or latency
- **Resource control:** Full control over scaling and memory allocation
- **Cloudflare Tunnels ready:** Optimized for secure external access

**Result:** Ultra-fast responses with complete infrastructure control 🚀

## 📧 Email System (Resend + Templates)

### ✅ Password Recovery Implementation
- **Service:** Resend API para delivery profesional de emails
- **Templates:** HTML template con brand colors (#34c956)  
- **Security:** 6-digit codes, 15min expiration, 3 max attempts
- **JWT Flow:** verify-reset-code → 5min JWT token → reset-password
- **Responsive:** Template optimizado para mobile y desktop

### Email Service Configuration
```typescript
// EmailService setup
constructor(private readonly resend: Resend) {}

async sendPasswordResetCode(email: string, username: string, code: string) {
  await this.resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: email,
    subject: 'Código de Recuperación - Peso Tracker',
    html: this.generatePasswordResetTemplate(username, code)
  });
}
```

### Template Features
- **Brand Colors:** Peso Tracker green (#34c956) gradients
- **Responsive:** Mobile-first design with media queries
- **Security Warnings:** Clear instructions and security notices  
- **Professional:** Clean typography and modern styling
- **Location:** `src/email/templates/reset-password-code.html`

### Environment Variables Required
```bash
RESEND_API_KEY=re_your_api_key_from_resend_com
FROM_EMAIL=noreply@yourdomain.com  # Verify domain in Resend
FROM_NAME=Peso Tracker
```

### Security Implementation
```typescript
// Password reset flow
async forgotPassword(email) {
  // 1. Invalidate existing codes
  // 2. Generate 6-digit code  
  // 3. Save with 15min expiration
  // 4. Send email (always success response)
}

async verifyResetCode(email, code) {
  // 1. Find valid code (not used, not expired, <3 attempts)
  // 2. Generate 5min JWT token for reset
  // 3. Return token for final step
}

async resetPassword(token, newPassword) {
  // 1. Verify JWT token
  // 2. Mark original code as used
  // 3. Update user password
}
```

## Endpoint Implementation Templates

### Standard Controller Pattern
```typescript
@ApiTags('ModuleName')
@ApiBearerAuth()
@Controller('endpoint')
@UseGuards(JwtAuthGuard)
export class ModuleController {
  constructor(private readonly service: ModuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create resource' })
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateDto) {
    return this.service.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.service.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update resource' })
  update(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }, @Body() dto: UpdateDto) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete resource' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.service.remove(id, user.id);
  }
}
```

### Standard Service Pattern
```typescript
@Injectable()
export class ModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateDto) {
    return this.prisma.model.create({
      data: { userId, ...dto }
    });
  }

  async findOne(id: number, userId: number) {
    const record = await this.prisma.model.findFirst({
      where: { id, userId }
    });
    if (!record) throw new NotFoundException('Resource not found');
    return record;
  }

  async update(id: number, userId: number, dto: UpdateDto) {
    await this.findOne(id, userId); // Verify ownership
    return this.prisma.model.update({
      where: { id },
      data: dto
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Verify ownership
    return this.prisma.model.delete({ where: { id } });
  }
}
```

### Standard DTO Pattern
```typescript
export class CreateModuleDto {
  @ApiProperty({ example: 'value', description: 'Field description' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  field: string;

  @ApiPropertyOptional({ example: 'optional value' })
  @IsOptional()
  @IsString()
  optionalField?: string;
}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
```

## Critical Database Constraints

- **Weight:** `@@unique([userId, date])` - One weight per date per user
- **Photo:** `weightId Int @unique` - One photo per weight
- **Goal:** Simple model, one active goal per user

## Current Schema (Key Fields Only)
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
  thumbnailUrl String // 150x150px
  mediumUrl    String // 400x400px  
  fullUrl      String // 800x800px
}

model Goal {
  id           Int      @id @default(autoincrement())
  userId       Int
  targetWeight Decimal  @db.Decimal(5, 2)
  targetDate   DateTime @db.Date
}

model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  code      String   @unique  // 6-digit code
  expiresAt DateTime             // 15 minutes expiration
  attempts  Int      @default(0) // Max 3 attempts
  used      Boolean  @default(false)
}
```

## Endpoint Quick Reference

**Auth (Public):** `POST /auth/{register,login,check-availability,forgot-password,verify-reset-code,reset-password}`
**Health (Public):** `GET /health/{,database,storage}`
**Weights (Protected):** `POST,GET,PATCH,DELETE /weights` + `/weights/{chart-data,paginated,progress,:id,:id/photo}`
**Photos (Public):** `GET /photos/secure/:token` (JWT-signed URLs, 1h expiration)
**Goals (Protected):** Standard CRUD `/goals`
**Dashboard (Protected):** `GET /dashboard`

## File Upload Pattern (Weights Only)
```typescript
@UseInterceptors(FileInterceptor('photo'))
@ApiConsumes('multipart/form-data')
create(
  @CurrentUser() user: { id: number },
  @Body() dto: CreateWeightDto,
  @UploadedFile() file?: Express.Multer.File,
) {
  return this.service.create(user.id, dto, file);
}
```

**Storage Service Usage:**
```typescript
// In service
constructor(
  private readonly prisma: PrismaService,
  private readonly storage: StorageService,
) {}

if (file) {
  const photoUrls = await this.storage.uploadImage(file, userId, weightId);
  // Returns: { thumbnailUrl, mediumUrl, fullUrl } - Raw filesystem paths stored in DB
}

// For existing photos from DB, generate JWT-signed secure URLs
const photoUrls = this.storage.getSignedUrlsForPhoto({
  thumbnailUrl: photo.thumbnailUrl,
  mediumUrl: photo.mediumUrl, 
  fullUrl: photo.fullUrl,
}, userId);
// Returns JWT-signed URLs with 1-hour expiration: /photos/secure/eyJhbGciOiJIUzI1NiIs...
```

**PhotosController for Secure Access:**
```typescript
@Get('secure/:token')
async getSecurePhoto(@Param('token') token: string, @Res() res: Response) {
  const payload = this.jwtService.verify<SecurePhotoPayload>(token);
  // Validates token, checks expiration, serves image from filesystem
  // Supports: 150px, 400px, 800px sizes with proper MIME types
}
```

## Business Logic Patterns

### Smart Pagination (Chart Data)
- **Chart endpoint:** Only returns periods with ≥2 data points
- **Table endpoint:** Traditional page/limit pagination
- **timeRange:** `all|1month|3months|6months|1year`
- **Key feature:** No empty periods in chart navigation

### Error Handling Standards
```typescript
// Standard patterns:
throw new NotFoundException('Resource not found');
throw new BadRequestException('Invalid input');
throw new ConflictException('Duplicate entry');
throw new ForbiddenException('Access denied');
```

### Validation Patterns
```typescript
// Weight validation
@IsNumber({ maxDecimalPlaces: 2 })
@Min(1)
@Max(999.99)
weight: number;

// Date validation
@IsDateString()
@IsNotEmpty()
date: string;

// File validation (handled by multer + storage service)
```

### Photo Processing (StorageService)
- **Auto-sizes:** 150px, 400px, 800px (thumbnail, medium, full)
- **Path:** `uploads/{userId}/{weightId}/{timestamp}_{size}.{ext}`
- **Constraint:** One photo per weight (DB level)
- **Cleanup:** Deletes old files when weight deleted/updated
- **URLs:** Direct filesystem URLs served via Express static middleware
- **Security:** File validation (MIME type, size), user isolation via folder structure
- **Performance:** Instant access, no external API calls

## Adding New Endpoints - Step by Step

### 1. Create DTO (src/module/dto/)
```typescript
export class CreateExampleDto {
  @ApiProperty({ example: 'value', description: 'Clear description' })
  @IsString()
  @IsNotEmpty()
  field: string;
}
```

### 2. Add Controller Method
```typescript
@Post()
@ApiOperation({ summary: 'Create example' })
@ApiResponse({ status: 201, description: 'Created successfully.' })
@ApiResponse({ status: 400, description: 'Invalid input.' })
create(@CurrentUser() user: { id: number }, @Body() dto: CreateExampleDto) {
  return this.service.create(user.id, dto);
}
```

### 3. Implement Service Logic
```typescript
async create(userId: number, dto: CreateExampleDto) {
  // Business validation if needed
  return this.prisma.example.create({
    data: { userId, ...dto }
  });
}
```

### 4. Test in Bruno (api-tests/)
- Create new request
- Test success and error cases
- Update environment variables if needed

## Common Patterns Reference

### Pagination Implementation
```typescript
// Standard pagination
async findPaginated(userId: number, page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.prisma.model.findMany({ where: { userId }, skip, take: limit }),
    this.prisma.model.count({ where: { userId } })
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
```

### User Ownership Verification
```typescript
// Always verify ownership for protected resources
async findOne(id: number, userId: number) {
  const record = await this.prisma.model.findFirst({ where: { id, userId } });
  if (!record) throw new NotFoundException('Resource not found');
  return record;
}
```

## Module Structure (When Adding New Module)
```
src/new-module/
├── dto/
│   ├── create-new.dto.ts
│   ├── update-new.dto.ts    
│   └── query-new.dto.ts     # For GET params
├── new-module.controller.ts
├── new-module.service.ts
└── new-module.module.ts
```

## Key Services to Inject
```typescript
constructor(
  private readonly prisma: PrismaService,        // Always needed
  private readonly storage: StorageService,       // For file uploads
) {}
```

## Testing New Endpoints
1. Add request to `/api-tests/` in Bruno
2. Test auth endpoints first to get token
3. Test success cases, then error cases
4. Check Swagger: `http://localhost:3000/api`

## Important URLs
- **API:** http://localhost:3000
- **Swagger:** http://localhost:3000/api
- **File Uploads:** http://localhost:3000/uploads/
- **DB Connection:** postgresql://postgres:postgres@localhost:5432/peso_tracker

## Quick Fixes for Common Issues

### Database Connection Failed
```bash
docker ps                     # Check if PostgreSQL is running  
docker-compose up -d postgres # Start PostgreSQL
npm run dev:reset            # If DB corrupted
```

### Photo Upload Fails
```bash
# Check uploads directory exists and is writable
ls -la uploads/
chmod 755 uploads/
mkdir -p uploads/
```

### JWT Token Invalid
```bash
# Login again to get new token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Duplicate Date Error (409)
```bash
# Use PATCH instead of POST to update existing weight
# Or change the date in your request
```

## Storage Requirements
- **Directory:** `./uploads/` (local filesystem)
- **Max size:** 5MB (configurable via MAX_FILE_SIZE)
- **Types:** JPEG, PNG, WebP (validated via MIME type)
- **Auto-generated:** 3 sizes (150px, 400px, 800px)

## Before Committing Changes
1. `npm run lint` - Must pass
2. Test endpoints in Bruno
3. Check Swagger docs updated
4. Verify no credentials exposed

## Performance Notes
- Always use `userId` in queries for user isolation
- Pagination required for lists (max 50 items)
- Photos auto-deleted when weight deleted

## Security Checklist
- All endpoints use `@UseGuards(JwtAuthGuard)` except auth/health/photos
- Always verify `userId` ownership in services
- File uploads: type and size validation in StorageService
- **Photo access:** JWT-signed URLs with 1-hour expiration for maximum security
- **No direct file access:** All photos served through secure token validation
- No credentials in code - use env vars




## 🎯 Migración Summary - Lo Que Cambió

### ❌ ELIMINADO (Supabase Dependencies)
- `@supabase/supabase-js` dependency
- `supabase` CLI tool
- `/health/supabase` endpoint  
- Supabase config variables
- `supabase/` directory

### ✅ AGREGADO (VPS Optimizations + JWT Security)
- `/health/storage` endpoint (filesystem check)
- **JWT-Signed URLs:** Secure photo access with 1-hour expiration
- **PhotosController:** Dedicated endpoint for secure image serving
- ConfigService integration (no more process.env)
- VPS-optimized connection pooling (8 prod, 5 dev)
- Local file storage with MIME validation
- Shared interfaces for better TypeScript
- VPS deployment configurations

### 🔄 ACTUALIZADO (Performance & Architecture)
- **Database:** Supabase → Local PostgreSQL
- **Storage:** Supabase Storage → Local Filesystem + JWT Security
- **Photo URLs:** Public URLs → JWT-signed secure URLs (1h expiration)
- **Health Checks:** Supabase → Storage filesystem
- **Connection Pool:** 3 → 8 (production)
- **Response Time:** 879ms → <50ms
- **Dependencies:** 659 → 638 packages (-21)

---

**Remember:** This API is now 100% independent, optimized for VPS multi-service deployment. User isolation critical - always filter by `userId`. Photos stored locally with **JWT-secured access** and instant performance. Ready for Cloudflare Tunnels. Check Bruno tests for examples.

## 🛡️ JWT-Signed URLs Architecture (NUEVA FEATURE)

### ✨ Características de Seguridad
- **URLs Temporales:** Expiran automáticamente en 1 hora (3600s)
- **Token JWT:** Incluye `userId`, `path`, y `exp` para validación completa
- **Sin exposición:** Rutas del filesystem nunca expuestas directamente
- **Compatible:** Funciona con cualquier frontend sin headers adicionales

### 🔧 Implementación Técnica
```typescript
// Generar URL firmada (StorageService)
generateSecurePhotoUrl(photoPath: string, userId: number): string {
  const payload = {
    path: cleanPath,
    userId: userId,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora
  };
  const token = jwt.sign(payload, JWT_SECRET);
  return `${BASE_URL}/photos/secure/${token}`;
}

// Servir imagen segura (PhotosController)
@Get('secure/:token')
async getSecurePhoto(@Param('token') token: string, @Res() res: Response) {
  const payload = this.jwtService.verify<SecurePhotoPayload>(token);
  // Validar expiración, verificar acceso, servir archivo
}
```

### 📊 URLs de Ejemplo
```
Antes: http://localhost:3000/uploads/1/1/image_thumbnail.jpg
Ahora: http://localhost:3000/photos/secure/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🎯 Beneficios de Seguridad
- ✅ **No hay acceso directo** a archivos del sistema
- ✅ **Expiración automática** previene acceso permanente
- ✅ **Validación de usuario** garantiza que solo el propietario accede
- ✅ **Compatible con frontends** sin complejidad adicional