# 🏋️ Peso Tracker API

> Una API completa de seguimiento de peso construida con NestJS, Prisma y Supabase que permite a los usuarios rastrear su progreso de peso con fotos, establecer metas y visualizar su progreso a través del tiempo.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

## 🌟 Características Principales

- **🔐 Autenticación Segura**: Sistema completo de registro/login con JWT
- **⚖️ Gestión de Peso**: CRUD completo con constraints de fecha únicos
- **📊 Paginación Temporal Inteligente**: Navegación avanzada por períodos para gráficos
- **📋 Paginación Tradicional**: Para vistas de tabla y listados
- **📸 Progreso Visual**: Fotos de progreso con múltiples tamaños automáticos
- **🎯 Sistema de Metas**: Gestión simple de objetivos de peso
- **📈 Dashboard Analítico**: Estadísticas y resúmenes de progreso
- **🛡️ Validación Robusta**: Validación completa con class-validator
- **🚦 Rate Limiting**: Protección contra abuso de API
- **🏥 Health Checks**: Monitoreo de estado de servicios
- **📖 Documentación Swagger**: API completamente documentada

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
- **Goal System**: Simple goal management (one goal per user)
- **Data Validation**: Robust input validation using class-validator
- **Security**: Helmet, CORS, and Rate Limiting protection
- **Health Monitoring**: Comprehensive health checks for app dependencies
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Local Development**: Streamlined Supabase local setup

## 📖 Documentación Completa de API

**Base URL:** `http://localhost:3000`  
**Swagger UI:** `http://localhost:3000/api`  
**Documentación Interactiva:** `http://localhost:3000/api/docs`

### 📋 Referencia Rápida de Endpoints

| Endpoint                    | Método | Descripción                               | Auth | Validación |
| --------------------------- | ------ | ----------------------------------------- | ---- | ---------- |
| **AUTENTICACIÓN**           |        |                                           |      |            |
| `/auth/register`            | POST   | Registrar nuevo usuario                   | ❌   | ✅         |
| `/auth/login`               | POST   | Iniciar sesión                            | ❌   | ✅         |
| **HEALTH CHECKS**           |        |                                           |      |            |
| `/health`                   | GET    | Estado general de la aplicación           | ❌   | -          |
| `/health/database`          | GET    | Estado de conexión a base de datos        | ❌   | -          |
| `/health/supabase`          | GET    | Estado de conexión a Supabase             | ❌   | -          |
| **GESTIÓN DE PESO**         |        |                                           |      |            |
| `/weights`                  | POST   | Crear registro de peso (+ foto opcional)  | ✅   | ✅         |
| `/weights/chart-data`       | GET    | Datos para gráficos (paginación temporal) | ✅   | ✅         |
| `/weights/paginated`        | GET    | Datos paginados para tablas               | ✅   | ✅         |
| `/weights/progress`         | GET    | Progreso visual (pesos con fotos)         | ✅   | -          |
| `/weights/:id`              | GET    | Obtener peso específico                   | ✅   | ✅         |
| `/weights/:id/photo`        | GET    | Obtener foto de peso específico           | ✅   | ✅         |
| `/weights/:id`              | PATCH  | Actualizar peso (+ foto opcional)         | ✅   | ✅         |
| `/weights/:id`              | DELETE | Eliminar peso                             | ✅   | ✅         |
| **METAS**                   |        |                                           |      |            |
| `/goals`                    | POST   | Crear nueva meta                          | ✅   | ✅         |
| `/goals/:id`                | GET    | Obtener meta por ID                       | ✅   | ✅         |
| `/goals/:id`                | PATCH  | Actualizar meta                           | ✅   | ✅         |
| `/goals/:id`                | DELETE | Eliminar meta                             | ✅   | ✅         |
| **DASHBOARD**               |        |                                           |      |            |
| `/dashboard`                | GET    | Dashboard con estadísticas completas      | ✅   | -          |

### 🔑 Autenticación

Todos los endpoints marcados con ✅ requieren autenticación JWT. Incluye el token en el header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Autenticación

### 📅 POST `/auth/register` - Registrar Usuario

**Descripción:** Crea una nueva cuenta de usuario y devuelve los datos del usuario junto con un token JWT.

**Validaciones:**
- `username`: 3-50 caracteres, único
- `email`: Formato de email válido, único
- `password`: Mínimo 6 caracteres, máximo 100

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response Exitoso (201):**
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

**Errores Posibles:**
- **400** - Datos de entrada inválidos (username muy corto, email inválido, etc.)
- **409** - Email o username ya existen

---

### 🔑 POST `/auth/login` - Iniciar Sesión

**Descripción:** Autentica a un usuario y devuelve sus datos junto con un token JWT.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Response Exitoso (200):**
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

**Errores Posibles:**
- **400** - Datos de entrada inválidos
- **401** - Credenciales incorrectas

> 📝 **Nota:** Guarda el token JWT para usarlo en requests autenticados. El token expira en 24 horas por defecto.

---

## ⚕️ Health Checks

### 🔍 GET `/health` - Estado General

**Descripción:** Verifica el estado general de la aplicación.

**Request:**
```bash
curl http://localhost:3000/health
```

