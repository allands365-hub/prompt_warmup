"use client";

import { useState } from "react";
import type { CookingTime, Diet, PlanInput } from "../../lib/types";

const DIETS: { value: Diet; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "non-veg", label: "Non-veg" },
  { value: "vegan", label: "Vegan" },
];

const TIMES: { value: CookingTime; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "medium", label: "Medium" },
  { value: "elaborate", label: "Elaborate" },
];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function PlanForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: PlanInput) => void;
  loading: boolean;
}) {
  const [diet, setDiet] = useState<Diet>("veg");
  const [cookingTime, setCookingTime] = useState<CookingTime>("medium");
  const [budget, setBudget] = useState(300);
  const [servings, setServings] = useState(2);
  const [allergies, setAllergies] = useState("");
  const [pantry, setPantry] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      diet,
      cookingTime,
      budget,
      servings,
      allergies: splitList(allergies),
      pantry: splitList(pantry),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Plan your cooking day"
      className="rounded-2xl border border-edge bg-panel/80 p-6 shadow-ticket backdrop-blur"
    >
      <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.25em] text-turmeric/80">
        Your day
      </p>

      <ChipGroup label="Diet">
        {DIETS.map((d) => (
          <Chip key={d.value} active={diet === d.value} onClick={() => setDiet(d.value)}>
            {d.label}
          </Chip>
        ))}
      </ChipGroup>

      <ChipGroup label="Time to cook today">
        {TIMES.map((t) => (
          <Chip
            key={t.value}
            active={cookingTime === t.value}
            onClick={() => setCookingTime(t.value)}
          >
            {t.label}
          </Chip>
        ))}
      </ChipGroup>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <Field label="Daily budget (₹)" htmlFor="budget">
          <input
            id="budget"
            type="number"
            min={50}
            value={budget}
            disabled={loading}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="field font-mono"
          />
        </Field>
        <Field label="Servings" htmlFor="servings">
          <input
            id="servings"
            type="number"
            min={1}
            max={12}
            value={servings}
            disabled={loading}
            onChange={(e) => setServings(Number(e.target.value))}
            className="field font-mono"
          />
        </Field>
      </div>

      <Field label="Allergies / dislikes" htmlFor="allergies" hint="comma-separated">
        <input
          id="allergies"
          type="text"
          placeholder="peanuts, gluten"
          value={allergies}
          disabled={loading}
          onChange={(e) => setAllergies(e.target.value)}
          className="field mb-4"
        />
      </Field>

      <Field label="Already in your pantry" htmlFor="pantry" hint="we won't make you buy it again">
        <input
          id="pantry"
          type="text"
          placeholder="rice, onions, oil"
          value={pantry}
          disabled={loading}
          onChange={(e) => setPantry(e.target.value)}
          className="field mb-6"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer touch-manipulation rounded-xl bg-turmeric px-4 py-3 font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Planning your day…" : "Plan my day"}
      </button>

      <style jsx>{`
        :global(.field) {
          width: 100%;
          min-height: 44px; /* touch target */
          border-radius: 0.7rem;
          border: 1px solid #3a2c1d;
          background: #17120d;
          padding: 0.6rem 0.8rem;
          font-size: 1rem; /* 16px — avoids iOS focus-zoom */
          color: #efe2cc;
        }
        :global(.field::placeholder) {
          color: #9a886c; /* lifted for contrast on ink */
        }
      `}</style>
    </form>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-medium text-cream/80">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-cream/80">{label}</span>
        {hint && <span className="text-xs text-cream/55">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-[44px] cursor-pointer touch-manipulation items-center rounded-full border px-4 text-sm transition ${
        active
          ? "border-turmeric bg-turmeric/15 text-turmeric"
          : "border-edge text-cream/65 hover:border-turmeric/50"
      }`}
    >
      {children}
    </button>
  );
}
