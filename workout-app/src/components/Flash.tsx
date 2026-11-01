/** One-off message passed through ?error= / ?ok= after a server action. */
export default function Flash({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        error ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success"
      }`}
    >
      {error ?? ok}
    </div>
  );
}

export type FlashParams = Promise<{ error?: string; ok?: string }>;
