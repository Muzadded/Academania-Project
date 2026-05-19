import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:3000');

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
