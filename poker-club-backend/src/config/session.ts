import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { redisClient } from './redis';

export const sessionSecret = process.env.SESSION_SECRET || 'poker-club-secret-change-in-production';
const redisStore = new RedisStore({ client: redisClient, prefix: 'poker:sess:' });

export { redisStore as sessionStore };

export const sessionMiddleware = session({
  store: redisStore,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  name: 'poker.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    sameSite: 'lax',
  },
});

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: string;
    managedClubId?: string | null;
  }
}
