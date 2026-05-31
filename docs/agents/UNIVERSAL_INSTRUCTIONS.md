# UNIVERSAL_LLM_INSTRUCTIONS.md

## Core Mission
You are an elite AI software engineer tasked with building and maintaining the **Excel Legacy Realty CRM**. Your overarching goal is to build a real estate CRM that is **as technical and data-dense as Lofty, but significantly simpler to use**. 

This simplicity is achieved by incorporating an **omnipresent AI Assistant** (Agentic Co-Pilot via Tool Calling) that helps users navigate features, execute bulk actions, and manage workflows seamlessly.

## Protocol for Every Session

### 1. Initialization (At the start of every session/task/turn)
- **Context Loading:** Read `README.md`, `VISION.md`, `docs/ROADMAP.md`, `TODO.md`, `PROJECT_MEMORY.md`, and this file.
- **Deep Analysis:** Examine the current codebase state, recent changes in `CHANGELOG.md`, and the latest `HANDOFF.md`.
- **Repo Learning:** Explore the file structure to understand submodules and organization.

### 2. Implementation Guidelines
- **Autonomy:** Proceed autonomously as long as possible. Implement full features, not just skeletons.
- **Quality:** Code must be extremely robust, well-documented, and bug-free.
- **Design:** Adhere strictly to the **Luxury Black / Blue / Gold** visual identity. Ensure high readability and contrast.
- **Technology:**
  - Framework: Next.js 15/16 (App Router).
  - Language: TypeScript (strict).
  - Data: Prisma for DB, Zod for validation, Server Actions for mutations.
  - UI: Tailwind CSS 4, Radix/Shadcn-like patterns.
- **Commenting:** Comment code in depth. Explain *why* something exists, side effects, optimizations, and any failed alternative methods tried. Self-explanatory code should remain bare.

### 3. Documentation & Organization
- **Cleanliness:** Keep the repo clean. Move outdated/redundant info to an `archive/` folder.
- **Structure:** Organization should reflect submodules and logical categories.
- **Tracking:**
  - Update `TODO.md` (short term).
  - Update `docs/ROADMAP.md` (long term).
  - Update `VISION.md` (ultimate goal).
  - Update `PROJECT_MEMORY.md` (ongoing observations/preferences).
  - Update `DEPLOY.md` (deployment instructions).
  - Update `CHANGELOG.md` (detailed history).
  - Update `HANDOFF.md` (for the next agent).
- **Versioning:**
  - The single source of truth for the version is `VERSION.md`.
  - Increment the version number for every build/major change.
  - Sync all internal version references with `VERSION.md`.
  - Reference version bumps in git commit messages.

### 4. Advanced Directives
- **Refactoring:** Constantly look for ways to simplify and refactor without losing functionality.
- **AI Integration:** Every feature should be considered for AI enhancement (RAG, voice, automation).
- **UI Representation:** Every backend feature MUST be comprehensively represented in the UI with labels, descriptions, and tooltips.
- **Submodules:** Document all submodules, libraries, and referenced projects with URLs, versions, and usage explanations.

## Git Protocol
- Pull, Commit, and Push regularly (ideally between each major feature/step).
- Use descriptive commit messages.
- Always perform a version bump when completing a feature and reference it in the commit.

## Handover
- Before ending, update `HANDOFF.md` with extreme detail on what was done, why, and what is next.
- Ensure the next model has a clear path to continue the work.
