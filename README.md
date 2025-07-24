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
- pnpm (o npm/yarn)
- Docker (opcional, para base de datos)

## 🔧 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/your-username/peso-tracker-backend.git
   cd peso-tracker-backend
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y edítalo con tus propias claves:
   ```bash
   cp .env.example .env
   ```

4. **Configurar la base de datos:**
   Asegúrate de tener una instancia de PostgreSQL en ejecución. Luego, aplica las migraciones de la base de datos:
   ```bash
   npx prisma migrate dev
   ```

5. **Iniciar la aplicación:**
   ```bash
   pnpm run start:dev
   ```

## 📚 Documentación de la API (Swagger)

Una vez que la aplicación esté en funcionamiento, puedes acceder a la documentación de la API generada por Swagger en la siguiente URL:

[http://localhost:3000/api](http://localhost:3000/api)

La documentación proporciona detalles sobre cada endpoint, incluyendo:

- **Descripción**: Qué hace el endpoint.
- **Parámetros**: Los parámetros de la ruta, consulta y cuerpo de la solicitud.
- **Cuerpo de la Solicitud**: Ejemplos de JSON para las solicitudes POST y PATCH.
- **Respuestas**: Ejemplos de respuestas para diferentes códigos de estado HTTP.
- **Esquemas**: Definiciones de los DTOs utilizados en la API.

## 🧪 Testing

Para ejecutar las pruebas unitarias y de integración, utiliza el siguiente comando:

```bash
npm test
```

## 🐳 Docker

También puedes ejecutar la aplicación utilizando Docker:

1. **Construir la imagen de Docker:**
   ```bash
   docker build -t peso-tracker-backend .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -p 3000:3000 --env-file .env peso-tracker-backend
   ```

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue los siguientes pasos:

1. Haz un fork del proyecto.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Añadir nueva funcionalidad'`).
4. Sube tus cambios a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## 📄 Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).