**Response (200):**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "supabase": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "supabase": {
      "status": "up"
    }
  }
}
```

---

### 📋 GET `/health/database` - Estado de Base de Datos

**Descripción:** Verifica la conectividad con PostgreSQL.

**Request:**
```bash
curl http://localhost:3000/health/database
```

**Response (200):**
```json
{
  "status": "ok",
  "database": {
    "status": "up",
    "message": "Database connection successful"
  }
}
```

---

### 🔗 GET `/health/supabase` - Estado de Supabase

**Descripción:** Verifica la conectividad con Supabase Storage.

**Request:**
```bash
curl http://localhost:3000/health/supabase
```

**Response (200):**
```json
{
  "status": "ok",
  "supabase": {
    "status": "up",
    "storage": "connected",
    "bucket": "peso-tracker-photos"
  }
}
```

---

## ⚖️ Gestión de Pesos

> 🔐 **Todos los endpoints de peso requieren autenticación**. Incluye el token JWT en el header Authorization.
> 📝 **Constraint Importante:** Solo un registro de peso por fecha por usuario.

### 📝 POST `/weights` - Crear Registro de Peso

**Descripción:** Crea un nuevo registro de peso con foto opcional. Solo se permite un peso por fecha por usuario.

**Validaciones:**
- `weight`: Número decimal, 1-999.99 kg, máximo 2 decimales
- `date`: Formato YYYY-MM-DD, debe ser único por usuario
- `notes`: Opcional, string
- `photo`: Opcional, archivo de imagen (JPEG, PNG, WebP, máx 5MB)
- `photoNotes`: Opcional, string para descripción de foto

**Request con Foto (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/weights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "weight=75.5" \
  -F "date=2025-07-28" \
  -F "notes=Peso matutino después del desayuno" \
  -F "photo=@/path/to/your/image.jpg" \
  -F "photoNotes=Foto de progreso"
```

**Request sin Foto (application/json):**
```bash
curl -X POST http://localhost:3000/weights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "weight": 75.5,
    "date": "2025-07-28",
    "notes": "Peso matutino después del desayuno"
  }'
```

**Response Exitoso (201):**
```json
{
  "id": 1,
  "userId": 1,
  "weight": "75.5",
  "date": "2025-07-28T00:00:00.000Z",
  "notes": "Peso matutino después del desayuno",
  "createdAt": "2025-07-28T12:00:00.000Z",
  "updatedAt": "2025-07-28T12:00:00.000Z",
  "photo": {
    "id": 1,
    "notes": "Foto de progreso",
    "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
    "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
    "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg"
  }
}
```

**Tamaños de Foto Generados Automáticamente:**
- **Thumbnail:** 150x150px (para listas y previews)
- **Medium:** 400x400px (para vistas de detalle)
- **Full:** 800x800px (para visualización completa)

**Errores Posibles:**
- **400** - Validación fallida (peso inválido, fecha inválida, etc.)
- **401** - Token JWT inválido o expirado
- **409** - Ya existe un peso para esa fecha
- **413** - Archivo de foto muy grande (>5MB)

---

### 📊 GET `/weights/chart-data` - Datos para Gráficos (Paginación Temporal)

**Descripción:** Obtiene datos de peso organizados por períodos completos para visualización en gráficos. Implementa paginación temporal inteligente que solo muestra períodos con suficientes datos (≥2 puntos) para crear gráficos de línea significativos.

**Parámetros de Query:**
- `timeRange` (opcional): `all` | `1month` | `3months` | `6months` | `1year`
  - **Default:** `1month`
  - **`all`:** Muestra todo el dataset (requiere ≥2 registros totales)
- `page` (opcional): Índice del período (0-based)
  - **Default:** `0` (período más reciente)
  - **1:** Período anterior, **2:** Anterior al anterior, etc.

**Ejemplos de Request:**

```bash
# Todos los datos (si hay ≥2 registros)
curl "http://localhost:3000/weights/chart-data?timeRange=all&page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mes actual con datos
curl "http://localhost:3000/weights/chart-data?timeRange=1month&page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Mes anterior
curl "http://localhost:3000/weights/chart-data?timeRange=1month&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Año actual
curl "http://localhost:3000/weights/chart-data?timeRange=1year&page=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Trimestre anterior
curl "http://localhost:3000/weights/chart-data?timeRange=3months&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "data": [
    {
      "weight": 75.5,
      "date": "2025-01-15T00:00:00.000Z"
    },
    {
      "weight": 74.8,
      "date": "2025-01-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPeriod": "Enero 2025",
    "hasNext": true,
    "hasPrevious": false,
    "totalPeriods": 8,
    "currentPage": 0
  }
}
```

**Lógica de Períodos:**
- **Mensual:** Meses calendario completos (Enero 2025, Diciembre 2024, etc.)
- **Trimestral:** Q1 (Ene-Mar), Q2 (Abr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dic)
- **Semestral:** S1 (Ene-Jun), S2 (Jul-Dic)
- **Anual:** Años calendario completos
- **All:** Dataset completo sin restricción temporal

**Características Inteligentes:**
- ❌ **No muestra períodos vacíos** o con <2 registros
- ✅ **Solo períodos con datos suficientes** para gráficos
- 📊 **Ideal para line charts** y visualizaciones temporales
- 📋 **Labels en español** para una mejor UX

