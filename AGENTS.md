# AGENTS.md

## Universal LLM Instructions

This project follows a centralized set of instructions for all AI models. Please refer to the [Universal Instructions](UNIVERSAL_INSTRUCTIONS.md) for the core protocol, coding standards, and documentation requirements.

### RAG Architecture Unification
The RAG (Retrieval-Augmented Generation) infrastructure has been fully consolidated into `src/lib/rag.ts`. Any vector syncs or RAG queries should rely solely on `src/lib/rag.ts`. The previously utilized `rag-sync.ts` has been merged and removed.

### Model-Specific Overrides
While the universal instructions apply to everyone, model-specific files (e.g., `CLAUDE.md`, `GEMINI.md`, `GPT.md`) may contain additional proprietary instructions or tips specific to that model's capabilities.
