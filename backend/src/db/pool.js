import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const isCloud = connectionString?.includes('supabase.com') || connectionString?.includes('pooler.supabase') || process.env.NODE_ENV === 'production';

export const pool = new pg.Pool({
  connectionString,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});