**Errores Posibles:**
- **400** - Parámetros inválidos (timeRange no válido, page negativo)
- **401** - Token JWT inválido o expirado
- **404** - No hay datos para el período solicitado

---

### 📋 GET `/weights/paginated` - Datos Paginados (Para Tablas)

**Descripción:** Obtiene registros de peso con paginación tradicional basada en registros, ideal para vistas de tabla y listados. Los datos se ordenan por fecha (más recientes primero).

**Parámetros de Query:**
- `page` (opcional): Número de página (1-based)
  - **Default:** `1`
  - **Rango:** 1 a totalPages
- `limit` (opcional): Registros por página
  - **Default:** `10`
  - **Rango:** 1-50

**Ejemplos de Request:**

```bash
# Primera página, 5 registros
curl "http://localhost:3000/weights/paginated?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Segunda página, 10 registros
curl "http://localhost:3000/weights/paginated?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Valores por defecto (página 1, 10 registros)
curl "http://localhost:3000/weights/paginated" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "data": [
    {
      "id": 25,
      "weight": 74.2,
      "date": "2025-01-28T00:00:00.000Z",
      "notes": "Peso después del ejercicio",
      "hasPhoto": true
    },
    {
      "id": 24,
      "weight": 74.8,
      "date": "2025-01-27T00:00:00.000Z",
      "notes": "Peso matutino",
      "hasPhoto": false
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

**Campos de Respuesta:**
- `id`: ID único del registro
- `weight`: Peso en kg (formato decimal)
- `date`: Fecha del registro (ISO string)
- `notes`: Notas del usuario (puede ser null)
- `hasPhoto`: Boolean indicando si tiene foto asociada

**Información de Paginación:**
- `page`: Página actual solicitada
- `limit`: Registros por página aplicado
- `total`: Total de registros del usuario
- `totalPages`: Total de páginas disponibles

**Casos de Uso:**
- 📋 **Tablas de datos** con navegación por páginas
- 📱 **Listas en móviles** con scroll infinito
- 🔍 **Búsquedas y filtros** de registros

**Errores Posibles:**
- **400** - Parámetros inválidos (page < 1, limit > 50, etc.)
- **401** - Token JWT inválido o expirado

---

### 📸 GET `/weights/progress` - Progreso Visual con Fotos

**Descripción:** Obtiene todos los registros de peso que tienen fotos asociadas, ordenados cronológicamente desde el más antiguo al más reciente. Perfecto para crear galerías de progreso visual tipo "antes y después".

**Request:**
```bash
curl http://localhost:3000/weights/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
[
  {
    "id": 1,
    "weight": 76.5,
    "date": "2024-01-15T00:00:00.000Z",
    "notes": "Peso inicial - empezando mi viaje",
    "photo": {
      "id": 1,
      "userId": 1,
      "weightId": 1,
      "notes": "Foto inicial del progreso",
      "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1640000000000_thumbnail.jpg",
      "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1640000000000_medium.jpg",
      "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1640000000000_full.jpg",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  },
  {
    "id": 15,
    "weight": 72.3,
    "date": "2024-06-15T00:00:00.000Z",
    "notes": "A mitad de camino - se nota la diferencia!",
    "photo": {
      "id": 15,
      "userId": 1,
      "weightId": 15,
      "notes": "Progreso a los 6 meses",
      "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/15/1655000000000_thumbnail.jpg",
      "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/15/1655000000000_medium.jpg",
      "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/15/1655000000000_full.jpg",
      "createdAt": "2024-06-15T10:00:00.000Z",
      "updatedAt": "2024-06-15T10:00:00.000Z"
    }
  }
]
```

**Características Especiales:**
- 📷 **Solo registros con fotos:** Filtra automáticamente registros sin foto
- 📅 **Orden cronológico:** Del más antiguo al más reciente (ideal para progreso)
- 🖼️ **Información completa de fotos:** Incluye todos los tamaños y metadatos
- 🎨 **Perfecto para galerías:** Diseñado para UIs de progreso visual

**Casos de Uso:**
- 🎨 **Galería de progreso** tipo antes/durante/después
- 📱 **Carrusel de fotos** en aplicaciones móviles
- 📈 **Comparación visual** de cambios a lo largo del tiempo
- 🏆 **Motivación** mostrando el progreso logrado

**Tamaños de Imagen Disponibles:**
- **Thumbnail (150x150px):** Para previews y listas
- **Medium (400x400px):** Para vistas de detalle y galerías
- **Full (800x800px):** Para visualización completa y zoom

**Response cuando no hay fotos:**
```json
[]
```

**Errores Posibles:**
- **401** - Token JWT inválido o expirado

---

### 🔍 GET `/weights/:id` - Obtener Peso por ID

**Descripción:** Obtiene un registro de peso específico por su ID, incluyendo la foto asociada si existe.

**Parámetros de URL:**
- `id`: ID del registro de peso (número entero)

**Request:**
```bash
curl http://localhost:3000/weights/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "id": 1,
  "userId": 1,
  "weight": "75.5",
  "date": "2025-01-28T00:00:00.000Z",
  "notes": "Peso matutino después del desayuno",
  "createdAt": "2025-01-28T12:00:00.000Z",
  "updatedAt": "2025-01-28T12:00:00.000Z",
  "photo": {
    "id": 1,
    "notes": "Foto de progreso",
    "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
    "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
    "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg",
    "createdAt": "2025-01-28T12:05:00.000Z",
    "updatedAt": "2025-01-28T12:05:00.000Z"
  }
}
```

**Response sin Foto:**
```json
{
  "id": 2,
  "userId": 1,
  "weight": "74.8",
  "date": "2025-01-27T00:00:00.000Z",
  "notes": "Peso sin foto",
  "createdAt": "2025-01-27T08:00:00.000Z",
  "updatedAt": "2025-01-27T08:00:00.000Z",
  "photo": null
}
```

**Errores Posibles:**
- **400** - ID inválido (no es un número)
- **401** - Token JWT inválido o expirado
- **403** - El peso no pertenece al usuario autenticado
- **404** - Registro de peso no encontrado

---

### 📷 GET `/weights/:id/photo` - Obtener Foto de Peso

**Descripción:** Obtiene la foto asociada a un registro de peso específico, con todos los tamaños disponibles.

**Parámetros de URL:**
- `id`: ID del registro de peso (número entero)

**Request:**
```bash
curl http://localhost:3000/weights/1/photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "id": 1,
  "userId": 1,
  "weightId": 1,
  "notes": "Foto de progreso - se nota la diferencia!",
  "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_thumbnail.jpg",
  "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_medium.jpg",
  "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753669464663_full.jpg",
  "createdAt": "2025-01-28T12:00:00.000Z",
  "updatedAt": "2025-01-28T12:00:00.000Z"
}
```

**Uso de Tamaños:**
- **thumbnailUrl (150x150px):** Ideal para listas, previews y tarjetas pequeñas
- **mediumUrl (400x400px):** Perfecto para vistas de detalle y galerías
- **fullUrl (800x800px):** Para visualización completa, zoom y descarga

**Errores Posibles:**
- **400** - ID inválido (no es un número)
- **401** - Token JWT inválido o expirado
- **403** - El peso no pertenece al usuario autenticado
- **404** - Registro de peso no encontrado o no tiene foto asociada

---

### ✏️ PATCH `/weights/:id` - Actualizar Peso

**Descripción:** Actualiza un registro de peso existente. Permite cambiar peso, fecha, notas y agregar/reemplazar foto.

**Parámetros de URL:**
- `id`: ID del registro de peso a actualizar

**Validaciones:**
- `weight` (opcional): Número decimal, 1-999.99 kg
- `date` (opcional): Formato YYYY-MM-DD, debe ser único por usuario
- `notes` (opcional): String, puede ser null para eliminar notas
- `photo` (opcional): Archivo de imagen, reemplaza la foto existente
- `photoNotes` (opcional): String para descripción de la nueva foto

**Request con JSON (solo datos):**
```bash
curl -X PATCH http://localhost:3000/weights/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "weight": 74.8,
    "notes": "Peso actualizado después del ejercicio"
  }'
