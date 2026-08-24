/**
 * Upload -> parse to text -> same pipeline as pasted text (SPEC.md Part 3).
 * Output stays text-only; no document regeneration.
 */
export async function parseResumeFile(file: File): Promise<{ text: string; unreadable: boolean }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text = '';
  if (name.endsWith('.pdf')) {
    // pdf-parse bundles an unmaintained ~2017 pdf.js that fails ("bad XRef entry") on
    // modern PDFs using cross-reference streams — i.e. most PDFs exported by current
    // Word/Google Docs/Pages. unpdf wraps current pdf.js and handles them correctly.
    const { extractText, getDocumentProxy } = await import('unpdf');
    const doc = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(doc, { mergePages: true });
    text = result.text;
  } else if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = buffer.toString('utf-8');
  }

  const trimmed = text.trim();
  // A scanned/image-based PDF can parse to empty/near-empty text — surface this rather
  // than silently scoring against blank content (CLAUDE.md: degrade visibly).
  const unreadable = trimmed.length < 40;

  return { text: trimmed, unreadable };
}
