import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Reactive read: the UI subscribes to this and updates the instant the plan is ready. */
export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("plans")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .first();
  },
});

const inputValidator = v.object({
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
});

/** Create the row in "generating" state and return its id for the action to fill in. */
export const create = mutation({
  args: { sessionId: v.string(), input: inputValidator },
  handler: async (ctx, { sessionId, input }) => {
    return await ctx.db.insert("plans", {
      sessionId,
      status: "generating",
      input,
    });
  },
});

const mealValidator = v.object({
  name: v.string(),
  steps: v.string(),
  prepMinutes: v.number(),
  ingredients: v.array(
    v.object({ name: v.string(), quantity: v.string(), cost: v.number() }),
  ),
});

/** Called by the action once the plan is generated + post-processed. */
export const complete = mutation({
  args: {
    planId: v.id("plans"),
    meals: v.object({
      breakfast: mealValidator,
      lunch: mealValidator,
      dinner: mealValidator,
    }),
    groceries: v.array(
      v.object({
        name: v.string(),
        quantity: v.string(),
        cost: v.number(),
        inPantry: v.boolean(),
      }),
    ),
    substitutions: v.array(
      v.object({ from: v.string(), to: v.string(), reason: v.string() }),
    ),
    budget: v.object({
      budget: v.number(),
      totalCost: v.number(),
      feasible: v.boolean(),
      overBy: v.number(),
    }),
  },
  handler: async (ctx, { planId, ...output }) => {
    await ctx.db.patch(planId, { status: "done", ...output });
  },
});

export const fail = mutation({
  args: { planId: v.id("plans"), error: v.string() },
  handler: async (ctx, { planId, error }) => {
    await ctx.db.patch(planId, { status: "error", error });
  },
});
