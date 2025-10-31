#!/usr/bin/env node

/**
 * Skatehive Scripts Runner
 * Usage: node scripts/index.js <command>
 * 
 * Available commands:
 * - db:inspect     - Inspect database schema
 * - db:fix-auth    - Fix auth_ott table schema
 * - vip:generate   - Generate new VIP codes
 * - help          - Show this help message
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  'db:inspect': 'database/inspect-schema.js',
  'db:fix-auth': 'database/fix-auth-ott-schema.js',
  'db:migrate': 'database/migrate-database.sh',
  'vip:generate': 'vip-management/generate-vip.js',
};

function showHelp() {
  console.log('🛹 Skatehive Scripts Runner\n');
  console.log('Usage: node scripts/index.js <command>\n');
  console.log('Available commands:');
  console.log('  db:inspect     - Inspect database table schemas');
  console.log('  db:fix-auth    - Fix auth_ott table schema issues');
  console.log('  db:migrate     - Run database migration scripts');
  console.log('  vip:generate   - Generate new VIP invitation codes');
  console.log('  help          - Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/index.js db:inspect');
  console.log('  node scripts/index.js vip:generate');
  console.log('  pnpm db:inspect  # Using package.json scripts');
}

function runScript(command) {
  const scriptPath = commands[command];
  
  if (!scriptPath) {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }

  const fullPath = path.join(__dirname, scriptPath);
  
  console.log(`🚀 Running: ${command}`);
  console.log(`📁 Script: ${scriptPath}\n`);

  // Determine if it's a shell script or node script
  const isShellScript = scriptPath.endsWith('.sh');
  const executor = isShellScript ? 'bash' : 'node';

  const child = spawn(executor, [fullPath], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.error(`\n❌ Script failed with exit code ${code}`);
      process.exit(code);
    }
    console.log(`\n✅ Script completed successfully`);
  });

  child.on('error', (error) => {
    console.error(`\n💥 Failed to run script: ${error.message}`);
    process.exit(1);
  });
}

// Parse command line arguments
const command = process.argv[2];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

runScript(command);