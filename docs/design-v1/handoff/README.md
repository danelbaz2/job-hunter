# Handoff: Job Hunter — UI Mockups (Search, Results, Job Detail)

## Overview
UI mockups for "Job Hunter", a Next.js app (per the project's own `CLAUDE.md` / `SPEC.md`) that aggregates job listings for Israel, scores them against a user's resume, and shows matched/gap points plus resume-edit suggestions. This package covers three states: search setup, results grid (with filters/sort/save), and a full job-detail page. `CLAUDE.md` and `SPEC.md` at the repo root are the functional source of truth — read them before implementing; this README covers UI only.

## About the Design Files
The bundled file (`Job Hunter Mockups.dc.html`) is a **design reference built in HTML** — a clickable prototype showing layout, states, and interaction intent. It is not production code. Recreate these screens in the target Next.js codebase using React components, the project's actual data (real Apify results, real auth), and whatever CSS approach the codebase already uses (or pick one — CSS Modules/Tailwind — if none exists yet). Do not port the raw HTML/inline-styles as-is.

## Fidelity
**High-fidelity.** Colors, spacing, type sizes and component states below are final; recreate them precisely. All copy in the mock (company names, job text, resume text) is placeholder/sample data — replace with real data from the Apify pipeline once wired up.

## Design Tokens (Nocturne design system)

Colors:
- Background: `#161826` · Surface (cards): `#232532` · Text: `#e9e9ed`
- Accent (single brand accent, blurple): `#9184d9`, ramp 100–900 from `#f5f4ff` (100) to `#2b2741` (900); base use is 500 `#968ae0`
- Neutral ramp 100–900: `#f3f5fe` → `#292b31`
- Divider: `color-mix(in srgb, #e9e9ed 16%, transparent)`
- Score-tier colors (added on top of the mono system, per explicit request for red/orange/green contrast):
  - High (≥85%): text `#4ade80`, bg `rgba(34,197,94,0.16)`, border `rgba(74,222,128,0.4)`
  - Mid (65–84%): text `#fbbf24`, bg `rgba(245,158,11,0.16)`, border `rgba(251,191,36,0.4)`
  - Low (<65%): text `#f87171`, bg `rgba(239,68,68,0.16)`, border `rgba(248,113,113,0.4)`

Typography: Inter for both heading and body, heading weight 500 (never bolder). Scale used: 56px (page H1), 38px/34px (section H1), 32px (spinner heading), 22px (H2), 17–19px (body/intro), 13–15px (meta/labels), 11–12px (fine print/quotes).

Spacing scale (0.7× density): 2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4px (space-1…8). Page padding: 64px horizontal on desktop, 56–96px vertical.

Radius: sm 4px, md 8px, lg 14px. Buttons/tags use pill (999px) radius.

Shadows: sm `0 0 0 1px #3f424d`; md `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)`; lg `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)`.

Icons: Phosphor icon set (outline style, stroke-width ~1.75).

## Screens / Views

### 1. Search setup (`#setup`)
**Purpose:** user enters location, seniority, domain(s), and resume before running a search.

**Layout:** Full-bleed page, no card wrapper, content max-width 1400px, 64px side padding. Single H1 (56px) + intro paragraph (19px, max 60ch), then a 2-column grid (Location select | Seniority picker), then full-width Domain chip row, then full-width Resume section, then a large primary CTA button.

**Components:**
- Nav bar: `Job Hunter` brand (16px, weight 500) left; `Search / Results / Saved (N)` links + account icon button right. Active link is white/bold, inactive is neutral-300.
- Location: native `<select>` styled 17px text, 16×18px padding, md radius.
- Seniority: 4 pill buttons (not a native segmented control) — **Junior, Mid-Level, Senior, Team Lead** (no "Staff+"). Unselected: transparent bg, 1px `neutral-700` border, `neutral-300` text. Selected: bg `color-mix(accent 18%, transparent)`, border `accent-500`, text `accent-200`. This is a background **tint**, not a full solid fill — keep the selected state legible against the label text.
- Domain: multi-select tag row, 8 options, selected = `tag-accent` (filled tint), unselected = `tag-outline`. Font 14px, generous 10×18px padding.
- Resume: two pill tabs — "Upload file" / "Paste text" (same selected/unselected treatment as Seniority). Upload tab shows a dashed dropzone (56×40px padding, lg radius) + an "uploaded" confirmation strip once a file exists. Paste tab shows a large textarea (17px text) pre-filled with placeholder resume text.
- Primary CTA: "Find matching jobs →" pill button, 17px text, 18×36px padding.

**State → Searching:** clicking the CTA replaces the whole page content with a centered searching state: spinner (40px circle, 3px border, accent top segment, 0.9s linear rotation), H1 "Searching for your next role…", and a checklist of source-check lines (AllJobs ✓, Drushim ✓, Indeed-Israel ✓, LinkedIn ⚠ unavailable, "Scoring fit…" ✓). After ~1.7s (mock timer — replace with real completion signal) it navigates to the Results screen.

### 2. Results grid (`#results`, grid mode)
**Purpose:** browse ranked listings, filter/sort, save, open detail.

**Layout:** Full-bleed, max-width 1500px, 64px side padding. Header row: H1 ("42 matches for your search" / "Saved jobs" when in Saved view) + search-summary tags, "Edit search" ghost button top-right. Below: a degraded-source notice banner (icon + text, neutral-900 bg, 1px divider border) shown whenever a source failed. Below that: a toolbar row (source filter tags left, sort-by segmented control right) with a bottom divider. Below: a responsive card grid, `repeat(auto-fill, minmax(280px,1fr))`, 36px row gap / 28px column gap.

**Job card component:**
- Container: `surface` bg, 1px divider border, lg radius, md shadow, 20×22×24px padding. Hover: lift `translateY(-6px)`, shadow → lg, border → `accent-600`. Cursor pointer; whole card is clickable to open detail.
- Bookmark icon button, top-left, 32×32px ghost icon button, stops click propagation. Outline stroke when unsaved (`neutral-400`), filled `accent-400` when saved.
- Top row: 48px avatar (initial letter, `accent-900` bg / `accent-300` text, sm radius) + title (17px, weight 500) + company (13px, neutral-400) on the left; **score badge inline at top-right of the card's own row** (not overlapping the border, sits within the card's padding) — pill shape, tier color per Design Tokens above, 16px bold text, 6×14px padding, 1px tier-color border.
- Location + "posted X days ago" line, 13px neutral-500.
- Bottom tag row: "{N} matched" (tag-accent) + "{N} gaps" (tag-outline) + conditionally "Skills-fit unavailable" (tag-neutral) when the AI scoring step failed for that listing.

