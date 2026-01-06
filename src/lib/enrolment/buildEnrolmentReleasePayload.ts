import {
  validateEnrolmentReleasePayload,
  type EnrolmentReleasePayload,
} from '@/src/lib/contracts/validateEnrolmentReleasePayload';

export type CodeReference = { code: string; label: string };

export type EnrolmentProfile = {
  learnerId?: string;
  identity: {
    familyName: string;
    givenNames: string;
    title?: string;
    dateOfBirth: string;
    sex: CodeReference;
  };
  contact: {
    email: string;
    mobilePhone?: string;
    otherPhone?: string;
  };
  residentialAddress: {
    line1: string;
    line2?: string;
    suburbTown: string;
    state: CodeReference;
    postcode: string;
    country: CodeReference;
  };
  postalAddress?: {
    sameAsResidential: boolean;
    line1?: string;
    line2?: string;
    suburbTown?: string;
    state?: CodeReference;
    postcode?: string;
    country?: CodeReference;
  };
  demographics: {
    indigenousStatus: CodeReference;
    countryOfBirth: CodeReference;
    languageAtHome: CodeReference;
    disabilityFlag: boolean;
    disabilityTypes?: CodeReference[];
  };
  education: {
    highestSchoolLevelCompleted: CodeReference;
    yearSchoolCompleted?: CodeReference;
    stillAtSchool: boolean;
    priorEducationAchievements: CodeReference[];
  };
  employment: {
    labourForceStatus: CodeReference;
    studyReason: CodeReference;
  };
  usi: {
    usi: string;
    usiVerifiedStatus: 'unverified' | 'verified' | 'exempt' | 'unknown';
    usiConsentVersion: string;
    usiConsentSignedAt: string;
    usiExemptionReason?: string;
  };
};

export type EnrolmentContext = {
  meta?: {
    schemaVersion?: string;
    sourceSystem?: string;
    sourceSystemVersion?: string;
    createdAt?: string;
    releasedAt?: string;
    payloadId?: string;
    correlationId?: string;
  };
  enrolment: {
    enrolmentId?: string;
    courseInstanceId: string;
    courseId?: string;
    rtoId: string;
    deliveryLocationId: string;
    commencementDate: string;
    completionDate: string;
    paymentStatus: string;
    fundingSource?: string;
    outcomeIdentifier?: string;
  };
  consents: {
    ncverPrivacyNoticeVersion: string;
    ncverPrivacyNoticeAckAt: string;
    ncverSurveyOptOut?: boolean;
    avetmissReleaseConsent: boolean;
    avetmissReleaseVersion: string;
    avetmissReleaseSignedAt: string;
  };
  modules?: EnrolmentReleasePayload['modules'];
};

export type EnrolmentReleasePayloadValidationError = Error & {
  errors: Array<{ path: string; message: string }>;
};

export function buildEnrolmentReleasePayload(input: {
  profile: EnrolmentProfile;
  enrolmentContext: EnrolmentContext;
}): EnrolmentReleasePayload {
  const now = new Date().toISOString();
  const { profile, enrolmentContext } = input;

  const payload: EnrolmentReleasePayload = {
    meta: {
      schemaVersion: enrolmentContext.meta?.schemaVersion ?? '1.1.0',
      sourceSystem: enrolmentContext.meta?.sourceSystem ?? 'training-wallet-mobile',
      sourceSystemVersion: enrolmentContext.meta?.sourceSystemVersion,
      createdAt: enrolmentContext.meta?.createdAt ?? now,
      releasedAt: enrolmentContext.meta?.releasedAt ?? now,
      payloadId: enrolmentContext.meta?.payloadId,
      correlationId: enrolmentContext.meta?.correlationId,
    },
    learner: {
      learnerId: profile.learnerId,
      identity: profile.identity,
      contact: profile.contact,
      residentialAddress: profile.residentialAddress,
      postalAddress: profile.postalAddress ?? { sameAsResidential: true },
      demographics: profile.demographics,
      education: profile.education,
      employment: profile.employment,
      usi: profile.usi,
    },
    enrolment: enrolmentContext.enrolment,
    consents: enrolmentContext.consents,
    modules: enrolmentContext.modules,
  };

  const result = validateEnrolmentReleasePayload(payload);
  if (!result.ok) {
    const error = new Error('Invalid enrolment release payload') as EnrolmentReleasePayloadValidationError;
    error.errors = result.errors;
    throw error;
  }

  return result.data;
}
