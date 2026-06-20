import { describe, it, expect } from "vitest";
import type { Meal, MealPlan } from "../lib/types";
import { buildGroceryList } from "../convex/lib/grocery";
import { checkBudget, suggestCutsToFit } from "../convex/lib/budget";
import { findSubstitutions } from "../convex/lib/substitutions";

function meal(name: string, ingredients: Meal["ingredients"]): Meal {
  return { name, steps: "cook", prepMinutes: 10, ingredients };
}

function plan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    breakfast: meal("Oats", [{ name: "Oats", quantity: "100 g", cost: 20 }]),
    lunch: meal("Dal Rice", [
      { name: "Rice", quantity: "200 g", cost: 30 },
      { name: "Toor Dal", quantity: "100 g", cost: 25 },
    ]),
    dinner: meal("Khichdi", [
      { name: "Rice", quantity: "150 g", cost: 22 },
      { name: "Oats", quantity: "50 g", cost: 10 },
    ]),
    ...overrides,
  };
}

describe("buildGroceryList", () => {
  it("merges duplicate ingredients across meals and sums their cost", () => {
    const list = buildGroceryList(plan());
    const rice = list.find((i) => i.name === "Rice");
    const oats = list.find((i) => i.name === "Oats");
    expect(rice?.cost).toBe(52); // 30 + 22
    expect(oats?.cost).toBe(30); // 20 + 10
    expect(oats?.quantity).toBe("150 g"); // 100 g + 50 g summed
  });

  it("flags pantry items and pushes them to the end", () => {
    const list = buildGroceryList(plan(), ["rice"]);
    const rice = list.find((i) => i.name === "Rice");
    expect(rice?.inPantry).toBe(true);
    expect(list[list.length - 1].inPantry).toBe(true);
  });
});

describe("checkBudget", () => {
  it("excludes pantry items from the total and reports feasibility", () => {
    const list = buildGroceryList(plan(), ["rice"]);
    const verdict = checkBudget(list, 100);
    // Total without rice: oats 30 + toor dal 25 = 55
    expect(verdict.totalCost).toBe(55);
    expect(verdict.feasible).toBe(true);
    expect(verdict.overBy).toBe(0);
  });

  it("reports how much it is over when the budget is too small", () => {
    const list = buildGroceryList(plan());
    const verdict = checkBudget(list, 50);
    // Total: rice 52 + dal 25 + oats 30 = 107
    expect(verdict.totalCost).toBe(107);
    expect(verdict.feasible).toBe(false);
    expect(verdict.overBy).toBe(57);
  });
});

describe("suggestCutsToFit", () => {
  it("suggests the most expensive items first until it would fit", () => {
    const list = buildGroceryList(plan());
    const cuts = suggestCutsToFit(list, 50);
    expect(cuts[0]).toBe("Rice"); // most expensive at 52
    expect(cuts.length).toBeGreaterThan(0);
  });

  it("returns nothing when already within budget", () => {
    const list = buildGroceryList(plan());
    expect(suggestCutsToFit(list, 1000)).toEqual([]);
  });
});

describe("findSubstitutions", () => {
  it("swaps paneer to tofu for a vegan diet", () => {
    const p = plan({
      dinner: meal("Paneer Curry", [{ name: "Paneer", quantity: "200 g", cost: 70 }]),
    });
    const subs = findSubstitutions(p, "vegan");
    expect(subs).toContainEqual(
      expect.objectContaining({ from: "Paneer", to: "tofu" }),
    );
  });

  it("swaps chicken to soya chunks for a vegetarian diet", () => {
    const p = plan({
      lunch: meal("Chicken Curry", [{ name: "Chicken", quantity: "300 g", cost: 120 }]),
    });
    const subs = findSubstitutions(p, "veg");
    expect(subs.some((s) => s.from === "Chicken" && s.to === "soya chunks")).toBe(true);
  });

  it("creates an allergy swap regardless of diet", () => {
    const p = plan({
      breakfast: meal("Peanut Poha", [{ name: "Peanuts", quantity: "30 g", cost: 10 }]),
    });
    const subs = findSubstitutions(p, "non-veg", ["peanuts"]);
    expect(subs.some((s) => s.reason.includes("allergy"))).toBe(true);
  });

  it("returns no substitutions when nothing conflicts", () => {
    expect(findSubstitutions(plan(), "veg")).toEqual([]);
  });

  it("does NOT flag eggplant as egg (word-boundary matching)", () => {
    const p = plan({
      lunch: meal("Baingan Bharta", [{ name: "Eggplant", quantity: "300 g", cost: 30 }]),
    });
    expect(findSubstitutions(p, "vegan")).toEqual([]);
  });

  it("does NOT flag coconut milk under the vegan dairy rule", () => {
    const p = plan({
      dinner: meal("Coconut Curry", [{ name: "Coconut Milk", quantity: "200 ml", cost: 40 }]),
    });
    expect(findSubstitutions(p, "vegan")).toEqual([]);
  });
});
