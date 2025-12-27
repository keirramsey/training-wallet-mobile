# Search Training Frontend UX/UI Review Skill

## Purpose
Systematic review and improvement of the Search Training frontend to reduce cognitive load, simplify the search-to-purchase flow, and cleanly serve three distinct audiences.

## Context
**Search Training** is an Australian vocational training marketplace:
- **URL**: https://coursefinder-mvp.vercel.app (MVP build)
- **Future domain**: searchtraining.com.au (or learna.com.au when rebranded)

### Three Audiences
| Audience | Primary Goal | Entry Point |
|----------|-------------|-------------|
| **Students** (primary) | Search → Compare → Book a course | Homepage search |
| **Employers** | Bulk purchase, manage team certs | /employers |
| **RTOs** | List courses, receive bookings | /rto |

### Brand Tokens
- **Gradient**: #2BC9F4 → #0E89BA (cyan-blue)
- **Fonts**: Poppins (marketing/headings), Inter (UI/body)
- **Radii**: 20px
- **Shadows**: Soft
- **Tech Stack**: Next.js 14, Tailwind CSS, TypeScript

---

## Current State Assessment (December 2024)

### What's Working
- Search-first hero with What/Where/When inputs
- Category chips for quick filtering
- Course cards show key info: price, rating, RTO name, "More dates & locations"
- Trust metrics section (120+ RTOs, 7000+ bookings, 4.8★)
- Clean brand gradient applied to CTAs

### Issues Identified

#### 1. Navigation Overload (8 items + 2 CTAs)
```
Current: Search Training | Courses | Employers | Training Wallet | RTOs | Help | Launch | [Log in] [Find a course]
```
- "Courses" and "Find a course" are redundant
- "Launch" is unclear to new visitors
- Training Wallet is a product, not a nav destination for first-time users

#### 2. Competing CTAs in Hero
```
[Browse popular courses ↓] [For employers →]
```
These undermine the search bar, which should be the sole focus.

#### 3. Too Many Sections (7 below fold)
1. Popular categories ✓
2. Popular near you ✓
3. Training Wallet promo ✗ (breaks buying flow)
4. Funded training (misplaced)
5. Employer band ✗ (B2B in B2C flow)
6. How it works (too late)
7. Trust metrics ✓

#### 4. Mid-Page Audience Splits
The employer band and Training Wallet promo interrupt the student journey.

#### 5. Redundant Social Proof
"4.8★" AND "96% would recommend" on cards - pick one.

---

## Recommended Architecture

### Simplified Navigation
```
Search Training | Find Courses | For Employers | For RTOs | [Log in]
```
Move to footer: Training Wallet, Help, Launch

### Homepage Structure (Revised)
```
HEADER
  └─ 5 nav items max

HERO
  ├─ Headline: "Find and book nationally recognised short courses across Australia."
  ├─ Audience pills: [For myself] [For my team] [I'm an RTO]
  └─ Search bar: What | Where | When | [Search]

CATEGORIES
  └─ Horizontal chip scroll (First Aid, Construction, etc.)

POPULAR NEAR YOU
  └─ 3 course cards (price, rating, RTO, CTA)

HOW IT WORKS
  └─ 3 steps: Search → Book → Train & Save

TRUST METRICS
  └─ 120+ RTOs | 7,000+ Bookings | 4.8★ Rating

FUNDED TRAINING
  └─ Brief callout with [Check eligibility] CTA

FOOTER
  ├─ Training Wallet link + brief description
  ├─ Employer link
  ├─ RTO link
  └─ Legal (Privacy, Terms, Cyber Readiness)
```

### Audience Pills Behaviour
```jsx
// Default: "For myself" selected
// Behaviour:
// - "For myself" → Standard search, current results
// - "For my team" → Redirect to /employers or show bulk UI
// - "I'm an RTO" → Redirect to /rto landing page
```

---

## Audit Checklist

### Navigation Audit
```
[ ] Count nav items (target: ≤5)
[ ] Identify redundant links
[ ] Check mobile hamburger menu order
[ ] Verify all links resolve correctly
```

