# 🏋️ Peso Tracker API

> Backend moderno para tracking de peso optimizado para **apps Apple** con fotos de progreso seguras y análisis temporal.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 🚀 **Stack**
- **NestJS + Prisma + PostgreSQL** - Backend robusto
- **ImageProcessingService** - HEIF/WebP optimization para Apple
- **JWT Security** - Tokens 15min + auto-refresh para móviles  
- **Cloudflare Ready** - Auto-detection y headers optimizados

## ⚡ **Quick Start**
```bash
# Development
npm run dev:start

# Production (VPS)  
npm run prod:start

# API Documentation
http://localhost:3000/api
```

## 🍎 **Apple Optimizations**
- **70% smaller images** - HEIF native format
- **Real photo proportions** - Progress photos sin crop
- **Mobile-first pagination** - 5 items max, protege diseño
- **15min secure tokens** - Mejor seguridad + auto-refresh

## 📱 **API Highlights**
- **Auth:** JWT + refresh tokens para apps móviles
- **Weights:** CRUD + paginación temporal inteligente  
- **Photos:** URLs firmadas con expiración (máxima seguridad)
- **Goals:** Sistema simple de objetivos
- **Dashboard:** Analytics y progreso

## 🎯 **Production Ready**
- **VPS Optimized** - PostgreSQL compartida, storage local
- **Cloudflare Integration** - Cache automático, headers optimizados
- **Docker Everything** - Zero-config deployment  
- **Security First** - User isolation, rate limiting, validation

---

**📖 Full API Documentation:** `http://localhost:3000/api` (Swagger)  
**🛠️ For Developers:** See `CLAUDE.md` for technical details