import Image from "next/image";
import type { Meal, MealPlan as MealPlanType } from "../../lib/types";

const SLOTS: { key: keyof MealPlanType; label: string; img: string }[] = [
  { key: "breakfast", label: "Morning", img: "/meal-breakfast.png" },
  { key: "lunch", label: "Midday", img: "/meal-lunch.png" },
  { key: "dinner", label: "Night", img: "/meal-dinner.png" },
];

export function MealPlan({ meals }: { meals: MealPlanType }) {
  return (
    <section aria-label="Your meals for the day">
      <SectionLabel>Your day</SectionLabel>
      <div className="grid gap-4 md:grid-cols-3">
        {SLOTS.map((slot) => (
          <MealTicket key={slot.key} img={slot.img} slot={slot.label} meal={meals[slot.key]} />
        ))}
      </div>
    </section>
  );
}

function MealTicket({
  img,
  slot,
  meal,
}: {
  img: string;
  slot: string;
  meal: Meal;
}) {
  return (
    <article className="rise flex flex-col rounded-2xl border border-edge bg-raised/60 p-5 shadow-ticket">
      <div className="relative mb-2 h-28 w-full">
        <Image
          src={img}
          alt=""
          fill
          sizes="(max-width: 768px) 90vw, 300px"
          className="object-contain drop-shadow"
        />
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-clay">
        {slot}
      </span>
      <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-cream">
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
