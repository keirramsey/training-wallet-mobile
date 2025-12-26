import { buildNeedMoreTrainingUrl } from '@/services/searchTraining';
import type { Credential } from '@/src/types/credential';

export type AssistantAction = { type: 'open_url'; url: string };

export type AssistantResponse = {
  message: string;
  action?: AssistantAction;
};

export type AssistantQuickAction = {
  id: string;
  label: string;
  message: string;
};

export const DEFAULT_QUICK_ACTIONS: AssistantQuickAction[] = [
  { id: 'expiring', label: "What's expiring?", message: "What's expiring?" },
  { id: 'directions', label: 'Directions', message: 'Directions' },
  { id: 'book', label: 'Book refresher', message: 'Book refresher' },
];

type IntentContext = {
  getCredentials?: () => Promise<Credential[]>;
  now?: () => number;
};

const EXPIRING_SOON_DAYS = 7;
const EXPIRING_WINDOW_DAYS = 30;
const DIRECTIONS_ADDRESS = '123 Collins St, Melbourne VIC';

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function matchesAny(input: string, terms: string[]): boolean {
  return terms.some((term) => input.includes(term));
}

function countExpiry(creds: Credential[], now: number) {
  const expired: Credential[] = [];
  const expiringSoon: Credential[] = [];
  const expiringLater: Credential[] = [];

  for (const credential of creds) {
    if (!credential.expires_at) continue;
    const expiryTime = new Date(credential.expires_at).getTime();
    if (Number.isNaN(expiryTime)) continue;

    const days = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
    if (days < 0) {
      expired.push(credential);
      continue;
    }
    if (days <= EXPIRING_SOON_DAYS) {
      expiringSoon.push(credential);
      continue;
    }
    if (days <= EXPIRING_WINDOW_DAYS) {
      expiringLater.push(credential);
    }
  }

  return { expired, expiringSoon, expiringLater };
}

export async function resolveAssistantIntent(input: string, context: IntentContext = {}): Promise<AssistantResponse> {
  const message = normalize(input);

  if (matchesAny(message, ['expiring', 'expiry', 'expires', 'expire', 'expir'])) {
    const creds = context.getCredentials ? await context.getCredentials() : [];
    if (!creds || creds.length === 0) {
      return {
        message:
          "I can't see any wallet credentials yet. Add tickets and I'll keep track of expiry dates for you.",
      };
    }

    const now = context.now ? context.now() : Date.now();
    const { expired, expiringSoon, expiringLater } = countExpiry(creds, now);
    const totalWithDates = expired.length + expiringSoon.length + expiringLater.length;

    if (totalWithDates === 0) {
      return {
        message:
          "I couldn't find any tickets with expiry dates yet. Add expiry details and I'll keep watch.",
      };
    }

    const expiringWithin30 = expiringSoon.length + expiringLater.length;
    const parts = [
      `Expired: ${expired.length}`,
      `Expiring soon (7 days): ${expiringSoon.length}`,
      `Within 30 days: ${expiringWithin30}`,
    ];

    return {
      message: `Here's your expiry snapshot: ${parts.join(' | ')}.`,
    };
  }

  if (matchesAny(message, ['directions', 'map', 'navigate', 'address', 'where'])) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DIRECTIONS_ADDRESS)}`;
    return {
      message: `Opening directions to your next booking at ${DIRECTIONS_ADDRESS}.`,
      action: { type: 'open_url', url },
    };
  }

  if (matchesAny(message, ['refresher', 'book', 'course', 'training'])) {
    const url = buildNeedMoreTrainingUrl({ q: 'chainsaw refresher', intent: 'refresher' });
    return {
      message: 'Opening Search Training for "chainsaw refresher".',
      action: { type: 'open_url', url },
    };
  }

  return {
    message:
      "I can help with what's expiring, directions to your next booking, or booking a refresher.",
  };
}
