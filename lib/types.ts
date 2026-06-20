/**
 * Shared domain types for the cooking to-do app.
 * These define the contract between the AI layer, the pure logic libs,
 * and the UI — so every module agrees on one shape.
 */

export type Diet = "veg" | "non-veg" | "vegan";
export type CookingTime = "quick" | "medium" | "elaborate";

/** What the user tells us about their day. */
export interface PlanInput {
  diet: Diet;
  /** How much time/energy they have to cook today. */
  cookingTime: CookingTime;
  /** Daily food budget in INR (₹). */
  budget: number;
  /** Number of people to cook for. */
  servings: number;
  /** Ingredients to avoid (allergies / dislikes), lowercase. */
  allergies: string[];
  /** Ingredients the user already has at home (pantry mode). */
  pantry: string[];
}

/** A single ingredient with an estimated cost for the given servings. */
export interface Ingredient {
  name: string;
  /** Human-readable quantity, e.g. "200 g", "2 pcs". */
  quantity: string;
  /** Estimated cost in INR for this quantity. */
  cost: number;
}

/** One meal of the day, as produced by the AI layer. */
export interface Meal {
  /** Dish name, e.g. "Masala Oats". */
  name: string;
  /** Short prep description / steps summary. */
  steps: string;
  prepMinutes: number;
  ingredients: Ingredient[];
}

/** The raw plan returned by the AI before deterministic post-processing. */
export interface MealPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

/** One line on the aggregated grocery to-do list. */
export interface GroceryItem {
  name: string;
  quantity: string;
  cost: number;
  /** True when the item is already in the user's pantry (can be skipped). */
  inPantry: boolean;
}

/** A diet/allergy-driven ingredient swap. */
export interface Substitution {
  from: string;
  to: string;
  reason: string;
}

/** Result of the budget feasibility check. */
export interface BudgetVerdict {
  budget: number;
  /** Total cost of items the user actually needs to buy (pantry excluded). */
  totalCost: number;
  feasible: boolean;
  /** Amount over budget (0 when feasible). */
  overBy: number;
}
