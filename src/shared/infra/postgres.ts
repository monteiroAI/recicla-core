import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://recicla_user:recicla_password@127.0.0.1:5432/recicla';
console.log('[POSTGRES] DATABASE_URL=', databaseUrl, typeof databaseUrl);
const databaseUrlMatch = databaseUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

const poolConfig = databaseUrlMatch
  ? {
      user: databaseUrlMatch[1],
      password: databaseUrlMatch[2],
      host: databaseUrlMatch[3],
      port: parseInt(databaseUrlMatch[4], 10),
      database: databaseUrlMatch[5],
    }
  : {
      connectionString: databaseUrl,
    };

console.log('[POSTGRES] poolConfig=', poolConfig);
export const pool = new Pool(poolConfig);
