# Phase 1 — Deterministic scoring: test cases

Test cases for the deterministic scoring in `backend/src/jobhunter/matching_worker/scoring/` (SPEC criteria 1–5). Write the tests from these tables first, then the code. Every row is one assertion. Rows marked **Decision** fix a behavior the SPEC leaves open; change the value if you disagree, but keep a test for it.

The v1 bugs these cases catch are named in the "Why" column.

## 1. Location (`score_location`)

Module: `matching_worker/scoring/location.py`.

The user chooses one **city** in the search (SPEC criterion 1). A listing's location is free text (Hebrew or English) resolved to a known city through an alias table; each known city has coordinates. The score depends on the straight-line distance between the two cities.

**Decision — bands** (one table in code):

| Distance from the search city | Score | Examples from Tel Aviv |
|---|---|---|
| same city, or remote | 100 | Tel Aviv, Remote |
| ≤ 15 km | 85 | Ramat Gan, Petah Tikva, Herzliya |
| ≤ 35 km | 60 | Netanya, Rehovot, Modi'in |
| ≤ 70 km | 40 | Jerusalem, Beit Shemesh |
| beyond | 25 | Haifa, Be'er Sheva |
| unknown or empty location, or no search city | 50 | neutral, and no location point is generated |

**Decision:** when a listing names several known cities (`Tel Aviv / Haifa`), the closest one counts. A search city outside the alias table is a programming error (the search form only offers known cities) and raises `ValueError`.

| # | Search city | Listing location | Expected | Why |
|---|---|---|---|---|
| L1 | Tel Aviv | `Tel Aviv` | 100 | same city |
| L2 | Tel Aviv | `תל אביב-יפו` | 100 | Hebrew name with suffix must resolve |
| L3 | Tel Aviv | `Petah Tikva, Israel` | 85 | country suffix ignored, nearby |
| L4 | Tel Aviv | `Herzliya` | 85 | nearby even though v1 put it in another region |
| L5 | Tel Aviv | `Netanya` | 60 | one step further |
| L6 | Tel Aviv | `Jerusalem` | 40 | further |
| L7 | Tel Aviv | `Haifa` | 25 | far ranks low but stays visible (v1 gave 60 to every other city) |
| L8 | Tel Aviv | `באר שבע` | 25 | Hebrew, far |
| L9 | Haifa | `Yokneam` | 60 | distance works from any search city |
| L10 | Tel Aviv | `Remote` | 100 | remote |
| L11 | Tel Aviv | `Hybrid - Tel Aviv` | 100 | hybrid resolves to its city |
| L12 | Tel Aviv | `` (empty) | 50 | unknown is neutral, not a match |
| L13 | Tel Aviv | `Springfield` | 50 | unknown city is neutral |
| L14 | (none) | `Haifa` | 50 | no filter, neutral |
| L15 | Tel Aviv | `ramat gan` | 85 | case-insensitive |
| L16 | Tel Aviv | `פ"ת` | 85 | common abbreviation |
| L17 | Tel Aviv | `Tel Aviv / Haifa` | 100 | closest of several cities |
| L18 | `Atlantis` | `Haifa` | `ValueError` | search city must be known |
| L19 | Tel Aviv | `Jaffa`, `יפו`, `Ramat HaHayal`, `רמת החייל`, `Kiryat Atidim`, `Tel Aviv District`, `מחוז תל אביב` | 100 | neighborhoods and LinkedIn's district format are Tel Aviv |
| L20 | Tel Aviv | `Springfield` | 50, and the location is logged | unrecognized locations feed the alias table |

## 2. Occupation (`score_occupation`)

Module: `matching_worker/scoring/occupation.py`. Taxonomy: `backend/src/jobhunter/occupations/occupations.json` (families of roles, English and Hebrew names, synonyms).

The user picks, in the search bar, any mix of whole **families** (all their roles count), single **roles**, and **free text** for an occupation the taxonomy doesn't have yet.

**Decision — scores:** 100 when the listing is a chosen occupation; 50 when it is another role of a chosen role's family (a Full Stack listing for a Backend search); 0 otherwise; 50 when nothing is chosen.

**Decision — title first:**
1. Free text found in the title → 100.
2. The title is read for known roles. When one term sits inside a longer matched term, only the longer counts ("QA Automation Engineer" is QA automation, not plain QA; "עובד מטבח" is kitchen worker, not cook).
3. If the title names a chosen role → 100. If it names a specific role that isn't chosen → 50 or 0 by family, **and the body is ignored**: "work with the backend team" doesn't make a Frontend listing a Backend match.
4. If the title names only a **generic** role ("Software Engineer", "QA Engineer", "Technician"), the body may pick a chosen role **of that same family** → 100; otherwise 50 or 0 by family.
5. If the title names no role, the body decides: a chosen role's term or the free text → 100, else 0.

