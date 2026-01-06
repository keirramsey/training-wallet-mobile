import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSizes, radii, shadows, spacing } from '@/src/theme/tokens';
import { apiFetch, buildUrl } from '@/src/lib/api';
import type { EnrolmentReleasePayload } from '@/src/lib/contracts/validateEnrolmentReleasePayload';
import {
  buildEnrolmentReleasePayload,
  type EnrolmentContext,
  type EnrolmentProfile,
  type EnrolmentReleasePayloadValidationError,
} from '@/src/lib/enrolment/buildEnrolmentReleasePayload';
import { addEnrolmentReleaseAuditRecord } from '@/src/storage/enrolmentReleaseAuditStore';

type ManualEnrolmentForm = {
  givenNames: string;
  familyName: string;
  dateOfBirth: string;
  sex: string;
  email: string;
  mobilePhone: string;
  addressLine1: string;
  suburbTown: string;
  state: string;
  postcode: string;
  courseInstanceId: string;
  rtoId: string;
  deliveryLocationId: string;
  commencementDate: string;
  completionDate: string;
  paymentStatus: string;
  usi: string;
  acknowledgePrivacy: boolean;
  avetmissReleaseConsent: boolean;
  ncverSurveyOptOut: boolean;
};

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

type CodeReference = { code: string; label: string };

const DEFAULT_CODE_REFERENCE: CodeReference = { code: 'UNKNOWN', label: 'Unknown' };
const DEFAULT_COUNTRY: CodeReference = { code: 'AU', label: 'Australia' };
const DEFAULT_PRIOR_EDUCATION: CodeReference = { code: 'NONE', label: 'None' };

const DEFAULT_FORM_STATE: ManualEnrolmentForm = {
  givenNames: '',
  familyName: '',
  dateOfBirth: '',
  sex: '',
  email: '',
  mobilePhone: '',
  addressLine1: '',
  suburbTown: '',
  state: '',
  postcode: '',
  courseInstanceId: '',
  rtoId: '',
  deliveryLocationId: '',
  commencementDate: '',
  completionDate: '',
  paymentStatus: '',
  usi: '',
  acknowledgePrivacy: false,
  avetmissReleaseConsent: false,
  ncverSurveyOptOut: false,
};

const ST_ENROLMENT_RELEASE_URL = buildUrl('/api/enrolment/release');

function toCodeReference(value: string, fallback: CodeReference = DEFAULT_CODE_REFERENCE): CodeReference {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return { code: trimmed, label: trimmed };
}

function safeValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function safeIsoDate(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function buildTrainingWalletProfile(now: string): EnrolmentProfile {
  return {
    learnerId: 'tw-learner-0001',
    identity: {
      familyName: 'Citizen',
      givenNames: 'Taylor',
      title: 'Mx',
      dateOfBirth: '1990-01-01',
      sex: { code: 'X', label: 'Unspecified' },
    },
    contact: {
      email: 'taylor.citizen@example.com',
      mobilePhone: '+61 400 000 000',
    },
    residentialAddress: {
      line1: '1 Wallet Street',
      line2: 'Suite 2',
      suburbTown: 'Sydney',
      state: { code: 'NSW', label: 'New South Wales' },
      postcode: '2000',
      country: DEFAULT_COUNTRY,
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
  };
}

function buildTrainingWalletContext(now: string): EnrolmentContext {
  return {
    meta: {
      schemaVersion: '1.1.0',
      sourceSystem: 'training-wallet-mobile',
      sourceSystemVersion: 'training-wallet-local',
      createdAt: now,
      releasedAt: now,
    },
    enrolment: {
      enrolmentId: 'enrolment-0001',
      courseInstanceId: 'course-instance-0001',
      courseId: 'course-0001',
      rtoId: 'rto-0001',
      deliveryLocationId: 'delivery-0001',
      commencementDate: '2024-01-01',
      completionDate: '2024-12-31',
      paymentStatus: 'paid',
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
}

function buildEnrolmentPayload(form: ManualEnrolmentForm): EnrolmentReleasePayload {
  const now = new Date().toISOString();
  const commencementDate = safeIsoDate(form.commencementDate, '2024-01-01');
  const completionDate = safeIsoDate(form.completionDate, '2024-12-31');
  const postcode = safeValue(form.postcode, '2000');
  const email = safeValue(form.email, 'unknown@example.com');
  const mobilePhone = safeValue(form.mobilePhone, '+61 400 000 000');
  const usi = safeValue(form.usi, 'A1B2C3D4E5');

  return {
    meta: {
      schemaVersion: '1.1.0',
      sourceSystem: 'training-wallet-mobile',
      createdAt: now,
      releasedAt: now,
    },
    learner: {
      identity: {
        familyName: safeValue(form.familyName, 'Unknown'),
        givenNames: safeValue(form.givenNames, 'Unknown'),
        title: undefined,
        dateOfBirth: safeIsoDate(form.dateOfBirth, '1990-01-01'),
        sex: toCodeReference(form.sex, { code: 'X', label: 'Unspecified' }),
      },
      contact: {
        email,
        mobilePhone,
      },
      residentialAddress: {
        line1: safeValue(form.addressLine1, 'Unknown'),
        line2: undefined,
        suburbTown: safeValue(form.suburbTown, 'Unknown'),
        state: toCodeReference(form.state),
        postcode,
        country: DEFAULT_COUNTRY,
      },
      postalAddress: {
        sameAsResidential: true,
      },
      demographics: {
        indigenousStatus: DEFAULT_CODE_REFERENCE,
        countryOfBirth: DEFAULT_COUNTRY,
        languageAtHome: DEFAULT_CODE_REFERENCE,
        disabilityFlag: false,
      },
      education: {
        highestSchoolLevelCompleted: DEFAULT_CODE_REFERENCE,
        yearSchoolCompleted: DEFAULT_CODE_REFERENCE,
        stillAtSchool: false,
        priorEducationAchievements: [DEFAULT_PRIOR_EDUCATION],
      },
      employment: {
        labourForceStatus: DEFAULT_CODE_REFERENCE,
        studyReason: DEFAULT_CODE_REFERENCE,
      },
      usi: {
        usi,
        usiVerifiedStatus: 'unverified',
        usiConsentVersion: 'v1',
        usiConsentSignedAt: now,
      },
    },
    enrolment: {
      courseInstanceId: safeValue(form.courseInstanceId, 'COURSE-INSTANCE'),
      courseId: undefined,
      rtoId: safeValue(form.rtoId, 'RTO-0000'),
      deliveryLocationId: safeValue(form.deliveryLocationId, 'DELIVERY-0000'),
      commencementDate,
      completionDate,
      paymentStatus: safeValue(form.paymentStatus, 'pending'),
      fundingSource: undefined,
      outcomeIdentifier: undefined,
    },
    consents: {
      ncverPrivacyNoticeVersion: '2024-01',
      ncverPrivacyNoticeAckAt: now,
      ncverSurveyOptOut: form.ncverSurveyOptOut,
      avetmissReleaseConsent: form.avetmissReleaseConsent,
      avetmissReleaseVersion: '2024-01',
      avetmissReleaseSignedAt: now,
    },
  };
}

export default function EnrolmentScreen() {
  const insets = useSafeAreaInsets();
  const [useTrainingWallet, setUseTrainingWallet] = useState(false);
  const [formState, setFormState] = useState<ManualEnrolmentForm>(DEFAULT_FORM_STATE);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [submissionErrors, setSubmissionErrors] = useState<Array<{ path: string; message: string }>>([]);

  const updateField = useCallback(
    <K extends keyof ManualEnrolmentForm>(key: K, value: ManualEnrolmentForm[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const isBasicComplete =
    formState.givenNames.trim() &&
    formState.familyName.trim() &&
    formState.dateOfBirth.trim() &&
    formState.email.trim() &&
    formState.mobilePhone.trim();

  const isAddressComplete =
    formState.addressLine1.trim() &&
    formState.suburbTown.trim() &&
    formState.state.trim() &&
    formState.postcode.trim();

  const isCourseComplete =
    formState.courseInstanceId.trim() &&
    formState.rtoId.trim() &&
    formState.deliveryLocationId.trim() &&
    formState.paymentStatus.trim();

  const shouldShowAddress = Boolean(isBasicComplete);
  const shouldShowCourse = shouldShowAddress && Boolean(isAddressComplete);
  const shouldShowConsents = shouldShowCourse && Boolean(isCourseComplete);

  const isSubmitting = submissionStatus === 'submitting';
  const canSubmit =
    shouldShowConsents &&
    formState.acknowledgePrivacy &&
    formState.avetmissReleaseConsent &&
    !isSubmitting;

  const onSubmitManual = useCallback(async () => {
    setSubmissionStatus('submitting');
    setSubmissionErrors([]);
    try {
      const payload = buildEnrolmentPayload(formState);
      await apiFetch('/api/enrolment/release', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSubmissionStatus('success');
    } catch (err) {
      const anyErr = err as { body?: unknown };
      if (anyErr?.body && typeof anyErr.body === 'object' && 'errors' in anyErr.body) {
        const bodyErrors = (anyErr.body as { errors?: Array<{ path: string; message: string }> })
          .errors;
        if (Array.isArray(bodyErrors)) {
          setSubmissionErrors(bodyErrors);
        }
      }
      setSubmissionStatus('error');
    }
  }, [formState]);

  const onSubmitTrainingWallet = useCallback(async () => {
    setSubmissionStatus('submitting');
    setSubmissionErrors([]);

    const now = new Date().toISOString();
    let payload: EnrolmentReleasePayload;
    try {
      payload = buildEnrolmentReleasePayload({
        profile: buildTrainingWalletProfile(now),
        enrolmentContext: buildTrainingWalletContext(now),
      });
    } catch (err) {
      const anyErr = err as Partial<EnrolmentReleasePayloadValidationError>;
      if (Array.isArray(anyErr?.errors)) {
        setSubmissionErrors(anyErr.errors);
      }
      setSubmissionStatus('error');
      return;
    }

    try {
      const response = await fetch(ST_ENROLMENT_RELEASE_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      if (!response.ok) {
        if (body && typeof body === 'object' && 'errors' in body) {
          const bodyErrors = (body as { errors?: Array<{ path: string; message: string }> })
            .errors;
          if (Array.isArray(bodyErrors)) {
            setSubmissionErrors(bodyErrors);
          }
        }
        setSubmissionStatus('error');
        return;
      }

      try {
        await addEnrolmentReleaseAuditRecord({
          releasedAt: payload.meta.releasedAt,
          recipientSystem: 'ST',
          schemaVersion: payload.meta.schemaVersion,
          courseInstanceId: payload.enrolment.courseInstanceId,
          rtoId: payload.enrolment.rtoId,
        });
      } catch {
        // Best-effort local audit log.
      }

      setSubmissionStatus('success');
    } catch {
      setSubmissionStatus('error');
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}> 
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Enrolment Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => setUseTrainingWallet((prev) => !prev)}
          style={({ pressed }) => [
            styles.togglePill,
            useTrainingWallet && styles.togglePillActive,
            pressed && styles.togglePillPressed,
          ]}
        >
          <Text style={[styles.toggleText, useTrainingWallet && styles.toggleTextActive]}>
            Use Training Wallet data
          </Text>
          <View style={[styles.toggleSwitch, useTrainingWallet && styles.toggleSwitchActive]}>
            <View style={[styles.toggleDot, useTrainingWallet && styles.toggleDotActive]} />
          </View>
        </Pressable>
        <Text style={styles.toggleHint}>
          Toggle to prefill enrolment details from a Training Wallet release payload.
        </Text>

        {useTrainingWallet ? (
          <>
            {submissionStatus === 'success' && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>Enrolment payload accepted.</Text>
              </View>
            )}
            {submissionStatus === 'error' && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerTitle}>Submission failed</Text>
                {submissionErrors.length > 0 ? (
                  submissionErrors.slice(0, 3).map((error) => (
                    <Text key={`${error.path}:${error.message}`} style={styles.errorBannerText}>
                      {error.path}: {error.message}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.errorBannerText}>Please try again.</Text>
                )}
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Training Wallet release</Text>
                <FontAwesome5 name="wallet" size={16} color={colors.brand.blue} />
              </View>
              <Text style={styles.cardBody}>
                Submit your Training Wallet release payload to Search Training for enrolment.
              </Text>
              <View style={styles.payloadBadge}>
                <Text style={styles.payloadBadgeText}>Payload: EnrolmentReleasePayload</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            {submissionStatus === 'success' && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>Enrolment payload accepted.</Text>
              </View>
            )}
            {submissionStatus === 'error' && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerTitle}>Submission failed</Text>
                {submissionErrors.length > 0 ? (
                  submissionErrors.slice(0, 3).map((error) => (
                    <Text key={`${error.path}:${error.message}`} style={styles.errorBannerText}>
                      {error.path}: {error.message}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.errorBannerText}>Please check the highlighted fields.</Text>
                )}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Learner details</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Given names</Text>
                <TextInput
                  style={styles.input}
                  value={formState.givenNames}
                  onChangeText={(value) => updateField('givenNames', value)}
                  placeholder="e.g. Alex"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Family name</Text>
                <TextInput
                  style={styles.input}
                  value={formState.familyName}
                  onChangeText={(value) => updateField('familyName', value)}
                  placeholder="e.g. Nguyen"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date of birth (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={formState.dateOfBirth}
                  onChangeText={(value) => updateField('dateOfBirth', value)}
                  placeholder="1990-01-01"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Sex code</Text>
                <TextInput
                  style={styles.input}
                  value={formState.sex}
                  onChangeText={(value) => updateField('sex', value)}
                  placeholder="M, F, X"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formState.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mobile phone</Text>
                <TextInput
                  style={styles.input}
                  value={formState.mobilePhone}
                  onChangeText={(value) => updateField('mobilePhone', value)}
                  placeholder="+61 4xx xxx xxx"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {shouldShowAddress && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Residential address</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Address line 1</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.addressLine1}
                    onChangeText={(value) => updateField('addressLine1', value)}
                    placeholder="Street address"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Suburb / Town</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.suburbTown}
                    onChangeText={(value) => updateField('suburbTown', value)}
                    placeholder="Suburb"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>State</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.state}
                    onChangeText={(value) => updateField('state', value)}
                    placeholder="NSW"
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Postcode</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.postcode}
                    onChangeText={(value) => updateField('postcode', value)}
                    placeholder="2000"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            {shouldShowCourse && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Course details</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Course instance ID</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.courseInstanceId}
                    onChangeText={(value) => updateField('courseInstanceId', value)}
                    placeholder="COURSE-INSTANCE"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>RTO ID</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.rtoId}
                    onChangeText={(value) => updateField('rtoId', value)}
                    placeholder="RTO-0000"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Delivery location ID</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.deliveryLocationId}
                    onChangeText={(value) => updateField('deliveryLocationId', value)}
                    placeholder="DELIVERY-0000"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Commencement date</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.commencementDate}
                    onChangeText={(value) => updateField('commencementDate', value)}
                    placeholder="2024-01-01"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Completion date</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.completionDate}
                    onChangeText={(value) => updateField('completionDate', value)}
                    placeholder="2024-12-31"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Payment status</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.paymentStatus}
                    onChangeText={(value) => updateField('paymentStatus', value)}
                    placeholder="pending"
                  />
                </View>
              </View>
            )}

            {shouldShowConsents && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>USI & consent</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>USI</Text>
                  <TextInput
                    style={styles.input}
                    value={formState.usi}
                    onChangeText={(value) => updateField('usi', value)}
                    placeholder="A1B2C3D4E5"
                    autoCapitalize="characters"
                  />
                </View>

                <Pressable
                  onPress={() => updateField('acknowledgePrivacy', !formState.acknowledgePrivacy)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formState.acknowledgePrivacy && styles.checkboxChecked,
                    ]}
                  >
                    {formState.acknowledgePrivacy && (
                      <FontAwesome name="check" size={12} color={colors.text.inverse} />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>I acknowledge the NCVER privacy notice</Text>
                </Pressable>

                <Pressable
                  onPress={() => updateField('avetmissReleaseConsent', !formState.avetmissReleaseConsent)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formState.avetmissReleaseConsent && styles.checkboxChecked,
                    ]}
                  >
                    {formState.avetmissReleaseConsent && (
                      <FontAwesome name="check" size={12} color={colors.text.inverse} />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>I consent to AVETMISS data release</Text>
                </Pressable>

                <Pressable
                  onPress={() => updateField('ncverSurveyOptOut', !formState.ncverSurveyOptOut)}
                  style={styles.checkboxRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formState.ncverSurveyOptOut && styles.checkboxChecked,
                    ]}
                  >
                    {formState.ncverSurveyOptOut && (
                      <FontAwesome name="check" size={12} color={colors.text.inverse} />
                    )}
                  </View>
                  <Text style={styles.checkboxText}>Opt out of NCVER survey</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Pressable
          onPress={useTrainingWallet ? onSubmitTrainingWallet : onSubmitManual}
          disabled={useTrainingWallet ? isSubmitting : !canSubmit}
          style={({ pressed }) => [
            styles.saveButton,
            (useTrainingWallet ? isSubmitting : !canSubmit) && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.saveButtonText}>
            {useTrainingWallet ? 'Continue with Training Wallet' : 'Submit enrolment'}
          </Text>
          <FontAwesome name="check-circle" size={16} color={colors.text.inverse} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.app,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  togglePill: {
    borderRadius: radii.pill,
    backgroundColor: colors.bg.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  togglePillActive: {
    backgroundColor: 'rgba(14, 137, 186, 0.12)',
    borderColor: colors.brand.blue,
  },
  togglePillPressed: {
    opacity: 0.9,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.text.primary,
  },
  toggleTextActive: {
    color: colors.brand.blue,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 3,
  },
  toggleSwitchActive: {
    backgroundColor: colors.brand.blue,
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.bg.surface,
    alignSelf: 'flex-start',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  toggleHint: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    fontSize: fontSizes.xs,
    color: colors.text.muted,
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    color: '#15803D',
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorBannerTitle: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: fontSizes.sm,
    marginBottom: 4,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: fontSizes.xs,
  },
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    marginBottom: spacing.lg,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardBody: {
    fontSize: fontSizes.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  payloadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(14, 137, 186, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  payloadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.blue,
  },
  fieldGroup: {
    gap: 6,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.muted,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg.app,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.blue,
    borderColor: colors.brand.blue,
  },
  checkboxText: {
    fontSize: fontSizes.sm,
    color: colors.text.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.brand.blue,
    height: 52,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontWeight: '800',
    fontSize: fontSizes.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
