import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { EnvConfig } from './config/env.config';
import { initializeTelemetry, shutdownTelemetry } from '@infra/telemetry';

async function bootstrap() {
  initializeTelemetry();

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });

  const logger = pino({
    level: nodeEnv === 'production' ? 'info' : 'debug'
  });

  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      customProps: (req: any) => ({
        trace_id: req.id as string | undefined
      })
    })
  );

  app.setGlobalPrefix('v1', {
    exclude: ['health', 'metrics']
  });
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(helmet());
  app.enableCors({
    origin: configService.get('NODE_ENV', { infer: true }) === 'production' ? false : true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  await app.listen(port);
  Logger.log(`🚀 Backend running on port ${port}`, 'Bootstrap');

  const gracefulShutdown = async () => {
    await app.close();
    await shutdownTelemetry();
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

bootstrap().catch((error) => {
  Logger.error('Error during bootstrap', error);
  process.exit(1);
});

