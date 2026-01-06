# Enrolment Data Requirements — Single Source of Truth (SOT)

**Applies to:** Search Training (ST), Training Wallet (TW), Search Training SMS / LTT API SMS (ST‑SMS)  
**Purpose:** Define *what data must be collected*, *when*, and *where it lives* so all products generate correct **AVETMISS Release 8.0 NAT** outputs and avoid duplicate data capture.

This document is intentionally **modular**:
- **Core AVETMISS Learner Profile** is collected once (preferably in **Training Wallet**) and re‑used everywhere.
- Course‑specific **waivers/medical/funding** are separate modules that only appear when required (so the enrolment UX stays short).

---

## 1) Design rules (non‑negotiables)

1. **Collect once, reuse everywhere**
   - “Learner Profile” data is a single canonical record (TW local-first; server copy only when the learner consents at enrolment).

2. **AVETMISS first**
   - If a field is required to populate **Client (NAT00080)** or **Client Contact Details (NAT00085)** it is **mandatory** in the core profile.

3. **Progressive disclosure**
   - Show only what’s needed for the specific course/enrolment. Funding and waivers appear only when relevant.

4. **Consent + audit trail**
   - Every release of AVETMISS/USI data from TW → ST/SMS is logged (timestamp, recipient/RTO, consent version).

5. **System-generated fields are not asked of learners**
   - NAT files contain many fields produced by the SMS (training activity, delivery location, outcomes, etc.). This document flags what is learner‑supplied vs system‑supplied.

---

## 2) AVETMISS / NAT file scope (what enrolment must support)

**Source of truth:** AVETMISS **8.0** (VET Provider Collection).

### What the learner must provide (captured via ST or Training Wallet)

These fields drive the *client* side of your NAT exports:

- **NAT00080 — Client**
  - Core identity + demographics (name, DOB, gender/sex, postcode, Indigenous status, language, labour force status, highest school level, etc.)
  - Conditional USI items (USI + verification fields when used)
- **NAT00085 — Client contact details**
  - Address + contact methods (email/phone), state/suburb, and related identifiers
- **NAT00090 — Disability** *(conditional)*
  - Only required if the learner indicates a disability / impairment
- **NAT00100 — Prior educational achievement** *(conditional)*
  - Only required if the learner indicates prior qualifications/education

> Note: You may still see older/legacy NAT numbering (e.g., NAT00010/20/30/60) in some systems. For **AVETMISS 8.0 exports**, treat the files above as authoritative and map legacy/internal structures into these outputs.

### What the system supplies (derived from course + booking + delivery)

These items should *not* be collected via an enrolment form — they are sourced from the course catalogue, delivery schedule, funding rules, and completion outcomes:

- **NAT00120 — Training activity**
  - Training organisation identifier, delivery location, unit/subject identifiers (national/local), start/end dates, delivery mode, outcome identifier, funding source (national), hours, etc.
- **NAT00130 — Program completed** *(mostly qualifications; usually not used for short-course SoA-only delivery)*
- **NAT00030A — Program** and **NAT00060 — Subject**
  - Reference files produced from your internal catalogue if you use *local* IDs; otherwise primarily system-managed.

### Practical outcome for ST / TW / ST SMS

- **ST**: collects only what’s missing at checkout (fastest possible path), and relies on TW for returning users.
- **Training Wallet**: captures and stores the learner data *once*, then releases it JIT (with consent) to ST/SMS.
- **ST SMS**: treats this document as the schema contract for enrolment + NAT export mapping.

## 3) Canonical modules

### Module A — Learner Profile (AVETMISS Core) ✅ REQUIRED
**Owner of truth:** Training Wallet (local-first)  
**Consumers:** ST checkout, ST‑SMS enrolment create/update, RTO exports  
**NAT targets:** NAT00080 + NAT00085

#### A1. Identity
| Key | Required | Notes / validation |
|---|---:|---|
| `legal_family_name` | ✅ | Match ID/USI records. No nicknames. |
| `legal_given_names` | ✅ | All given names. |
| `title` | ◻︎ | Optional. If captured, map to AVETMISS title identifier where used. |
| `date_of_birth` | ✅ | YYYY-MM-DD; must be plausible (age checks). |
| `sex` | ✅ | AVETMISS “Sex” code set. Include “X/Other/Indeterminate” options per code list. |

