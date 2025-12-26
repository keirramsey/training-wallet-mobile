import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, apiFetch } from '@/src/lib/api';

type EndpointKey = 'health' | 'me' | 'credentials';

type Endpoint = {
  key: EndpointKey;
  label: string;
  path: string;
};

type LastResponse = {
  key: EndpointKey;
  path: string;
  payload: unknown;
  durationMs: number;
};

type LastError = {
  key: EndpointKey;
  path: string;
  message: string;
  httpStatus?: number;
  durationMs: number;
};

function normalizeApiError(err: unknown): { message: string; httpStatus?: number } {
  const anyErr = err as { message?: unknown; status?: unknown };

  const rawMessage = typeof anyErr?.message === 'string' ? anyErr.message.trim() : '';
  const httpStatus = typeof anyErr?.status === 'number' ? anyErr.status : undefined;

  if (!rawMessage) return { message: 'Request failed', httpStatus };

  const containsHttpStatus = /\b\d{3}\b/.test(rawMessage);
  const alreadyGeneric = /^request failed\b/i.test(rawMessage);
  if (containsHttpStatus || alreadyGeneric) return { message: rawMessage, httpStatus };

  return { message: `Request failed: ${rawMessage}`, httpStatus };
}

function formatErrorMessage(error: LastError): string {
  if (typeof error.httpStatus === 'number' && !error.message.includes(String(error.httpStatus))) {
    return `HTTP ${error.httpStatus}: ${error.message}`;
  }
  return error.message;
}

export default function PingApiScreen() {
  const endpoints = useMemo<Endpoint[]>(
    () => [
      { key: 'health', label: 'Ping /health', path: '/health' },
      { key: 'me', label: 'GET /api/me', path: '/api/me' },
      { key: 'credentials', label: 'GET /api/credentials', path: '/api/credentials' },
    ],
    []
  );

  const [loadingByKey, setLoadingByKey] = useState<Record<EndpointKey, boolean>>({
    health: false,
    me: false,
    credentials: false,
  });

  const [lastResponse, setLastResponse] = useState<LastResponse | null>(null);
  const [lastError, setLastError] = useState<LastError | null>(null);
  const [lastRequestKey, setLastRequestKey] = useState<EndpointKey | null>(null);

  const lastEndpoint = useMemo(() => {
    if (!lastRequestKey) return null;
    return endpoints.find((e) => e.key === lastRequestKey) ?? null;
  }, [endpoints, lastRequestKey]);

  const retryDisabled = useMemo(() => {
    const retryKey = lastEndpoint?.key;
    if (!retryKey) return true;
    return loadingByKey[retryKey];
  }, [lastEndpoint?.key, loadingByKey]);

  const runRequest = useCallback(async (endpoint: Endpoint) => {
    setLastRequestKey(endpoint.key);
    setLoadingByKey((prev) => ({ ...prev, [endpoint.key]: true }));
    const startedAt = Date.now();
    try {
      const payload = await apiFetch(endpoint.path);
      const durationMs = Date.now() - startedAt;
      setLastResponse({ key: endpoint.key, path: endpoint.path, payload, durationMs });
    } catch (err) {
      const normalized = normalizeApiError(err);
      const durationMs = Date.now() - startedAt;
      setLastError({
        key: endpoint.key,
        path: endpoint.path,
        message: normalized.message,
        httpStatus: normalized.httpStatus,
        durationMs,
      });
    } finally {
      setLoadingByKey((prev) => ({ ...prev, [endpoint.key]: false }));
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>API Test Panel</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Resolved API_BASE_URL</Text>
        <Text selectable style={styles.mono}>
          {API_BASE_URL}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => lastEndpoint && runRequest(lastEndpoint)}
        disabled={retryDisabled}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && !retryDisabled ? styles.buttonPressed : null,
          retryDisabled ? styles.buttonDisabled : null,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Retry last request</Text>
      </Pressable>

      {endpoints.map((endpoint) => {
        const isLoading = loadingByKey[endpoint.key];
        return (
          <Pressable
            key={endpoint.key}
            accessibilityRole="button"
            onPress={() => runRequest(endpoint)}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.button,
              pressed && !isLoading ? styles.buttonPressed : null,
              isLoading ? styles.buttonDisabled : null,
            ]}
          >
            {isLoading ? (
              <View style={styles.buttonRow}>
                <ActivityIndicator />
                <Text style={styles.buttonText}>Loading…</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{endpoint.label}</Text>
            )}
          </Pressable>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.label}>Last Response</Text>
        {lastResponse ? (
          <>
            <Text style={styles.meta}>
              {lastResponse.path} • {lastResponse.durationMs}ms
            </Text>
            <Text selectable style={styles.mono}>
              {JSON.stringify(lastResponse.payload, null, 2)}
            </Text>
          </>
        ) : (
          <Text style={styles.help}>No responses yet.</Text>
        )}
      </View>

      <View style={[styles.card, lastError ? styles.errorCard : null]}>
        <Text style={styles.label}>Last Error</Text>
        {lastError ? (
          <>
            <Text style={styles.meta}>
              {lastError.path} • {lastError.durationMs}ms
            </Text>
            <Text style={styles.errorText}>{formatErrorMessage(lastError)}</Text>
          </>
        ) : (
          <Text style={styles.help}>No errors yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  errorCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
  },
  mono: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#111827',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  help: {
    color: '#6B7280',
  },
  errorText: {
    color: '#991B1B',
    fontWeight: '600',
  },
});

