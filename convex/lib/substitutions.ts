import type { Diet, MealPlan, Substitution } from "../../lib/types";

/**
 * Deterministic ingredient-substitution rules.
 *
 * Each rule maps an ingredient to a swap that satisfies a constraint —
 * either a diet (e.g. vegan can't use paneer) or an allergy. The AI is
 * asked to respect constraints up front, but this engine is the
 * guarantee: it scans the final plan and flags anything that still
 * violates a rule, with a concrete replacement.
 *
 * Matching is word-based (not substring): "egg" matches "egg"/"eggs" but NOT
 * "eggplant", and a rule may `exclude` qualifiers so "coconut milk" isn't
 * flagged by the dairy-milk rule.
 */

interface Rule {
  /** Whole word to match (singular). */
  match: string;
  to: string;
  reason: string;
  /** Diets for which this swap applies. Omit = applies to all. */
  diets?: Diet[];
  /** Skip the rule if any of these words also appear in the name. */
  exclude?: string[];
}

const PLANT_MILKS = ["coconut", "almond", "soy", "soya", "oat", "cashew"];

const VEGAN_RULES: Rule[] = [
  { match: "paneer", to: "tofu", reason: "vegan — no dairy", diets: ["vegan"] },
  { match: "milk", to: "soy milk", reason: "vegan — no dairy", diets: ["vegan"], exclude: PLANT_MILKS },
  { match: "curd", to: "coconut yogurt", reason: "vegan — no dairy", diets: ["vegan"] },
  { match: "yogurt", to: "coconut yogurt", reason: "vegan — no dairy", diets: ["vegan"], exclude: ["coconut"] },
  { match: "butter", to: "vegan butter / oil", reason: "vegan — no dairy", diets: ["vegan"] },
  { match: "ghee", to: "vegetable oil", reason: "vegan — no dairy", diets: ["vegan"] },
  { match: "honey", to: "maple syrup", reason: "vegan — no animal products", diets: ["vegan"] },
  { match: "egg", to: "mashed banana / flax egg", reason: "vegan — no eggs", diets: ["vegan"] },
];

const VEG_RULES: Rule[] = [
  { match: "chicken", to: "soya chunks", reason: "vegetarian — no meat", diets: ["veg", "vegan"] },
  { match: "mutton", to: "rajma (kidney beans)", reason: "vegetarian — no meat", diets: ["veg", "vegan"] },
  { match: "fish", to: "jackfruit", reason: "vegetarian — no meat/fish", diets: ["veg", "vegan"] },
  { match: "prawn", to: "mushroom", reason: "vegetarian — no seafood", diets: ["veg", "vegan"] },
  { match: "egg", to: "paneer", reason: "vegetarian — no eggs", diets: ["veg"] },
];

/** Common allergy-driven swaps, applied regardless of diet. */
const ALLERGY_SWAPS: Record<string, string> = {
  peanut: "roasted chana",
  groundnut: "roasted chana",
  milk: "soy milk",
  dairy: "plant-based alternative",
  gluten: "rice flour",
  wheat: "rice flour",
  soy: "chickpeas",
  egg: "flax egg",
};

const ALL_RULES = [...VEGAN_RULES, ...VEG_RULES];

/** Split a name into lowercase word tokens. */
function tokenize(name: string): string[] {
  return name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
}

/** Strip a simple trailing plural so "eggs" matches "egg". */
function singular(word: string): string {
  return word.replace(/(es|s)$/, "");
}

/** True if `term` appears as a whole word (plural-tolerant) in the name's tokens. */
function nameHasWord(words: string[], term: string): boolean {
  const t = singular(term);
  return words.some((w) => singular(w) === t);
}

function ruleApplies(words: string[], rule: Rule): boolean {
  if (!nameHasWord(words, rule.match)) return false;
  if (rule.exclude && rule.exclude.some((ex) => words.includes(ex))) return false;
  return true;
}

/**
 * Inspect a finished plan and return every substitution needed to satisfy
 * the chosen diet and the user's allergies. Deduplicated by `from`.
 */
export function findSubstitutions(
  plan: MealPlan,
  diet: Diet,
  allergies: string[] = [],
): Substitution[] {
  const names = collectIngredientNames(plan);
  const seen = new Set<string>();
  const subs: Substitution[] = [];

  const add = (from: string, to: string, reason: string) => {
    const key = from.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    subs.push({ from, to, reason });
  };

  // Diet-driven swaps.
  for (const name of names) {
    const words = tokenize(name);
    for (const rule of ALL_RULES) {
      const appliesToDiet = !rule.diets || rule.diets.includes(diet);
      if (appliesToDiet && ruleApplies(words, rule)) {
        add(name, rule.to, rule.reason);
      }
    }
  }

  // Allergy-driven swaps.
  const allergySet = allergies.map((a) => a.trim().toLowerCase()).filter(Boolean);
  for (const name of names) {
    const words = tokenize(name);
    for (const allergen of allergySet) {
      if (nameHasWord(words, allergen)) {
        const to = ALLERGY_SWAPS[singular(allergen)] ?? "a safe alternative";
        add(name, to, `allergy — avoid ${allergen}`);
      }
    }
  }

  return subs;
}

function collectIngredientNames(plan: MealPlan): string[] {
  return [
    ...plan.breakfast.ingredients,
    ...plan.lunch.ingredients,
    ...plan.dinner.ingredients,
  ].map((i) => i.name);
}