#### A2. Contact (Client Contact Details)
| Key | Required | Notes / validation |
|---|---:|---|
| `email` | ✅ | Email format. (If no email, alternate contact rules apply.) |
| `mobile_phone` | ✅* | Strongly recommended. If absent, require another phone. |
| `other_phone` | ◻︎ | Optional. |

#### A3. Residential address (Usual residence)
| Key | Required | Notes / validation |
|---|---:|---|
| `res_address_line1` | ✅ | Street number + street name. |
| `res_address_line2` | ◻︎ | Unit/level, etc. |
| `res_suburb_town` | ✅ | Free text (but normalise). |
| `res_state` | ✅ | State/Territory (AU). |
| `res_postcode` | ✅ | 4 digits for AU. |
| `res_country` | ✅ | AVETMISS country identifier (default Australia). |

#### A4. Postal address (only if different)
| Key | Required | Notes / validation |
|---|---:|---|
| `postal_same_as_residential` | ✅ | Boolean. If false → capture postal fields below. |
| `post_address_line1` | ✅* | Required if postal differs. |
| `post_address_line2` | ◻︎ |  |
| `post_suburb_town` | ✅* |  |
| `post_state` | ✅* |  |
| `post_postcode` | ✅* |  |
| `post_country` | ✅* |  |

#### A5. Demographics (Client file)
| Key | Required | Notes / validation |
|---|---:|---|
| `indigenous_status` | ✅ | AVETMISS Indigenous status identifier. |
| `country_of_birth` | ✅ | AVETMISS country identifier. |
| `language_at_home` | ✅ | AVETMISS language identifier (English included). |
| `disability_flag` | ✅ | Yes/No. |
| `disability_types` | ✅* | Required if disability_flag = Yes (multi-select from AVETMISS disability type identifiers). |

#### A6. Education history (Client file)
| Key | Required | Notes / validation |
|---|---:|---|
| `highest_school_level_completed` | ✅ | AVETMISS highest school level identifier. |
| `year_school_completed` | ✅* | Required if applicable per AVETMISS rules (e.g., if not still at school). |
| `still_at_school` | ✅ | AVETMISS at school flag. |
| `prior_education_achievements` | ✅ | Multi-select from AVETMISS prior educational achievement identifiers (include “none”). |

#### A7. Employment + study reason (Client file)
| Key | Required | Notes / validation |
|---|---:|---|
| `labour_force_status` | ✅ | AVETMISS labour force status identifier. |
| `study_reason` | ✅ | AVETMISS study reason identifier (main reason for undertaking training). |

---

### Module B — USI (collection + verification + release) ✅ REQUIRED for accredited VET
**Owner of truth:** TW (local-first), verification record server-side (hashed)  
**Consumers:** ST checkout, ST‑SMS, RTO issuance

| Key | Required | Notes |
|---|---:|---|
| `usi` | ✅* | Required for accredited enrolments unless exempt rules apply. |
| `usi_verified_status` | ✅ | `unverified|verified|exempt|unknown` |
| `usi_consent_version` | ✅ | Versioned consent text reference. |
| `usi_consent_signed_at` | ✅ | Timestamp. |

Implementation notes:
- Prefer **verify** flow (TW → USI service) before enrolment.
- At enrolment, TW issues a **short-lived release token**; raw USI is released only after explicit consent.

---

### Module C — AVETMISS / NCVER Privacy Notice Acknowledgement ✅ REQUIRED
**Owner of truth:** ST (enrolment instance) + TW (profile acknowledgement optional)  
**Goal:** Capture that learner has received the privacy notice and consents to required disclosures.

| Key | Required | Notes |
|---|---:|---|
| `ncver_privacy_notice_version` | ✅ | Store a version string/hash. |
| `ncver_privacy_notice_ack_at` | ✅ | Timestamp. |
| `ncver_survey_opt_out` | ◻︎ | Optional (some RTOs collect). |

---

### Module D — Enrolment Instance (ST checkout → ST‑SMS) ✅ REQUIRED per booking
**Owner of truth:** ST (booking) and ST‑SMS (official enrolment)  
**NAT targets:** Does not directly populate NAT00080/85; links learner to training activity.

