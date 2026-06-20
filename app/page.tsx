"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { PlanInput } from "../lib/types";
import { PlanForm } from "./components/PlanForm";
import { MealPlan } from "./components/MealPlan";
import { Ledger } from "./components/Ledger";
import { Substitutions } from "./components/Substitutions";

export default function Home() {
  // Stable per-tab session id so this browser reads back its own plan.
  const [sessionId] = useState(
    () => Math.random().toString(36).slice(2) + Date.now().toString(36),
  );

  const create = useMutation(api.plans.create);
  const generate = useAction(api.generate.generate);
  const plan = useQuery(api.plans.getBySession, { sessionId });

  // Local guard covers the window before the reactive query reports "generating".
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isGenerating = plan?.status === "generating";
  const loading = submitting || isGenerating;

  async function handleSubmit(input: PlanInput) {
    if (loading) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const planId = await create({ sessionId, input });
      await generate({ planId, input });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Couldn't reach the kitchen. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasSubs = (plan?.substitutions?.length ?? 0) > 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-turmeric/80">
          PromptWars · a cooking to-do list
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-cream md:text-6xl">
          Aaj ka{" "}
          <span className="text-turmeric">Kitchen</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-cream/70">
          Tell us about your day. We&apos;ll plan breakfast, lunch and dinner,
          write your grocery receipt, swap what you can&apos;t eat, and make sure
          it all fits your budget.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] md:items-start">
        <PlanForm onSubmit={handleSubmit} loading={loading} />

        <div className="space-y-8">
          {submitError && <ErrorCard message={submitError} />}
          {!plan && !submitError && !submitting && <Placeholder />}
          {loading && plan?.status !== "done" && <Generating />}
          {plan?.status === "error" && !submitError && <ErrorCard message={plan.error} />}
          {plan?.status === "done" && plan.meals && plan.groceries && plan.budget && (
            <>
              <MealPlan meals={plan.meals} />
              {hasSubs ? (
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                  <Ledger groceries={plan.groceries} budget={plan.budget} />
                  <Substitutions subs={plan.substitutions ?? []} />
                </div>
              ) : (
                <Ledger groceries={plan.groceries} budget={plan.budget} />
              )}
            </>
          )}
        </div>
      </div>

      <footer className="mt-16 border-t border-edge pt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/50">
        Meals by AI · grocery, swaps &amp; budget by deterministic logic
      </footer>
    </main>
  );
}

function Placeholder() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-edge p-8 text-center">
      <p className="font-display text-2xl text-cream/80">Your plan appears here</p>
      <p className="mt-2 max-w-xs text-sm text-cream/50">
        Fill in your day on the left and press <em>Plan my day</em>.
      </p>
    </div>
  );
}

function Generating() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-edge bg-panel/60 p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-turmeric border-t-transparent" />
      <p className="text-sm text-cream/70">Simmering your plan…</p>
    </div>
  );
}

function ErrorCard({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-chili/50 bg-chili/10 p-6">
      <p className="font-display text-lg text-chili">That didn&apos;t cook through</p>
      <p className="mt-1 text-sm text-cream/70">
        {message ?? "Something went wrong. Try again."}
      </p>
    </div>
  );
}
