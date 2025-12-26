export type BuildSTUrlOpts = {
  q?: string;
  near?: string;
  lat?: number;
  lng?: number;
  rKm?: number;
  when?: 'now' | 'next7' | 'next30';
  intent?: 'refresher' | 'renewal' | 'directions';
  cred?: string;
  exp?: number;
};

const BASE_URL = 'https://searchtraining.com.au/search';
const DEFAULT_RADIUS_KM = 50;
const DEFAULT_WHEN: NonNullable<BuildSTUrlOpts['when']> = 'next30';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function buildNeedMoreTrainingUrl(opts: BuildSTUrlOpts = {}): string {
  const params = new URLSearchParams();

  params.set('source', 'wallet');
  params.set('r', String(isFiniteNumber(opts.rKm) ? opts.rKm : DEFAULT_RADIUS_KM));
  params.set('when', opts.when ?? DEFAULT_WHEN);

  if (opts.q) params.set('q', opts.q);
  if (opts.near) params.set('near', opts.near);
  if (isFiniteNumber(opts.lat) && isFiniteNumber(opts.lng)) {
    params.set('lat', String(opts.lat));
    params.set('lng', String(opts.lng));
  }
  if (opts.intent) params.set('intent', opts.intent);
  if (opts.cred) params.set('cred', opts.cred);
  if (isFiniteNumber(opts.exp)) params.set('exp', String(opts.exp));

  return `${BASE_URL}?${params.toString()}`;
}

function runDevSanityChecks() {
  if (!__DEV__) return;

  const baseParams = new URLSearchParams(buildNeedMoreTrainingUrl().split('?')[1] ?? '');
  if (baseParams.get('source') !== 'wallet') {
    // eslint-disable-next-line no-console
    console.warn('[SearchTraining] Missing source=wallet param.');
  }
  if (baseParams.get('when') !== DEFAULT_WHEN) {
    // eslint-disable-next-line no-console
    console.warn('[SearchTraining] Missing default when param.');
  }
  if (baseParams.get('r') !== String(DEFAULT_RADIUS_KM)) {
    // eslint-disable-next-line no-console
    console.warn('[SearchTraining] Missing default radius param.');
  }

  const encodedParams = new URLSearchParams(
    buildNeedMoreTrainingUrl({ q: 'chainsaw refresher' }).split('?')[1] ?? ''
  );
  if (encodedParams.get('q') !== 'chainsaw refresher') {
    // eslint-disable-next-line no-console
    console.warn('[SearchTraining] Query encoding failed.');
  }
}

runDevSanityChecks();
