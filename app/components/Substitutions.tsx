import type { Substitution } from "../../lib/types";

export function Substitutions({ subs }: { subs: Substitution[] }) {
  if (subs.length === 0) return null;

  return (
    <section aria-label="Smart substitutions" className="rise">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-lg text-cream">Smart swaps</h2>
        <span className="h-px flex-1 bg-edge" />
      </div>
      <ul className="flex flex-wrap gap-2">
        {subs.map((sub) => (
          <li
            key={sub.from}
            className="flex items-center gap-2 rounded-full border border-clay/40 bg-clay/10 px-3 py-1.5 text-sm"
            title={sub.reason}
          >
            <span className="text-cream/55 line-through">{sub.from}</span>
            <span aria-hidden className="text-clay">→</span>
            <span className="font-medium text-cream">{sub.to}</span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-clay/80">
              {sub.reason}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
