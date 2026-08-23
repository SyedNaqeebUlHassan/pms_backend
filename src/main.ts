import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import compression from 'compression';
import * as express from 'express';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // security headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Body size limit

  app.use((req: Request, res: Response, next: NextFunction) => {
    express.json({ limit: '10mb' })(req, res, next);
  });

  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

  // CORS

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // attach auth guard to every request
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // global validation pipe

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
