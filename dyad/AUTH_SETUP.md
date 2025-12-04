# Authentication Setup Instructions

## 1. Generate Encryption Keys

Run the setup script to generate encryption keys:

```bash
cd /Users/mymac/Desktop/DYAD_BOLT/dyad
npx tsx src/server/setup-auth.ts
```

This will generate:
- `ENCRYPTION_KEY` - For encrypting user credentials
- `JWT_SECRET` - For signing JWT tokens

## 2. Update .env File

Add the generated values to your `.env` file:

```env
# Authentication
JWT_SECRET=<generated-value>
JWT_EXPIRY=7d

# Encryption  
ENCRYPTION_KEY=<generated-value>
```

**Important:** Remove or comment out the global `GITHUB_TOKEN` from `.env` as it will now be user-specific:
```env
# GITHUB_TOKEN=<removed - now user-specific>
```

## 3. Run Database Migration

Run the migration script to create authentication tables:

```bash
npx tsx src/server/migrate-db.ts
```

This will:
- Create `users` table
- Create `user_credentials` table
- Add `user_id` column to `bolt_projects`
- Add `user_id` column to `bolt_files`

## 4. Restart the Server

After completing the above steps, restart your DYAD server:

```bash
npm run dev:server-only
```

## 5. Test Authentication

Test the authentication endpoints:

### Register a new user:
```bash
curl -X POST http://localhost:9999/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

### Login:
```bash
curl -X POST http://localhost:9999/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Store credentials (use the token from login):
```bash
curl -X POST http://localhost:9999/api/credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{"type":"github_token","value":"ghp_your_github_token"}'
```

## Next Steps

After backend setup is complete, you'll need to:
1. Create frontend authentication components
2. Update Bolt.diy to use authentication
3. Add credential setup modal
4. Update deployment buttons to use stored credentials
