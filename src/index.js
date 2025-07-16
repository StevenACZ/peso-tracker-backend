import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import weightRoutes from './routes/weights.js';
import goalRoutes from './routes/goals.js'; // Importar rutas de metas
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan'; // Para logging de requests

dotenv.config();

const app = express();

// Middleware para logging en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware para parsear JSON con límite de tamaño
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Configuración de seguridad con Helmet
app.use(helmet());

// Configuración de CORS más segura
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin 'origin' (como Postman, apps móviles) solo si no hay orígenes definidos
    if (!origin && allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Max 100 requests por IP cada 15 min
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para autenticación (más estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Max 10 intentos por IP cada 15 min
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use('/api/auth', authLimiter);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/weights', weightRoutes);
app.use('/api/goals', goalRoutes); // Usar rutas de metas

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'The requested resource was not found' });
});

// Middleware centralizado para manejo de errores
app.use((err, req, res, next) => {
  console.error(err); // Log del error completo en el servidor

  // No exponer detalles del error en producción
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred',
    ...(isProduction ? {} : { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Aquí se podría cerrar la conexión a la DB si es necesario
    process.exit(0);
  });
});