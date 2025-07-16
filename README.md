# 🏋️ Peso Tracker Backend

API REST para seguimiento de peso corporal. Hecha con **Node.js**, **Express**, **PostgreSQL** y **Docker**.

## 🧱 Tecnologías

- Node.js + Express
- PostgreSQL (con volumen persistente)
- Docker + Docker Compose
- JWT para autenticación
- pgAdmin para gestión visual

## 🚀 Instalación rápida

```bash
git clone https://github.com/TU_USUARIO/peso-tracker.git
cd peso-tracker
cp .env.example .env  # Luego edita tus variables reales
docker compose up --build -d
```

## 📡 Endpoints iniciales
GET /api/health → Verifica que el backend funciona

## 🛠 Por hacer
- Autenticación JWT (login/register)
- CRUD de pesos
- Metas de peso
- Dashboard

## 📂 Estructura

```
peso-tracker/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── init-db.sql
└── README.md
```

## 🧠 Autor
Creado por Steven 💜