**Decision — matching words:** text is normalized (lowercase, one kind of quote mark, no niqqud, and Hebrew gender suffixes removed: `מפתח/ת` → `מפתח`). Latin terms must be whole words (`nurse` ≠ `nursery`, `sales` ≠ `wholesale`); Hebrew terms match anywhere, because one-letter prefixes attach to the word (`והנהלת חשבונות`).

| # | Chosen | Title | Text excerpt | Expected | Why |
|---|---|---|---|---|---|
| O1 | role `backend-developer` | `Backend Developer` | — | 100 | English title |
| O2 | role `backend-developer` | `מפתח/ת בקאנד` | — | 100 | v1 only knew English terms: every Hebrew listing scored 0 |
| O3 | role `backend-developer` | `Software Engineer` | `...פיתוח צד שרת ב-Python...` | 100 | generic title, body picks a role of its family |
| O4 | role `backend-developer` | `Software Engineer` | `Build great products.` | 50 | generic title, same family |
| O5 | role `backend-developer` | `Full Stack Developer` | — | 50 | same family |
| O6 | role `backend-developer` | `Frontend Developer` | `You'll work closely with the backend team.` | 50 | title wins over body |
| O7 | role `backend-developer` | `QA Automation Engineer` | — | 0 | other family |
| O8 | (none) | `QA Automation Engineer` | — | 50 | no filter |
| O9 | family `software` | `Full Stack Developer` | — | 100 | a whole family covers its roles |
| O10 | role `accountant` | `רואה/ת חשבון` | — | 100 | Hebrew gender slash |
| O11 | role `accountant` | `Accountant` | — | 100 | non-tech role |
| O12 | role `accountant` | `מנהל/ת חשבונות` | — | 50 | bookkeeper, same family |
| O13 | role `nurse` | `Nursery Assistant` | — | 0 | Latin terms are whole words |
| O14 | role `sales-representative` | `Wholesale Coordinator` | — | 0 | `sales` is not in `wholesale` |
| O15 | role `cook` | `עובד/ת מטבח` | — | 50 | longest Hebrew term wins (kitchen worker, not `טבח`) |
| O16 | free `sommelier` | `Sommelier` | — | 100 | free text in the title |
| O17 | free `sommelier` | `Waiter` | `We love wine.` | 0 | title names another role |
| O18 | free `glassblower` | `Workshop team member` | `Experienced glassblower wanted.` | 100 | title names no role, body decides |
| O19 | role `truck-driver` | `Device Driver Engineer` | — | 0 | `device driver` is embedded software |
| O20 | role `teacher` | `מורה דרך` | — | 0 | tour guide is not teacher |
| O21 | role `data-analyst` | `אנליסט/ית פיננסי/ת` | — | 0 | financial analyst, other family |
| O22 | role `caregiver` | `Caregiver` | — | 100 | non-tech role |
| O23 | role `astronaut` | `Astronaut` | — | `ValueError` | ids come from the taxonomy |
| O24 | role `backend-developer` | `QA Engineer` | `Test our backend` | 0 | a generic title's body only picks inside its own family |

The taxonomy has its own integrity tests (`tests/test_occupation_taxonomy.py`): unique ids, every family and role named in both languages, no term shared by two roles, at most one generic role per family.

## 3. Seniority (`score_seniority`)

**Decision — detection order:**
1. **Title keywords first.** If the title names a level, that level decides: in the user's set → 100, otherwise 0.
2. **Otherwise, years of experience in the text.** Take the minimum number asked for: 0–2 → `Junior`, 3–4 → `Mid-Level`, 5+ → `Senior`.
3. **Keywords in the description body are ignored** (except years). This is what stops "you'll work with senior engineers" from rejecting a junior listing.
4. Nothing found → 50.

**Title keywords:**

| Level | Terms |
|---|---|
| `Junior` | junior, jr, entry level, entry-level, graduate, student, ג'וניור, ג׳וניור, ג׳ וניור, מתחיל, ללא ניסיון, סטודנט |
| `Mid-Level` | mid level, mid-level, intermediate |
| `Senior` | senior, sr, sr., בכיר, סניור |
| `Team Lead` | team lead, tech lead, lead engineer, engineering manager, ראש צוות |

Note the two forms of the Hebrew geresh: `'` (apostrophe) and `׳` (U+05F3). Normalize both before matching.

**Years patterns** (both languages): `3+ years`, `at least 3 years`, `3-5 years` (minimum = 3), `3 years of experience`, `3 שנות ניסיון`, `ניסיון של 3 שנים`, `שנתיים` (= 2), `שנה` / `שנת ניסיון` (= 1).

