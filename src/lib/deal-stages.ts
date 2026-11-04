/**
 * Canonical deal pipeline stages — the single source of truth.
 *
 * Why: three places defined their own stage lists and drifted. The Prisma
 * default is 'LEAD' while the kanban UIs rendered only QUALIFICATION..CLOSED_WON,
 * so default-stage deals were INVISIBLE on the board, and there was no
 * CLOSED_LOST state at all (deals could never be marked lost). Stage strings
 * sent to updateDealStageAction were unvalidated.
 *
 * Pipeline flow: LEAD -> QUALIFICATION -> PROPOSAL -> NEGOTIATION ->
 * UNDER_CONTRACT -> CLOSED_WON | CLOSED_LOST
 */

export const DEAL_STAGES = [
  { id: 'LEAD', label: 'Lead', open: true },
  { id: 'QUALIFICATION', label: 'Qualification', open: true },
  { id: 'PROPOSAL', label: 'Proposal/Showing', open: true },
  { id: 'NEGOTIATION', label: 'Negotiation', open: true },
  { id: 'UNDER_CONTRACT', label: 'Under Contract', open: true },
  { id: 'CLOSED_WON', label: 'Closed Won', open: false },
  { id: 'CLOSED_LOST', label: 'Closed Lost', open: false },
] as const;

export type DealStageId = (typeof DEAL_STAGES)[number]['id'];

export const DEAL_STAGE_IDS: string[] = DEAL_STAGES.map(s => s.id);

export const OPEN_STAGES = DEAL_STAGES.filter(s => s.open);
export const CLOSED_STAGES = DEAL_STAGES.filter(s => !s.open);

export function isDealStage(value: string): value is DealStageId {
  return DEAL_STAGE_IDS.includes(value);
}

export function stageLabel(id: string): string {
  return DEAL_STAGES.find(s => s.id === id)?.label ?? id.replace(/_/g, ' ');
}
