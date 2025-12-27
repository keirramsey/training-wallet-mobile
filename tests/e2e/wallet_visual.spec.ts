import { expect, test } from '@playwright/test';

const FIXED_TIME_ISO = '2025-01-01T00:00:00.000Z';
const FIXED_TIME_MS = new Date(FIXED_TIME_ISO).getTime();
const LOCAL_CREDENTIALS_KEY = 'training_wallet.local_credentials.v1';

const seedLocalCredentials = () => [
  {
    id: 'local_20250101_01',
    title: 'Construction Safety L2',
    issuer_name: 'OSHA Training Institute',
    issuer_logo_url: null,
    issued_at: '2024-12-12T00:00:00.000Z',
    expires_at: '2025-02-15T00:00:00.000Z',
    status: 'verified',
    category: 'Safety Cert',
    colorTheme: 'blue',
    licence_id: '882-119-220',
    rto_code: 'RTO 91405',
    units: [{ code: 'CPCCWHS1001', title: 'Prepare to work safely in the construction industry' }],
    evidence: [],
  },
  {
    id: 'local_20250101_02',
    title: 'Forklift Operator',
    issuer_name: 'Warehouse Pro Training',
    issuer_logo_url: null,
    issued_at: '2024-11-24T00:00:00.000Z',
    expires_at: '2026-11-24T00:00:00.000Z',
    status: 'processing',
    category: 'Heavy Machinery',
    colorTheme: 'slate',
    licence_id: 'FLT-78234',
    rto_code: 'RTO 41003',
    units: [{ code: 'TLILIC0003', title: 'Licence to operate a forklift truck' }],
    evidence: [],
  },
  {
    id: 'local_20250101_03',
    title: 'First Aid / CPR',
    issuer_name: 'Australian Red Cross',
    issuer_logo_url: null,
    issued_at: '2023-10-23T00:00:00.000Z',
    expires_at: '2024-10-23T00:00:00.000Z',
    status: 'expired',
    category: 'Healthcare',
    colorTheme: 'rose',
    licence_id: 'FA-2023-4521',
    rto_code: 'RTO 3067',
    units: [{ code: 'HLTAID011', title: 'Provide first aid' }],
    evidence: [],
  },
];

test.use({
  viewport: { width: 430, height: 932 },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ fixedTime, storageKey, storageValue }) => {
    const OriginalDate = Date;

    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixedTime);
          return;
        }

        switch (args.length) {
          case 1:
            super(args[0]);
            return;
          case 2:
            super(args[0], args[1]);
            return;
          case 3:
            super(args[0], args[1], args[2]);
            return;
          case 4:
            super(args[0], args[1], args[2], args[3]);
            return;
          case 5:
            super(args[0], args[1], args[2], args[3], args[4]);
            return;
          case 6:
            super(args[0], args[1], args[2], args[3], args[4], args[5]);
            return;
          default:
            super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
      }
      static now() {
        return fixedTime;
      }
      static parse(str: string) {
        return OriginalDate.parse(str);
      }
      static UTC(...args: Parameters<typeof Date.UTC>) {
        return OriginalDate.UTC(...args);
      }
    }

    // @ts-expect-error override Date for deterministic E2E rendering
    window.Date = MockDate;

    window.localStorage.setItem(storageKey, storageValue);
  }, {
    fixedTime: FIXED_TIME_MS,
    storageKey: LOCAL_CREDENTIALS_KEY,
    storageValue: JSON.stringify(seedLocalCredentials()),
  });

  await page.route('**/api/credentials**', async (route) => {
    const url = route.request().url();
    const isDetail = /\/api\/credentials\/.+/.test(url);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(isDetail ? { ok: true, item: null } : { ok: true, items: [] }),
    });
  });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        transition-duration: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
});

test('home visual regression', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="home-root"]:visible').first().waitFor();
  await page.locator('[data-testid="home-content"]:visible').first().waitFor({ state: 'attached' });
  await expect(page).toHaveScreenshot('home.png');
});

test('credential detail visual regression', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-testid="home-root"]:visible').first().waitFor();
  await page.locator('[data-testid="home-content"]:visible').first().waitFor({ state: 'attached' });

  const firstTicket = page.locator('[data-ticket-id]:visible').first();
  await expect(firstTicket).toBeVisible();
  await firstTicket.scrollIntoViewIfNeeded();

  const id = await firstTicket.getAttribute('data-ticket-id');
  expect(id).toBeTruthy();

  await page.goto(`/credential/${id}`);
  await page.locator('[data-testid="credential-detail-root"]:visible').first().waitFor();
  await page.locator('[data-testid="credential-detail-content"]:visible').first().waitFor({ state: 'attached' });
  await expect(page).toHaveScreenshot('credential-detail.png');
});

test('history screen visual regression', async ({ page }) => {
  await page.goto('/history');
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  // Wait a bit for animations to settle
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot('history.png');
});

test('history screen with expired filter', async ({ page }) => {
  await page.goto('/history');
  await page.waitForLoadState('networkidle');

  // Click on Expired filter chip
  const expiredChip = page.getByRole('button', { name: 'Expired' });
  await expiredChip.click();
  await page.waitForTimeout(300);

  await expect(page).toHaveScreenshot('history-expired.png');
});

test('profile screen visual regression', async ({ page }) => {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await expect(page).toHaveScreenshot('profile.png');
});

test('bottom navigation is visible on all screens', async ({ page }) => {
  // Check wallet tab
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const walletTab = page.getByRole('button', { name: /wallet/i }).first();
  await expect(walletTab).toBeVisible();

  // Check history tab
  await page.goto('/history');
  await page.waitForLoadState('networkidle');
  const historyTab = page.getByRole('button', { name: /history/i }).first();
  await expect(historyTab).toBeVisible();

  // Check profile tab
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  const profileTab = page.getByRole('button', { name: /profile/i }).first();
  await expect(profileTab).toBeVisible();
});

test('central AI button is visible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check for the AI assistant button
  const aiButton = page.getByRole('button', { name: /ai assistant/i });
  await expect(aiButton).toBeVisible();
});
