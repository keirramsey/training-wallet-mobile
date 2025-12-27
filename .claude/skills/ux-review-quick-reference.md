# Search Training UX Overhaul — Quick Reference

## The Problem
- 8 nav items (too many)
- Competing CTAs in hero
- 7 sections below fold (too many)
- B2B content interrupting B2C flow
- Redundant rating metrics on cards

## The Solution

### Navigation: 8 → 5
```
REMOVE: Courses, Training Wallet, Help, Launch, "Find a course" button
KEEP:   Logo | Find Courses | For Employers | For RTOs | Log in
```

### Hero: Add Pills, Remove Buttons
```
┌─────────────────────────────────────────────────────┐
│  Find and book nationally recognised short courses  │
│                                                     │
│  (•) For myself  ( ) For my team  ( ) I'm an RTO   │  ← ADD
│                                                     │
│  [What       ] [Where      ] [When    ▾]  [Search] │
│                                                     │
│  ✗ Remove: [Browse popular courses ↓]              │  ← REMOVE
│  ✗ Remove: [For employers →]                       │  ← REMOVE
└─────────────────────────────────────────────────────┘
```

### Homepage Sections: 7 → 6
```
KEEP (in this order):
1. Hero + pills + search
2. Popular categories (chips)
3. Popular near you (cards)
4. How it works (move UP)
5. Trust metrics
6. Funded training (brief)

REMOVE:
✗ Training Wallet promo section
✗ Employer band ("Need to book for your team?")
```

### Course Cards: Remove Redundant Metric
```
KEEP:   ★ 4.8
REMOVE: "96% would recommend"
```

### New Pages Needed
```
/employers  → B2B landing page (book for team)
/rto        → Supplier landing page (list your courses)
```

---

## Execution Order

| Phase | Task | Time |
|-------|------|------|
| 1.1 | Remove hero buttons | 15 min |
| 1.2 | Consolidate nav | 30 min |
| 1.3 | Remove % from cards | 15 min |
| 1.4 | Reorder sections | 30 min |
| 2.1 | Create AudiencePills | 1 hr |
| 2.2 | Add pills to hero | 15 min |
| 3.1 | Employer landing page | 2 hr |
| 3.2 | RTO landing page | 2 hr |
| 3.3 | Update footer | 30 min |
| 4.1 | Typography audit & fix | 1 hr |
| 4.2 | Spacing standardization | 45 min |
| 4.3 | Color palette cleanup | 30 min |
| 4.4 | Border radius consistency | 20 min |
| 4.5 | Shadow consistency | 15 min |
| 4.6 | Component consolidation | 1 hr |
| 4.7 | Polish pass | 45 min |
| 5.x | Test & validate | 1 hr |

**Total estimate: ~12-14 hours**

---

## Claude Code Quick-Start Prompt

Copy this to begin:

```
I need you to review and improve the Search Training frontend.

Live site: https://coursefinder-mvp.vercel.app
Stack: Next.js 14, Tailwind CSS, TypeScript

Start by:
1. Listing the file structure in /app and /components
2. Reading the homepage file (app/page.tsx)
3. Identifying the navigation component
4. Summarizing what you find

Then we'll execute changes in this order:
- Remove competing CTAs from hero
- Consolidate nav from 8 to 5 items
- Remove "% would recommend" from course cards
- Reorder homepage sections
- Add audience pills component
- Enhance employer and RTO landing pages

Read the SKILL.md file in project knowledge for full context.
```

---

## Brand Reference

```css
/* Gradient */
--gradient: linear-gradient(135deg, #2BC9F4, #0E89BA);

/* Fonts */
--font-display: 'Poppins', sans-serif;
--font-body: 'Inter', sans-serif;

/* Radii */
--radius: 20px;

/* Shadows */
--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

---

## Success =

✓ Nav ≤5 items
✓ Hero has pills + single CTA (search)
✓ No B2B content in main flow
✓ Course cards show one rating metric
✓ Typography ≤5 sizes, consistent across pages
✓ Spacing standardized (py-16 sections, gap-6 grids)
✓ Single gray family (no mixed gray/slate)
✓ Cards all use same padding, radius, shadow
✓ Mobile works flawlessly
✓ Lighthouse 90+

---

## Formatting Standards Quick Ref

```
TYPOGRAPHY
h1: text-4xl font-bold
h2: text-2xl font-semibold
h3: text-xl font-semibold
body: text-base
small: text-sm text-gray-600

SPACING
Sections: py-16
Card grids: gap-6
Container: max-w-7xl mx-auto px-4

COLORS
Text: gray-900 / gray-600 / gray-400
Borders: gray-200
Backgrounds: white / gray-50

RADII
Cards: rounded-2xl
Buttons: rounded-xl
Inputs: rounded-xl
Chips: rounded-full

SHADOWS
Cards: shadow-sm → hover:shadow-md
```
