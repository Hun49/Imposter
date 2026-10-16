import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './db/schema';

export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
}

export function createAuth(env: AuthEnv) {
  const db = drizzle(env.DB, { schema });

  const secret =
    env.BETTER_AUTH_SECRET || 'imposter-dev-secret-super-secure-key-12345-min32chars';
  const baseURL = env.BETTER_AUTH_URL || 'http://localhost:8787';

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret,
    baseURL,
    trustedOrigins: [
      'http://localhost:5173',
      'http://localhost:8787',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:8787',
      'https://imposter-web.pages.dev',
      'https://imposter-api.hun-wrk0966.workers.dev',
      /^https:\/\/[a-z0-9-]+\.imposter-web\.pages\.dev$/,
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [username()],
  });
}
