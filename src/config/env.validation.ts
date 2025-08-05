import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
} from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT?: string = '3000';

  @IsOptional()
  @IsString()
  NODE_ENV?: string = 'development';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  DIRECT_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string = '24h';

  @IsOptional()
  @IsNumberString()
  BCRYPT_SALT_ROUNDS?: string = '12';

  @IsOptional()
  @IsString()
  UPLOADS_PATH?: string = '/app/uploads';

  @IsOptional()
  @IsString()
  BASE_URL?: string = 'http://localhost:3000';

  @IsOptional()
  @IsNumberString()
  MAX_FILE_SIZE?: string = '5242880';

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string = 'http://localhost:3000';

  @IsOptional()
  @IsNumberString()
  RATE_LIMIT_TTL?: string = '60';

  @IsOptional()
  @IsNumberString()
  RATE_LIMIT_LIMIT?: string = '100';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
    });

    throw new Error(
      `Environment validation failed:\n${errorMessages.join('\n')}`,
    );
  }

  return validatedConfig;
}
