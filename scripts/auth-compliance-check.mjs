import fs from 'node:fs/promises';
import path from 'node:path';

async function readText(rootDir, relativePath) {
  const filePath = path.join(rootDir, relativePath);
  return fs.readFile(filePath, 'utf8');
}

export async function runAuthComplianceCheck({ rootDir = process.cwd() } = {}) {
  const failures = [];

  const authPath = 'src/auth/auth.ts';
  const apiPath = 'src/lib/api.ts';

  const [authFile, apiFile] = await Promise.all([
    readText(rootDir, authPath),
    readText(rootDir, apiPath),
  ]);

  if (authFile.includes('AsyncStorage')) {
    failures.push(`Auth flow must not use AsyncStorage (${authPath}).`);
  }
  if (!authFile.includes('expo-secure-store') && !authFile.includes('SecureStore')) {
    failures.push(`Auth flow must use expo-secure-store (${authPath}).`);
  }
  if (!authFile.includes('usePKCE') || !authFile.includes('nonce')) {
    failures.push(`Auth flow must use PKCE + nonce (${authPath}).`);
  }
  if (!authFile.includes('code_verifier') && !authFile.includes('codeVerifier')) {
    failures.push(`Auth flow must send code_verifier (${authPath}).`);
  }
  if (!authFile.includes('claims.nonce') || !authFile.includes('Invalid nonce')) {
    failures.push(`Auth flow must validate nonce before storing tokens (${authPath}).`);
  }
  if (authFile.includes('EXPO_PUBLIC_DEMO_LOGIN') || authFile.includes('__DEV__')) {
    failures.push(`Demo login flags must not exist in auth flow (${authPath}).`);
  }
  if (!authFile.includes('org_id') || !authFile.includes('cognito:groups')) {
    failures.push(`Auth claims must map org_id and cognito:groups (${authPath}).`);
  }
  if (authFile.includes('custom:rto_id') && !authFile.includes('auth_claim_fallback_custom_rto_id')) {
    failures.push(`custom:rto_id fallback must log a warning (${authPath}).`);
  }
  if (!authFile.includes('setItemAsync') || !authFile.includes('ACCESS_TOKEN_KEY') || !authFile.includes('ID_TOKEN_KEY')) {
    failures.push(`Auth tokens must be stored via SecureStore keys (${authPath}).`);
  }
  if (!apiFile.includes('Authorization')) {
    failures.push(`API client must attach Authorization header (${apiPath}).`);
  }

  return { ok: failures.length === 0, failures };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await runAuthComplianceCheck();
    if (result.ok) {
      console.log('✅ Auth compliance checks passed');
    } else {
      console.error('❌ Auth compliance checks failed:');
      for (const failure of result.failures) {
        console.error(`- ${failure}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Auth compliance checks failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
