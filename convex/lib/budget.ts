import type { GroceryItem, BudgetVerdict } from "../../lib/types";

/**
 * Decide whether the grocery list fits the user's daily budget.
 *
 * Pure function. Only items the user actually needs to buy count toward
 * the total — anything already in their pantry is free.
 */
export function checkBudget(
  groceries: GroceryItem[],
  budget: number,
): BudgetVerdict {
  const totalCost = groceries
    .filter((item) => !item.inPantry)
    .reduce((sum, item) => sum + item.cost, 0);

  const rounded = Math.round(totalCost);
  const feasible = rounded <= budget;

  return {
    budget,
    totalCost: rounded,
    feasible,
    overBy: feasible ? 0 : rounded - budget,
  };
}

/**
 * When over budget, suggest which items to trim: the most expensive
 * to-buy items first, until the running cost would fit the budget.
 * Returns the names of items to reconsider (cheapest-swap candidates).
 */
export function suggestCutsToFit(
  groceries: GroceryItem[],
  budget: number,
): string[] {
  const verdict = checkBudget(groceries, budget);
  if (verdict.feasible) return [];

  const buyable = groceries
    .filter((item) => !item.inPantry)
    .sort((a, b) => b.cost - a.cost);

  const cuts: string[] = [];
  let remaining = verdict.overBy;
  for (const item of buyable) {
    if (remaining <= 0) break;
    cuts.push(item.name);
    remaining -= item.cost;
  }
  return cuts;
}
