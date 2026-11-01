import type { Session } from "@/lib/types";
import { fmtRange } from "@/lib/time";

type Props = {
  session: Session & { booked_count?: number };
  trainerName?: string | null;
  children?: React.ReactNode;
  booked?: boolean;
};

export default function SessionCard({ session: s, trainerName, children, booked }: Props) {
  const left = s.booked_count === undefined ? null : s.capacity - s.booked_count;
  return (
    <div className={`card ${s.cancelled ? "opacity-60" : ""} ${booked ? "border-primary/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{fmtRange(s.starts_at, s.ends_at)}</span>
            {s.cancelled ? <span className="chip bg-danger/10 text-danger">Cancelled</span> : null}
            {booked && !s.cancelled ? <span className="chip bg-primarySoft text-primary">Booked</span> : null}
            {left !== null && !s.cancelled ? (
              <span
                className={`chip ${left > 0 ? "bg-success/10 text-success" : "bg-surface2 text-muted"}`}
              >
                {left > 0 ? `${left} of ${s.capacity} spots left` : "Full"}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 truncate">{s.title}</h3>
          <p className="text-sm text-muted">
            {[trainerName ? `with ${trainerName}` : null, s.location ? `📍 ${s.location}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {s.notes ? <p className="mt-1 text-sm text-muted">{s.notes}</p> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap gap-2">{children}</div> : null}
      </div>
    </div>
  );
}
