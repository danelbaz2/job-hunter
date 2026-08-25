# UI Refactor Plan

Full rewrite of the frontend layer on branch `ui-refactor`, cut from `main` at
`bbc574f`. Written 2026-08-25.

**Important starting fact:** this app is *already* React — Next.js 15 App Router,
React 19, functional components with hooks, CSS Modules. This is a rewrite of the
UI layer *within* React, not a port to React.

---

## 1. Boundaries — what must NOT change

Do not touch, under any circumstance:

- `app/api/`
- `lib/scoring/`
- `lib/sources/`
- `lib/db/`
- `lib/auth.ts`, `lib/auth/`, `lib/auth.config.ts`
- `lib/resume/`
- `middleware.ts`
- `drizzle/`

`types/domain.ts` is the **frozen contract** between backend and UI. Every rebuilt
component consumes the same `SearchResultItem`, `SearchSummary`, `SourceProgress`,
`MatchPoint`, `Source`.

The NDJSON search-stream protocol must be re-consumed byte-identically:
`{type:'source'}` then `{type:'scoring'}` then `{type:'done', searchId}` or
`{type:'error'}`.

`/api/jobs/[id]/save` POST/DELETE semantics unchanged.

`lib/formatDate.ts` may be imported but not modified.

**Verification:** `git diff main --stat` must show zero changes under `app/api/` or
`lib/`. If it does, something went wrong.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Styling | Tailwind CSS v4 (`@theme` tokens, `@tailwindcss/postcss`, no JS config) |
| Components | shadcn/ui, restyled to Nocturne |
| Primitives | Radix (arrives with shadcn) |
| Animation | `motion` v11 (`motion/react`) + plain CSS |
| Icons | `lucide-react` |
| Fonts | Inter via `next/font` |
| Theme | Dark only |

---

## 3. Design decisions already settled

The repo contains its own design system, Nocturne, at
`design_handoff_job_hunter_ui/_ds/nocturne-*/` — read its `readme.md` and
`styles.css` before starting.

1. **Nocturne overrides shadcn defaults.** shadcn is copy-in source designed to be
   restyled; the house design system wins. Its tokens go into `@theme`, and shadcn's
   variants get remapped onto them.

2. **One deliberate exception:** Nocturne says the primary button is "an accent
   outline, never a fill". Overruled for the single main CTA per view, which gets a
   solid accent fill — an outline primary competes visually with every secondary
   control around it. Everything else stays outline/ghost, so Nocturne's look holds
   across ~90% of the UI.

3. **lucide, not Phosphor.** Nocturne names Phosphor, but it was never actually
   adopted (the code hand-rolls SVGs in `components/icons.tsx`), so there is no
   investment to protect, and lucide is frictionless with shadcn.

4. **Spacing deviates from Nocturne's 0.70x density,** which produced non-integer
   values like `11.2px` that snap to no grid. Keep the dense *feel* by choosing
   tighter steps on a whole-pixel 4px unit, rather than by rescaling the unit.

5. **Headings cap at weight 500** (Nocturne: "hierarchy here is size and space").

6. **Focus ring:** `:focus-visible { outline: 2px solid accent; outline-offset: 2px }`
   — never the browser default.

7. **Route transitions are enter-only,** via `app/template.tsx`. `AnimatePresence`
   cannot hold an unmounting RSC tree across App Router server navigations. Pages
   fade in; they do not fade out. This is the known convention, not a shortcut.

---

## 4. File layout

```
app/
  layout.tsx              rewrite: next/font, MotionConfig, Suspense'd nav
  template.tsx            NEW   route enter transition
  globals.css             rewrite: @import "tailwindcss" + @theme tokens
  page.tsx                rewrite  landing
  AuthCard.tsx            rewrite
  search/{page,SearchForm}.tsx          rewrite
  results/{page,ResultsGrid}.tsx        rewrite
  saved/page.tsx                        rewrite
  settings/{page,SignOutButton}.tsx     rewrite
  jobs/[id]/{page,JobDetailClient}.tsx  rewrite
  {results,saved,jobs/[id],settings}/loading.tsx   NEW (4 files)

components/
  ui/          NEW  shadcn-generated + restyled: button, input, textarea,
               label, badge, card, skeleton, dropdown-menu, dialog,
               sonner (toast), separator, progress, tooltip, scroll-area
  ui/          NEW  hand-built on top: Chip, SegmentedControl, ScoreBadge,
               Meter, EmptyState, Banner
  motion/      NEW  Stagger, FadeIn, Reveal, Collapse
  skeletons/   NEW  JobCardSkeleton, JobDetailSkeleton, ResultsGridSkeleton,
               SettingsSkeleton, NavSkeleton
  <feature>    rewrite, SAME names and SAME props:
               NavBar, JobCard, FitBreakdown, MatchedGapList, ResumeInput,
               SearchingState, SeniorityPicker, LocationChips, DomainChips,
               CollapsibleText, CollapsibleList
  icons.tsx    DELETE (replaced by lucide)

DELETE: all 15 *.module.css files
```

