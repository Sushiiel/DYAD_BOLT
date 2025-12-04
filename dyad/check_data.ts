import Database from 'better-sqlite3';

const db = new Database('/Users/mymac/Desktop/DYAD_BOLT/dyad/userData/sqlite.db', { verbose: console.log });

const tables = ['bolt_projects', 'users', 'apps', 'chats'];
for (const table of tables) {
    try {
        const count = db.prepare(`SELECT count(*) as c FROM ${table}`).get() as any;
        console.log(`${table}: ${count.c}`);
    } catch (e: any) {
        console.log(`${table}: error ${e.message}`);
    }
}
