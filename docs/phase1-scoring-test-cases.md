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

Module: `matching_worker/scoring/seniority.py`.

Levels, in order: `Junior` < `Mid-Level` < `Senior` < `Team Lead`. The user picks one or more.

**Decision — scores:** the listing's level is one of the user's → 100; one step away from the closest of the user's levels → 50; two steps or more → 0; nothing found, or no level picked → 50.

**Decision — detection order:**
1. **Title keywords first.** If the title names a level, that level decides. A title naming several ("Junior / Mid-Level") gets its best score.
2. **Otherwise, experience asked for in the text.** Take the minimum: 0–2 years → `Junior`, 3–4 → `Mid-Level`, 5+ → `Senior`. A number of years counts only near the word "experience" / "ניסיון", so "founded 20 years ago" is ignored. "No experience required" phrases count as 0 years, which matters for the many non-tech listings that say so (`ללא ניסיון`, `לא נדרש ניסיון`).
3. **Other keywords in the description body are ignored.** This is what stops "you'll work with senior engineers" from rejecting a junior listing.
4. Nothing found → 50.

**Title keywords:**

| Level | Terms |
|---|---|
| `Junior` | junior, jr, entry level, entry-level, graduate, student, intern, internship, ג'וניור, ג׳וניור, ג׳ וניור, מתחיל, ללא ניסיון, סטודנט |
| `Mid-Level` | mid level, mid-level, intermediate |
| `Senior` | senior, sr, principal, בכיר, סניור |
| `Team Lead` | team lead, team leader, tech lead, lead engineer, lead developer, engineering manager, ראש צוות |

Note the two forms of the Hebrew geresh: `'` (apostrophe) and `׳` (U+05F3). The shared normalization unifies them, and removes gender suffixes (`בכיר/ה` → `בכיר`).

**Years patterns** (both languages): `3+ years`, `at least 3 years`, `3-5 years` (minimum = 3), `3 years of experience`, `two years of experience`, `3 שנות ניסיון`, `שלוש שנות ניסיון`, `ניסיון של 3 שנים`, `שנתיים` (= 2), `שנת ניסיון` / `ניסיון של שנה` (= 1).

**No-experience phrases:** `ללא ניסיון`, `לא נדרש ניסיון`, `אין צורך בניסיון`, `no experience required`, `no experience needed`, `no prior experience`.

| # | User levels | Title | Text excerpt | Expected | Why |
|---|---|---|---|---|---|
| S1 | `Junior` | `Junior Backend Developer` | — | 100 | title keyword |
| S2 | `Junior` | `Senior Backend Engineer` | — | 0 | two steps away |
| S3 | `Junior` | `Backend Developer` | `You'll join a team of senior engineers.` | 50 | v1 returned 0: description keyword wrongly treated as the listing's level |
| S4 | `Junior` | `Backend Developer` | `1+ years of experience with Python` | 100 | years → Junior |
| S5 | `Junior` | `Backend Developer` | `5+ years of experience` | 0 | years → Senior, two steps away |
| S6 | `Junior`, `Mid-Level` | `Backend Developer` | `3-5 years of experience` | 100 | minimum 3 → Mid-Level, selected |
| S7 | `Junior` | `מפתח/ת בקאנד` | `ניסיון של שנתיים לפחות` | 100 | Hebrew dual form = 2 years |
| S8 | `Junior` | `מפתח/ת בקאנד ג׳וניור` | — | 100 | geresh U+05F3 |
| S9 | `Junior` | `מפתח/ת בקאנד ג'וניור` | — | 100 | apostrophe geresh |
| S10 | `Junior` | `Sr. Software Engineer` | — | 0 | abbreviation |
| S11 | `Junior` | `Software Engineer` | — | 50 | nothing found |
| S12 | `Senior` | `מהנדס/ת תוכנה בכיר/ה` | — | 100 | Hebrew senior, gender slash |
| S13 | `Junior` | `Team Lead, Backend` | — | 0 | team lead is three steps from junior |
| S14 | `Junior` | `Junior Developer` | `Requirements: 3+ years of experience` | 100 | title wins over years |
| S15 | `Junior` | `Developer` | `sr. management will review` | 50 | `sr` only counts in the title |
| S16 | `Junior` | `Backend Developer` | `3+ years of experience` | 50 | Mid-Level, one step away |
| S17 | `Mid-Level` | `Junior Developer` | — | 50 | one step away, the other direction |
| S18 | `Senior` | `Team Lead` | — | 50 | one step away |
| S19 | `Junior` | `מוכר/ת לחנות` | `לא נדרש ניסיון, הכשרה במקום` | 100 | no-experience phrase → Junior |
| S20 | `Junior` | `Cashier` | `No experience required.` | 100 | English no-experience phrase |
| S21 | `Junior` | `Developer` | `Founded 20 years ago.` | 50 | years without "experience" nearby are ignored |
| S22 | `Junior` | `Developer` | `שלוש שנות ניסיון` | 50 | Hebrew number word → 3 years → Mid-Level |
| S23 | `Junior` | `Developer` | `two years of experience` | 100 | English number word |
| S24 | (none) | `Senior Developer` | — | 50 | no filter |
| S25 | `Junior` | `Junior / Mid-Level Developer` | — | 100 | best of several title levels |

