import Link from "next/link";
import Flash from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import VideoCard from "@/components/VideoCard";
import VideoUpload from "@/components/VideoUpload";
import { createVideo } from "@/lib/actions/videos";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { NamedRef, Video } from "@/lib/types";
import { LEVELS } from "@/lib/video";

export const metadata = { title: "Videos" };

type SP = Promise<{ error?: string; ok?: string; category?: string; show?: string }>;
type Row = Video & { trainer: NamedRef };

export default async function VideosPage({ searchParams }: { searchParams: SP }) {
  const me = await requireProfile();
  const sp = await searchParams;
  const supabase = await createClient();
  const isTrainer = me.role === "trainer";

  let q = supabase
    .from("videos")
    .select("*, trainer:profiles!videos_trainer_id_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (isTrainer) q = q.eq("trainer_id", me.id);
  const [{ data }, { data: done }] = await Promise.all([
    q,
    isTrainer
      ? Promise.resolve({ data: [] as { video_id: string }[] })
      : supabase.from("video_completions").select("video_id").eq("client_id", me.id),
  ]);

  const all = (data ?? []) as Row[];
  const doneIds = new Set((done ?? []).map((d) => d.video_id as string));
  const categories = [...new Set(all.map((v) => v.category).filter(Boolean) as string[])].sort();
  let videos = sp.category ? all.filter((v) => v.category === sp.category) : all;
  if (sp.show === "todo") videos = videos.filter((v) => !doneIds.has(v.id));
  const multipleTrainers = new Set(all.map((v) => v.trainer_id)).size > 1;

  const filterHref = (patch: { category?: string | null; show?: string | null }) => {
    const p = new URLSearchParams();
    const category = patch.category === undefined ? sp.category : patch.category;
    const show = patch.show === undefined ? sp.show : patch.show;
    if (category) p.set("category", category);
    if (show) p.set("show", show);
    const s = p.toString();
    return s ? `/videos?${s}` : "/videos";
  };

  return (
    <>
      <Flash error={sp.error} ok={sp.ok} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>{isTrainer ? "Recorded workouts" : "Workout library"}</h1>
          {!isTrainer && all.length > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {doneIds.size} of {all.length} completed
            </p>
          ) : null}
        </div>
        {!isTrainer && all.length > 0 ? (
          <div className="h-2 w-40 overflow-hidden rounded-full bg-surface2">
            <div className="h-full bg-primary" style={{ width: `${(doneIds.size / all.length) * 100}%` }} />
          </div>
        ) : null}
      </div>

      {isTrainer ? (
        <details className="card mt-4" open={all.length === 0}>
          <summary className="cursor-pointer font-semibold">＋ Add a video</summary>
          <form action={createVideo} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="title">Title</label>
              <input id="title" name="title" required maxLength={100} placeholder="e.g. 20-min full body, no equipment" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="video_url">Video link (YouTube, Vimeo or .mp4)</label>
              <input id="video_url" name="video_url" type="url" maxLength={500} placeholder="https://youtu.be/…" className="input" />
            </div>
            <div>
              <span className="label">…or upload a file (max 50 MB)</span>
              <VideoUpload trainerId={me.id} />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <input id="category" name="category" list="categories" maxLength={40} placeholder="Strength, Mobility, Cardio…" className="input" />
              <datalist id="categories">
                {[...new Set([...categories, "Strength", "Mobility", "Cardio", "HIIT", "Core", "Stretching"])].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="level">Level</label>
                <select id="level" name="level" className="input capitalize" defaultValue="">
                  <option value="">Any</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="duration_min">Minutes</label>
                <input id="duration_min" name="duration_min" type="number" min={1} max={600} className="input" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">Instructions</label>
              <textarea id="description" name="description" rows={3} maxLength={2000} placeholder="Warm-up, sets and reps, equipment needed…" className="input" />
            </div>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Publishing…">Publish to my clients</SubmitButton>
            </div>
          </form>
        </details>
      ) : null}

      {categories.length > 0 || !isTrainer ? (
        <div className="mt-5 flex flex-wrap gap-1.5 text-sm">
          <Link href={filterHref({ category: null })} className={`chip px-3 py-1 ${!sp.category ? "bg-primary text-onprimary" : "bg-surface2"}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c} href={filterHref({ category: c })} className={`chip px-3 py-1 ${sp.category === c ? "bg-primary text-onprimary" : "bg-surface2"}`}>
              {c}
            </Link>
          ))}
          {!isTrainer ? (
            <Link
              href={filterHref({ show: sp.show === "todo" ? null : "todo" })}
              className={`chip ml-auto px-3 py-1 ${sp.show === "todo" ? "bg-primary text-onprimary" : "bg-surface2"}`}
            >
              Not done yet
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="mt-4">
        {videos.length === 0 ? (
          <div className="card text-center text-muted">
            {all.length === 0
              ? isTrainer
                ? "No videos yet. Record a workout and share it with your clients."
                : "Your trainer hasn't posted any workouts yet."
              : "Nothing matches this filter."}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.id} video={v} trainerName={multipleTrainers ? v.trainer?.full_name : null} done={doneIds.has(v.id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
