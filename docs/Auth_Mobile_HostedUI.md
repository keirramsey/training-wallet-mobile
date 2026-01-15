# Training Wallet Mobile Auth (Hosted UI + PKCE)

This app uses Cognito Hosted UI with PKCE and returns to the app via a deep link.
Tokens are stored in SecureStore (Keychain/Keystore) and used as Bearer tokens for API calls.

## Required env keys (names only)
- `EXPO_PUBLIC_COGNITO_DOMAIN`
- `EXPO_PUBLIC_COGNITO_CLIENT_ID`
- `EXPO_PUBLIC_COGNITO_SCOPES` (default: `openid email profile`)
- `EXPO_PUBLIC_COGNITO_REDIRECT_SCHEME` (default: `trainingwallet`)
- `EXPO_PUBLIC_COGNITO_REDIRECT_PATH` (default: `auth/callback`)
- `EXPO_PUBLIC_API_BASE_URL` (or `EXPO_PUBLIC_ST_API_BASE_URL`)

## Deep link scheme
- `app.json` must include `scheme: "trainingwallet"` (already present).
- If you change the scheme or path, update the env keys above.

## Flow summary
1) User taps “Sign in with Cognito”.
2) System browser opens Cognito Hosted UI.
3) After login, Cognito redirects to the app via deep link.
4) App exchanges the code for tokens, verifies nonce, and stores tokens in SecureStore.
5) API calls attach `Authorization: Bearer <access_token>`.

## Claim mapping
- `userId`: `sub`
- `orgId`: `org_id` (fallback to `custom:rto_id` with a one-time warning)
- `roles`: `cognito:groups` array

## Manual verification checklist
- Sign-in opens the system browser and returns to the app.
- After sign-in, Settings → Security shows userId, orgId, roles, and expiry.
- Tokens are stored in SecureStore (not AsyncStorage).
- API calls include `Authorization: Bearer <access_token>`.
- Sign out clears SecureStore tokens and returns to the welcome flow.

## Troubleshooting
- If the app does not return after login, confirm the redirect scheme/path matches `app.json` and env.
- If org/roles are missing, inspect the id_token claims in Cognito.
- Demo login is disabled in dev/prod; it is only allowed in test builds.
