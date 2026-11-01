"use server";

import { revalidatePath } from "next/cache";
import { requireClient, requireTrainer } from "@/lib/auth";
import { back, dbMessage, optStr, str } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";
import { LEVELS } from "@/lib/video";

function fields(form: FormData) {
  const level = str(form, "level");
  const duration = Number(str(form, "duration_min"));
  return {
    title: str(form, "title"),
    description: optStr(form, "description"),
    category: optStr(form, "category"),
    level: (LEVELS as readonly string[]).includes(level) ? level : null,
    duration_min: Number.isInteger(duration) && duration > 0 ? duration : null,
  };
}

function validUrl(v: string | null): boolean {
  if (!v) return true;
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

export async function createVideo(form: FormData) {
  const me = await requireTrainer();
  const data = fields(form);
  const videoUrl = optStr(form, "video_url");
  const storagePath = optStr(form, "storage_path");
  if (!data.title) back("/videos", "error", "Give the video a title.");
  if (!videoUrl && !storagePath) back("/videos", "error", "Paste a video link or upload a file.");
  if (!validUrl(videoUrl)) back("/videos", "error", "That link doesn't look right.");
  if (storagePath && !storagePath.startsWith(`${me.id}/`)) back("/videos", "error", "Invalid upload.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .insert({ ...data, trainer_id: me.id, video_url: videoUrl, storage_path: storagePath });
  if (error) back("/videos", "error", dbMessage(error));
  revalidatePath("/", "layout");
  back("/videos", "ok", "Video published to your clients.");
}

export async function updateVideo(form: FormData) {
  await requireTrainer();
  const id = str(form, "id");
  const page = `/videos/${id}`;
  const data = fields(form);
  if (!data.title) back(page, "error", "Give the video a title.");
  const supabase = await createClient();
  const { error } = await supabase.from("videos").update(data).eq("id", id);
  if (error) back(page, "error", dbMessage(error));
  revalidatePath("/", "layout");
  back(page, "ok", "Saved.");
}

export async function deleteVideo(form: FormData) {
  await requireTrainer();
  const id = str(form, "id");
  const supabase = await createClient();
  const { data: video } = await supabase.from("videos").select("storage_path").eq("id", id).single();
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) back(`/videos/${id}`, "error", dbMessage(error));
  if (video?.storage_path) await supabase.storage.from("videos").remove([video.storage_path]);
  revalidatePath("/", "layout");
  back("/videos", "ok", "Video deleted.");
}

export async function toggleCompleted(form: FormData) {
  const me = await requireClient();
  const id = str(form, "id");
  const supabase = await createClient();
  const { error } =
    str(form, "done") === "true"
      ? await supabase.from("video_completions").delete().eq("video_id", id).eq("client_id", me.id)
      : await supabase.from("video_completions").insert({ video_id: id, client_id: me.id });
  if (error) back(`/videos/${id}`, "error", dbMessage(error));
  revalidatePath("/", "layout");
}
