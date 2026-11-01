"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const MAX_MB = 50;

/**
 * Uploads a recorded workout straight from the browser to Supabase Storage
 * (into the trainer's own folder) and puts the resulting path in a hidden field.
 */
export default function VideoUpload({ trainerId }: { trainerId: string }) {
  const [path, setPath] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    setPath("");
    if (!file) return setStatus(null);
    if (file.size > MAX_MB * 1024 * 1024) return setStatus(`File is larger than ${MAX_MB} MB — use a YouTube/Vimeo link instead.`);
    setBusy(true);
    setStatus("Uploading…");
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const target = `${trainerId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient()
      .storage.from("videos")
      .upload(target, file, { contentType: file.type || "video/mp4" });
    setBusy(false);
    if (error) return setStatus(`Upload failed: ${error.message}`);
    setPath(target);
    setStatus(`Uploaded ${file.name} ✓`);
  }

  return (
    <div>
      <input type="hidden" name="storage_path" value={path} />
      <input
        type="file"
        accept="video/*"
        disabled={busy}
        onChange={(e) => onFile(e.target.files?.[0])}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface2 file:px-3 file:py-2 file:text-sm file:font-medium file:text-text"
      />
      {status ? <p className="mt-1.5 text-xs text-muted">{status}</p> : null}
    </div>
  );
}
