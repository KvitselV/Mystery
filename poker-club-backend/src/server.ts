import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { httpServer } from './app';
import { connectRedis } from "./config/redis";

const PORT = process.env.PORT || 3000;


async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
    console.log('SERVER BUILD MARKER v3');

    // 👇 Подключаемся к Redis
    await connectRedis();
    // При успешном коннекте у тебя в redis.ts уже есть лог "✅ Redis connected"

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

bootstrap();