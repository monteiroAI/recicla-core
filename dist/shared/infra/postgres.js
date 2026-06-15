"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
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
exports.pool = new pg_1.Pool(poolConfig);
