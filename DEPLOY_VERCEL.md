# Vercel Deployment - Training Wallet Mobile (Expo Web)

## Vercel Project Settings

- Root Directory: `training-wallet-mobile`
- Build Command: `npx expo export -p web`
- Output Directory: `dist`

## Rewrites (SPA routing)

All routes should rewrite to `/` to support client-side routing. This is configured in `training-wallet-mobile/vercel.json`.

## Environment Variables

Set these variables in Vercel (names only, no secrets here):

- `EXPO_PUBLIC_ST_API_BASE_URL`
- `EXPO_PUBLIC_API_BASE_URL`

## Local Production Test

```sh
cd training-wallet-mobile
npx expo export -p web
npx serve dist
```
