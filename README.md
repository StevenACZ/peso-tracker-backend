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

| Componente        | Tecnología                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**       | [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)                                                                                                         |
| **Base de Datos** | [PostgreSQL](https://www.postgresql.org/)                                                                                                                                    |
| **Autenticación** | [JSON Web Token (JWT)](https://jwt.io/), [bcrypt.js](https://github.com/kelektiv/bcrypt.js)                                                                                  |
| **Contenedores**  | [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/)                                                                                        |
| **Seguridad**     | [Helmet](https://helmetjs.github.io/), [CORS](https://expressjs.com/en/resources/middleware/cors.html), [express-rate-limit](https://github.com/nfriedly/express-rate-limit) |
| **Validación**    | [express-validator](https://express-validator.github.io/docs/)                                                                                                               |
| **Otros**         | [pgAdmin](https://www.pgadmin.org/), [Morgan](https://github.com/expressjs/morgan) (Logger)                                                                                  |

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

A continuación se detallan todos los endpoints disponibles con ejemplos de peticiones y respuestas.

> **Nota**: Las rutas que indican `🔒 Protegido` requieren un Token JWT en la cabecera `Authorization`.
>
> `Authorization: Bearer <tu-token-jwt>`

---

### 💚 Health Check

Para verificar que la API está funcionando correctamente.

**`GET /health`**

```bash
curl -X GET http://localhost:3000/health
```

**Respuesta Exitosa (200 OK):**

```json
{
  "status": "OK",
  "timestamp": "2025-07-17T10:00:00.000Z",
  "uptime": 120.5
}
```

---

### 👤 Autenticación (`/api/auth`)

#### Registro de Usuario

**`POST /api/auth/register`**

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
  "user": {
    "id": 1,
    "username": "steven",
    "email": "steven@example.com"
  }
}
```

**Errores de Validación (400 BAD REQUEST):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "msg": "Password must contain at least one lowercase letter, one uppercase letter, and one number",
      "param": "password",
      "location": "body"
    }
  ]
}
```

#### Inicio de Sesión

**`POST /api/auth/login`**

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
  "user": {
    "id": 1,
    "username": "steven",
    "email": "steven@example.com"
  }
}
```

**Error de Credenciales (401 UNAUTHORIZED):**

```json
{
  "error": "Invalid credentials"
}
```

---

### ⚖️ Registros de Peso (`/api/weights`)

#### Obtener Registros de Peso

**`GET /api/weights` 🔒 Protegido**

Obtiene todos los registros de peso del usuario autenticado.

**Parámetros de consulta opcionales:**

- `limit`: Número máximo de registros (1-100)
- `offset`: Número de registros a omitir
- `startDate`: Fecha de inicio (YYYY-MM-DD)
- `endDate`: Fecha de fin (YYYY-MM-DD)

**Ejemplo de Petición:**

```bash
curl -X GET "http://localhost:3000/api/weights?limit=10&startDate=2025-01-01" \
-H "Authorization: Bearer <tu-token-jwt>"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "weight": 80.5,
      "date": "2025-07-17",
      "notes": "Después del entrenamiento",
      "created_at": "2025-07-17T10:00:00.000Z",
      "updated_at": "2025-07-17T10:00:00.000Z"
    }
  ]
}
```

#### Agregar Registro de Peso

**`POST /api/weights` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X POST http://localhost:3000/api/weights \
-H "Authorization: Bearer <tu-token-jwt>" \
-H "Content-Type: application/json" \
-d '{
  "weight": 80.5,
  "date": "2025-07-17",
  "notes": "Después del entrenamiento"
}'
```

**Respuesta Exitosa (201 CREATED):**

```json
{
  "message": "Weight record created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "weight": 80.5,
    "date": "2025-07-17",
    "notes": "Después del entrenamiento",
    "created_at": "2025-07-17T10:00:00.000Z",
    "updated_at": "2025-07-17T10:00:00.000Z"
  }
}
```

#### Actualizar Registro de Peso

