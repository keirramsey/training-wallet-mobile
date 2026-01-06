import { test, expect } from '@playwright/test';

test('POST /api/enrolment/release validates payload', async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/api/enrolment/release`, {
    data: { not: 'valid' },
  });

  expect(response.status()).toBe(400);

  const body = (await response.json()) as { ok?: boolean; errors?: unknown };
  expect(body.ok).toBe(false);
  expect(Array.isArray(body.errors)).toBe(true);
});
