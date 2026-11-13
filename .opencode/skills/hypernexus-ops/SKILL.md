# HyperNexus Ops

- `hypernexus_status` / `hypernexus_system_overview` Ã¢â‚¬â€ health before and after production changes.
- `hypernexus_mcp_status` / `hypernexus_mcp_servers` / `hypernexus_mcp_tools` Ã¢â‚¬â€ MCP bridge inventory.
- `hypernexus_billing_status` Ã¢â‚¬â€ quotas, depleted models, fallback chain.
- `hypernexus_audit_log` Ã¢â‚¬â€ record compliance-relevant actions.

## Verify loop
1. VERIFY before change: `hypernexus_status`
2. Act
3. VERIFY after change: `hypernexus_status`
4. PERSIST: `hypernexus_memory_store` with the outcome
