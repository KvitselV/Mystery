import { RedisStore } from 'connect-redis';
export declare const sessionSecret: string;
declare const redisStore: RedisStore;
export { redisStore as sessionStore };
export declare const sessionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
declare module 'express-session' {
    interface SessionData {
        userId?: string;
        role?: string;
        managedClubId?: string | null;
    }
}
//# sourceMappingURL=session.d.ts.map