### Hero Audit
```
[ ] Single primary CTA? (search bar only)
[ ] Headline under 15 words?
[ ] Audience selector present?
[ ] Search inputs clear and functional?
[ ] Remove secondary buttons below search
```

### Content Hierarchy Audit
```
[ ] Count sections below fold (target: ≤6)
[ ] Training Wallet NOT interrupting buying flow?
[ ] Employer content NOT in main student flow?
[ ] "How it works" appears before trust metrics?
[ ] Funded training is brief, not dominant?
```

### Course Card Audit
```
[ ] Price visible without clicking?
[ ] Single rating metric (not both stars AND percentage)?
[ ] RTO name visible?
[ ] Clear CTA (View course)?
[ ] "More dates & locations" indicator?
```

### Mobile Audit
```
[ ] Search accessible without scrolling?
[ ] Category chips horizontally scrollable?
[ ] Cards stack properly?
[ ] Tap targets ≥44px?
[ ] No horizontal overflow?
```

---

## Component Specifications

### Audience Pills Component
```tsx
// Location: components/ui/AudiencePills.tsx
interface AudiencePillsProps {
  selected: 'student' | 'employer' | 'rto';
  onChange: (audience: string) => void;
}

// Visual spec:
// - Pill group with subtle border
// - Selected pill: gradient background (#2BC9F4 → #0E89BA)
// - Unselected: transparent with gray text
// - Transition: 150ms ease
```

### Simplified Course Card
```tsx
// Remove: "X% would recommend"
// Keep: Star rating only
// Structure:
// ┌─────────────────────────┐
// │ Course Title            │
// │ RTO Name · Location     │
// │ ★ 4.8  ·  More dates    │
// │                   $420  │
// │           [View course] │
// └─────────────────────────┘
```

### Streamlined Nav
```tsx
// Desktop: 5 items + login
// Mobile: Hamburger with same 5 items

const navItems = [
  { label: 'Find Courses', href: '/courses' },
  { label: 'For Employers', href: '/employers' },
  { label: 'For RTOs', href: '/rto' },
];

// Move to footer:
// - Training Wallet
// - Help
// - Launch
```

---

## Implementation Phases

### Phase 1: Quick Wins (1-2 days)
- [ ] Remove `[Browse popular courses ↓]` and `[For employers →]` from hero
- [ ] Consolidate nav to 5 items
- [ ] Remove "X% would recommend" from cards (keep star rating)
- [ ] Move "How it works" section above trust metrics

### Phase 2: Structure (3-5 days)
- [ ] Add audience pills component to hero
- [ ] Remove Training Wallet section from homepage body
- [ ] Remove employer band from homepage body
- [ ] Add Training Wallet brief mention to footer
- [ ] Reorder sections per recommended architecture

### Phase 3: Dedicated Landing Pages (1 week)
- [ ] Create /for-employers landing page (B2B focused)
- [ ] Create /for-rtos landing page (supplier onboarding)
- [ ] Update audience pills to link to these pages
- [ ] Ensure each landing page has single clear CTA

### Phase 4: Polish (ongoing)
- [ ] Add skeleton loading for course cards
- [ ] Micro-interactions on search, filters
- [ ] Mobile gesture refinements
- [ ] A/B test audience pill copy

---

## Success Criteria

After implementation:
- [ ] Nav has ≤5 items
- [ ] Hero has single CTA (search bar)
- [ ] Audience pills visible and functional
- [ ] Homepage has ≤6 sections below fold
- [ ] No B2B content interrupting B2C flow
- [ ] "How it works" appears before trust metrics
- [ ] Course cards show single rating metric
- [ ] Mobile Lighthouse performance ≥90
- [ ] Mobile Lighthouse accessibility ≥90

---

## Files to Modify

```
app/page.tsx                      # Homepage - main changes
app/layout.tsx                    # Nav restructure
components/nav/                   # Navigation components
components/ui/AudiencePills.tsx   # New component
components/CourseCard.tsx         # Remove % recommend
app/employers/page.tsx            # Enhance as landing page
app/rto/page.tsx                  # Enhance as landing page
```

