import { validateEnrolmentReleasePayload } from '../src/lib/contracts/validateEnrolmentReleasePayload';

const now = new Date().toISOString();

const payload = {
  meta: {
    schemaVersion: '1.1.0',
    sourceSystem: 'training-wallet-mobile',
    sourceSystemVersion: 'local-dev',
    createdAt: now,
    releasedAt: now,
    payloadId: 'payload-0001',
    correlationId: 'corr-0001',
  },
  learner: {
    learnerId: 'learner-0001',
    identity: {
      familyName: 'Citizen',
      givenNames: 'Testy',
      title: 'Mx',
      dateOfBirth: '1990-01-01',
      sex: { code: 'X', label: 'Unspecified' },
    },
    contact: {
      email: 'testy.citizen@example.com',
      mobilePhone: '+61 412 345 678',
    },
    residentialAddress: {
      line1: '123 Example Street',
      line2: 'Unit 1',
      suburbTown: 'Sydney',
      state: { code: 'NSW', label: 'New South Wales' },
      postcode: '2000',
      country: { code: 'AU', label: 'Australia' },
    },
    postalAddress: {
      sameAsResidential: true,
    },
    demographics: {
      indigenousStatus: { code: '9', label: 'Not stated' },
      countryOfBirth: { code: '1101', label: 'Australia' },
      languageAtHome: { code: '1201', label: 'English' },
      disabilityFlag: false,
    },
    education: {
      highestSchoolLevelCompleted: { code: '12', label: 'Year 12' },
      yearSchoolCompleted: { code: '2010', label: '2010' },
      stillAtSchool: false,
      priorEducationAchievements: [{ code: '13', label: 'Certificate III' }],
    },
    employment: {
      labourForceStatus: { code: '01', label: 'Full-time' },
      studyReason: { code: '15', label: 'Develop skills' },
    },
    usi: {
      usi: 'A1B2C3D4E5',
      usiVerifiedStatus: 'verified',
      usiConsentVersion: '2024-01',
      usiConsentSignedAt: now,
    },
  },
  enrolment: {
    enrolmentId: 'enrol-0001',
    courseInstanceId: 'course-instance-0001',
    courseId: 'course-0001',
    rtoId: 'rto-0001',
    deliveryLocationId: 'delivery-0001',
    commencementDate: '2024-01-01',
    completionDate: '2024-12-31',
    paymentStatus: 'pending',
    fundingSource: 'self',
    outcomeIdentifier: 'outcome-001',
  },
  consents: {
    ncverPrivacyNoticeVersion: '2024-01',
    ncverPrivacyNoticeAckAt: now,
    ncverSurveyOptOut: false,
    avetmissReleaseConsent: true,
    avetmissReleaseVersion: '2024-01',
    avetmissReleaseSignedAt: now,
  },
};

const result = validateEnrolmentReleasePayload(payload);
if (!result.ok) {
  throw new Error(`Generated payload is invalid: ${JSON.stringify(result.errors)}`);
}

console.log(JSON.stringify(payload, null, 2));
