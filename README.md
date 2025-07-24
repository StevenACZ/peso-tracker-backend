# Peso Tracker Backend

Backend API para la aplicación de seguimiento de peso construida con NestJS, Prisma, PostgreSQL y Supabase.

## 🚀 Características

- **Autenticación JWT**: Registro y login de usuarios
- **Gestión de Pesos**: CRUD completo para registros de peso
- **Gestión de Metas**: Crear y gestionar objetivos de peso
- **Gestión de Fotos**: Subida y almacenamiento de fotos en Supabase Storage
- **Validación**: Validación robusta de datos de entrada
- **Seguridad**: Helmet, CORS, Rate limiting
- **Health Checks**: Monitoreo de estado de la aplicación
- **Documentación**: API completamente documentada

## 🛠️ Tecnologías

- **Framework**: NestJS
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Almacenamiento**: Supabase Storage
- **Autenticación**: JWT
- **Validación**: class-validator
- **Seguridad**: Helmet, CORS, Throttling
- **Procesamiento de Imágenes**: Sharp

## 📋 Requisitos Previos

- Node.js 18+
- PostgreSQL
- Cuenta de Supabase

## 🔧 Instalación

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

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/peso_tracker"
DIRECT_URL="postgresql://user:password@localhost:5432/peso_tracker"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="peso-tracker-photos"

# App Configuration
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# Security
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
```

4. **Configurar la base de datos**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **Iniciar la aplicación**

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 API Endpoints

### Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario

### Pesos

- `GET /api/weights` - Obtener pesos del usuario
- `POST /api/weights` - Crear registro de peso
- `GET /api/weights/:id` - Obtener peso específico
- `PATCH /api/weights/:id` - Actualizar peso
- `DELETE /api/weights/:id` - Eliminar peso

### Metas

- `GET /api/goals` - Obtener metas del usuario
- `POST /api/goals` - Crear meta
- `GET /api/goals/:id` - Obtener meta específica
- `PATCH /api/goals/:id` - Actualizar meta
- `DELETE /api/goals/:id` - Eliminar meta

### Fotos

- `POST /api/photos/upload` - Subir foto
- `GET /api/photos` - Obtener fotos del usuario
- `GET /api/photos/:id` - Obtener foto específica
- `DELETE /api/photos/:id` - Eliminar foto

### Health Check

- `GET /api/health` - Estado general de la aplicación
- `GET /api/health/database` - Estado de la base de datos
- `GET /api/health/supabase` - Estado de Supabase

## 🧪 Testing

Ejecutar el script de prueba de endpoints:

```bash
./test-endpoints.sh
```

## 🚀 Deployment

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas de deployment.

### Docker

```bash
docker build -t peso-tracker-backend .
docker run -p 3000:3000 peso-tracker-backend
```

### Render

1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Build Command: `npm install && npm run deploy:build`
4. Start Command: `npm run deploy:start`

## 📁 Estructura del Proyecto

```
src/
├── auth/           # Módulo de autenticación
├── weights/        # Módulo de gestión de pesos
├── goals/          # Módulo de gestión de metas
├── photos/         # Módulo de gestión de fotos
├── storage/        # Servicio de almacenamiento
├── health/         # Health checks
├── prisma/         # Configuración de Prisma
├── common/         # Utilidades compartidas
├── config/         # Configuración de la aplicación
└── main.ts         # Punto de entrada
```

## 🔒 Seguridad

- **JWT Authentication**: Tokens seguros para autenticación
- **Password Hashing**: Bcrypt con salt rounds configurables
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CORS**: Configuración de CORS para frontend
- **Helmet**: Headers de seguridad HTTP
- **Validation**: Validación estricta de datos de entrada

## 📊 Monitoreo

- Health checks en `/api/health`
- Logs estructurados
- Métricas de base de datos y Supabase

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte, crear un issue en el repositorio de GitHub.
