import { plainToInstance, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max, validateSync } from 'class-validator';

/**
 * Ortam değişkeni şeması. Uygulama açılışında doğrulanır;
 * eksik/yanlış config sessizce değil, net hatayla düşer.
 */
enum NodeEnv {
  development = 'development',
  staging = 'staging',
  production = 'production',
  test = 'test',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.development;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT = 3000;

  @IsString()
  DATABASE_URL!: string;

  // Prisma migration için doğrudan bağlantı (Supabase pooler kullanılıyorsa)
  @IsString()
  @IsOptional()
  DIRECT_URL?: string;

  // Supabase (Doc 8) — walking skeleton aşamasında opsiyonel; auth sprintinde zorunlu olur.
  @IsString()
  @IsOptional()
  SUPABASE_URL?: string;

  @IsString()
  @IsOptional()
  SUPABASE_JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Ortam değişkeni doğrulama hatası:\n${errors.toString()}`);
  }
  return validated;
}
