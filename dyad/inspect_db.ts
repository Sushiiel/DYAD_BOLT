import Database from 'better-sqlite3';

const db = new Database('/Users/mymac/Desktop/DYAD_BOLT/dyad/userData/sqlite.db', { verbose: console.log });

console.log('--- Tables ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('\n--- Migrations ---');
try {
    const migrations = db.prepare("SELECT * FROM __drizzle_migrations").all();
    console.log(migrations);
} catch (e) {
    console.log('Could not read __drizzle_migrations:', e.message);
}

console.log('\n--- bolt_projects columns ---');
try {
    const columns = db.prepare("PRAGMA table_info(bolt_projects)").all();
    console.log(columns);
} catch (e) {
    console.log('Could not read bolt_projects:', e.message);
}
