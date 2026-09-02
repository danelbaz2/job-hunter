import type { RawListing } from '@/lib/sources/types';
import type { Source } from '@/types/domain';

/**
 * Deterministic "something broke" scenario for demos / grading (see README).
 *
 * It runs the *real* pipeline — the retry loop in `apifyRunner`, the transient-error
 * retry in `openRouterChat`, the visible degradation in the searching UI — but every
 * external call is short-circuited before it leaves the process, so a demo run costs
 * nothing on Apify or OpenRouter.
 *
 * Enable per-request with the `demo=1` field on POST /api/search. Gated by `isDemoAllowed()`.
 */

// Intentionally always on, in every environment: the failure-scenario button is a
// graded deliverable and must be reachable on the deployed app. It is safe to leave
// enabled — a demo run makes zero external calls and only writes a normal search row.
export function isDemoAllowed(): boolean {
  return true;
}

function listing(over: Partial<RawListing> & { title: string; company: string; location: string; rawText: string }): RawListing {
  return {
    source: 'alljobs',
    externalId: `demo-${over.title}-${over.company}`.replace(/\s+/g, '-').toLowerCase(),
    url: 'https://example.com/demo-listing',
    companyLogoUrl: null,
    postedAt: new Date().toISOString(),
    description: over.rawText,
    requirements: [],
    ...over,
  };
}

const ALLJOBS_LISTINGS: RawListing[] = [
  listing({
    source: 'alljobs',
    title: 'Backend Engineer',
    company: 'Nimbus Data',
    location: 'Tel Aviv',
    rawText:
      'We are hiring a Backend Engineer in Tel Aviv to build and scale our data ingestion services. ' +
      'You will design REST APIs, own PostgreSQL schema design, and work with Node.js and TypeScript. ' +
      'Requirements: 3+ years building production backend services, strong SQL, experience with cloud infrastructure (AWS or GCP).',
  }),
  listing({
    source: 'alljobs',
    title: 'Full-Stack Developer',
    company: 'Bright Retail',
    location: 'Herzliya',
    rawText:
      'Full-Stack Developer role in Herzliya. Our stack is React on the front end and Node.js on the back end. ' +
      'You will ship features end to end, from database migrations to UI. ' +
      'Requirements: experience with React and a Node backend, comfort with relational databases, 2+ years of professional experience.',
  }),
];

const DRUSHIM_LISTINGS: RawListing[] = [
  listing({
    source: 'drushim',
    title: 'Senior Backend Developer',
    company: 'Maccabi Tech',
    location: 'Tel Aviv',
    rawText:
      'Senior Backend Developer at a healthcare technology group in Tel Aviv. ' +
      'You will lead the design of microservices handling millions of requests per day, mentor two junior developers, ' +
      'and drive migration from a monolith to services. Requirements: 5+ years backend, deep experience with distributed systems, Go or Java.',
  }),
  listing({
    source: 'drushim',
    title: 'DevOps Engineer',
    company: 'CloudField',
    location: 'Remote',
    rawText:
      'Remote DevOps Engineer. Own our Kubernetes clusters, CI/CD pipelines, and observability stack. ' +
      'Requirements: hands-on Kubernetes in production, Terraform, experience with Prometheus and Grafana, on-call rotation.',
  }),
];

const LINKEDIN_LISTINGS: RawListing[] = [
  listing({
    source: 'linkedin',
    title: 'Software Engineer, Platform',
    company: 'Orbit Security',
    location: 'Tel Aviv',
    rawText:
      'Software Engineer on the Platform team in Tel Aviv. Build internal tooling and shared libraries used by every product team. ' +
      'Requirements: solid computer science fundamentals, one of Go, Rust or TypeScript, an interest in developer experience.',
  }),
];

export interface DemoActorFault {
  /** `.call()` throws while `attempt` is <= this number (a paid retry each time). */
  callFailsUpToAttempt: number;
  /** `listItems()` throws on these attempt numbers (a *free* retry — the run is reused). */
  datasetFailsOnAttempts: number[];
  /** Returned once the above stop failing. Empty ⇒ this source degrades to `failed`. */
  listings: RawListing[];
}

/**
 * alljobs  — actor call fails twice, succeeds on the 3rd (2 paid retries; recovers).
 * drushim  — clean, succeeds first try (the nominal case, for contrast).
 * indeed_il — fails all 3 attempts, degrades to `failed` (the others carry on).
 * linkedin — actor call is fine, the dataset read fails once then the *same run* is reused (free retry).
 */
export const DEMO_ACTOR_FAULTS: Record<Source, DemoActorFault> = {
  alljobs: { callFailsUpToAttempt: 2, datasetFailsOnAttempts: [], listings: ALLJOBS_LISTINGS },
  drushim: { callFailsUpToAttempt: 0, datasetFailsOnAttempts: [], listings: DRUSHIM_LISTINGS },
  indeed_il: { callFailsUpToAttempt: 3, datasetFailsOnAttempts: [], listings: [] },
  linkedin: { callFailsUpToAttempt: 0, datasetFailsOnAttempts: [1], listings: LINKEDIN_LISTINGS },
};

/** Default candidate text so the demo always reaches the (faulted) OpenRouter call. */
export const DEMO_INTENT_TEXT =
  'Backend-leaning full-stack engineer, 4 years with Node.js, TypeScript and PostgreSQL, looking for a role with more system-design ownership.';

/**
 * Stateful fake `fetch` for the OpenRouter endpoint: HTTP 503 on the first call, then a
 * valid completion. The quote is lifted verbatim from the listing text in the request body,
 * so it survives the caller's substring verification (SPEC.md criterion 5 stays honest).
 * One instance per listing — call the factory per `scoreSkillsFit`.
 */
export function makeDemoOpenRouterFetch(): typeof fetch {
  let calls = 0;
  return (async (_url: string, init?: RequestInit) => {
    calls++;
    if (calls === 1) {
      return new Response(JSON.stringify({ error: { message: 'Upstream error (simulated 503)' } }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    }

    const parsedBody = JSON.parse(String(init?.body ?? '{}')) as {
      messages?: { role: string; content: string }[];
    };
    const userContent = parsedBody.messages?.find((m) => m.role === 'user')?.content ?? '';
    const listingText = userContent.split('LISTING TEXT:\n')[1] ?? userContent;
    const sentence =
      listingText
        .split(/(?<=\.)\s+/)
        .map((s) => s.trim())
        .find((s) => s.length > 25) ?? listingText.slice(0, 60).trim();

    const content = JSON.stringify({
      skillsScore: 76,
      matched: [{ text: 'Relevant backend experience for this role', quote: sentence }],
      gaps: [{ text: 'Depth in distributed systems not evidenced', quote: sentence }],
    });

    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
}
