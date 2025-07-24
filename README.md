# PesoTracker Backend

Backend API para la aplicación PesoTracker, una herramienta para seguimiento de peso y metas de fitness.

## Tecnologías

- **Framework**: NestJS con TypeScript
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticación**: JWT, Passport
- **Almacenamiento**: Supabase Storage
- **Validación**: class-validator, class-transformer
- **Seguridad**: Helmet, Throttler

## Requisitos previos

- Node.js (v18 o superior)
- npm (v8 o superior)
- Una cuenta en [Supabase](https://supabase.com/)

## Configuración

1. Clona este repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Copia el archivo `.env.example` a `.env` y configura las variables de entorno:

```bash
cp .env.example .env
```

4. Edita el archivo `.env` con tus credenciales de Supabase y configuración

5. Genera el cliente Prisma:

```bash
npm run db:generate
```

## Estructura del proyecto

```
src/
├── auth/               # Autenticación y autorización
│   ├── dto/            # Objetos de transferencia de datos
│   ├── guards/         # Guards de autenticación
│   └── strategies/     # Estrategias de Passport
├── weights/            # Módulo de pesos
│   └── dto/            # DTOs para pesos
├── goals/              # Módulo de metas
│   └── dto/            # DTOs para metas
├── photos/             # Módulo de fotos
│   └── dto/            # DTOs para fotos
├── common/             # Código compartido
│   ├── decorators/     # Decoradores personalizados
│   ├── filters/        # Filtros de excepción
│   ├── interceptors/   # Interceptores
│   └── types/          # Tipos y interfaces
├── prisma/             # Servicio y configuración de Prisma
├── app.module.ts       # Módulo principal
└── main.ts             # Punto de entrada
```

## Scripts disponibles

- `npm run start`: Inicia la aplicación
- `npm run start:dev`: Inicia la aplicación en modo desarrollo con hot-reload
- `npm run build`: Compila la aplicación
- `npm run db:migrate`: Aplica migraciones de base de datos
- `npm run db:generate`: Genera el cliente Prisma
- `npm run db:studio`: Inicia Prisma Studio para gestionar la base de datos
- `npm run db:seed`: Ejecuta el script de semillas para la base de datos

## API Endpoints

La documentación detallada de la API estará disponible en `/api/docs` una vez que la aplicación esté en ejecución.

## Licencia

[MIT](LICENSE)