import type { MealPlan, GroceryItem } from "../../lib/types";

/**
 * Build a single grocery to-do list from a full day's meal plan.
 *
 * Pure function: aggregates ingredients across breakfast/lunch/dinner,
 * merges duplicates (summing cost, concatenating distinct quantities),
 * and flags anything already in the user's pantry so it can be skipped.
 */
export function buildGroceryList(
  plan: MealPlan,
  pantry: string[] = [],
): GroceryItem[] {
  const pantrySet = new Set(pantry.map(normalize));
  const merged = new Map<string, GroceryItem>();

  const allIngredients = [
    ...plan.breakfast.ingredients,
    ...plan.lunch.ingredients,
    ...plan.dinner.ingredients,
  ];

  for (const ing of allIngredients) {
    const key = normalize(ing.name);
    const existing = merged.get(key);

    if (existing) {
      existing.cost += ing.cost;
      existing.quantity = mergeQuantities(existing.quantity, ing.quantity);
    } else {
      merged.set(key, {
        name: ing.name.trim(),
        quantity: ing.quantity.trim(),
        cost: ing.cost,
        inPantry: pantrySet.has(key),
      });
    }
  }

  // Stable, predictable order: things you need to buy first, then alphabetical.
  return [...merged.values()].sort((a, b) => {
    if (a.inPantry !== b.inPantry) return a.inPantry ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** Parse a quantity like "200 g" into { value: 200, unit: "g" }, or null. */
function parseQuantity(q: string): { value: number; unit: string } | null {
  const match = q.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;
  return { value: parseFloat(match[1]), unit: match[2].trim().toLowerCase() };
}

/**
 * Combine two quantity strings. When both parse to the same unit, sum them
 * ("200 g" + "150 g" → "350 g") so the receipt's quantity matches its cost.
 * Otherwise fall back to listing both.
 */
function mergeQuantities(a: string, b: string): string {
  const pa = parseQuantity(a);
  const pb = parseQuantity(b);
  if (pa && pb && pa.unit === pb.unit) {
    const sum = pa.value + pb.value;
    const value = Number.isInteger(sum) ? String(sum) : String(+sum.toFixed(2));
    return pa.unit ? `${value} ${pa.unit}` : value;
  }
  if (a.toLowerCase() === b.toLowerCase()) return a;
  return `${a} + ${b}`;
}
