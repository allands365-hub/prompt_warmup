# Aaj ka Kitchen — an AI cooking to-do list

A micro-app for **PromptWars**. Tell it about your day; it produces a personal
cooking to-do list: a breakfast/lunch/dinner plan, a grocery receipt, smart
substitutions, and a budget that actually adds up.

## How it works

The split is deliberate: **AI does the creative part, deterministic code does the logic.**

| Output | Produced by |
| --- | --- |
| Breakfast / lunch / dinner plan | OpenAI (`gpt-4o-mini`, strict JSON schema) |
| Grocery list | `convex/lib/grocery.ts` — aggregates + dedupes ingredients across meals |
| Substitutions | `convex/lib/substitutions.ts` — diet/allergy rules engine |
| Budget feasibility | `convex/lib/budget.ts` — pantry-aware totals + cheapest-cut suggestions |

Those three logic files are pure functions with **no Convex/React imports**, so
they're independently unit-tested (`tests/logic.test.ts`) and portable.

### Architecture

```
Browser (Next.js) ──create──▶ Convex mutation ──▶ plans table
        │                                              ▲
        │                                              │ complete()
        └──generate──▶ Convex action ──▶ OpenAI ──▶ pure logic libs
                       (key stays server-side)        (grocery/budget/subs)
        │
        └──useQuery (reactive) ◀── plans table  ── UI updates instantly
```

The OpenAI key lives in **Convex's environment**, never in the browser or the
repo. The frontend only ever talks to Convex.

## Run it

```bash
npm install

# 1. Link this folder to your Convex deployment + generate types + push functions
npx convex dev          # leave running in one terminal

# 2. Give the server-side action your OpenAI key (in another terminal)
npx convex env set OPENAI_API_KEY sk-...your-key...

# 3. Start the web app
npm run dev             # http://localhost:3000
```

## Test

```bash
npm run test            # vitest — covers grocery, budget, and substitution logic
```

## Stack

Next.js 16 · React 19 · Convex · TypeScript · Tailwind CSS · OpenAI · Vitest
