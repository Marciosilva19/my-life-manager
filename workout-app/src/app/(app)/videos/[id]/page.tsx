import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { deleteVideo, toggleCompleted, updateVideo } from "@/lib/actions/videos";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtShortDay } from "@/lib/time";
import type { NamedRef, Video } from "@/lib/types";
import { LEVELS, toPlayable } from "@/lib/video";

export const metadata = { title: "Workout" };

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const me = await requireProfile();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*, trainer:profiles!videos_trainer_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound(); // RLS hides videos from trainers you're not connected to
  const v = data as Video & { trainer: NamedRef };
  const isOwner = v.trainer_id === me.id;

  let src = v.video_url;
  if (v.storage_path) {
    const { data: signed } = await supabase.storage.from("videos").createSignedUrl(v.storage_path, 60 * 60 * 3);
    src = signed?.signedUrl ?? null;
  }
  const player = src ? (v.storage_path ? { kind: "file" as const, src } : toPlayable(src)) : null;

  let done = false;
  let completedBy = 0;
  if (me.role === "client") {
    const { count } = await supabase
      .from("video_completions")
      .select("*", { count: "exact", head: true })
      .eq("video_id", v.id)
      .eq("client_id", me.id);
    done = (count ?? 0) > 0;
  } else if (isOwner) {
    const { count } = await supabase
      .from("video_completions")
      .select("*", { count: "exact", head: true })
      .eq("video_id", v.id);
    completedBy = count ?? 0;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Flash error={sp.error} ok={sp.ok} />
      <Link href="/videos" className="btn-ghost btn-sm -ml-3 mb-2">← All videos</Link>

      <div className="overflow-hidden rounded-2xl bg-black shadow-soft">
        {player?.kind === "iframe" ? (
          <iframe
            src={player.src}
            title={v.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : player?.kind === "file" ? (
          <video src={player.src} controls playsInline preload="metadata" className="aspect-video w-full" />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 text-white">
            <span className="text-4xl">▶</span>
            {player ? (
              <a href={player.src} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Open video ↗
              </a>
            ) : (
              <p className="text-sm opacity-70">Video unavailable</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1>{v.title}</h1>
          <p className="mt-1 text-sm capitalize text-muted">
            {[v.category, v.level, v.duration_min ? `${v.duration_min} min` : null, v.trainer?.full_name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {me.role === "client" ? (
          <form action={toggleCompleted}>
            <input type="hidden" name="id" value={v.id} />
            <input type="hidden" name="done" value={String(done)} />
            <SubmitButton className={done ? "btn-secondary" : "btn-primary"} pendingText="…">
              {done ? "✓ Completed — undo" : "Mark as done"}
            </SubmitButton>
          </form>
        ) : isOwner ? (
          <span className="chip bg-surface2 text-muted">
            Completed by {completedBy} {completedBy === 1 ? "client" : "clients"}
          </span>
        ) : null}
      </div>

      {v.description ? <p className="mt-4 whitespace-pre-line">{v.description}</p> : null}
      <p className="mt-4 text-xs text-muted">Published {fmtShortDay(v.created_at)}</p>

      {isOwner ? (
        <details className="card mt-6">
          <summary className="cursor-pointer font-semibold">Edit video</summary>
          <form action={updateVideo} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={v.id} />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" required maxLength={100} defaultValue={v.title} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <input id="category" name="category" maxLength={40} defaultValue={v.category ?? ""} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="level">Level</label>
                <select id="level" name="level" defaultValue={v.level ?? ""} className="input capitalize">
                  <option value="">Any</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="duration_min">Minutes</label>
                <input id="duration_min" name="duration_min" type="number" min={1} max={600} defaultValue={v.duration_min ?? ""} className="input" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">Instructions</label>
              <textarea id="description" name="description" rows={4} maxLength={2000} defaultValue={v.description ?? ""} className="input" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton>Save changes</SubmitButton>
            </div>
          </form>
          <form action={deleteVideo} className="mt-4 border-t border-border pt-4">
            <input type="hidden" name="id" value={v.id} />
            <SubmitButton className="btn-danger" pendingText="Deleting…" confirm="Delete this video for all clients?">
              Delete video
            </SubmitButton>
          </form>
        </details>
      ) : null}
    </div>
  );
}
