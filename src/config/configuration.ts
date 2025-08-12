export default () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    isProduction,

    database: {
      url: process.env.DATABASE_URL,
    },

    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
    },

    bcrypt: {
      saltRounds: isProduction ? 12 : 10,
    },

    storage: {
      uploadsPath: '/app/uploads',
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      maxFileSize: 10485760, // 10MB for image uploads
    },

    cors: {
      origin: isProduction
        ? process.env.FRONTEND_URL?.split(',') || [
            'https://your-frontend-domain.com',
          ]
        : process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },

    email: {
      resendApiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      fromName: 'Peso Tracker',
    },
  };
};