```

**Request con Foto (multipart/form-data):**
```bash
curl -X PATCH http://localhost:3000/weights/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "weight=74.2" \
  -F "notes=Nuevo peso con foto actualizada" \
  -F "photo=@/path/to/new/image.jpg" \
  -F "photoNotes=Foto actualizada - se ve el progreso!"
```

**Response Exitoso (200):**
```json
{
  "id": 1,
  "userId": 1,
  "weight": "74.8",
  "date": "2025-01-28T00:00:00.000Z",
  "notes": "Peso actualizado después del ejercicio",
  "createdAt": "2025-01-28T12:00:00.000Z",
  "updatedAt": "2025-01-28T15:30:00.000Z",
  "photo": {
    "id": 1,
    "notes": "Foto actualizada - se ve el progreso!",
    "thumbnailUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753670000000_thumbnail.jpg",
    "mediumUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753670000000_medium.jpg",
    "fullUrl": "http://127.0.0.1:54321/storage/v1/object/public/peso-tracker-photos/1/1/1753670000000_full.jpg"
  }
}
```

**Comportamiento Especial:**
- 📷 **Foto nueva:** Reemplaza completamente la foto anterior (elimina archivos antiguos)
- 📝 **Campos vacíos:** Solo se actualizan los campos enviados en el request
- 📅 **Cambio de fecha:** Valida que la nueva fecha no entre en conflicto con otros registros
- 🔄 **updatedAt:** Se actualiza automáticamente al timestamp actual

**Errores Posibles:**
- **400** - Validación fallida o datos inválidos
- **401** - Token JWT inválido o expirado
- **403** - El peso no pertenece al usuario autenticado
- **404** - Registro de peso no encontrado
- **409** - Conflicto de fecha (ya existe otro peso en esa fecha)
- **413** - Archivo de foto muy grande (>5MB)

---

### 🗑️ DELETE `/weights/:id` - Eliminar Peso

**Descripción:** Elimina un registro de peso y su foto asociada (si existe) de forma permanente. Esta acción no se puede deshacer.

**Parámetros de URL:**
- `id`: ID del registro de peso a eliminar

**Request:**
```bash
curl -X DELETE http://localhost:3000/weights/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "message": "Peso eliminado exitosamente",
  "deletedWeight": {
    "id": 1,
    "weight": "75.5",
    "date": "2025-01-28T00:00:00.000Z",
    "hadPhoto": true
  }
}
```

**Proceso de Eliminación:**
1. 🔍 **Verificación:** Confirma que el peso pertenece al usuario
2. 📷 **Limpieza de foto:** Elimina archivos de imagen de Supabase Storage (todos los tamaños)
3. 📋 **Eliminación de DB:** Borra el registro de la base de datos
4. ✅ **Confirmación:** Retorna información del registro eliminado

**⚠️ Advertencias Importantes:**
- **Acción irreversible:** No se pueden recuperar datos eliminados
- **Eliminación completa:** Se borran tanto el registro como los archivos de foto
- **Validación de ownership:** Solo puedes eliminar tus propios registros

**Errores Posibles:**
- **400** - ID inválido (no es un número)
- **401** - Token JWT inválido o expirado
- **403** - El peso no pertenece al usuario autenticado
- **404** - Registro de peso no encontrado
- **500** - Error interno (problema con storage o base de datos)

---

## 📈 Dashboard y Analytics

### 🏆 GET `/dashboard` - Dashboard Completo

**Descripción:** Obtiene el dashboard completo del usuario con estadísticas de peso, información de metas activas y resúmenes de progreso.

**Request:**
```bash
curl http://localhost:3000/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "memberSince": "2024-01-15T00:00:00.000Z"
  },
  "weightStats": {
    "totalRecords": 25,
    "recordsWithPhotos": 8,
    "currentWeight": 72.3,
    "startingWeight": 76.5,
    "lowestWeight": 71.8,
    "highestWeight": 76.5,
    "totalWeightLost": 4.2,
    "averageWeight": 74.1,
    "lastRecordDate": "2025-01-28T00:00:00.000Z",
    "firstRecordDate": "2024-01-15T00:00:00.000Z",
    "daysSinceStart": 378
  },
  "activeGoal": {
    "id": 1,
    "targetWeight": 70.0,
    "targetDate": "2025-06-01T00:00:00.000Z",
    "remainingWeight": 2.3,
    "daysRemaining": 124,
    "progressPercentage": 64.6,
    "onTrack": true,
    "estimatedCompletionDate": "2025-05-15T00:00:00.000Z"
  },
  "recentProgress": {
    "last7Days": {
      "weightChange": -0.5,
      "trend": "decreasing"
    },
    "last30Days": {
      "weightChange": -1.2,
      "trend": "decreasing",
      "recordsAdded": 8
    }
  },
  "achievements": [
    {
      "type": "weight_milestone",
      "title": "Meta de 5kg alcanzada!",
      "description": "Has perdido más de 5kg desde que empezaste",
      "achievedAt": "2024-12-20T00:00:00.000Z"
    }
  ]
}
```

**Componentes del Dashboard:**
- 📊 **weightStats:** Estadísticas completas de peso y progreso
- 🎯 **activeGoal:** Información de la meta activa (null si no hay meta)
- 📈 **recentProgress:** Tendencias y cambios recientes
- 🏆 **achievements:** Logros y hitos alcanzados

**Cálculos Inteligentes:**
- **progressPercentage:** Basado en peso inicial vs objetivo
- **onTrack:** Evaluación si va por buen camino para alcanzar la meta
- **estimatedCompletionDate:** Predicción basada en tendencia actual
- **trend:** Análisis de tendencia (increasing/decreasing/stable)

**Errores Posibles:**
- **401** - Token JWT inválido o expirado

---

## 🎯 Gestión de Metas

> 📝 **Sistema Simplificado:** Una meta activa por usuario. El sistema se enfoca en metas claras y alcanzables.

### 📝 POST `/goals` - Crear Meta

**Descripción:** Crea una nueva meta de peso. Si ya existe una meta activa, puede reemplazarla o crear una nueva dependiendo de la configuración.

**Validaciones:**
- `targetWeight`: Número decimal, 1-999.99 kg, debe ser diferente al peso actual
- `targetDate`: Fecha futura en formato YYYY-MM-DD

**Request:**
```bash
curl -X POST http://localhost:3000/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetWeight": 70.0,
    "targetDate": "2025-12-31"
  }'
