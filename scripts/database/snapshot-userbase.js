const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function redactRow(row) {
  const redacted = { ...row };
  const redactKeys = [
    'refresh_token_hash',
    'token_hash',
    'ciphertext',
    'dek_wrapped',
    'secret_hash',
    'ip_hash',
  ];
  for (const key of redactKeys) {
    if (key in redacted && redacted[key] != null) {
      redacted[key] = '[redacted]';
    }
  }
  return redacted;
}

async function main() {
  const env = {
    ...process.env,
    ...parseEnvFile(path.join(process.cwd(), '.env.local')),
  };

  if (!env.DATABASE_URL) {
    console.error('DATABASE_URL missing in .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  const { rows: tables } = await client.query(
    `select tablename
     from pg_tables
     where schemaname = 'public'
       and tablename like 'userbase_%'
     order by tablename`
  );

  for (const { tablename } of tables) {
    const { rows: countRows } = await client.query(
      `select count(*)::int as count from public.${tablename}`
    );
    const count = countRows[0]?.count ?? 0;
    console.log(`\n== ${tablename} (${count}) ==`);
    if (count > 0) {
      const { rows } = await client.query(
        `select * from public.${tablename} order by created_at desc nulls last limit 5`
      );
      rows.map(redactRow).forEach((row) => console.log(row));
    }
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
