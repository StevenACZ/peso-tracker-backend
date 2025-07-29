# Peso Tracker Backend - Claude Context

## Stack & Architecture
- **NestJS** + **Prisma** + **Supabase** (PostgreSQL + Storage)
- **JWT Auth** + **class-validator** + **Sharp** (image processing)
- **One DB constraint:** One weight per date per user, one photo per weight

## Quick Command Reference
```bash
npm run go              # Start everything (daily use)
npm run go:reset        # Fresh start with clean DB
npm run dev:reset       # Only reset DB
npm run lint            # Must run before commits
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
```

## Endpoint Quick Reference

**Auth (Public):** `POST /auth/{register,login}`
**Health (Public):** `GET /health/{,database,supabase}`
**Weights (Protected):** `POST,GET,PATCH,DELETE /weights` + `/weights/{chart-data,paginated,progress,:id,:id/photo}`
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
  const photoUrls = await this.storage.uploadPhoto(file, userId, weightId);
  // Returns: { thumbnailUrl, mediumUrl, fullUrl }
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
- **Path:** `{userId}/{weightId}/{timestamp}_{size}.{ext}`
- **Constraint:** One photo per weight (DB level)
- **Cleanup:** Deletes old files when weight deleted/updated

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
- **Supabase Studio:** http://127.0.0.1:54323
- **DB Connection:** postgresql://postgres:postgres@127.0.0.1:54322/postgres

## Quick Fixes for Common Issues

### Database Connection Failed
```bash
npx supabase status  # Check if running
npx supabase start   # If not running
npm run dev:reset    # If DB corrupted
```

### Photo Upload Fails
```bash
# Check bucket exists at http://127.0.0.1:54323
# Create 'peso-tracker-photos' bucket (public)
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
- **Bucket:** `peso-tracker-photos` (public)
- **Max size:** 5MB
- **Types:** JPEG, PNG, WebP
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
- All endpoints use `@UseGuards(JwtAuthGuard)` except auth/health
- Always verify `userId` ownership in services
- File uploads: type and size validation in StorageService
- No credentials in code - use env vars




---

**Remember:** This API follows standard REST patterns with JWT auth. User isolation is critical - always filter by `userId`. Photos are handled automatically by StorageService. Check Bruno tests for examples.