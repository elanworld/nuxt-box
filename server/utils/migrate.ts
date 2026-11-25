import type Database from 'better-sqlite3'

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_updated_idx ON tasks (updated_at);

CREATE TABLE IF NOT EXISTS task_updates (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS task_updates_task_idx ON task_updates (task_id);
`

export function runSqliteMigrations(sqlite: Database.Database) {
  sqlite.transaction(() => {
    sqlite.exec(MIGRATION_SQL)
    const column = sqlite.prepare("SELECT name FROM pragma_table_info('tasks') WHERE name = 'tags'").get()
    if (!column) {
      sqlite.exec("ALTER TABLE tasks ADD COLUMN tags TEXT DEFAULT '[]' NOT NULL")
    }
  }).immediate()
}