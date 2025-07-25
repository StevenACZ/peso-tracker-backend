# Peso Tracker Backend - Setup Guide

## Configuración del Proyecto

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- Base de datos PostgreSQL (Supabase recomendado)

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd peso-tracker-backend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

#### Para Desarrollo

Copia el archivo `.env.development` a `.env` y configura las variables:

```bash
cp .env.development .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Database - Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
```

#### Para Producción

Configura el archivo `.env.production` con tus credenciales de producción.

4. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate
```

### Scripts Disponibles

#### Desarrollo

```bash
# Iniciar en modo desarrollo (usa .env.development)
npm run dev

# O manualmente:
npm run start:dev:env

# Modo debug
npm run start:debug
```

#### Producción

```bash
# Construir y ejecutar en producción (usa .env.production)
npm run prod

# O manualmente:
npm run build
npm run start:prod:env
```

#### Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio
```

#### Otros

```bash
# Formatear código
npm run format

# Linter
npm run lint
```

### Configuración por Entorno

#### Desarrollo

- CORS: `http://localhost:3000`
- Rate Limiting: 1000 requests per 5 minutes
- Bcrypt: 10 rounds (más rápido)
- Swagger: Habilitado en `/api/docs`

#### Producción

- CORS: URLs de producción configurables
- Rate Limiting: 100 requests per minute
- Bcrypt: 12 rounds (más seguro)
- Swagger: Deshabilitado

### Estructura de Archivos de Entorno

- `.env.example` - Plantilla con todas las variables
- `.env.development` - Configuración para desarrollo
- `.env.production` - Configuración para producción
- `.env` - Archivo activo (no incluido en git)

### API Documentation

En desarrollo, la documentación de Swagger está disponible en:
`http://localhost:3000/api/docs`

### Troubleshooting

#### Error en endpoints POST

Si los endpoints POST no funcionan, verifica:

1. Los DTOs tienen decoradores `@Expose()` correctos
2. El ValidationPipe está configurado correctamente
3. Las variables de entorno están cargadas

#### Error de CORS

Verifica que `FRONTEND_URL` esté configurado correctamente para tu entorno.

#### Error de base de datos

1. Verifica las credenciales en el archivo `.env`
2. Ejecuta `npm run db:generate`
3. Ejecuta `npm run db:migrate`