```

**Response Exitoso (201):**
```json
{
  "id": 1,
  "userId": 1,
  "targetWeight": "70.00",
  "targetDate": "2025-12-31T00:00:00.000Z",
  "createdAt": "2025-01-29T10:00:00.000Z",
  "updatedAt": "2025-01-29T10:00:00.000Z",
  "progress": {
    "currentWeight": 74.2,
    "remainingWeight": 4.2,
    "progressPercentage": 23.5,
    "daysRemaining": 337,
    "estimatedCompletion": "2025-10-15T00:00:00.000Z"
  }
}
```

**Errores Posibles:**
- **400** - Validación fallida (peso igual al actual, fecha pasada)
- **401** - Token JWT inválido
- **409** - Ya existe una meta activa (dependiendo de configuración)

---

### 🔍 GET `/goals/:id` - Obtener Meta por ID

**Descripción:** Obtiene una meta específica con información de progreso actualizada.

**Request:**
```bash
curl http://localhost:3000/goals/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "id": 1,
  "userId": 1,
  "targetWeight": "70.00",
  "targetDate": "2025-12-31T00:00:00.000Z",
  "createdAt": "2025-01-29T10:00:00.000Z",
  "updatedAt": "2025-01-29T10:00:00.000Z",
  "progress": {
    "currentWeight": 74.2,
    "startingWeight": 76.5,
    "remainingWeight": 4.2,
    "weightLostSoFar": 2.3,
    "progressPercentage": 35.4,
    "daysRemaining": 337,
    "daysSinceCreated": 15,
    "averageWeightLossPerWeek": 0.11,
    "onTrack": true,
    "estimatedCompletion": "2025-10-15T00:00:00.000Z"
  }
}
```

---

### ✏️ PATCH `/goals/:id` - Actualizar Meta

**Descripción:** Actualiza una meta existente. Permite cambiar peso objetivo y/o fecha límite.

**Request:**
```bash
curl -X PATCH http://localhost:3000/goals/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetWeight": 68.0,
    "targetDate": "2025-11-30"
  }'
