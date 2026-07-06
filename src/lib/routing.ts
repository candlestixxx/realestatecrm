import prisma from './prisma';

export async function routeLeadAction(leadId: string) {
  try {
    // 1. Fetch lead details, associated contact, and segments
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        contact: true,
        segments: true
      }
    });

    if (!lead) {
      console.warn(`[Lead Routing] Lead ${leadId} not found.`);
      return { error: 'Lead not found' };
    }

    // 2. Fetch all active routing rules for this workspace
    const rules = await prisma.leadRoutingRule.findMany({
      where: {
        workspaceId: lead.workspaceId,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (rules.length === 0) {
      console.log(`[Lead Routing] No active routing rules found for workspace ${lead.workspaceId}.`);
      return { success: false, message: 'No active rules matching' };
    }

    // 3. Find first matching rule
    let matchedRule = null;
    for (const rule of rules) {
      // Match by source
      if (rule.source && lead.source?.toLowerCase() === rule.source.toLowerCase()) {
        matchedRule = rule;
        break;
      }
      // Match by segment (if lead belongs to segmentId)
      if (rule.segmentId && lead.segments.some(s => s.id === rule.segmentId)) {
        matchedRule = rule;
        break;
      }
      // Fallback fallback rule (no source or segment defined)
      if (!rule.source && !rule.segmentId) {
        matchedRule = rule;
      }
    }

    if (!matchedRule) {
      console.log(`[Lead Routing] Lead ${leadId} did not match any active routing rules.`);
      return { success: false, message: 'No matching rule criteria' };
    }

    // 4. Parse agent pool
    const agentIds = matchedRule.agentIds
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    if (agentIds.length === 0) {
      console.warn(`[Lead Routing] Matched rule ${matchedRule.name} has an empty agent pool.`);
      return { error: 'Empty agent pool' };
    }

    // 5. Select assigned agent using round-robin index pointer
    const assignIndex = matchedRule.currentIndex % agentIds.length;
    const assignedAgentId = agentIds[assignIndex];

    const agentUser = await prisma.user.findUnique({
      where: { id: assignedAgentId },
      select: { name: true }
    });

    // 6. Assign the lead and increment round-robin pointer in a transaction
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: { userId: assignedAgentId }
      }),
      prisma.leadRoutingRule.update({
        where: { id: matchedRule.id },
        data: { currentIndex: (assignIndex + 1) % agentIds.length }
      }),
      prisma.activity.create({
        data: {
          type: 'SYSTEM',
          content: `Lead automatically routed to agent ${agentUser?.name || 'Agent'} via round-robin rule: "${matchedRule.name}"`,
          workspaceId: lead.workspaceId,
          leadId: leadId
        }
      })
    ]);

    console.log(`[Lead Routing] Lead ${leadId} successfully assigned to agent ${assignedAgentId} via rule "${matchedRule.name}".`);
    return { success: true, assignedAgentId };
  } catch (err: any) {
    console.error('[Lead Routing] Error routing lead:', err);
    return { error: err.message || 'Routing failed' };
  }
}
