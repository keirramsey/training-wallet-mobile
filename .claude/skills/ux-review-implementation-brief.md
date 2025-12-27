# Search Training — Claude Code Implementation Brief

## Overview
This brief provides step-by-step prompts for Claude Code to execute UX/UI improvements on the Search Training frontend.

**Live site**: https://coursefinder-mvp.vercel.app
**Stack**: Next.js 14, Tailwind CSS, TypeScript

---

## Pre-Flight Check

Before starting, run this prompt to orient Claude Code:

```
Review the Search Training frontend codebase structure.

1. List all files in /app and /components directories
2. Identify the homepage file (likely app/page.tsx)
3. Identify navigation components
4. Identify the CourseCard component
5. List any UI component library in use (shadcn, custom, etc.)

Output a brief summary of the codebase structure before we begin changes.
```

---

## Phase 1: Quick Wins

### 1.1 Remove Competing Hero CTAs

```
In the homepage file (app/page.tsx or equivalent), find and remove the two buttons below the search bar:

1. Remove: "Browse popular courses ↓" button/link
2. Remove: "For employers →" button/link

These buttons compete with the search bar which should be the sole CTA.

Keep the search bar (What/Where/When inputs) intact.
Show me the before and after of the hero section.
```

### 1.2 Consolidate Navigation

```
Modify the navigation component to reduce items from 8 to 5.

Current nav items:
- Search Training (logo - keep)
- Courses
- Employers
- Training Wallet
- RTOs
- Help
- Launch
- Log in (keep)
- Find a course (CTA)

New nav structure:
- Search Training (logo)
- Find Courses (href="/courses")
- For Employers (href="/employers")
- For RTOs (href="/rto")
- Log in (href="/login")

Remove from nav (move to footer later):
- Training Wallet
- Help
- Launch
- "Find a course" button (redundant with "Find Courses")

Update both desktop and mobile navigation.
```

### 1.3 Simplify Course Cards

```
In the CourseCard component, remove the "X% would recommend" line.

Current card shows:
- Course title
- RTO name · Location
- ★ 4.8
- 96% would recommend  ← REMOVE THIS
- More dates & locations
- Price
- View course button

The star rating alone is sufficient social proof. The percentage is redundant.

Find all instances where "would recommend" is rendered and remove them.
```

### 1.4 Reorder Homepage Sections

```
Reorder the homepage sections to this sequence:

1. Hero (search bar with inputs)
2. Popular categories (chips)
3. Popular near you (course cards)
4. How it works (3 steps) ← MOVE UP
5. Trust metrics (120+ RTOs, etc.)
6. Funded training callout
7. Footer

Sections to REMOVE from homepage body:
- Training Wallet promotional section (move brief mention to footer)
- Employer band / "Need to book training for your team?" section

The employer content will be handled by audience pills (Phase 2) and a dedicated landing page (Phase 3).
```

---

## Phase 2: Audience Pills

### 2.1 Create AudiencePills Component

```
Create a new component: components/ui/AudiencePills.tsx

Requirements:
- Three options: "For myself" (default), "For my team", "I'm an RTO"
- Selected state uses brand gradient (#2BC9F4 → #0E89BA)
- Unselected state is subtle (gray text, transparent background)
- On selection change:
  - "For myself" → stays on homepage, standard search
  - "For my team" → redirects to /employers
  - "I'm an RTO" → redirects to /rto

Visual spec:
- Pill group container with subtle border-radius (20px)
- Pills are horizontally arranged
- Selected pill has gradient background, white text
- Unselected pills have transparent background, gray text
- Transition: 150ms ease-out

Use Tailwind for styling. Match the existing design system.

Example structure:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Audience = 'student' | 'employer' | 'rto';

export function AudiencePills() {
  const [selected, setSelected] = useState<Audience>('student');
  const router = useRouter();

  const handleSelect = (audience: Audience) => {
    setSelected(audience);
    if (audience === 'employer') router.push('/employers');
    if (audience === 'rto') router.push('/rto');
  };

  return (
    // ... implement pills UI
  );
}
```
```

### 2.2 Integrate Pills into Hero

```
Add the AudiencePills component to the homepage hero section.

Position: Below the headline, above the search bar.

Current hero structure:
1. Headline
2. Subheadline
3. Search inputs

New hero structure:
1. Headline
2. Subheadline
3. AudiencePills ← ADD HERE
4. Search inputs

Ensure proper spacing (e.g., mb-6 or mb-8 below pills).
```

---

## Phase 3: Dedicated Landing Pages

### 3.1 Enhance Employer Landing Page

```
Review and enhance /employers/page.tsx (or app/employers/page.tsx).

