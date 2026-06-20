import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * One table: each row is a generated day plan, keyed by a client-supplied
 * sessionId so a browser can reactively read back its own result.
 *
 * We store both the user's input and the fully post-processed output
 * (meals + grocery list + substitutions + budget verdict) so the UI never
 * has to recompute and re-renders are instant.
 */

const ingredient = v.object({
  name: v.string(),
  quantity: v.string(),
  cost: v.number(),
});

const meal = v.object({
  name: v.string(),
  steps: v.string(),
  prepMinutes: v.number(),
  ingredients: v.array(ingredient),
});

export default defineSchema({
  plans: defineTable({
    sessionId: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("done"),
      v.literal("error"),
    ),
    error: v.optional(v.string()),

    // User input
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

    // Output (populated when status === "done")
    meals: v.optional(
      v.object({ breakfast: meal, lunch: meal, dinner: meal }),
    ),
    groceries: v.optional(
      v.array(
        v.object({
          name: v.string(),
          quantity: v.string(),
          cost: v.number(),
          inPantry: v.boolean(),
        }),
      ),
    ),
    substitutions: v.optional(
      v.array(
        v.object({ from: v.string(), to: v.string(), reason: v.string() }),
      ),
    ),
    budget: v.optional(
      v.object({
        budget: v.number(),
        totalCost: v.number(),
        feasible: v.boolean(),
        overBy: v.number(),
      }),
    ),
  }).index("by_session", ["sessionId"]),
});
