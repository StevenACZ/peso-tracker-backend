<div align="center">
  <br />
  <h1>🏋️ Peso Tracker API</h1>
  <p>
    Una API REST robusta y segura para registrar y seguir tu progreso de peso corporal.
    <br />
    Construida con Node.js, Express, PostgreSQL y completamente dockerizada.
  </p>
</div>

---

## ✨ Características Principales

- **🔐 Autenticación Segura**: Rutas protegidas con JSON Web Tokens (JWT).
- **👤 Gestión de Usuarios**: Endpoints para registro y login de usuarios.
- **⚖️ CRUD de Pesos**: Operaciones completas para crear, leer, actualizar y eliminar registros de peso.
- **🎯 CRUD de Metas**: Gestión de metas de peso para mantener la motivación.
- **🐳 Dockerizado**: Entorno de desarrollo listo para usar con Docker y Docker Compose.
- **🛡️ Seguridad**: Middlewares de seguridad implementados (Helmet, CORS, Rate Limiting).
- **✅ Validación**: Validación de datos en todas las peticiones para asegurar la integridad.
- **🐘 Base de Datos Persistente**: Uso de PostgreSQL con un volumen para que tus datos no se pierdan.
- **👨‍💻 Gestión Visual**: Incluye PgAdmin para administrar la base de datos fácilmente desde el navegador.

## 🧱 Stack Tecnológico

| Componente      | Tecnología                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Backend**     | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)                                |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/)                                                          |
| **Autenticación** | [JSON Web Token (JWT)](https://jwt.io/), [bcrypt.js](https://github.com/kelektiv/bcrypt.js)       |
| **Contenedores**  | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)               |
| **Seguridad**   | [Helmet](https://helmetjs.github.io/), [CORS](https://expressjs.com/en/resources/middleware/cors.html), [express-rate-limit](https://github.com/nfriedly/express-rate-limit) |
| **Validación**  | [express-validator](https://express-validator.github.io/docs/)                                     |
| **Otros**       | [pgAdmin](https://www.pgadmin.org/), [Morgan](https://github.com/expressjs/morgan) (Logger)           |


## 🚀 Cómo Empezar

Asegúrate de tener **Git** y **Docker** instalados en tu sistema.

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/TU_USUARIO/peso-tracker-backend.git
    cd peso-tracker-backend
    ```

2.  **Configura tus variables de entorno:**
    Copia el archivo de ejemplo y edítalo con tus propias credenciales.
    ```bash
    cp .env.example .env
    ```
    Abre el archivo `.env` y rellena las variables (especialmente las contraseñas y el `JWT_SECRET`).

3.  **Levanta los servicios con Docker Compose:**
    Este comando construirá la imagen de Node.js y levantará todos los contenedores en segundo plano.
    ```bash
    docker compose up --build -d
    ```

4.  **¡Listo!** La API estará corriendo en `http://localhost:3000`.
    - **API**: `http://localhost:3000`
    - **pgAdmin**: `http://localhost:5050`

## 📡 Documentación de la API (Endpoints)

A continuación se detallan los endpoints disponibles.

> **Nota**: Las rutas que indican `🔒 Protegido` requieren un Token JWT en la cabecera `Authorization`.
>
> `Authorization: Bearer <tu-token-jwt>`

---

### 💚 Health Check

Para verificar que la API está funcionando correctamente.

`GET /health`

```json
// ✅ Respuesta Exitosa (200 OK)
{
  "status": "OK",
  "timestamp": "2024-05-21T10:00:00.000Z",
  "uptime": 120.5
}
```

---

### 👤 Autenticación (`/api/auth`)

#### Registro de Usuario
`POST /api/auth/register`

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "username": "steven",
  "email": "steven@example.com",
  "password": "Password123!"
}'
```
**Respuesta Exitosa (201 CREATED):**
```json
{
  "message": "User registered successfully",
  "user": { "id": 1, "username": "steven", "email": "steven@example.com" }
}
```

#### Inicio de Sesión
`POST /api/auth/login`

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "steven@example.com",
  "password": "Password123!"
}'
```
**Respuesta Exitosa (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "steven", "email": "steven@example.com" }
}
```

---

### ⚖️ Registros de Peso (`/api/weights`)

#### `GET /api/weights` 🔒 Protegido
Obtiene todos los registros de peso del usuario.

#### `POST /api/weights` 🔒 Protegido
Añade un nuevo registro de peso.

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/api/weights \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "weight": 80.5,
  "date": "2024-05-21",
  "notes": "Primera medición"
}'
```

#### `PUT /api/weights/:id` 🔒 Protegido
Actualiza un registro de peso existente.

#### `DELETE /api/weights/:id` 🔒 Protegido
Elimina un registro de peso.

---

### 🎯 Metas de Peso (`/api/goals`)

#### `GET /api/goals` 🔒 Protegido
Obtiene las metas de peso del usuario.

#### `POST /api/goals` 🔒 Protegido
Crea una nueva meta de peso.

**Ejemplo de Petición:**
```bash
curl -X POST http://localhost:3000/api/goals \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "target_weight": 75.0,
  "target_date": "2024-12-31"
}'
```

#### `PUT /api/goals/:id` 🔒 Protegido
Actualiza una meta de peso existente.

#### `DELETE /api/goals/:id` 🔒 Protegido
Elimina una meta de peso.

## 🗂️ Estructura del Proyecto

```
peso-tracker-backend/
├── src/                      # Código fuente de la aplicación
│   ├── config/               # Conexión a la DB
│   ├── controllers/          # Lógica de negocio
│   ├── middleware/           # Middlewares (auth, validation, errors)
│   ├── models/               # Interacción con la base de datos
│   ├── routes/               # Definición de rutas de la API
│   └── index.js              # Punto de entrada principal del servidor
├── .env.example              # Archivo de ejemplo para variables de entorno
├── docker-compose.yml        # Orquestación de los contenedores
├── Dockerfile                # Definición del contenedor de Node.js
├── init-db.sql               # Script SQL para inicializar las tablas
└── README.md                 # Este archivo :)
```

## 🧠 Autor

Creado con 💜 por **Steven**