export type Playable =
  | { kind: "iframe"; src: string }
  | { kind: "file"; src: string }
  | { kind: "link"; src: string };

/** Turns a YouTube / Vimeo / direct file URL into something the player can show. */
export function toPlayable(url: string): Playable {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return { kind: "link", src: url };
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const id =
      u.searchParams.get("v") ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/)?.[1] ?? null;
    if (id) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/(\d{5,})/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(u.pathname)) return { kind: "file", src: url };
  return { kind: "link", src: url };
}

/** YouTube thumbnail when we can derive one. */
export function thumbnail(url: string | null): string | null {
  if (!url) return null;
  const p = toPlayable(url);
  const m = p.kind === "iframe" ? p.src.match(/youtube-nocookie\.com\/embed\/([^/?]+)/) : null;
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
