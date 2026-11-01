export type Role = "trainer" | "client";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  bio: string | null;
  invite_code: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  trainer_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  capacity: number;
  notes: string | null;
  cancelled: boolean;
  created_at: string;
};

export type Video = {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  category: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
  duration_min: number | null;
  video_url: string | null;
  storage_path: string | null;
  created_at: string;
};

export type NamedRef = { full_name: string } | null;
