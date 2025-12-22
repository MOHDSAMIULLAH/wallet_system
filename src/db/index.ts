import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

// Export for health checks
export const testConnection = async () => {
  try {
    const result = await sql`SELECT 1 as test`;
    return result.length > 0;
  } catch (error) {
    throw error;
  }
};
