import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3055),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgresql://postgres:P@ssw0rd@localhost:5432/cpopm?schema=public'),
    REDIS_URL: z.string().url().optional(),
    AUTH_AZURE_AD_ENABLED: z
      .union([z.boolean(), z.string()])
      .default('false')
      .transform((value) => {
        if (typeof value === 'boolean') {
          return value;
        }
        const normalized = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'on'].includes(normalized);
      }),
    AZURE_AD_CLIENT_ID: z.string().optional(),
    AZURE_AD_CLIENT_SECRET: z.string().optional(),
    AZURE_AD_TENANT_ID: z.string().optional(),
    AZURE_AD_REDIRECT_URI: z.string().url().optional(),
    JWT_SECRET: z
      .string()
      .min(32)
      .default('dev-jwt-secret-change-me-in-production-1234567890'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32)
      .default('dev-jwt-refresh-secret-change-me-0987654321')
  })
  .superRefine((data, ctx) => {
    if (data.AUTH_AZURE_AD_ENABLED) {
      const missing = [
        ['AZURE_AD_CLIENT_ID', data.AZURE_AD_CLIENT_ID],
        ['AZURE_AD_CLIENT_SECRET', data.AZURE_AD_CLIENT_SECRET],
        ['AZURE_AD_TENANT_ID', data.AZURE_AD_TENANT_ID],
        ['AZURE_AD_REDIRECT_URI', data.AZURE_AD_REDIRECT_URI]
      ]
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        missing.forEach((key) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key as string],
            message: 'Obrigatório quando AUTH_AZURE_AD_ENABLED=true'
          });
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export const loadEnv = (): EnvConfig => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formattedErrors = parsed.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`Invalid environment configuration: ${formattedErrors.join('; ')}`);
  }

  return parsed.data;
};

