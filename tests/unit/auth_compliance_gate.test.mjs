import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { runAuthComplianceCheck } from '../../scripts/auth-compliance-check.mjs';

async function writeFile(rootDir, relativePath, contents) {
  const fullPath = path.join(rootDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, contents, 'utf8');
}

test('mobile auth compliance gate enforces SecureStore + PKCE + nonce', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tw-mobile-auth-check-'));

  await writeFile(
    tmpDir,
    'src/auth/auth.ts',
    "import AsyncStorage from '@react-native-async-storage/async-storage';\nconst foo = 'usePKCE';\n"
  );
  await writeFile(tmpDir, 'src/lib/api.ts', "export function api(){}");

  const failResult = await runAuthComplianceCheck({ rootDir: tmpDir });
  assert.equal(failResult.ok, false);

  await writeFile(
    tmpDir,
    'src/auth/auth.ts',
    "import * as SecureStore from 'expo-secure-store';\nconst ACCESS_TOKEN_KEY='x';const ID_TOKEN_KEY='y';\nconst usePKCE=true;const nonce='n';\nconst claims={nonce:'n','org_id':'rto','cognito:groups':['owner'],'custom:rto_id':'legacy'};\nconsole.warn('auth_claim_fallback_custom_rto_id');\nconst code_verifier='x';\nif (claims.nonce !== 'n') { throw new Error('Invalid nonce'); }\nSecureStore.setItemAsync(ACCESS_TOKEN_KEY,'a');SecureStore.setItemAsync(ID_TOKEN_KEY,'b');\n"
  );
  await writeFile(tmpDir, 'src/lib/api.ts', "export const h = { Authorization: 'Bearer t' }");

  const passResult = await runAuthComplianceCheck({ rootDir: tmpDir });
  assert.equal(passResult.ok, true);
});
