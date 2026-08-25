/**
 * Deliberately empty. This is Next's Suspense fallback for page.tsx's own `await
 * auth()` check (typically well under 100ms) — it has no way to know whether
 * JobDetailLoader's client-side cache is already warm for this id, so if it rendered
 * the heavy skeleton here, every navigation would flash it even on a cache hit.
 * JobDetailLoader (mounted once page.tsx resolves) is the only thing that decides
 * whether to show a skeleton, based on the actual cache state.
 */
export default function Loading() {
  return null;
}
