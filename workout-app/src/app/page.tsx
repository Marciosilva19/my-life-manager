import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";

export default async function Landing() {
  if (await getProfile()) redirect("/dashboard");
  const features = [
    { icon: "🤝", title: "Your PT, connected", text: "Join your trainer with an invite code. Trainers see all their clients in one place." },
    { icon: "📅", title: "Book gym sessions", text: "Your PT posts the days and times they're at the gym — grab a spot in one tap." },
    { icon: "🎬", title: "Recorded workouts", text: "Follow your trainer's video workouts anytime and track the ones you've done." },
  ];
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 py-10 sm:py-16">
      <div className="flex items-center gap-2 text-lg font-bold">
        <span className="text-primary">●</span> PT Studio
      </div>
      <section className="mt-14 sm:mt-20">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Train with your PT — <span className="text-primary">in the gym and at home.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          One place for personal trainers and their clients: in-person session booking and a library of recorded
          workouts.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup?role=client" className="btn-primary px-6 py-3 text-base">
            I'm training with a PT
          </Link>
          <Link href="/signup?role=trainer" className="btn-secondary px-6 py-3 text-base">
            I'm a personal trainer
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </section>
      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="mt-2">{f.title}</h3>
            <p className="mt-1 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
