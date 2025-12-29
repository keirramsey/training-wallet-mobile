export type ApiFetchError = Error & {
  status?: number;
  url?: string;
  body?: unknown;
  cause?: unknown;
};

export type ApiFetchInit = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = trimTrailingSlashes(
  process.env.EXPO_PUBLIC_ST_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://localhost:3000'
);

export function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function asErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
    return value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isAbortError(err: unknown): boolean {
  const anyErr = err as { name?: unknown; message?: unknown };
  const name = typeof anyErr?.name === 'string' ? anyErr.name : '';
  const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
  return name === 'AbortError' || /aborted/i.test(message);
}

function isRetryableNetworkError(err: unknown): boolean {
  if (!err) return true;
  const anyErr = err as { name?: unknown; message?: unknown };
  const name = typeof anyErr?.name === 'string' ? anyErr.name : '';
  const message = typeof anyErr?.message === 'string' ? anyErr.message : '';
  if (name === 'TypeError') return true;
  return /network request failed|failed to fetch|load failed|networkerror/i.test(message);
}

function createApiFetchError(params: {
  message: string;
  status?: number;
  url?: string;
  body?: unknown;
  cause?: unknown;
}): ApiFetchError {
  const error = new Error(params.message) as ApiFetchError;
  error.name = 'ApiFetchError';
  error.status = params.status;
  error.url = params.url;
  error.body = params.body;
  if (typeof params.cause !== 'undefined') error.cause = params.cause;
  return error;
}

async function readResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!text) return null;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiFetch<T = unknown>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const hasBody = typeof init.body !== 'undefined' && init.body !== null;
  const isFormData =
    typeof FormData !== 'undefined' && hasBody && init.body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  const url = buildUrl(path);
  const timeoutMs = typeof init.timeoutMs === 'number' ? init.timeoutMs : DEFAULT_TIMEOUT_MS;
  const method = (init.method ?? 'GET').toUpperCase();
  const canAutoRetry = method === 'GET' || method === 'HEAD';

  const attemptFetch = async (attempt: number): Promise<T> => {
    const { timeoutMs: _timeoutMs, signal: externalSignal, ...fetchInit } = init;

    const controller = new AbortController();
    let timedOut = false;

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, { ...fetchInit, headers, signal: controller.signal });
    } catch (cause) {
      clearTimeout(timeoutId);

      if (timedOut) {
        const error = createApiFetchError({
          message: `Request timed out after ${timeoutMs}ms`,
          url,
          cause,
        });
        if (attempt === 0 && canAutoRetry) return attemptFetch(1);
        throw error;
      }

      if (isAbortError(cause) && externalSignal?.aborted) {
        throw createApiFetchError({ message: 'Request aborted', url, cause });
      }

      const message = asErrorMessage(cause);
      const error = createApiFetchError({
        message: message ? `Request failed: ${message}` : 'Request failed',
        url,
        cause,
      });

      if (attempt === 0 && canAutoRetry && isRetryableNetworkError(cause)) return attemptFetch(1);
      throw error;
    }

    let body: unknown;
    try {
      body = await readResponseBody(res);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const message =
        typeof body === 'string' && body.trim()
          ? body
          : `Request failed: ${res.status} ${res.statusText}`;
      throw createApiFetchError({ message, status: res.status, url, body });
    }

    return body as T;
  };

  return attemptFetch(0);
}