**`PUT /api/weights/:id` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X PUT http://localhost:3000/api/weights/1 \
-H "Authorization: Bearer <tu-token-jwt>" \
-H "Content-Type: application/json" \
-d '{
  "weight": 79.8,
  "date": "2025-07-17",
  "notes": "Actualizado: después del entrenamiento"
}'
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Weight record updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "weight": 79.8,
    "date": "2025-07-17",
    "notes": "Actualizado: después del entrenamiento",
    "created_at": "2025-07-17T10:00:00.000Z",
    "updated_at": "2025-07-17T10:30:00.000Z"
  }
}
```

#### Eliminar Registro de Peso

**`DELETE /api/weights/:id` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X DELETE http://localhost:3000/api/weights/1 \
-H "Authorization: Bearer <tu-token-jwt>"
```

**Respuesta Exitosa (204 NO CONTENT):**

```
(Sin contenido)
```

---

### 🎯 Metas de Peso (`/api/goals`)

#### Obtener Metas

**`GET /api/goals` 🔒 Protegido**

Obtiene todas las metas del usuario autenticado.

**Ejemplo de Petición:**

```bash
curl -X GET http://localhost:3000/api/goals \
-H "Authorization: Bearer <tu-token-jwt>"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "target_weight": 75.0,
      "target_date": "2025-12-31",
      "created_at": "2025-07-17T10:00:00.000Z",
      "updated_at": "2025-07-17T10:00:00.000Z"
    }
  ]
}
```

#### Crear Meta

**`POST /api/goals` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X POST http://localhost:3000/api/goals \
-H "Authorization: Bearer <tu-token-jwt>" \
-H "Content-Type: application/json" \
-d '{
  "target_weight": 75.0,
  "target_date": "2025-12-31"
}'
```

**Respuesta Exitosa (201 CREATED):**

```json
{
  "message": "Goal created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "target_weight": 75.0,
    "target_date": "2025-12-31",
    "created_at": "2025-07-17T10:00:00.000Z",
    "updated_at": "2025-07-17T10:00:00.000Z"
  }
}
```

#### Actualizar Meta

**`PUT /api/goals/:id` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X PUT http://localhost:3000/api/goals/1 \
-H "Authorization: Bearer <tu-token-jwt>" \
-H "Content-Type: application/json" \
-d '{
  "target_weight": 70.0,
  "target_date": "2025-11-30"
}'
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Goal updated successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "target_weight": 70.0,
    "target_date": "2025-11-30",
    "created_at": "2025-07-17T10:00:00.000Z",
    "updated_at": "2025-07-17T10:30:00.000Z"
  }
}
```

#### Eliminar Meta

**`DELETE /api/goals/:id` 🔒 Protegido**

**Ejemplo de Petición:**

```bash
curl -X DELETE http://localhost:3000/api/goals/1 \
-H "Authorization: Bearer <tu-token-jwt>"
```

**Respuesta Exitosa (204 NO CONTENT):**

```
(Sin contenido)
```

---

### 🚨 Códigos de Error Comunes

| Código  | Descripción                                | Ejemplo                                         |
| ------- | ------------------------------------------ | ----------------------------------------------- |
| **400** | Bad Request - Datos inválidos              | Validación fallida, campos requeridos faltantes |
| **401** | Unauthorized - No autenticado              | Token JWT faltante o inválido                   |
| **403** | Forbidden - Sin permisos                   | Intentar acceder a recursos de otro usuario     |
| **404** | Not Found - Recurso no encontrado          | ID de registro o meta inexistente               |
| **429** | Too Many Requests - Rate limit excedido    | Demasiadas peticiones en poco tiempo            |
| **500** | Internal Server Error - Error del servidor | Error interno de la aplicación                  |

### 📝 Notas Importantes

1. **Autenticación**: Todos los endpoints protegidos requieren el token JWT obtenido en el login.
2. **Validación**: Los datos son validados automáticamente. Revisa los mensajes de error para corregir los datos.
3. **Rate Limiting**: La API tiene límites de peticiones para prevenir abuso.
4. **Fechas**: Usa el formato ISO 8601 (YYYY-MM-DD) para todas las fechas.
5. **Pesos**: Los pesos deben estar entre 20 y 500 kg.

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
