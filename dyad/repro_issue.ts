import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { boltProjects } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';

const sqlite = new Database('userData/sqlite.db');
const db = drizzle(sqlite);

async function testProjectCreation() {
    try {
        console.log('Attempting to create project without userId...');
        await db.insert(boltProjects).values({
            id: uuidv4(),
            name: 'Test Project',
            description: 'Test Description',
            // userId is missing
        } as any);
        console.log('Success: Project created without userId');
    } catch (error: any) {
        console.log('Expected Error:', error.message);
    }
}

testProjectCreation();
