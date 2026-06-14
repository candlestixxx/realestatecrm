import { FolderDetectionService } from './folder-detection';
import { SocialCopyService, type ListingStage } from './social-copy';
import { saveWorkflowRecord } from '@/lib/workflow-store';

export interface WebhookPayload {
  event: string;
  listingId: string;
  address: string;
  agentId: string;
  statusUpdate?: ListingStage;
}

export class AutomationTriggerService {
  /**
   * Handles listing webhook triggers or direct actions, runs copy generation, and updates the CRM workflow store directly.
   */
  public static async triggerPipeline(payload: WebhookPayload) {
    if (!payload.address || !payload.listingId) {
      throw new Error('Missing address or listingId');
    }

    // Determine stage
    let targetStage: ListingStage = 'Coming Soon';
    if (payload.statusUpdate) {
      targetStage = payload.statusUpdate;
    } else if (payload.event === 'listing.created') {
      targetStage = 'Just Listed';
    }

    // Find local property folder
    const folderPath = FolderDetectionService.findPropertyFolder(payload.address) || '';

    // Generate marketing social copy
    const highlights = ['Stunning exterior architecture', 'Newly upgraded kitchen', 'Premium location'];
    const socialCaption = await SocialCopyService.generateSocialCopy(payload.address, targetStage, highlights);

    // Save state directly into CRM workflows store
    const workflowId = `marketing-media:${payload.listingId}`;
    const snapshot = {
      draft: {
        propertyAddress: payload.address,
        socialCaption,
        highlights: highlights.join(', '),
        sourceFolderPath: folderPath,
        lastSync: new Date().toISOString(),
      },
      banner: folderPath
        ? `Marketing assets successfully loaded from: ${folderPath}`
        : 'Marketing assets successfully generated. (No local directory found, using defaults)',
      activity: [
        {
          title: 'Pipeline Triggered',
          detail: `Pipeline triggered by ${payload.agentId || 'system'} for event: ${payload.event}`,
          timestamp: new Date().toISOString(),
        }
      ],
      lastSavedAt: new Date().toISOString()
    };

    const record = await saveWorkflowRecord(workflowId, snapshot);
    return {
      success: true,
      workflowId,
      record
    };
  }
}
