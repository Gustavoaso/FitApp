import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { getIronSession } from 'iron-session';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.APP_URL || '*',
    credentials: true,
  });

  // Rate Limiting
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minuto
      max: 100, // 100 requests por IP
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // Iron Session
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    (req as any).session = await getIronSession(req, res, {
      cookieName: 'fitnesis_session',
      password:
        process.env.SESSION_SECRET ||
        'super_secret_password_must_be_at_least_32_characters_long',
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
      },
    });
    next();
  });

  // Class Validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Fitnesis API')
    .setDescription('The Fitnesis backend API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
