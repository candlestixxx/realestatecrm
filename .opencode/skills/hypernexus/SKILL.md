# HyperNexus Memory

Use the `hypernexus_*` tools for durable memory that survives across sessions and harnesses.

## Discipline
1. **RECALL first** Ã¢â‚¬â€ run `hypernexus_context_harvest` or `hypernexus_memory_search` before re-deriving known answers.
2. **PERSIST non-obvious outcomes** Ã¢â‚¬â€ decisions, gotchas, and fixes go to `hypernexus_memory_store` with tags.
3. **FAST on hot paths** Ã¢â‚¬â€ prefer `hypernexus_memory_fts_search` inside tight loops.
4. **Scratchpad for working state** Ã¢â‚¬â€ `hypernexus_scratchpad` holds short-lived keys (goal, phase).

## Inline recall
Write `@memory:keyword` in a prompt to expand matching L2 context inline.

## Observation types
Record structured findings with `hypernexus_record_observation`: discovery | decision | progress | warning | fix.
