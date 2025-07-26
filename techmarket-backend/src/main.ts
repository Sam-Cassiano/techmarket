import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Pipes globais para validação automática com DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Filtro global para tratamento de exceções HTTP
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS - ajuste para produção conforme necessário
  app.enableCors({
    origin: 'http://localhost:3000', // substitua pela URL do frontend em produção
    credentials: true,
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('TechMarket API')
    .setDescription('API para o sistema TechMarket')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Rota simples de verificação de saúde da API
  app.getHttpAdapter().get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Inicialização do servidor
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3005;
  try {
    await app.listen(PORT);
    logger.log(`🚀 Aplicação iniciada em http://localhost:${PORT}`);
  } catch (error) {
    logger.error('❌ Erro ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

bootstrap();
