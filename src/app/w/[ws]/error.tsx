"use client";

export default function WorkspaceError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mt-10 text-center">
      <h2 className="mb-1">Alguma coisa correu mal</h2>
      <p className="mb-4 text-[14px] leading-relaxed text-muted">
        {error.message || "Não foi possível carregar esta página."}
      </p>
      <button type="button" className="btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