```

**Response Exitoso (200):**
```json
{
  "id": 1,
  "userId": 1,
  "targetWeight": "68.00",
  "targetDate": "2025-11-30T00:00:00.000Z",
  "createdAt": "2025-01-29T10:00:00.000Z",
  "updatedAt": "2025-01-29T15:30:00.000Z",
  "progress": {
    "currentWeight": 74.2,
    "remainingWeight": 6.2,
    "progressPercentage": 27.1,
    "daysRemaining": 306,
    "estimatedCompletion": "2025-12-10T00:00:00.000Z"
  }
}
```

---

### 🗑️ DELETE `/goals/:id` - Eliminar Meta

**Descripción:** Elimina una meta de forma permanente. Acción irreversible.

**Request:**
```bash
curl -X DELETE http://localhost:3000/goals/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Exitoso (200):**
```json
{
  "message": "Meta eliminada exitosamente",
  "deletedGoal": {
    "id": 1,
    "targetWeight": "68.00",
    "targetDate": "2025-11-30T00:00:00.000Z",
    "progressAtDeletion": 27.1
  }
}
```

**Errores Comunes (todos los endpoints de goals):**
- **400** - ID inválido o datos de validación incorrectos
- **401** - Token JWT inválido o expirado
- **403** - La meta no pertenece al usuario autenticado
- **404** - Meta no encontrada

---

## 📸 Gestión de Fotos (Consolidada)

> 📝 **Nota Importante:** La gestión de fotos ha sido consolidada en el módulo de pesos. Las fotos se gestionan a través de endpoints de peso con la restricción de una-foto-por-peso.

**Operaciones Disponibles:**
- **📷 Subir fotos:** Usar endpoints de creación/actualización de peso con datos de formulario
- **🔍 Obtener fotos:** Acceder a fotos a través de endpoints de peso (`/weights/:id/photo`)
- **🗑️ Eliminar fotos:** Las fotos se eliminan cuando se elimina el peso asociado
- **🖼️ Ver progreso:** Usar `/weights/progress` para galería de fotos cronológica

**Tamaños Automáticos:**
- **Thumbnail:** 150x150px (listas, previews)
- **Medium:** 400x400px (vistas de detalle)
- **Full:** 800x800px (visualización completa)

**Limitaciones:**
- Máximo 5MB por foto
- Formatos: JPEG, PNG, WebP
- Una foto por registro de peso

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

- **Simple goals**: One active goal per user
- **Target tracking**: Date and weight-based goals
- **Progress monitoring**: Track progress toward target weight

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

---

## 🔧 Troubleshooting y Solución de Problemas

### 🚑 Problemas Comunes y Soluciones

#### 📛 Error: "Database connection failed"

**Síntomas:**
- Health check `/health/database` retorna error
- Error en logs: `PrismaClientInitializationError`

**Soluciones:**
```bash
# 1. Verificar que Supabase esté ejecutándose
npx supabase status

# 2. Si no está activo, iniciar Supabase
npx supabase start

# 3. Verificar DATABASE_URL en .env.development
echo $DATABASE_URL
# Debe ser: postgresql://postgres:postgres@127.0.0.1:54322/postgres

# 4. Resetear base de datos si es necesario
npm run dev:reset
```

---

#### 📷 Error: "Failed to upload photo to storage"

**Síntomas:**
- Creación/actualización de peso con foto falla
- Health check `/health/supabase` retorna error

**Soluciones:**
```bash
# 1. Verificar Supabase Storage
curl http://127.0.0.1:54321/storage/v1/bucket/peso-tracker-photos

# 2. Crear bucket si no existe
# Ir a: http://127.0.0.1:54323 > Storage > Create bucket
# Nombre: peso-tracker-photos
# Marcar como público

# 3. Verificar variables de entorno
echo $SUPABASE_SERVICE_ROLE_KEY
echo $SUPABASE_STORAGE_BUCKET
```

---

#### 🔐 Error: "JWT token invalid or expired"

**Síntomas:**
- Error 401 en endpoints autenticados
- Error: `JsonWebTokenError` o `TokenExpiredError`

