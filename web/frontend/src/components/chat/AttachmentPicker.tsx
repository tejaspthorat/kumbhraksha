"use client";

import { useRef, useState, useCallback } from "react";
import { Paperclip, X, Upload } from "lucide-react";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface AttachmentPickerProps {
  onUpload: (file: File) => Promise<{ url: string; type: string; name: string; size: number }>;
  onAttach: (attachment: { url: string; type: string; name: string; size: number }) => void;
  disabled?: boolean;
}

export default function AttachmentPicker({
  onUpload,
  onAttach,
  disabled = false,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      e.target.value = "";

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("File type not allowed");
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        setError("File too large (max 10MB)");
        setTimeout(() => setError(null), 3000);
        return;
      }

      setUploading(true);
      setProgress(0);
      setError(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 15, 90));
      }, 200);

      try {
        const result = await onUpload(file);
        setProgress(100);
        onAttach(result);
      } catch (err: any) {
        setError(err.message || "Upload failed");
        setTimeout(() => setError(null), 3000);
      } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
        }, 500);
      }
    },
    [onUpload, onAttach]
  );

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || uploading}
        className="p-2 rounded-lg text-muted hover:text-body hover:bg-surface-soft transition-all duration-200 disabled:opacity-30"
        title="Attach file"
      >
        {uploading ? (
          <div className="w-5 h-5 relative">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${progress * 0.63} 100`}
                className="text-accent"
              />
            </svg>
          </div>
        ) : (
          <Paperclip size={18} />
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs whitespace-nowrap animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
