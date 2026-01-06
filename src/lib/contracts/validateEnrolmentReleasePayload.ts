import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimeRegex =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

const isoDateSchema = z.string().refine((value) => isoDateRegex.test(value), {
  message: "Invalid date format"
});

const isoDateTimeSchema = z.string().refine((value) => isoDateTimeRegex.test(value), {
  message: "Invalid date-time format"
});

const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, "Invalid schemaVersion format");

const codeReferenceSchema = z
  .object({
    code: z.string().min(1),
    label: z.string().min(1)
  })
  .strict();

const phoneSchema = z.string().regex(/^[0-9+()\s-]{6,}$/, "Invalid phone number");

const identitySchema = z
  .object({
    familyName: z.string().min(1),
    givenNames: z.string().min(1),
    title: z.string().optional(),
    dateOfBirth: isoDateSchema,
    sex: codeReferenceSchema
  })
  .strict();

const contactSchema = z
  .object({
    email: z.string().email(),
    mobilePhone: phoneSchema.optional(),
    otherPhone: phoneSchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.mobilePhone && !value.otherPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mobilePhone"],
        message: "Either mobilePhone or otherPhone is required"
      });
    }
  });

const residentialAddressSchema = z
  .object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    suburbTown: z.string().min(1),
    state: codeReferenceSchema,
    postcode: z.string().regex(/^\d{4}$/, "Invalid postcode format"),
    country: codeReferenceSchema
  })
  .strict();

const postalAddressSchema = z
  .object({
    sameAsResidential: z.boolean(),
    line1: z.string().min(1).optional(),
    line2: z.string().optional(),
    suburbTown: z.string().min(1).optional(),
    state: codeReferenceSchema.optional(),
    postcode: z.string().regex(/^\d{4}$/, "Invalid postcode format").optional(),
    country: codeReferenceSchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.sameAsResidential) {
      if (!value.line1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["line1"],
          message: "line1 is required when postal address differs"
        });
      }
      if (!value.suburbTown) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["suburbTown"],
          message: "suburbTown is required when postal address differs"
        });
      }
      if (!value.state) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["state"],
          message: "state is required when postal address differs"
        });
      }
      if (!value.postcode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["postcode"],
          message: "postcode is required when postal address differs"
        });
      }
      if (!value.country) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["country"],
          message: "country is required when postal address differs"
        });
      }
    }
  });

const demographicsSchema = z
  .object({
    indigenousStatus: codeReferenceSchema,
    countryOfBirth: codeReferenceSchema,
    languageAtHome: codeReferenceSchema,
    disabilityFlag: z.boolean(),
    disabilityTypes: z.array(codeReferenceSchema).min(1).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.disabilityFlag && (!value.disabilityTypes || value.disabilityTypes.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["disabilityTypes"],
        message: "disabilityTypes is required when disabilityFlag is true"
      });
    }
  });

const educationSchema = z
  .object({
    highestSchoolLevelCompleted: codeReferenceSchema,
    yearSchoolCompleted: codeReferenceSchema.optional(),
    stillAtSchool: z.boolean(),
    priorEducationAchievements: z.array(codeReferenceSchema).min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.stillAtSchool && !value.yearSchoolCompleted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["yearSchoolCompleted"],
        message: "yearSchoolCompleted is required when stillAtSchool is false"
      });
    }
  });

const employmentSchema = z
  .object({
    labourForceStatus: codeReferenceSchema,
    studyReason: codeReferenceSchema
  })
  .strict();

const usiSchema = z
  .object({
    usi: z.string().regex(/^[A-Za-z0-9]{10}$/, "Invalid USI format"),
    usiVerifiedStatus: z.enum(["unverified", "verified", "exempt", "unknown"]),
    usiConsentVersion: z.string().min(1),
    usiConsentSignedAt: isoDateTimeSchema,
    usiExemptionReason: z.string().optional()
  })
  .strict();

const learnerSchema = z
  .object({
    learnerId: z.string().optional(),
    identity: identitySchema,
    contact: contactSchema,
    residentialAddress: residentialAddressSchema,
    postalAddress: postalAddressSchema,
    demographics: demographicsSchema,
    education: educationSchema,
    employment: employmentSchema,
    usi: usiSchema
  })
  .strict();

