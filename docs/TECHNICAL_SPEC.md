# Technical Spec

## 1. Architecture overview
Build the system as a modular full-stack TypeScript application with a shared backend and synced client experiences for web and mobile.

### Core Objective
To build a CRM with the technical depth of Lofty, simplified by an omnipresent AI Assistant (Agentic Co-Pilot) utilizing Tool Calling to navigate features, execute workflows, and manage segments.

### Recommended layers
- Presentation layer: web app and mobile app
- API layer: CRM, workflows, messaging, integrations, AI (Tool Calling), media services
- Domain layer: leads, contacts, deals, tasks, documents, social, voice, memory, marketing
- Infrastructure layer: auth, storage, queues, sync, notifications, audit logs

## 2. Suggested system modules

### Identity, Segments, and Permissions
- Role-based access control (e.g. BROKER, REALTOR_AGENT)
- Workspace as Segments / Lists scoping
- Permission policies by channel, feature, and action
- Audit trail for sensitive operations

### CRM domain
- Contacts
- Leads (with Bulk Select, Segments, and AI Assist flags)
- Deals (Kanban Pipeline)
- Listings
- Tasks
- Notes
- Activities (Unified Timeline)
- Smart Plans (AI Drip Campaigns)
- Lead Intelligence (Social & Public Records Scrapers)

### Workflow engine
- Trigger / condition / action model
- State-machine persistence (`WorkflowSession`)
- Branching logic
- Human approval steps
- Versioning
- Templates
- Bidirectional linkage to Deals and Leads

### Communication hub
- Sync Queue for pulling external leads
- Email / SMS / Text logging
- Call logging
- Unified activity feed

### AI services
- Agentic Co-Pilot (Gemini 2.5 Flash)
- Tool Calling for feature execution (Bulk actions, Segments)
- Content generation assistant
- Summarization and extraction service
- Automated Intelligence Scrapers

## 3. Data model concepts

### Core entities
- User
- Workspace (Acts as a Segment/List)
- WorkspaceMember
- Contact
- Lead
- Deal
- Task
- Activity
- WorkflowSession
- SmartPlan
- VerificationToken

### Important relationships
- A workspace acts as a segmented container for leads, deals, tasks, workflows, and integrations.
- A contact can be linked to one or more leads and deals.
- A lead can have connected workflows and an active AI Smart Plan.
- A workflow session preserves structured JSON data drafted in the studio before formal submission.

## 4. API surface areas
- Auth / users / roles
- Leads / contacts / deals / listings / tasks
- Workflow CRUD and execution
- AI Chat and Tool Calling Router (`/api/chat`)
- Sync Queue (`/api/sync-queue`)
- Intelligence Scrapers

## 5. Security and audit
- Authenticated NextAuth session checks
- Workspace validation on every API route (`requireWorkspaceAccess`)
- Role validation (`requireWorkspaceRole`)
- Least privilege permissions
- Workspace isolation
