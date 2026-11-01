import Link from "next/link";
import type { Video } from "@/lib/types";
import { thumbnail } from "@/lib/video";

export default function VideoCard({
  video: v,
  trainerName,
  done,
}: {
  video: Video;
  trainerName?: string | null;
  done?: boolean;
}) {
  const thumb = thumbnail(v.video_url);
  return (
    <Link href={`/videos/${v.id}`} className="card group block overflow-hidden p-0 transition hover:border-primary/50">
      <div className="relative aspect-video bg-surface2">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-60">▶</div>
        )}
        {done ? <span className="chip absolute left-2 top-2 bg-success text-white">✓ Done</span> : null}
        {v.duration_min ? (
          <span className="chip absolute bottom-2 right-2 bg-black/70 text-white">{v.duration_min} min</span>
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 group-hover:text-primary">{v.title}</h3>
        <p className="mt-0.5 text-xs capitalize text-muted">
          {[v.category, v.level, trainerName].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
