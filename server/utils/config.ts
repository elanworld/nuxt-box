export function getSqlitePath() {
  return process.env.SQLITE_PATH || useRuntimeConfig().sqlitePath || './data/tasks.db'
}