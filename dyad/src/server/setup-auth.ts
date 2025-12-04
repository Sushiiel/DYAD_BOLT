#!/usr/bin/env node

/**
 * Setup script for generating encryption keys and JWT secrets
 * Run this script once during initial setup
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate encryption key (32 bytes = 64 hex characters)
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate JWT secret (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('\n=== Authentication Setup ===\n');
console.log('Generated encryption key and JWT secret.');
console.log('\nAdd these to your .env file:\n');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_EXPIRY=7d`);
console.log('\n');

// Optionally write to .env file
const envPath = path.join(__dirname, '../.env');
const envExample = `
# Authentication
JWT_SECRET=${jwtSecret}
JWT_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=${encryptionKey}

# Note: Remove GITHUB_TOKEN from here - it will be user-specific
# GITHUB_TOKEN=<removed>
`;

console.log('Would you like to append these to your .env file? (You can also copy them manually)');
console.log(`\nTo append automatically, run:\necho '${envExample}' >> ${envPath}\n`);
