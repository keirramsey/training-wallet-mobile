# Training Wallet Mobile (Expo)

## Run locally

1) Install dependencies:

- `npm install`

2) Create your local env file:

- `cp .env.example .env`
- Set `EXPO_PUBLIC_ST_API_BASE_URL` (example below)

3) Start Expo:

- `npx expo start`

## API configuration

Training Wallet Mobile reads the API base URL from environment variables:

1) `EXPO_PUBLIC_ST_API_BASE_URL` (primary)
2) `EXPO_PUBLIC_API_BASE_URL` (fallback)
3) `http://localhost:3000` (default)

Example:

```
EXPO_PUBLIC_ST_API_BASE_URL=https://st-api-service-production-4618.up.railway.app
```

