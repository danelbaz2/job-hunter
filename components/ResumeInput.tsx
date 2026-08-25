'use client';

import { useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Upload, X } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Textarea } from '@/components/ui/textarea';

export type ResumeMode = 'upload' | 'paste';

const EASE = [0.16, 1, 0.3, 1] as const;

export function ResumeInput({
  mode,
  onModeChange,
  file,
  onFileChange,
  text,
  onTextChange,
}: {
  mode: ResumeMode;
  onModeChange: (m: ResumeMode) => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
  text: string;
  onTextChange: (t: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SegmentedControl
        className="mb-3 shrink-0"
        options={[
          { value: 'upload', label: 'Upload file' },
          { value: 'paste', label: 'Paste text' },
        ]}
        value={mode}
        onChange={onModeChange}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: EASE }}
          className="flex min-h-0 flex-1 flex-col"
        >
          {mode === 'upload' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div
                className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 text-center text-base text-text/70 transition-colors hover:border-accent-500 hover:text-text/90"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={32} className="text-neutral-500" />
                <p>Drop your resume here, or click to choose a file (PDF or DOCX)</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  hidden
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
              </div>
              {file && (
                <div className="mt-2 flex shrink-0 items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => onFileChange(null)} aria-label="Remove file" className="p-1 text-text/50 hover:text-text">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Textarea
              className="h-full flex-1 resize-none text-base"
              placeholder="Paste your resume text here…"
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
