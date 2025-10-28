import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { FastifySocketIoAdapter } from './adapters/fastify-socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Enable CORS for both HTTP and WebSocket
  app.enableCors({
    origin: '*', // Replace with frontend URL in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Use custom Fastify-compatible Socket.IO adapter
  app.useWebSocketAdapter(new FastifySocketIoAdapter(app));

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  
  console.log(`✅ Application is running on: http://localhost:${process.env.PORT || 3000}`);
  console.log(`✅ WebSocket server is running on: ws://localhost:${process.env.PORT || 3000}`);
}
bootstrap();