This page should be a focused B2B landing page for employers who want to:
- Book training for multiple staff
- Track team certifications
- Manage compliance

Required sections:
1. Hero with employer-specific headline
   - "Training management for your entire team"
   - Single CTA: "Get started" or "Book team training"

2. Three key benefits (icons + short descriptions)
   - Book multiple staff, single invoice
   - Track certificates and expiry dates
   - Compliance dashboard

3. How it works (employer flow)
   - Search courses → Add team members → Pay once → Track completion

4. Trust/social proof
   - "Trusted by X employers" or company logos if available

5. CTA section
   - Primary: Start booking
   - Secondary: Request a demo / Contact sales

6. FAQ section (collapsible)
   - Pricing questions
   - How invoicing works
   - Integration questions

Do NOT include student-focused content on this page.
```

### 3.2 Enhance RTO Landing Page

```
Review and enhance /rto/page.tsx (or app/rto/page.tsx).

This page should convert RTOs (training providers) who want to list courses.

Required sections:
1. Hero with RTO-specific headline
   - "Reach more students with Search Training"
   - Single CTA: "List your courses" or "Partner with us"

2. Value proposition (why list on Search Training)
   - Access to students searching for training
   - No upfront fees, commission-based model
   - AVETMISS-ready integrations

3. How it works (RTO flow)
   - Sign up → Add courses → Receive bookings → Get paid

4. Commission/pricing transparency
   - Clear explanation of the model (5% platform leads, ~2% widget leads)

5. Trust signals
   - "120+ RTOs already listed"
   - Logos of partner RTOs if available

6. CTA section
   - Primary: Apply to list
   - Secondary: Contact partnerships team

7. FAQ for RTOs
   - How do I get paid?
   - What's the onboarding process?
   - Do you integrate with my SMS?

Do NOT include student or employer content on this page.
```

### 3.3 Update Footer

```
Update the footer component to include:

Column 1: For Students
- Find Courses
- Training Wallet
- Funding Eligibility
- Help Centre

Column 2: For Employers
- Employer Dashboard
- Book Team Training
- Request Private Course

Column 3: For RTOs
- List Your Courses
- RTO Dashboard
- Partner Resources

Column 4: Company
- About
- Privacy
- Terms
- Cyber Readiness

Bottom row:
- © 2025 Search Training
- trainingwallet.com.au partner network
```

---

## Phase 4: Formatting & Visual Consistency

### 4.1 Typography Audit

```
Audit all typography across the site.

1. List every distinct font-size class used (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.)
2. List every font-weight class used
3. Identify inconsistencies:
   - Are all h2s the same size?
   - Are all card titles the same size?
   - Are all body text blocks the same size?

Create a table showing:
| Element Type | Current Classes | Locations | Recommended Standard |
|--------------|-----------------|-----------|---------------------|

Then propose a standardized typography scale:
- h1: text-4xl font-bold (page titles)
- h2: text-2xl font-semibold (section headings)
- h3: text-xl font-semibold (card titles)
- body: text-base font-normal
- small: text-sm text-gray-600
```

### 4.2 Spacing Standardization

```
Audit all spacing across the site.

1. List all section padding values (py-8, py-12, py-16, py-20, etc.)
2. List all gap values in grids/flexbox
3. List all margin values between elements

Standardize to:
- Section padding: py-16 (or py-20 for major sections)
- Card grid gaps: gap-6
- Content gaps: space-y-4 or space-y-6
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

Find and replace inconsistent spacing to match these standards.
Show me each file changed and what was modified.
```

### 4.3 Color Palette Cleanup

```
Audit all color usage across the site.

1. List all gray shades used (gray-400, gray-500, gray-600, slate-500, etc.)
2. List all text color classes
3. List all background color classes
4. List all border color classes

Standardize to ONE gray family (recommend gray-*):
- Primary text: text-gray-900
- Secondary text: text-gray-600
- Muted text: text-gray-400
- Borders: border-gray-200
- Light backgrounds: bg-gray-50

Find and replace any slate-*, neutral-*, or zinc-* with the gray-* equivalent.
Ensure hover states are consistent (e.g., always hover:text-gray-900 or hover:bg-gray-100).
```

### 4.4 Border Radius Consistency

```
Audit all border-radius usage.

1. List all rounded-* classes used on cards
2. List all rounded-* classes used on buttons
3. List all rounded-* classes used on inputs
4. List all rounded-* classes used on badges/chips

Standardize to:
- Cards/containers: rounded-2xl (brand standard 20px)
- Buttons: rounded-xl
- Inputs: rounded-xl (match buttons)
- Chips/badges: rounded-full