---

---

## Formatting & Visual Consistency

### Design Token Enforcement

The codebase should use consistent tokens. Audit and enforce:

```
TYPOGRAPHY (max 4 sizes for body content)
─────────────────────────────────────────
h1: text-4xl or text-5xl (page titles only, ONE per page)
h2: text-2xl or text-3xl (section headings)
h3: text-xl (card titles, subsections)
body: text-base (16px default)
small: text-sm (metadata, captions)

WEIGHTS
─────────────────────────────────────────
Headings: font-semibold or font-bold
Body: font-normal
Emphasis: font-medium (sparingly)

FLAG: More than 2 font weights on a single page
FLAG: Inconsistent heading sizes for same-level content
```

```
SPACING (use Tailwind scale consistently)
─────────────────────────────────────────
Section gaps: py-16 or py-20 (consistent across all sections)
Card gaps: gap-6 or gap-8 (pick one, use everywhere)
Component padding: p-4, p-6, or p-8 (standardise)
Text spacing: space-y-2 or space-y-4 (consistent within similar blocks)

FLAG: Mixing py-12 and py-16 and py-20 randomly
FLAG: Inconsistent card padding across the site
```

```
COLORS (strict palette)
─────────────────────────────────────────
Primary gradient: from-[#2BC9F4] to-[#0E89BA]
Text primary: text-gray-900 or text-slate-900
Text secondary: text-gray-600 or text-slate-600
Text muted: text-gray-400 or text-slate-400
Background: bg-white, bg-gray-50, bg-slate-50
Borders: border-gray-200 or border-slate-200

FLAG: Random grays (gray-500 here, slate-400 there)
FLAG: Colors not from the defined palette
FLAG: Inconsistent hover states
```

```
RADII (one standard)
─────────────────────────────────────────
Cards/containers: rounded-2xl (20px) — brand standard
Buttons: rounded-xl or rounded-full (pick one)
Inputs: rounded-lg or rounded-xl (match buttons)
Chips/badges: rounded-full

FLAG: Mixing rounded-lg, rounded-xl, rounded-2xl randomly
```

```
SHADOWS (consistent depth)
─────────────────────────────────────────
Cards: shadow-sm or shadow-md (pick one for all cards)
Hover lift: hover:shadow-lg (consistent)
Dropdowns: shadow-lg
Modals: shadow-xl

FLAG: Some cards with shadow-sm, others with shadow-lg
```

### Formatting Audit Checklist

```
TYPOGRAPHY CONSISTENCY
[ ] Count distinct font sizes used — should be ≤5
[ ] All h1s are same size across pages
[ ] All h2s are same size across pages
[ ] All card titles are same size
[ ] Body text is consistently text-base
[ ] No orphan text styles (one-off sizes)

SPACING CONSISTENCY
[ ] All sections use same vertical padding
[ ] All card grids use same gap
[ ] Consistent margin between heading and content
[ ] No random extra padding/margin

COLOR CONSISTENCY
[ ] All grays are from same family (gray-* OR slate-*, not mixed)
[ ] Primary text color is consistent
[ ] Secondary/muted text color is consistent
[ ] All borders use same color
[ ] Hover states are consistent (same opacity change or color shift)

COMPONENT CONSISTENCY
[ ] All buttons use same border-radius
[ ] All cards use same border-radius
[ ] All inputs use same border-radius
[ ] All cards have same shadow depth
[ ] Badge/chip styles are identical across site

ALIGNMENT
[ ] Content max-width is consistent (max-w-7xl or similar)
[ ] Container padding is consistent
[ ] Text alignment is intentional (not random center/left)
[ ] Grid columns are consistent where applicable
```

### Common Formatting Issues to Fix