**Soluciones:**
```bash
# 1. Verificar JWT_SECRET en .env.development
echo $JWT_SECRET
# Debe ser: super-secret-jwt-token-with-at-least-32-characters-long

# 2. Obtener nuevo token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 3. Verificar expiración del token (default: 24h)
echo $JWT_EXPIRES_IN
```

---

#### ⚠️ Error: "Duplicate entry for date"

**Síntomas:**
- Error 409 al crear peso
- Mensaje: "Ya existe un peso para esa fecha"

**Soluciones:**
```bash
# 1. Verificar registros existentes para la fecha
curl "http://localhost:3000/weights/paginated?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Usar PATCH en lugar de POST para actualizar
curl -X PATCH http://localhost:3000/weights/ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight": 75.0}'

# 3. Cambiar la fecha en el request
```

---

#### 📋 Error: "No data found for chart"

**Síntomas:**
- `/weights/chart-data` retorna datos vacíos
- Mensaje: "No hay datos para el período solicitado"

**Explicación:**
El sistema requiere ≥2 registros por período para generar gráficos significativos.

**Soluciones:**
```bash
# 1. Verificar total de registros
curl "http://localhost:3000/weights/paginated" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Usar timeRange="all" si hay <2 registros por período
curl "http://localhost:3000/weights/chart-data?timeRange=all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Agregar más registros de peso para poblar el período
```

---

#### 🚀 Error: "Application failed to start"

**Síntomas:**
- `npm run start:dev` falla
- Error en logs durante startup

**Soluciones:**
```bash
# 1. Limpiar dependencias
rm -rf node_modules package-lock.json
npm install

# 2. Regenerar Prisma client
npx prisma generate

# 3. Verificar puerto no ocupado
lsof -i :3000
# Si está ocupado, matar proceso o cambiar puerto

# 4. Restart completo
npm run restart
```

### 🔍 Comandos de Diagnóstico

```bash
# Verificar estado completo
npx supabase status
curl http://localhost:3000/health

# Logs de Supabase
npx supabase logs

# Verificar variables de entorno
cat .env.development

# Test de conectividad
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;"

# Verificar estructura de DB
npx prisma studio
```

### 📞 Obtener Ayuda

1. **Logs detallados:** Revisar consola de la aplicación
2. **Supabase Studio:** `http://127.0.0.1:54323`
3. **Prisma Studio:** `npx prisma studio`
4. **Bruno Tests:** Probar endpoints en `/api-tests/`

---

## 🧪 Testing

### API Testing con Bruno

El proyecto incluye tests de API completos en `/api-tests/` usando Bruno.

**Estructura de Tests:**
```
api-tests/
└── Peso Tracker API/
    ├── Authentication/          # Tests de login/register
    ├── Weights/                 # Tests CRUD de pesos
    ├── Goals/                   # Tests de metas
    ├── Dashboard/               # Tests de dashboard
    └── environments/            # Variables de entorno
```

**Ejecutar Tests:**
1. Abrir Bruno
2. Importar colección desde `/api-tests/`
3. Seleccionar environment "PesoTrackerBackend - Dev"
4. Ejecutar tests en orden

### Unit Tests (Futuro)

```bash
# Cuando estén implementados:
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Tests con coverage
```

---

## 👨‍💻 Guía de Desarrollo

### 🚀 Scripts de Desarrollo

```bash
# 📁 Instalación y Setup
npm install                    # Instalar dependencias
npm run go                     # Setup completo (recomendado)
npm run go:reset              # Setup + reset DB (para empezar limpio)

# 📋 Desarrollo Diario
npm run start:dev             # Desarrollo con hot reload
npm run dev                    # Alias para start:dev con env correcto
npm run restart               # Reiniciar servicios completos

# 📈 Base de Datos
npm run db:push:local         # Aplicar schema a DB local
npm run dev:reset             # Reset DB con datos limpios
npm run db:studio:local       # Abrir Prisma Studio
npm run db:migrate:local      # Crear/aplicar migraciones

# 🎨 Calidad de Código
npm run format                # Formatear código con Prettier
npm run lint                  # Linting con ESLint

# 🏠 Producción
npm run build                 # Build para producción
npm run start:prod            # Ejecutar en modo producción
```

### 📜 Flujo de Trabajo para Nuevos Endpoints

#### 1. 📝 Definir el Endpoint
```typescript
// 1. Crear DTO en src/module/dto/
export class CreateExampleDto {
  @ApiProperty({ example: 'valor', description: 'Descripción' })
  @IsString()
  @IsNotEmpty()
  field: string;
}

// 2. Agregar al controller
@Post()
@ApiOperation({ summary: 'Crear ejemplo' })
exampleMethod(@Body() dto: CreateExampleDto) {
  return this.service.create(dto);
}
```

#### 2. 🔧 Implementar Lógica de Negocio
```typescript
// En el service correspondiente
async create(dto: CreateExampleDto) {
  // Validaciones de negocio
  // Interacción con base de datos via Prisma
  // Procesamiento de archivos (si aplica)
  // Return de datos formateados
}
```

#### 3. 🧪 Probar el Endpoint
```bash
# Crear request en Bruno (api-tests/)
# Probar casos exitosos y de error
# Verificar en Swagger: http://localhost:3000/api
```

