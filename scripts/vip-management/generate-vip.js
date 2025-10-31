const argon2 = require('argon2');
const crypto = require('crypto');

async function generateVipCode() {
  // Generate a 6-character code ID (like the existing one)
  const codeId = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  // Generate an 8-character secret
  const secret = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  // Hash the secret
  const secretHash = await argon2.hash(secret);
  
  console.log('Generated VIP Code:');
  console.log(`Full Code: ${codeId}-${secret}`);
  console.log(`Code ID: ${codeId}`);
  console.log(`Secret: ${secret}`);
  console.log(`Secret Hash: ${secretHash}`);
  
  // Test verification
  const isValid = await argon2.verify(secretHash, secret);
  console.log(`Verification Test: ${isValid ? 'PASS' : 'FAIL'}`);
  
  return { codeId, secret, secretHash, fullCode: `${codeId}-${secret}` };
}

// Let's also test what happens if we create a hash for "9F9YWCZS"
async function testKnownSecret() {
  const testSecret = "9F9YWCZS";
  const testHash = await argon2.hash(testSecret);
  
  console.log('\nTesting known secret:');
  console.log(`Secret: ${testSecret}`);
  console.log(`Generated Hash: ${testHash}`);
  
  const isValid = await argon2.verify(testHash, testSecret);
  console.log(`Verification Test: ${isValid ? 'PASS' : 'FAIL'}`);
}

async function main() {
  await generateVipCode();
  await testKnownSecret();
}

main().catch(console.error);