```
ISSUE: Inconsistent section spacing
─────────────────────────────────────────
BAD:  py-8 on one section, py-16 on next, py-12 on another
GOOD: py-16 on ALL content sections (or py-20 for major breaks)

ISSUE: Text size chaos
─────────────────────────────────────────
BAD:  h2 is text-3xl here, text-2xl there, text-xl elsewhere
GOOD: h2 is ALWAYS text-2xl font-semibold site-wide

ISSUE: Card inconsistency
─────────────────────────────────────────
BAD:  Course cards have p-4, category cards have p-6, other cards have p-5
GOOD: ALL cards use p-6 rounded-2xl shadow-sm

ISSUE: Button style drift
─────────────────────────────────────────
BAD:  Some buttons rounded-lg, some rounded-xl, some rounded-full
GOOD: Primary buttons are ALWAYS rounded-xl, secondary are rounded-lg

ISSUE: Color palette creep
─────────────────────────────────────────
BAD:  text-gray-600, text-slate-500, text-neutral-600 mixed
GOOD: Pick ONE gray family and use it everywhere
```

### Polish Checklist (Production-Ready)

```
VISUAL POLISH
[ ] No placeholder text remaining ("Lorem ipsum", "Coming soon")
[ ] All images have proper aspect ratios (no stretching)
[ ] Icons are consistent size and style (all Lucide, or all Heroicons)
[ ] Empty states are designed (not just "No results")
[ ] Loading states exist for async content
[ ] Error states are styled (not browser defaults)

INTERACTION POLISH
[ ] All clickable elements have hover states
[ ] Focus states are visible (accessibility)
[ ] Transitions are consistent (150ms or 200ms, pick one)
[ ] No janky layout shifts on load
[ ] Buttons have active/pressed states

TYPOGRAPHY POLISH
[ ] No widows (single words on last line of headings) — fix with &nbsp; or text balancing
[ ] Line lengths are readable (max 65-75 characters for body text)
[ ] Proper quotation marks and apostrophes (' not ')
[ ] Consistent capitalization (Title Case OR Sentence case, not mixed)

RESPONSIVE POLISH
[ ] Text doesn't overflow containers on mobile
[ ] Images scale properly
[ ] Spacing reduces proportionally on mobile (py-16 → py-8)
[ ] Touch targets are large enough (min 44px)
[ ] No horizontal scroll on any viewport
```

### Tailwind Config Standardization

If not already present, ensure tailwind.config.js enforces the design system:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#2BC9F4',
          blue: '#0E89BA',
        },
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'brand': '20px', // Use rounded-brand for cards
      },
    },
  },
}
```

Then use consistently:
```jsx
// Instead of: bg-gradient-to-r from-[#2BC9F4] to-[#0E89BA]
// Use: bg-gradient-to-r from-brand-cyan to-brand-blue

// Instead of: rounded-2xl (hoping it's 20px)
// Use: rounded-brand
```

### Formatting Implementation Order

**Phase F1: Audit (before changing anything)**
1. Document all font sizes in use
2. Document all spacing values in use
3. Document all colors in use
4. Document all border-radius values in use
5. Create a "current state" inventory

**Phase F2: Define standards**
1. Choose ONE value for each token type
2. Update tailwind.config.js if needed
3. Create a mini style guide (just for reference)

**Phase F3: Enforce across pages**
1. Homepage first
2. Course listing page
3. Course detail page
4. Booking flow pages
5. Employer/RTO pages

**Phase F4: Component consolidation**
1. Ensure Button component enforces standards
2. Ensure Card component enforces standards
3. Ensure Input component enforces standards
4. Remove any one-off styled elements

---

## Anti-Patterns to Avoid

❌ Separate homepages per audience (fragments SEO)
❌ Carousel sliders (low engagement)
❌ "Learn more" buttons (use action verbs)
❌ Chat widget on first load
❌ Newsletter popup
❌ Autoplaying video
❌ Generic stock photography
❌ "Trusted by thousands" without specifics
❌ Inconsistent spacing between sections
❌ More than 4-5 font sizes on a page
❌ Mixed gray families (gray-* AND slate-* AND neutral-*)
❌ One-off component styles that don't match the system