### 📊 Monitoreo y Debugging

```bash
# 🔍 Health Checks
curl http://localhost:3000/health           # Estado general
curl http://localhost:3000/health/database  # Base de datos
curl http://localhost:3000/health/supabase  # Supabase Storage

# 📜 Logs y Debugging
npx supabase logs                  # Logs de Supabase
tail -f logs/app.log              # Application logs (si están configurados)

# 📊 Analytics
http://127.0.0.1:54323            # Supabase Studio
http://localhost:3000/api         # Swagger UI
```

### 📚 Estructura de Archivos para Nuevos Módulos

```
src/
└── nuevo-modulo/
    ├── dto/
    │   ├── create-nuevo.dto.ts    # DTO para POST
    │   ├── update-nuevo.dto.ts    # DTO para PATCH
    │   └── query-nuevo.dto.ts     # DTO para GET queries
    ├── nuevo-modulo.controller.ts # Endpoints REST
    ├── nuevo-modulo.service.ts    # Lógica de negocio
    ├── nuevo-modulo.module.ts     # Módulo NestJS
    └── entities/                  # (si se necesitan tipos especiales)
```

### 🔄 Integración con Servicios Existentes

```typescript
// Usar servicios existentes
constructor(
  private readonly prisma: PrismaService,
  private readonly storage: StorageService,
) {}

// Patrones de autenticación
@UseGuards(JwtAuthGuard)
@Controller('nuevo-endpoint')
export class NuevoController {
  @Get()
  getData(@CurrentUser() user: { id: number }) {
    // user.id está automáticamente disponible
  }
}
```

---

## 🤝 Guía de Contribución

### 📋 Antes de Contribuir

1. **🔍 Familiarizarse:** Lee toda esta documentación y CLAUDE.md
2. **🏠 Setup local:** Usa `npm run go` para configuración completa
3. **🧪 Probar endpoints:** Ejecuta tests en Bruno antes de cambios
4. **📚 Swagger:** Revisa la documentación en http://localhost:3000/api

### 🎨 Patrones y Convenciones

#### 📝 DTOs y Validación
```typescript
// Usar siempre class-validator y ApiProperty
export class CreateExampleDto {
  @ApiProperty({ 
    example: 'valor ejemplo', 
    description: 'Descripción clara del campo' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  field: string;
}
```

#### 🛡️ Manejo de Errores
```typescript
// Usar excepciones estándar de NestJS
throw new NotFoundException('Recurso no encontrado');
throw new BadRequestException('Datos inválidos');
throw new ConflictException('Recurso duplicado');
```

#### 🔐 Autenticación y Autorización
```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('endpoint')
export class ExampleController {
  @Get()
  getData(@CurrentUser() user: { id: number }) {
    // Verificar ownership automáticamente
    return this.service.findByUserId(user.id);
  }
}
```

### 📈 Constraints del Negocio

1. **📅 Unicidad de fechas:** Un peso por fecha por usuario
2. **📸 Una foto por peso:** Constraint a nivel de base de datos
3. **🎯 Meta única:** Un usuario solo puede tener una meta activa
4. **🔒 Aislamiento de usuarios:** Cada usuario solo ve sus datos

### ✅ Checklist de Pull Request

- [ ] 🎨 Código sigue patrones existentes
- [ ] 📝 DTOs con validación completa
- [ ] 📚 Swagger/OpenAPI documentado
- [ ] 🛡️ Manejo de errores apropiado
- [ ] 🔐 Autenticación implementada correctamente
- [ ] 🧪 Endpoint probado en Bruno
- [ ] 📝 Documentación actualizada (README.md y CLAUDE.md)
- [ ] 🔄 No rompe funcionalidad existente

### 🐛 Reportar Issues

**Para bugs:**
1. Descripción clara del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Logs relevantes
5. Versión de dependencias

**Para nuevas características:**
1. Descripción del caso de uso
2. Beneficio para los usuarios
3. Propuesta de implementación
4. Consideraciones de breaking changes

### 📖 Actualizar Documentación

**Cuando agregar nuevo endpoint:**
1. Actualizar tabla de endpoints en README.md
2. Agregar sección detallada con ejemplos
3. Documentar en CLAUDE.md para contexto futuro
4. Crear tests en Bruno (`/api-tests/`)
5. Actualizar Swagger con `@ApiOperation`, `@ApiResponse`

**Formato de documentación:**
- 📝 **Descripción clara** del propósito
- 📋 **Parámetros detallados** con validaciones
- 🚀 **Ejemplos de request** con curl
- ✅ **Responses exitosos** con JSON
- ❌ **Errores posibles** con códigos HTTP

---

## 📜 Recursos Adicionales

### 🔗 Enlaces Útiles
- **NestJS Docs:** https://docs.nestjs.com/
- **Prisma Docs:** https://www.prisma.io/docs/
- **Supabase Docs:** https://supabase.com/docs
- **class-validator:** https://github.com/typestack/class-validator
- **Bruno API Client:** https://www.usebruno.com/

### 📚 Lecturas Recomendadas
- REST API Best Practices
- JWT Security Guidelines
- Database Design Patterns
- File Upload Security

## 📄 License

This project is licensed under the [MIT License](LICENSE).
