// In-memory D1 stand-in backed by Node's built-in SQLite, so the functions
// suite exercises the real SQL (parameter binding, ON CONFLICT, FKs) without
// needing a D1 runtime. Exposes the same prepare/batch surface the app uses.
import { DatabaseSync } from 'node:sqlite';
import { D1_SCHEMA_SQL, PLAYGROUND_SCHEMA_SQL } from '../api/_db.js';

export function createFakeD1() {
  const db = new DatabaseSync(':memory:');

  return {
    exec(sql) {
      return db.exec(sql);
    },
    prepare(sql) {
      const make = (...params) => {
        const stmt = db.prepare(sql);
        return {
          async first() {
            const row = stmt.get(...params);
            return row ?? null;
          },
          async all() {
            return { results: stmt.all(...params) };
          },
          async run() {
            const r = stmt.run(...params);
            return { meta: { last_row_id: Number(r.lastInsertRowid) } };
          },
        };
      };
      return {
        bind: (...params) => make(...params),
        async run() {
          return make().run();
        },
        async first() {
          return make().first();
        },
        async all() {
          return make().all();
        },
      };
    },
    async batch(stmts) {
      const results = [];
      for (const s of stmts) results.push(await s.run());
      return results;
    },
    close() {
      db.close();
    },
  };
}

function applySchema(db, schemaSql) {
  for (const stmt of schemaSql.split(';').map(s => s.trim()).filter(Boolean)) {
    db.exec(stmt);
  }
}

export function createTestDb() {
  const db = createFakeD1();
  applySchema(db, D1_SCHEMA_SQL);
  return db;
}

export function createPlaygroundDb() {
  const db = createFakeD1();
  applySchema(db, PLAYGROUND_SCHEMA_SQL);
  return db;
}
