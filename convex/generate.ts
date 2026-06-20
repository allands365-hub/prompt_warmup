"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import type { MealPlan, PlanInput } from "../lib/types";
import { buildGroceryList } from "./lib/grocery";
import { checkBudget } from "./lib/budget";
import { findSubstitutions } from "./lib/substitutions";

const MODEL = "gpt-4o-mini";

/** JSON schema the model MUST conform to — guarantees a typed, parseable plan. */
const mealSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string" },
    steps: { type: "string", description: "2-4 short prep steps" },
    prepMinutes: { type: "integer" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: "string", description: "e.g. '200 g', '2 pcs'" },
          cost: { type: "number", description: "estimated INR cost for the quantity" },
        },
        required: ["name", "quantity", "cost"],
      },
    },
  },
  required: ["name", "steps", "prepMinutes", "ingredients"],
};

const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
  },
  required: ["breakfast", "lunch", "dinner"],
};

function buildPrompt(input: PlanInput): string {
  return [
    `Create a one-day Indian meal plan (breakfast, lunch, dinner) for ${input.servings} person(s).`,
    `Diet: ${input.diet}. Cooking effort available today: ${input.cookingTime}.`,
    `Target daily grocery budget: ₹${input.budget}.`,
    input.allergies.length
      ? `Strictly avoid these (allergies/dislikes): ${input.allergies.join(", ")}.`
      : "",
    input.pantry.length
      ? `The user already has at home: ${input.pantry.join(", ")} — you may use these.`
      : "",
    `Use realistic Indian grocery prices in INR. Keep total ingredient cost close to the budget.`,
    `For "quick" use minimal prep (<15 min/meal); "elaborate" can be richer.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export const generate = action({
  args: {
    planId: v.id("plans"),
    input: v.object({
      diet: v.union(v.literal("veg"), v.literal("non-veg"), v.literal("vegan")),
      cookingTime: v.union(
        v.literal("quick"),
        v.literal("medium"),
        v.literal("elaborate"),
      ),
      budget: v.number(),
      servings: v.number(),
      allergies: v.array(v.string()),
      pantry: v.array(v.string()),
    }),
  },
  handler: async (ctx, { planId, input }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(api.plans.fail, {
        planId,
        error: "OPENAI_API_KEY not set. Run: npx convex env set OPENAI_API_KEY <key>",
      });
      return;
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content:
                "You are a practical Indian home-cooking planner. Respect diet and allergy constraints strictly and keep costs realistic.",
            },
            { role: "user", content: buildPrompt(input as PlanInput) },
          ],
          response_format: {
            type: "json_schema",
            json_schema: { name: "meal_plan", strict: true, schema: planSchema },
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const plan = JSON.parse(data.choices[0].message.content) as MealPlan;

      // Deterministic post-processing — the engineered core, not the LLM.
      const groceries = buildGroceryList(plan, input.pantry);
      const budget = checkBudget(groceries, input.budget);
      const substitutions = findSubstitutions(plan, input.diet, input.allergies);

      await ctx.runMutation(api.plans.complete, {
        planId,
        meals: plan,
        groceries,
        substitutions,
        budget,
      });
    } catch (err) {
      await ctx.runMutation(api.plans.fail, {
        planId,
        error: err instanceof Error ? err.message : "Unknown error generating plan",
      });
    }
  },
});
