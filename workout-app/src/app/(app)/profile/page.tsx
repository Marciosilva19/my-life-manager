import Flash, { type FlashParams } from "@/components/Flash";
import SubmitButton from "@/components/SubmitButton";
import { signOut } from "@/lib/actions/auth";
import { updateProfile } from "@/lib/actions/relations";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Profile" };

export default async function ProfilePage({ searchParams }: { searchParams: FlashParams }) {
  const me = await requireProfile();
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-lg">
      <Flash error={sp.error} ok={sp.ok} />
      <h1>Profile</h1>
      <form action={updateProfile} className="card mt-4 space-y-4">
        <div>
          <label className="label" htmlFor="full_name">Name</label>
          <input id="full_name" name="full_name" required maxLength={80} defaultValue={me.full_name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="bio">
            {me.role === "trainer" ? "About you (shown to your clients)" : "About you (goals, injuries… shown to your trainers)"}
          </label>
          <textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={me.bio ?? ""} className="input" />
        </div>
        <p className="text-sm text-muted">
          Account type: <span className="font-semibold capitalize text-text">{me.role}</span>
        </p>
        <SubmitButton>Save</SubmitButton>
      </form>
      <form action={signOut} className="mt-4">
        <button className="btn-secondary w-full">Sign out</button>
      </form>
    </div>
  );
}
