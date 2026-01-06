import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'training_wallet.enrolment_release_audit.v1';

export type EnrolmentReleaseAuditRecord = {
  id: string;
  releasedAt: string;
  recipientSystem: 'ST';
  schemaVersion: string;
  courseInstanceId: string;
  rtoId: string;
};

type EnrolmentReleaseAuditInput = Omit<EnrolmentReleaseAuditRecord, 'id'>;

async function readAll(): Promise<EnrolmentReleaseAuditRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is EnrolmentReleaseAuditRecord => {
      if (!item || typeof item !== 'object') return false;
      const anyItem = item as Partial<EnrolmentReleaseAuditRecord>;
      return (
        typeof anyItem.id === 'string' &&
        typeof anyItem.releasedAt === 'string' &&
        typeof anyItem.recipientSystem === 'string' &&
        typeof anyItem.schemaVersion === 'string' &&
        typeof anyItem.courseInstanceId === 'string' &&
        typeof anyItem.rtoId === 'string'
      );
    });
  } catch {
    return [];
  }
}

async function writeAll(records: EnrolmentReleaseAuditRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function addEnrolmentReleaseAuditRecord(
  input: EnrolmentReleaseAuditInput
): Promise<EnrolmentReleaseAuditRecord> {
  const record: EnrolmentReleaseAuditRecord = {
    id: `release_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    ...input,
  };

  const existing = await readAll();
  await writeAll([record, ...existing]);
  return record;
}
