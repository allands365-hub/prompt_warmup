import type { Meal, MealPlan as MealPlanType } from "../../lib/types";

type SlotIcon = (props: { className?: string }) => React.ReactElement;

const SLOTS: { key: keyof MealPlanType; Icon: SlotIcon; label: string }[] = [
  { key: "breakfast", Icon: SunriseIcon, label: "Morning" },
  { key: "lunch", Icon: SunIcon, label: "Midday" },
  { key: "dinner", Icon: MoonIcon, label: "Night" },
];

export function MealPlan({ meals }: { meals: MealPlanType }) {
  return (
    <section aria-label="Your meals for the day">
      <SectionLabel>Your day</SectionLabel>
      <div className="grid gap-4 md:grid-cols-3">
        {SLOTS.map((slot) => (
          <MealTicket key={slot.key} Icon={slot.Icon} slot={slot.label} meal={meals[slot.key]} />
        ))}
      </div>
    </section>
  );
}

function MealTicket({
  Icon,
  slot,
  meal,
}: {
  Icon: SlotIcon;
  slot: string;
  meal: Meal;
}) {
  return (
    <article className="rise flex flex-col rounded-2xl border border-edge bg-raised/60 p-5 shadow-ticket">
      <header className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-clay">
          {slot}
        </span>
        <Icon className="h-5 w-5 text-turmeric" />
      </header>
      <h3 className="font-display text-xl font-semibold leading-tight text-cream">
        {meal.name}
      </h3>
      <p className="mt-1 font-mono text-xs text-coriander">{meal.prepMinutes} min</p>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">{meal.steps}</p>
    </article>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-lg text-cream">{children}</h2>
      <span className="h-px flex-1 bg-edge" />
    </div>
  );
}

/* Decorative time-of-day marks (aria-hidden — the text label carries meaning). */
function iconBase(className?: string) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase(className)}>
      <path d="M12 3v2M5 9l1.5 1.5M19 9l-1.5 1.5M3 17h18M7 17a5 5 0 0 1 10 0" />
      <path d="M2 21h20" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase(className)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase(className)}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