---

## 5. Phases

### Phase 0 — Foundation

```
npm i tailwindcss@4 @tailwindcss/postcss postcss motion lucide-react
npx shadcn@latest init
```

- Port Nocturne's OKLCH ramps into `@theme`, keeping the token names
  (`--color-accent-500`, `--color-neutral-700`, ...) so the design vocabulary
  survives.
- Load Inter via `next/font`. It is declared in `globals.css` today but never
  actually loaded, so the app currently renders in system-ui.
- Define the type scale (1.200 minor third), and split elevation into a real
  `box-shadow` plus a separate border token — today's `0 0 0 1px` fakes borders *as*
  shadows, which is why nothing can have both.
- Breakpoints: 640 / 768 / 1024 / 1280.

**Done when:** `npm run build` passes and the app renders structurally intact but
unstyled.

**Known snag:** `npx shadcn init` may balk on React 19 peer deps. It is known and
resolvable — do not let it turn into a stack change.

### Phase 1 — Shell and primitives

- `components/ui/` primitives.
- `NavBar` with a mobile drawer below 768px.
- `app/template.tsx` route transition (~200ms fade + 4px rise).
- `Skeleton` primitive with a gradient-sweep shimmer (not a flat pulse).
- `<MotionConfig reducedMotion="user">` at the root.
- A page container replacing the `.page` class and the inline
  `style={{maxWidth:1500}}` hacks in `app/results/page.tsx` and `app/saved/page.tsx`.

### Phase 2 — Core pages

Order: landing + `AuthCard`, then search form, results grid, job detail, saved,
settings.

**Mobile-first is a real rewrite here, not a polish pass.** The codebase currently
contains exactly ONE media query (`app/Landing.module.css:7`); everything else is
desktop-only, with a hard `padding: 56px 64px` on `.page`.

- Job detail: two-column on desktop, stacked with a sticky apply bar on mobile.
- Results grid: 1 / 2 / 3 columns across breakpoints.
- `SearchForm` keeps its full-page takeover during the stream. The NDJSON stream
  carries genuinely informative per-source progress; replacing it with generic
  skeleton cards would lose information the user wants.

**Highest-risk file:** the NDJSON reader loop in `app/search/SearchForm.tsx`. Port it
verbatim; change only what wraps it.

### Phase 3 — Loading states

- The four `loading.tsx` files.
- Skeletons composed from the *same* primitives as the real components, so
  dimensions match and cumulative layout shift is zero.
- Move the nav's saved-count / latest-search query behind its own `<Suspense>`. Right
  now it blocks first paint on every single route (`app/layout.tsx`).
- Skeleton to content handoff is a staggered fade+slide (~20ms per item, capped), not
  an abrupt swap.

### Phase 4 — Motion and a11y polish

- Stagger orchestration, form validation feedback.
- Optimistic save + toast. Today a failed save silently reverts with no user feedback
  (`components/JobCard.tsx:31`).
- Scroll reveals on the landing page ONLY.
- Focus-visible audit, contrast audit, reduced-motion verification, responsive sweep
  at all four breakpoints.

---

## 6. Animation allocation

| Technique | Used for |
|---|---|
| CSS transition | hover / focus / active / press on every interactive element |
| CSS keyframes | skeleton shimmer, meter fill, spinner |
| `motion` | route enter, list stagger, dropdown and dialog enter-exit, toast, collapse, the searching-state checklist |
| `motion` `whileInView` | landing feature reveals only |

**Rule:** `motion` never handles hover states — that ships JS for something the
compositor does for free. `prefers-reduced-motion` is handled globally by
`MotionConfig`, plus a CSS `@media` block for the non-motion animations.

---

## 7. Deferred — not in scope

- Light theme (dark-only for now; doubles the token work).
- **SPEC.md Part 2 criterion 8** — AI resume-edit suggestions. Advertised on the
  landing page but never implemented anywhere in the codebase. Leave a designed slot
  for it in the job-detail sidebar. This is the largest remaining gap against SPEC.md
  and should be the next feature after this rewrite.
- Saved-jobs filtering.
- Richer auth error states beyond the current single string.
