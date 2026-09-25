'use strict';

require('reflect-metadata');
require('dotenv').config();

const { NestFactory } = require('@nestjs/core');
const {
  Logger,
  ValidationPipe,
} = require('@nestjs/common');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');

const { AppModule } = require('./app.module');
const { HttpExceptionFilter } = require('./common/filters/http-exception.filter');

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Global validation: strip unknown fields, transform payloads to DTO
  // classes, and reject requests that don't pass class-validator rules.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Global exception filter: catches all unhandled errors and returns
  // consistent JSON error responses.
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Swagger / OpenAPI -------------------------------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Events API')
    .setDescription(
      'Events Management REST API — registration, JWT login, event CRUD, RSVP, attendees.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        description: 'JWT bearer token obtained from /auth/login or /auth/register',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  });

  const port = Number(process.env.PORT) || 3000;
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;
  await app.listen(port);
  logger.log(`Application listening on ${baseUrl}`);
  logger.log(`Swagger UI available at ${baseUrl}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