Update all instances to match these standards.
```

### 4.5 Shadow Consistency

```
Audit all shadow usage.

1. List all shadow-* classes used on cards
2. List hover shadow states

Standardize to:
- Cards at rest: shadow-sm
- Cards on hover: hover:shadow-md
- Dropdowns/popovers: shadow-lg
- Modals: shadow-xl

Update all card components to use consistent shadow treatment.
```

### 4.6 Component Consolidation

```
Review all Card-like components across the site.

1. Course cards
2. Category cards
3. Info cards
4. Any other card-style containers

Ensure they ALL use:
- Same padding (p-6)
- Same border-radius (rounded-2xl)
- Same shadow (shadow-sm hover:shadow-md)
- Same border treatment (border border-gray-200 OR no border)

If there are multiple Card components, consolidate into one configurable component.
Same for Button components — ensure all buttons use the same base styles.
```

### 4.7 Polish Pass

```
Final polish review:

1. Remove any placeholder text ("Lorem ipsum", "Coming soon", "TBD")
2. Check all images have alt text
3. Ensure all empty states are designed (not just blank)
4. Verify loading states exist for async content
5. Check hover states exist on all clickable elements
6. Verify focus states are visible (for accessibility)
7. Ensure transitions are consistent (use transition-all duration-150 or duration-200 everywhere)
8. Fix any widows in headings (single words on last line)
9. Verify line lengths are readable (max-w-prose for long text blocks)

List any issues found and fix them.
```

---

## Phase 5: Testing & Validation

### 5.1 Mobile Audit

```
Review the homepage on mobile viewport (375px width).

Check and fix:
1. Search bar inputs stack properly on mobile
2. Audience pills are horizontally scrollable or stack
3. Category chips scroll horizontally without breaking
4. Course cards are full-width on mobile
5. Navigation hamburger menu works correctly
6. All tap targets are ≥44px
7. No horizontal overflow/scroll on any section

Report any issues found and fix them.
```

### 5.2 Accessibility Audit

```
Run an accessibility review on the homepage:

1. All images have alt text
2. Form inputs have associated labels
3. Color contrast meets WCAG AA (4.5:1 for text)
4. Focus states are visible on all interactive elements
5. Heading hierarchy is correct (h1 → h2 → h3, no skips)
6. ARIA labels on icon-only buttons

Fix any issues found.
```

### 5.3 Performance Check

```
Review the homepage for performance:

1. Are images optimized (next/image with proper sizing)?
2. Are fonts loaded efficiently (next/font)?
3. Is there any render-blocking JavaScript?
4. Are course cards using skeleton loading during fetch?

If skeleton loading is not implemented, add it for the "Popular near you" section.
```

---

## Validation Checklist

After all phases complete, verify:

```
Navigation:
[ ] Nav has exactly 5 items (logo + 4 links + login)
[ ] "Training Wallet", "Help", "Launch" removed from nav
[ ] All nav links work correctly

Hero:
[ ] No buttons below search bar
[ ] Audience pills present and functional
[ ] "For my team" redirects to /employers
[ ] "I'm an RTO" redirects to /rto

Homepage sections (in order):
[ ] Hero with pills + search
[ ] Popular categories
[ ] Popular near you
[ ] How it works
[ ] Trust metrics
[ ] Funded training
[ ] Footer

Formatting & Consistency:
[ ] Typography uses ≤5 distinct sizes site-wide
[ ] All h2s are same size across pages
[ ] All cards use same padding, radius, shadow
[ ] All buttons use same border-radius
[ ] Single gray family used (no mixed gray/slate/neutral)
[ ] Section spacing is consistent (py-16 everywhere)
[ ] Hover states are consistent across components

[ ] Training Wallet section REMOVED from body
[ ] Employer band section REMOVED from body

Course cards:
[ ] No "X% would recommend" text
[ ] Star rating still present

Landing pages:
[ ] /employers is B2B focused, no student content
[ ] /rto is supplier focused, clear value prop

Footer:
[ ] Training Wallet link present
[ ] Organized into columns by audience
```

---

## Rollback Notes

If any change causes issues:

1. Navigation changes are isolated to nav component
2. Hero changes are in homepage file only
3. AudiencePills is a new component (can be removed without breaking)
4. Section reordering is homepage-only
5. Landing page enhancements are page-specific

Each phase can be reverted independently if needed.

---

## Success Metrics

Post-implementation, the homepage should:
- Load with 6 or fewer sections visible on scroll
- Have one unmistakeable CTA (search bar)
- Serve all three audiences via pills without cluttering the page
- Score 90+ on Lighthouse (Performance, Accessibility)
- Complete search → results in under 2 seconds
