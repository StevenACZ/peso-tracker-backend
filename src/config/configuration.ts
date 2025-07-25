export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    isProduction,

    database: {
      url: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    bcrypt: {
      saltRounds: parseInt(
        process.env.BCRYPT_SALT_ROUNDS || (isProduction ? '12' : '10'),
        10,
      ),
    },

    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      storageBucket:
        process.env.SUPABASE_STORAGE_BUCKET || 'peso-tracker-photos',
    },

    cors: {
      origin: isProduction
        ? process.env.FRONTEND_URL?.split(',') || [
            'https://your-frontend-domain.com',
          ]
        : process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },

    rateLimit: {
      ttl: parseInt(
        process.env.RATE_LIMIT_TTL || (isProduction ? '60' : '300'),
        10,
      ),
      limit: parseInt(
        process.env.RATE_LIMIT_LIMIT || (isProduction ? '100' : '1000'),
        10,
      ),
    },

    logging: {
      level: isProduction ? 'error' : 'debug',
    },
  };
};
