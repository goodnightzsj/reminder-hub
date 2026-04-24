import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import type { LocalSqlDriver } from "@reminder-hub/datastore";

const DB_NAME = "reminder-hub";

let connection: SQLiteDBConnection | null = null;

/**
 * Adapts @capacitor-community/sqlite to our LocalSqlDriver interface.
 * Note: Web support requires additional setup (JEEP SQLite element); this
 * factory assumes a native platform (iOS/Android).
 */
export async function createCapacitorSqlDriver(): Promise<LocalSqlDriver> {
  if (!connection) {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const retcc = (await sqlite.checkConnectionsConsistency()).result;
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (retcc && isConn) {
      connection = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      connection = await sqlite.createConnection(DB_NAME, false, "no-encryption", 1, false);
    }
    await connection.open();
  }

  const conn = connection;

  return {
    async execute(sql, params = []) {
      await conn.run(sql, params as unknown[]);
    },
    async select<T>(sql: string, params: unknown[] = []) {
      const res = await conn.query(sql, params);
      return (res.values ?? []) as T[];
    },
  };
}
