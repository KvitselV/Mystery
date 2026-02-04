import 'reflect-metadata';
import { AppDataSource } from './config/database';
import { httpServer } from './app';

const PORT = process.env.PORT || 3001;

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connected successfully');

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  });