| Key | Required | Notes |
|---|---:|---|
| `course_id` | ✅ | ST course listing identifier. |
| `rto_id` | ✅ | Provider identifier. |
| `delivery_location_id` | ✅ | From course instance. |
| `start_date` | ✅ | From course instance. |
| `end_date` | ✅ | From course instance. |
| `payment_status` | ✅ | From Stripe/ST. |
| `funding_source` | ◻︎ | e.g., fee-for-service, state funding, employer paid. |

---

### Module E — Employer / Payer (only if applicable) ◻︎ OPTIONAL
Used when employer pays or funding rules require employer details.

| Key | Required | Notes |
|---|---:|---|
| `employer_name` | ✅* | If employer-paying. |
| `employer_abn` | ◻︎ | Optional unless funding requires. |
| `employer_contact_name` | ◻︎ |  |
| `employer_contact_phone` | ◻︎ |  |
| `employer_contact_email` | ◻︎ |  |

---

### Module F — Minor / Guardian (conditional) ◻︎ OPTIONAL
Required when learner is under 18 (or per RTO policy).

| Key | Required | Notes |
|---|---:|---|
| `is_minor` | ✅ | Derived from DOB. |
| `guardian_name` | ✅* | If minor. |
| `guardian_phone` | ✅* | If minor. |
| `guardian_email` | ◻︎ |  |
| `guardian_consent_signed_at` | ✅* | If minor. |

---

### Module G — Course Risk, Medical, Liability Waiver (conditional) ◻︎ OPTIONAL
**Not AVETMISS.** Controlled by course/risk templates. Keep separate from Module A.

Examples:
- fitness-to-participate declaration
- medical treatment consent
- photography/video consent
- liability waiver / indemnity
- PPE acknowledgement

Store:
- `waiver_template_id`
- `waiver_version`
- `waiver_signed_at`
- `waiver_signature_method` (checkbox, typed, drawn)

---

### Module H — Funding Program Add-ons (conditional) ◻︎ OPTIONAL
Example: **ACT Training Fund Authority** eligibility questions. Keep separate and attach only when funding is selected.

Store:
- `funding_program_id`
- `eligibility_answers_json`
- `funding_consent_signed_at`

---

## 4) Where each module is collected

### Training Wallet (TW)
- Module A (Learner Profile) — **primary**
- Module B (USI) — **primary**
- Optional: store Module C acknowledgement state (but enrolment event still records it)

### Search Training (ST)
- Module D (Enrolment instance) — **primary**
- Module C (privacy notice acknowledgement) — **primary**
- Module E/F/G/H — as needed by course / funding / payer
- Pull Module A/B from TW via consented release (or capture minimal temporary profile if no app)

### ST‑SMS (LTT API SMS)
- Receives canonical Module A/B/C/D payloads (or references) from ST
- Generates all NAT files using:
  - learner profile (NAT00080/85)
  - course setup + outcomes (NAT00120 etc.)

---

## 5) “No-app” fallback (ST-only enrolment)
If the learner doesn’t have TW installed:
- ST collects **Module A + Module B + Module C** directly (same fields).
- After checkout, ST prompts learner to install TW to become the ongoing “profile vault”.
- On first TW sign-in, TW imports the profile and becomes the new source of truth.

---

## 6) Validation & code sets

- All coded fields (sex, indigenous status, language, country, disability types, schooling, prior education, labour force status, study reason) must use the **AVETMISS Release 8.0 Data Element Definitions** code lists.
- Store **both**:
  - the *code* (authoritative)
  - the *display label* (for UX)
- Keep code sets versioned (e.g., `/data/avetmiss/r8/`).

---

## 7) Implementation checklist (engineering)

1. Create shared schema package (Zod/JSON Schema) for Modules A–H.
2. Centralise validation + normalisation (postcode, state, DOB, email, phone).
3. Version all consent/notice text and store only the version/hash in records.
4. Log data releases:
   - `consent_event_id`, `recipient_rto_id`, `fields_released`, `signed_at`, `ip/device`
5. Ensure exports:
   - ST‑SMS can generate NAT00080 + NAT00085 for every active learner record.
   - Missing mandatory fields → block enrolment until resolved.

---

## 8) References
- NCVER: **AVETMISS Release 8.0 Standard Enrolment Form** (standard enrolment questions).  
- NCVER: **AVETMISS VET Provider Collection Specifications (Release 8.0)** (NAT file set and rules).  
- NCVER: **AVETMISS Data Element Definitions (Release 8.0)** (authoritative code lists).

(Keep these links updated in each repo’s `/docs/`.)
