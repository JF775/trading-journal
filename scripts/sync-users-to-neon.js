const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
let dbUrl = '';
for (const line of env.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('DATABASE_URL=')) {
    dbUrl = trimmed.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
}

const client = new Client({
  connectionString: dbUrl,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');

    const usersPath = path.join(__dirname, '..', 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    console.log(`Migrating ${users.length} users to Neon...`);

    for (const u of users) {
      const query = `
        INSERT INTO "User" (id, name, email, avatar, provider, password_hash, role, preferred_broker, created_at, last_login)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          avatar = EXCLUDED.avatar,
          preferred_broker = EXCLUDED.preferred_broker,
          last_login = EXCLUDED.last_login;
      `;
      await client.query(query, [
        u.id,
        u.name,
        u.email.toLowerCase().trim(),
        u.avatar || null,
        u.provider || 'credentials',
        u.password_hash || null,
        u.role || 'client_starter',
        u.preferred_broker || 'Exness',
        u.created_at ? new Date(u.created_at) : new Date(),
        u.last_login ? new Date(u.last_login) : new Date()
      ]);
    }

    console.log('All users successfully migrated/synced to Neon!');
    const res = await client.query('SELECT id, name, email, role FROM "User"');
    console.log(`Current Neon users (${res.rows.length}):`, res.rows.map(r => `${r.email} (${r.role})`));
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
