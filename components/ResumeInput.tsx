'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResumeInput({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && /\.(pdf|docx)$/i.test(dropped.name)) onFileChange(dropped);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 text-center text-base text-text/70 transition-colors duration-200 hover:border-accent-500 hover:text-text/90',
          dragActive && 'border-accent-500 bg-accent-500/8 text-text/90'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload
          size={32}
          className={cn('text-neutral-500 transition-transform duration-200', dragActive && '-translate-y-0.5 text-accent-500')}
        />
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
          <button type="button" onClick={() => onFileChange(null)} aria-label="Remove file" className="p-1 text-text/60 hover:text-text">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
