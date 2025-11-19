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
    APP_WEB_URL: z.string().url().default('http://localhost:3000'),
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
    AUTH_INVITE_TTL_HOURS: z.coerce.number().default(72),
    AUTH_RESET_TTL_MINUTES: z.coerce.number().default(60),
    AZURE_AD_CLIENT_ID: z.string().optional(),
    AZURE_AD_CLIENT_SECRET: z.string().optional(),
    AZURE_AD_TENANT_ID: z.string().optional(),
    AZURE_AD_REDIRECT_URI: z.string().url().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_SECURE: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((value) => {
        if (typeof value === 'boolean' || value === undefined) {
          return value;
        }
        const normalized = value.toLowerCase().trim();
        if (['true', '1', 'yes', 'on'].includes(normalized)) {
          return true;
        }
        if (['false', '0', 'no', 'off'].includes(normalized)) {
          return false;
        }
        return undefined;
      }),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),
    JWT_SECRET: z.string().min(32).default('dev-jwt-secret-change-me-in-production-1234567890'),
    JWT_REFRESH_SECRET: z.string().min(32).default('dev-jwt-refresh-secret-change-me-0987654321'),
    GPT_TOKEN: z.string().min(10).optional(),
    GEMINI_TOKEN: z.string().optional(),
    GPT_MODEL: z.string().default('gpt-4-turbo-preview'),
    GPT_MAX_TOKENS: z.coerce.number().default(2000),
    GPT_TEMPERATURE: z.coerce.number().default(0.2),
  })
  .superRefine((data, ctx) => {
    if (data.AUTH_AZURE_AD_ENABLED) {
      const missing = [
        ['AZURE_AD_CLIENT_ID', data.AZURE_AD_CLIENT_ID],
        ['AZURE_AD_CLIENT_SECRET', data.AZURE_AD_CLIENT_SECRET],
        ['AZURE_AD_TENANT_ID', data.AZURE_AD_TENANT_ID],
        ['AZURE_AD_REDIRECT_URI', data.AZURE_AD_REDIRECT_URI],
      ]
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        missing.forEach((key) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key as string],
            message: 'Obrigatório quando AUTH_AZURE_AD_ENABLED=true',
          });
        });
      }
    }

    const smtpValues = [data.SMTP_HOST, data.SMTP_PORT, data.SMTP_USER, data.SMTP_PASSWORD];
    const smtpConfigured = smtpValues.some((value) => value !== undefined);

    if (smtpConfigured) {
      if (!data.SMTP_HOST) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_HOST'],
          message: 'Obrigatório quando variáveis SMTP_* são definidas',
        });
      }
      if (!data.SMTP_PORT) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_PORT'],
          message: 'Obrigatório quando variáveis SMTP_* são definidas',
        });
      }
      if (!data.SMTP_FROM) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SMTP_FROM'],
          message: 'Obrigatório quando variáveis SMTP_* são definidas',
        });
      }
    }

    if (data.GPT_TOKEN) {
      const model = data.GPT_MODEL.trim();
      if (model.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['GPT_MODEL'],
          message: 'Modelo GPT não pode ser vazio quando GPT_TOKEN está definido',
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export const loadEnv = (): EnvConfig => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formattedErrors = parsed.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`,
    );
    throw new Error(`Invalid environment configuration: ${formattedErrors.join('; ')}`);
  }

  return parsed.data;
};
