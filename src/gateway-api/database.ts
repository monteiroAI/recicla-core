// ## nome/caminho do arquivo: src/gateway-api/database.ts
// ## objetivo do arquivo: Instância unificada e centralizada do Pool de conexões do PostgreSQL.
// ## versão / data: v1.0.0 | 23 de Junho de 2026

import { Pool } from 'pg';

export const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mrvtrust_db', 
  password: 'postgres',     
  port: 5432,
});