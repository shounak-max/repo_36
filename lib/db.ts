import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { config } from "@/lib/config";

type GlobalWithPool = typeof globalThis & {
  taskManagerPgPool?: Pool;
};

const globalForPg = globalThis as GlobalWithPool;

function shouldUseSsl(connectionString: string): boolean {
  return connectionString.includes("sslmode=require") || process.env.POSTGRES_SSL === "true";
}

export function getPool(): Pool {
  if (!globalForPg.taskManagerPgPool) {
    const connectionString = config.postgresUrl;
    globalForPg.taskManagerPgPool = new Pool({
      connectionString,
      max: 5,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined
    });
  }

  return globalForPg.taskManagerPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function checkDatabase(): Promise<boolean> {
  const result = await query<{ ok: number }>("select 1 as ok");
  return result.rows[0]?.ok === 1;
}
