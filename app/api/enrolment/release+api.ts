import { validateEnrolmentReleasePayload } from '@/src/lib/contracts/validateEnrolmentReleasePayload';

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, errors: [{ path: '$', message: 'Invalid JSON body' }] },
      { status: 400 }
    );
  }

  const result = validateEnrolmentReleasePayload(payload);
  if (!result.ok) {
    return Response.json({ ok: false, errors: result.errors }, { status: 400 });
  }

  // TODO: map result.data into ST checkout/enrolment tables.
  // TODO: persist consent metadata and release audit trail for compliance.
  return Response.json({ ok: true, accepted: true });
}
