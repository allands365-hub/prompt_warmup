"use client";

import { useState } from "react";
import type { BudgetVerdict, GroceryItem } from "../../lib/types";
import { suggestCutsToFit } from "../../convex/lib/budget";

/**
 * The signature element: the grocery list + budget feasibility rendered as a
 * home cook's paper receipt. Prices are monospaced and right-aligned; the
 * verdict is a hand-stamped mark. This is where the "budget feasibility logic"
 * required output earns its keep visually.
 *
 * When the plan is over budget, "Trim to fit" runs the deterministic
 * suggestCutsToFit() and shows which items to skip to get back under budget.
 */
export function Ledger({
  groceries,
  budget,
}: {
  groceries: GroceryItem[];
  budget: BudgetVerdict;
}) {
  const [cuts, setCuts] = useState<Set<string> | null>(null);

  const toBuy = groceries.filter((g) => !g.inPantry);
  const haveAlready = groceries.filter((g) => g.inPantry);

  const trimmedTotal =
    cuts === null
      ? budget.totalCost
      : Math.round(
          toBuy
            .filter((g) => !cuts.has(g.name))
            .reduce((sum, g) => sum + g.cost, 0),
        );
  const trimmedFits = trimmedTotal <= budget.budget;

  function handleTrim() {
    setCuts(new Set(suggestCutsToFit(groceries, budget.budget)));
  }

  return (
    <section
      aria-label="Grocery receipt and budget"
      className="rise overflow-hidden rounded-2xl bg-paper text-ink shadow-ticket"
    >
      <div className="border-b border-dashed border-paper-line px-6 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-clay">
          The Ledger
        </p>
        <h2 className="font-display text-2xl font-semibold">Grocery receipt</h2>
      </div>

      <ul className="paper-rule px-6 py-2">
        {toBuy.map((item) => (
          <ReceiptLine key={item.name} item={item} cut={cuts?.has(item.name) ?? false} />
        ))}
        {toBuy.length === 0 && (
          <li className="py-3 text-sm text-ink/70">
            Nothing to buy — your pantry has it covered.
          </li>
        )}
      </ul>

      {haveAlready.length > 0 && (
        <div className="px-6 pb-2 pt-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
            Already in your pantry
          </p>
          <p className="text-sm text-ink/65">
            {haveAlready.map((g) => g.name).join(" · ")}
          </p>
        </div>
      )}

      <div className="border-t-2 border-double border-paper-line px-6 py-4">
        <Row label="To buy" value={`₹${budget.totalCost}`} />
        <Row label="Your budget" value={`₹${budget.budget}`} muted />

        <div className="mt-4">
          <Stamp verdict={budget} />
        </div>

        {!budget.feasible && cuts === null && (
          <button
            type="button"
            onClick={handleTrim}
            className="mt-4 w-full cursor-pointer touch-manipulation rounded-lg border border-clay/50 bg-clay/10 px-4 py-3 text-sm font-semibold text-clay transition hover:bg-clay/20"
          >
            Trim to fit — suggest what to skip
          </button>
        )}

        {cuts !== null && (
          <div className="mt-4 rounded-lg border border-coriander/40 bg-coriander/10 p-4">
            <p className="text-sm text-ink/80">
              Skip the struck-through items and your total drops to{" "}
              <span className="font-mono font-semibold">₹{trimmedTotal}</span>
              {trimmedFits ? (
                <span className="font-semibold text-coriander"> — fits your budget ✓</span>
              ) : (
                <span className="font-semibold text-chili">
                  {" "}— still ₹{trimmedTotal - budget.budget} over
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setCuts(null)}
              className="mt-2 cursor-pointer text-xs font-medium text-ink/60 underline-offset-2 hover:underline"
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ReceiptLine({ item, cut }: { item: GroceryItem; cut: boolean }) {
  return (
    <li
      className={`flex items-baseline gap-3 py-[7px] text-sm leading-[18px] ${
        cut ? "opacity-55" : ""
      }`}
    >
      <span className={`font-medium text-ink ${cut ? "line-through" : ""}`}>
        {item.name}
      </span>
      <span className="text-ink/55">{item.quantity}</span>
      {cut && (
        <span className="rounded bg-chili/15 px-1.5 font-mono text-[10px] uppercase tracking-wide text-chili">
          skip
        </span>
      )}
      <span className="flex-1 border-b border-dotted border-paper-line" aria-hidden />
      <span
        className={`font-mono tabular-nums text-ink ${cut ? "line-through" : ""}`}
      >
        ₹{Math.round(item.cost)}
      </span>
    </li>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span
        className={`font-mono text-xs uppercase tracking-[0.15em] ${
          muted ? "text-ink/60" : "text-ink/75"
        }`}
      >
        {label}
      </span>
      <span className="font-mono text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Stamp({ verdict }: { verdict: BudgetVerdict }) {
  if (verdict.feasible) {
    return (
      <div className="inline-flex -rotate-2 items-center gap-2 rounded-md border-2 border-coriander px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-coriander">
        ✓ Feasible
        <span className="font-normal normal-case tracking-normal text-ink/70">
          ₹{verdict.budget - verdict.totalCost} to spare
        </span>
      </div>
    );
  }
  return (
    <div className="inline-flex -rotate-2 items-center gap-2 rounded-md border-2 border-chili px-4 py-2 font-mono text-sm font-bold uppercase tracking-[0.2em] text-chili">
      ✗ ₹{verdict.overBy} over
    </div>
  );
}