**Filters/sort (functional, not just visual):**
- Source tags (AllJobs / Drushim / Indeed-Israel): click toggles a listing source on/off; filled = included, outlined = excluded. Deselecting all sources shows the empty state.
- Sort segmented control: "Fit score" (default, descending) / "Newest" (ascending by days-posted).
- Empty state: dashed border box, centered, "No listings match these filters" + "Reset filters" secondary button.

**Saved view:** same grid, filtered to bookmarked jobs; reached via the "Saved (N)" nav link. Nav shows a live count.

### 3. Job detail (full page, replaces the grid — not a modal)
**Purpose:** deep-dive on one listing: what it needs, how the user matches, apply.

**Layout:** Full-bleed, max-width 1400px, 64px padding. "← Back to results" ghost button top-left returns to whichever list (grid or saved) the user came from. Header: 64px avatar + H1 (38px) + company/location (17px) + tags (Full-time / Via {source} / posted label) on the left; Save button + large score badge (32px number, pill, tier-colored, 16×28px padding) on the right.

Below, a 2-column layout (1.4fr / 1fr, 56px gap):
- **Left column:** "About this role" (22px H2 + 16px body, max 70ch), "Requirements" (em-dash bullet list, 15px), "Fit breakdown" (4 labeled progress bars — Location / Domain / Seniority / Skills fit — 8px track height, `neutral-800` track, `accent-500` fill, percentage label right-aligned per row). When skills-fit AI scoring failed for this listing, replace that bar with a warning panel (icon + explanatory text, neutral-900 bg, 1px divider border, md radius) instead of a fabricated number.
- **Right column:** a sticky card (`top: 88px`) containing: full-width primary "Apply on {source}" button linking out to the original listing (`target="_blank" rel="noopener"`) + caption text, then "Matched — N" and "Gaps — N" sections. **Each matched/gap point shows two lines**: the claim itself (13.5px) and, in italic 11.5px muted text, the exact quoted snippet from the original listing text it was derived from ("From listing: "…""). This traceability is a SPEC.md non-negotiable — never show a matched/gap point without the sourcing quote.

## Interactions & Behavior
- Card click → navigate to detail (not a modal/overlay — a full page transition).
- Bookmark click → toggle saved state, stop propagation so it doesn't also open detail.
- Source tag click → toggle that source's jobs in/out of the visible list.
- Sort control → re-sort visible list by score desc or by recency.
- Seniority/Resume-mode pills → single-select within their group, tinted-background selected state (see Design Tokens — this was explicitly corrected from an earlier full-color-fill bug).
- Search submit → loading state → auto-navigate to results after the search completes.
- No animations beyond: card hover lift/shadow transition (~0.18s ease), spinner rotation (0.9s linear infinite).

## State Management
Suggested state shape (mirrors the mock's logic):
```
{
  seniority: 'Junior' | 'Mid-Level' | 'Senior' | 'Team Lead',
  resumeMode: 'upload' | 'paste',
  searching: boolean,
  navView: 'results' | 'saved',
  sourceFilters: { [sourceName]: boolean },
  sortBy: 'score' | 'date',
  savedJobIds: string[],
  openJobId: string | null
}
```
Data requirements per job/listing: id, company, title, location, source, url, postedAt, subLocation/subDomain/subSeniority/subSkills scores (0–100, subSkills nullable when AI scoring failed), aiFailed flag, description, requirements[], matchedPoints[{text, quote}], gapPoints[{text, quote}]. The `quote` field must be a verbatim substring of the original listing text — this is required by `SPEC.md` Part 2, criteria 6–7 (no hallucinated match/gap claims).

## Assets
No external image assets — avatars are initials on a tinted background (generated, not uploaded logos). Icons are inline SVG, Phosphor-style outline paths (see the HTML file for exact paths — reproduce with the codebase's actual Phosphor icon package rather than hand-copying SVG paths).

## Files
- `Job Hunter Mockups.dc.html` — the full interactive mockup (all 3 screens/states, click-through). Open in a browser to click through it.
- `screenshots/results-grid.png`, `screenshots/job-detail.png`, `screenshots/saved-empty-state.png` — reference captures of key states.
- `../CLAUDE.md`, `../SPEC.md` — functional spec this UI implements (not duplicated here; read at repo root).
