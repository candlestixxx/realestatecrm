# HyperNexus Workflows

- **MEM-FIRST** (multi-step tasks): context_harvest -> memory_search -> <execute> -> memory_store
- **DISCOVER** (capability gap): suggest_tools -> tool_search -> mcp_call -> memory_store
- **HARVEST** (resuming after a break): context_harvest -> session_context -> memory_list
- **HANDOFF** (context switch / session end): session_handoff(write) -> memory_store(summary)
- **OPS** (deployments/incidents): system_overview -> <act> -> system_overview -> memory_store

Follow RECALL -> DISCOVER -> EXECUTE -> PERSIST -> VERIFY.
