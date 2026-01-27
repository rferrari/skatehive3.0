#!/usr/bin/env node

const { Client } = require('pg');

async function run() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Missing DATABASE_URL environment variable');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const handle = `smoke_${Date.now()}`;
    const insertResult = await client.query(
      'insert into public.userbase_users (handle) values ($1) returning id, handle',
      [handle]
    );

    const inserted = insertResult.rows[0];
    if (!inserted?.id) {
      throw new Error('Insert failed: no id returned');
    }

    const readResult = await client.query(
      'select id, handle from public.userbase_users where id = $1',
      [inserted.id]
    );

    if (!readResult.rows.length) {
      throw new Error('Read failed: inserted row not found');
    }

    await client.query('delete from public.userbase_users where id = $1', [inserted.id]);

    console.log('Userbase smoke test passed');
  } catch (error) {
    console.error('Userbase smoke test failed');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
