import 'dotenv/config';
import * as schema from './drizzle/schema';
import {drizzle} from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

export const db = drizzle(process.env.DATABASE_URL!, { logger: true, schema, mode: 'default' });