| # | User levels | Title | Text excerpt | Expected | Why |
|---|---|---|---|---|---|
| S1 | `Junior` | `Junior Backend Developer` | — | 100 | title keyword |
| S2 | `Junior` | `Senior Backend Engineer` | — | 0 | conflicting title |
| S3 | `Junior` | `Backend Developer` | `You'll join a team of senior engineers.` | 50 | v1 returned 0: description keyword wrongly treated as the listing's level |
| S4 | `Junior` | `Backend Developer` | `1+ years of experience with Python` | 100 | years → Junior |
| S5 | `Junior` | `Backend Developer` | `5+ years of experience` | 0 | years → Senior |
| S6 | `Junior`, `Mid-Level` | `Backend Developer` | `3-5 years of experience` | 100 | minimum 3 → Mid-Level, selected |
| S7 | `Junior` | `מפתח/ת בקאנד` | `ניסיון של שנתיים לפחות` | 100 | Hebrew dual form = 2 years |
| S8 | `Junior` | `מפתח/ת בקאנד ג׳וניור` | — | 100 | geresh U+05F3 |
| S9 | `Junior` | `מפתח/ת בקאנד ג'וניור` | — | 100 | apostrophe geresh |
| S10 | `Junior` | `Sr. Software Engineer` | — | 0 | abbreviation |
| S11 | `Junior` | `Software Engineer` | — | 50 | nothing found |
| S12 | `Senior` | `מהנדס/ת תוכנה בכיר/ה` | — | 100 | Hebrew senior |
| S13 | `Junior` | `Team Lead, Backend` | — | 0 | team lead ≠ junior |
| S14 | `Junior` | `Junior Developer` | `Requirements: 3+ years of experience` | 100 | title wins over years (Decision) |
| S15 | `Junior` | `Developer` | `sr. management will review` | 50 | `sr` only counts in the title |

## 4. Overall score (`compute_overall_score`)

Weights: location 0.25, occupation 0.25, seniority 0.20, skills 0.30. When skills is `None`, the other three weights are renormalized (divide by 0.70).

**Decision — rounding:** half up, like v1 (JavaScript `Math.round`). Python's built-in `round()` rounds half to even (`round(12.5) == 12`), so don't use it here.

| # | Location | Occupation | Seniority | Skills | Computation | Expected |
|---|---|---|---|---|---|---|
| O1 | 100 | 100 | 100 | 100 | 100 | 100 |
| O2 | 100 | 100 | 50 | 70 | 25 + 25 + 10 + 21 = 81 | 81 |
| O3 | 100 | 100 | 50 | None | 60 / 0.70 = 85.71 | 86 |
| O4 | 50 | 0 | 0 | 0 | 12.5 | **13** (built-in `round` gives 12) |
| O5 | 0 | 0 | 0 | 0 | 0 | 0 |
| O6 | 50 | 100 | 50 | None | 47.5 / 0.70 = 67.86 | 68 |
| O7 | 100 | 0 | 100 | 90 | 25 + 0 + 20 + 27 = 72 | 72 |

Property test worth adding: recomputing from the stored sub-scores always returns the stored overall score (criterion 3).

## 5. Ordering (`sort_matches`)

Criterion 4 says strictly descending, so ties need a rule. **Decision:** overall score descending, then `posted_at` descending (most recent first, missing dates last), then listing id ascending so the order is stable.

| # | Input (score, posted_at, id) | Expected order |
|---|---|---|
| R1 | (70, —, b), (90, —, a), (80, —, c) | a, c, b |
| R2 | (80, 2026-10-01, a), (80, 2026-10-15, b) | b, a |
| R3 | (80, None, a), (80, 2026-10-01, b) | b, a |
| R4 | (80, 2026-10-01, b), (80, 2026-10-01, a) | a, b |

## 6. Deterministic points (`deterministic_points`)

Used when there is no resume or the AI returns nothing usable (criterion 5).

| # | Case | Expected |
|---|---|---|
| P1 | Location 100, listing text contains `תל אביב` | one matched point whose `quote` is a substring of the listing text |
| P2 | Location 25 (Haifa from Tel Aviv) | one gap point quoting the listing's location, which must appear in the listing text |
| P3 | Location 50 because the location is unknown | no location point at all (neither matched nor gap) |
| P4 | Occupation 100 from a Hebrew term | matched point quoting the line that contains the term |
| P5 | Any generated point | `point.quote in listing.raw_text` is `True` — assert this on every case above |
| P6 | Location, occupation and seniority all at 100 | no gap point: the function never invents a gap to fill the list |
