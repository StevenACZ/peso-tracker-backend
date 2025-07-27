# Peso Tracker Backend

Backend API para la aplicación de seguimiento de peso construida con NestJS, Prisma, PostgreSQL y Supabase.

## 🚀 Características

- **Autenticación JWT**: Registro y login de usuarios.
- **Gestión de Pesos**: CRUD completo para registros de peso.
- **Gestión de Metas**: Crear y gestionar objetivos de peso, incluyendo hitos.
- **Gestión de Fotos**: Subida y almacenamiento de fotos en Supabase Storage, con asociación a registros de peso.
- **Validación de Datos**: Validación robusta de datos de entrada utilizando `class-validator`.
- **Seguridad**: Implementación de Helmet, CORS y Rate Limiting para proteger la aplicación.
- **Health Checks**: Endpoints para monitorear el estado de la aplicación y sus dependencias (base de datos, Supabase).
- **Documentación de API**: Documentación completa y detallada de la API con Swagger (OpenAPI).
- **Desarrollo Local**: Configuración completa con Supabase local para desarrollo rápido.

## 🛠️ Tecnologías

- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/)
- **Almacenamiento de Archivos**: [Supabase Storage](https://supabase.com/storage)
- **Autenticación**: [JWT](https://jwt.io/)
- **Validación**: [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer)
- **Seguridad**: [Helmet](https://helmetjs.github.io/), [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), [Throttler](https://docs.nestjs.com/security/rate-limiting)
- **Procesamiento de Imágenes**: [Sharp](https://sharp.pixelplumbing.com/)

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm/yarn/pnpm
- Docker (para Supabase local)
- Supabase CLI (`npm install -g supabase`)

## 🔧 Instalación y Configuración

### 🚀 Desarrollo Local (Súper Rápido)

1. **Clonar e instalar:**

   ```bash
   git clone https://github.com/your-username/peso-tracker-backend.git
   cd peso-tracker-backend
   npm install
   ```

2. **¡Iniciar todo de una vez!**

   ```bash
   npm run go
   ```

   **¡Eso es todo!** 🎉 Este comando mágico:
   - ✅ Inicia Supabase local automáticamente
   - ✅ Configura la base de datos con tu esquema
   - ✅ Inicia el servidor de desarrollo
   - ✅ Todo listo para desarrollar sin configuración adicional

### 🔄 Comandos de Desarrollo

- **`npm run go`** - Comando mágico: inicia todo automáticamente
- **`npm run restart`** - Reinicia todo desde cero
- **`npm run supabase:start`** - Solo inicia Supabase local
- **`npm run supabase:stop`** - Detiene Supabase local
- **`npm run db:studio:local`** - Abre Prisma Studio con BD local

### 📝 Agregar Nuevas Tablas

1. Modifica `prisma/schema.prisma`
2. Ejecuta `npm run go` (actualiza automáticamente la BD)
3. ¡Listo! Las nuevas tablas están disponibles

### 🌐 URLs Locales

- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Supabase Studio**: http://127.0.0.1:54323
- **Base de datos**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

### ☁️ Configuración para Producción

1. **Configurar variables de entorno:**

   ```bash
   cp .env.example .env.production
   # Editar .env.production con tus credenciales de Supabase Cloud
   ```

2. **Iniciar en modo producción:**
   ```bash
   npm run prod
   ```

## 🔐 Variables de Entorno

### Desarrollo Local

El archivo `.env.development` ya está configurado con credenciales locales seguras:

- **Supabase URL**: http://127.0.0.1:54321
- **JWT Secret**: super-secret-jwt-token-with-at-least-32-characters-long
- **Base de datos**: PostgreSQL local en Docker

### Producción

Configura `.env.production` con tus credenciales reales de Supabase Cloud.

## 📚 Documentación de la API (Swagger)

Una vez que la aplicación esté en funcionamiento, accede a la documentación:

[http://localhost:3000/api](http://localhost:3000/api)

La documentación incluye:

- **Descripción**: Qué hace cada endpoint
- **Parámetros**: Parámetros de ruta, consulta y cuerpo
- **Ejemplos**: JSON de solicitudes y respuestas
- **Esquemas**: Definiciones de DTOs

## 🧪 Testing

```bash
npm test
```

## 🐳 Docker

1. **Construir imagen:**

   ```bash
   docker build -t peso-tracker-backend .
   ```

2. **Ejecutar contenedor:**
   ```bash
   docker run -p 3000:3000 --env-file .env peso-tracker-backend
   ```

## ❓ Preguntas Frecuentes

### ¿Cómo funciona el desarrollo local vs producción?

- **Local**: Base de datos PostgreSQL en Docker, completamente aislada
- **Producción**: Supabase Cloud con tus credenciales reales
- **Cambio automático**: Los scripts manejan el cambio de entorno automáticamente

### ¿Qué pasa si reinicio mi computadora?

Solo ejecuta `npm run go` nuevamente. Docker iniciará automáticamente.

### ¿Los datos se comparten entre local y producción?

No, son bases de datos completamente separadas y seguras.

### ¿Puedo usar el comando corto para cambios en el esquema?

Sí, `npm run go` detecta cambios en `prisma/schema.prisma` y actualiza la BD automáticamente.

## 🚨 Notas Importantes

- **Docker debe estar ejecutándose** para Supabase local
- **Puertos 54321-54324** deben estar disponibles
- **Usa siempre los scripts npm** para cambio de entornos
- **Las credenciales locales son seguras** para compartir en el equipo

## 🤝 Contribuciones

1. Fork del proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).
