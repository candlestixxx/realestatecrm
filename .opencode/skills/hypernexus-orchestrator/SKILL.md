# HyperNexus Orchestrator

Coordinate multi-step work through the HyperNexus control plane (kernel on port 7778)
using the `hypernexus_*` tools.

## Loop

1. **RECALL** — `hypernexus_context_harvest` + `hypernexus_memory_search` before planning.
2. **DISCOVER** — on capability gaps use `hypernexus_suggest_tools` → `hypernexus_tool_search` → `hypernexus_mcp_call`.
3. **EXECUTE** — do the work with normal tools; keep the plan in `hypernexus_scratchpad` (key `current_task`).
4. **PERSIST** — `hypernexus_memory_store` every non-obvious decision/gotcha with tags;
   `hypernexus_record_observation` for structured findings.
5. **VERIFY** — `hypernexus_status` after significant changes; record outcomes via `hypernexus_audit_log`.

## Rules

- Never re-derive what memory already holds — recall first.
- Keep hot-path calls on `hypernexus_memory_fts_search`; full semantic search is for explicit tool calls.
- Write `@memory:keyword` in prompts to pull specific facts inline.
- End long sessions with `hypernexus_session_handoff` (action=write) so the next session can resume.
- If the kernel is offline, degrade gracefully: continue with local tools and note the gap.