const enrolmentSchema = z
  .object({
    enrolmentId: z.string().optional(),
    courseInstanceId: z.string().min(1),
    courseId: z.string().optional(),
    rtoId: z.string().min(1),
    deliveryLocationId: z.string().min(1),
    commencementDate: isoDateSchema,
    completionDate: isoDateSchema,
    paymentStatus: z.string().min(1),
    fundingSource: z.string().optional(),
    outcomeIdentifier: z.string().optional()
  })
  .strict();

const consentsSchema = z
  .object({
    ncverPrivacyNoticeVersion: z.string().min(1),
    ncverPrivacyNoticeAckAt: isoDateTimeSchema,
    ncverSurveyOptOut: z.boolean().optional(),
    avetmissReleaseConsent: z.boolean(),
    avetmissReleaseVersion: z.string().min(1),
    avetmissReleaseSignedAt: isoDateTimeSchema
  })
  .strict();

const employerSchema = z
  .object({
    employerName: z.string().min(1),
    employerAbn: z.string().optional(),
    employerContactName: z.string().optional(),
    employerContactPhone: phoneSchema.optional(),
    employerContactEmail: z.string().email().optional()
  })
  .strict();

const guardianSchema = z
  .object({
    isMinor: z.boolean(),
    guardianName: z.string().min(1).optional(),
    guardianPhone: phoneSchema.optional(),
    guardianEmail: z.string().email().optional(),
    guardianConsentSignedAt: isoDateTimeSchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.isMinor) {
      if (!value.guardianName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianName"],
          message: "guardianName is required when isMinor is true"
        });
      }
      if (!value.guardianPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianPhone"],
          message: "guardianPhone is required when isMinor is true"
        });
      }
      if (!value.guardianConsentSignedAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["guardianConsentSignedAt"],
          message: "guardianConsentSignedAt is required when isMinor is true"
        });
      }
    }
  });

const waiverSchema = z
  .object({
    waiverTemplateId: z.string().min(1),
    waiverVersion: z.string().min(1),
    waiverSignedAt: isoDateTimeSchema,
    waiverSignatureMethod: z.enum(["checkbox", "typed", "drawn"])
  })
  .strict();

const fundingProgramSchema = z
  .object({
    fundingProgramId: z.string().min(1),
    eligibilityAnswersJson: z.record(z.string(), z.unknown()).optional(),
    fundingConsentSignedAt: isoDateTimeSchema
  })
  .strict();

const emergencyContactSchema = z
  .object({
    name: z.string().min(1),
    relationship: z.string().optional(),
    phone: phoneSchema,
    email: z.string().email().optional()
  })
  .strict();

const usiReferenceSchema = z
  .object({
    referenceId: z.string().min(1),
    issuer: z.string().min(1),
    expiresAt: isoDateTimeSchema.optional()
  })
  .strict();

const modulesSchema = z
  .object({
    employer: employerSchema.optional(),
    guardian: guardianSchema.optional(),
    waivers: z.array(waiverSchema).optional(),
    fundingProgram: fundingProgramSchema.optional(),
    emergencyContact: emergencyContactSchema.optional(),
    usiReference: usiReferenceSchema.optional()
  })
  .strict();

const metaSchema = z
  .object({
    schemaVersion: semverSchema,
    sourceSystem: z.string().min(1),
    sourceSystemVersion: z.string().optional(),
    createdAt: isoDateTimeSchema,
    releasedAt: isoDateTimeSchema,
    payloadId: z.string().optional(),
    correlationId: z.string().optional()
  })
  .strict();

const enrolmentReleasePayloadSchema = z
  .object({
    meta: metaSchema,
    learner: learnerSchema,
    enrolment: enrolmentSchema,
    consents: consentsSchema,
    modules: modulesSchema.optional()
  })
  .strict();

export type EnrolmentReleasePayload = z.infer<typeof enrolmentReleasePayloadSchema>;

export type EnrolmentPayloadValidationResult =
  | { ok: true; data: EnrolmentReleasePayload }
  | { ok: false; errors: Array<{ path: string; message: string }> };

export function validateEnrolmentReleasePayload(input: unknown): EnrolmentPayloadValidationResult {
  const parsed = enrolmentReleasePayloadSchema.safeParse(input);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  return {
    ok: false,
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.length ? issue.path.join(".") : "$",
      message: issue.message
    }))
  };
}
