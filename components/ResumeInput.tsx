'use client';

import { useRef } from 'react';
import pillStyles from './Pills.module.css';
import styles from './ResumeInput.module.css';
import { UploadIcon } from './icons';

export type ResumeMode = 'upload' | 'paste';

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
    <div>
      <div className={pillStyles.pillRow} style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`${pillStyles.pill} ${mode === 'upload' ? pillStyles.pillSelected : ''}`}
          onClick={() => onModeChange('upload')}
        >
          Upload file
        </button>
        <button
          type="button"
          className={`${pillStyles.pill} ${mode === 'paste' ? pillStyles.pillSelected : ''}`}
          onClick={() => onModeChange('paste')}
        >
          Paste text
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <div className={styles.dropzone} onClick={() => inputRef.current?.click()}>
            <UploadIcon />
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
            <div className={styles.uploadedStrip}>
              <span>{file.name}</span>
              <button type="button" onClick={() => onFileChange(null)} aria-label="Remove file">
                ×
              </button>
            </div>
          )}
        </div>
      ) : (
        <textarea
          className={styles.textarea}
          placeholder="Paste your resume text here…"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />
      )}
    </div>
  );
}
