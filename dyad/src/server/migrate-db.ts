#!/usr/bin/env node

/**
 * Database migration script to add authentication tables
 * This will create the users and userCredentials tables
 * 
 * WARNING: This will modify your database schema!
 * Make a backup before running this script.
 */

import { db, initializeDatabase } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log('Starting database migration...\n');

    try {
        // Initialize the database first
        await initializeDatabase();
        console.log('✓ Database initialized\n');

        // Create users table
        console.log('Creating users table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
      )
    `);
        console.log('✓ Users table created');

        // Create userCredentials table
        console.log('Creating user_credentials table...');
        await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        credential_type TEXT NOT NULL,
        encrypted_value TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('✓ User credentials table created');

        // Add userId column to bolt_projects table (if not exists)
        console.log('Adding userId column to bolt_projects...');
        try {
            await db.run(sql`
        ALTER TABLE bolt_projects ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE
      `);
            console.log('✓ Added userId to bolt_projects');
        } catch (error: any) {
            if (error.message.includes('duplicate column')) {
                console.log('  (userId column already exists in bolt_projects)');
            } else {
                throw error;
            }
        }

        // Add userId column to bolt_files table (if not exists)
        console.log('Adding userId column to bolt_files...');
        try {
            await db.run(sql`
        ALTER TABLE bolt_files ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE
      `);
            console.log('✓ Added userId to bolt_files');
        } catch (error: any) {
            if (error.message.includes('duplicate column')) {
                console.log('  (userId column already exists in bolt_files)');
            } else {
                throw error;
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run the setup-auth script to generate encryption keys');
        console.log('2. Add the generated keys to your .env file');
        console.log('3. Restart your server\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
