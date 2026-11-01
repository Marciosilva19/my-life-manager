import { redirect } from "next/navigation";

/** Redirect back to a page with a one-off message shown by <Flash>. */
export function back(path: string, kind: "error" | "ok", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(message)}`);
}

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(form: FormData, key: string): string | null {
  return str(form, key) || null;
}

/** Strips the "P0001: " style prefix Postgres errors sometimes carry. */
export function dbMessage(err: { message: string } | null, fallback = "Something went wrong."): string {
  return err?.message?.replace(/^[A-Z0-9]{5}:\s*/, "") || fallback;
}

/** Only allow same-site relative redirects. */
export function safeNext(v: string | null | undefined, fallback = "/dashboard"): string {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}