## 4. Overall score (`compute_overall_score`)

Module: `matching_worker/scoring/overall.py` (with `sort_matches`). Cases are W1–W7 (weighted), not to be confused with the occupation cases O1–O24.

Weights: location 0.25, occupation 0.25, seniority 0.20, skills 0.30. When skills is `None`, the other three weights are renormalized (divide by 0.70).

**Decision — rounding:** half up, like v1 (JavaScript `Math.round`). Python's built-in `round()` rounds half to even (`round(12.5) == 12`), so don't use it here. The sum is computed as an exact fraction with integer weights (25, 25, 20, 30), so 12.5 can't drift to 12.4999 through float error.

| # | Location | Occupation | Seniority | Skills | Computation | Expected |
|---|---|---|---|---|---|---|
| W1 | 100 | 100 | 100 | 100 | 100 | 100 |
| W2 | 100 | 100 | 50 | 70 | 25 + 25 + 10 + 21 = 81 | 81 |
| W3 | 100 | 100 | 50 | None | 60 / 0.70 = 85.71 | 86 |
| W4 | 50 | 0 | 0 | 0 | 12.5 | **13** (built-in `round` gives 12) |
| W5 | 0 | 0 | 0 | 0 | 0 | 0 |
| W6 | 50 | 100 | 50 | None | 47.5 / 0.70 = 67.86 | 68 |
| W7 | 100 | 0 | 100 | 90 | 25 + 0 + 20 + 27 = 72 | 72 |

Property tests, over every combination of sub-scores in steps of 5 (with and without skills): the score stays in 0–100, recomputing gives the same result (criterion 3), and raising a sub-score never lowers it.

## 5. Ordering (`sort_matches`)

Also tested: the order never depends on the input order (every permutation of a mixed list gives the same result).

Criterion 4 says strictly descending, so ties need a rule. **Decision:** overall score descending, then `posted_at` descending (most recent first, missing dates last), then listing id ascending so the order is stable.

| # | Input (score, posted_at, id) | Expected order |
|---|---|---|
| R1 | (70, —, b), (90, —, a), (80, —, c) | a, c, b |
| R2 | (80, 2026-10-01, a), (80, 2026-10-15, b) | b, a |
| R3 | (80, None, a), (80, 2026-10-01, b) | b, a |
| R4 | (80, 2026-10-01, b), (80, 2026-10-01, a) | a, b |

## 6. Deterministic points (`deterministic_points`)

Module: `matching_worker/points.py`; listings are `matching_worker/listing.py`.

Used when the AI step fails or returns nothing usable (criterion 5). Every search has a resume or a skills description (SPEC criterion 7), so this is the fallback for an AI failure, shown as such to the user, never the normal path.

**Decision — what is quoted against:** `Listing.raw_text` is the full text as the user sees it, built by the adapter as title, company, location and body, one per line. The model refuses a `raw_text` that lacks the title or the location, so those can always be quoted.

**Decision — how quotes are cut:** matching runs on normalized text (`מפתח/ת` → `מפתח`), but a quote must be the original words. A point quotes the whole line, or the sentence within the line, of the raw text whose normalized form contains the matched term. The location point quotes the location string itself.

**Decision — when a point is made:** location 100 or 85 → matched, 60 or less → gap, unknown → none. Occupation 100 → matched, 50 or 0 → gap, nothing chosen → none. Seniority 100 → matched, one step or more away → gap, level unknown or none picked → none.

**Decision — nothing matched:** when no point is a match, the listing shows its gaps under "Nothing in this listing matches your search." (`summary`), never an invented match.

`quote_point` is the only way to build a point, for these and for the AI's: it raises when the quote isn't a verbatim substring of `raw_text`.

| # | Case | Expected |
|---|---|---|
| P1 | Location 100, listing text contains `תל אביב` | one matched point whose `quote` is a substring of the listing text |
| P2 | Location 25 (Haifa from Tel Aviv) | one gap point quoting the listing's location, which must appear in the listing text |
| P3 | Location 50 because the location is unknown | no location point at all (neither matched nor gap) |
| P4 | Occupation 100 from a Hebrew term | matched point quoting the line that contains the term |
| P5 | Any generated point | `point.quote in listing.raw_text` is `True` — assert this on every case above |
| P6 | Location, occupation and seniority all at 100 | no gap point: the function never invents a gap to fill the list |
| P7 | Hebrew title `מפתח/ת בקאנד ג'וניור` | the quote is the title as written, gender slash included |
| P8 | Junior search, body `Requirements: 5+ years of experience. Python.` | gap "Senior position" quoting `Requirements: 5+ years of experience.` |
| P9 | Backend search, title `Full Stack Developer` / `Cashier` | gap "Related role (Full Stack Developer)…" / "Different occupation (Cashier)" |
| P10 | Backend search from Tel Aviv, `Cashier` in Haifa | only gaps, and `summary` says nothing matched |
| P11 | A quote absent from `raw_text`, or blank | `quote_point` raises `QuoteNotInListingError` |
| P12 | `raw_text` without the title, or without the location | `Listing` refuses it |
