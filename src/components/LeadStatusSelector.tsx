'use client';

import { useState } from 'react';
import { updateLeadStatusAction } from '@/lib/actions/lead';
import toast from 'react-hot-toast';

export default function LeadStatusSelector({
  leadId,
  initialStatus,
}: {
  leadId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value;
    setIsUpdating(true);
    try {
      const res = await updateLeadStatusAction(leadId, nextStatus);
      if (res && res.error) {
        toast.error(res.error);
        setStatus(status); // Revert
      } else {
        setStatus(nextStatus);
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      toast.error('Network error updating status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={status}
        disabled={isUpdating}
        onChange={handleChange}
        className="w-full p-2 bg-background border border-border rounded text-sm font-medium focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
      >
        <option value="NEW">New Lead</option>
        <option value="PROSPECTING">Prospecting</option>
        <option value="CONTACTED">Contacted</option>
        <option value="QUALIFIED">Qualified</option>
        <option value="ACTIVE_LEAD">Active Lead</option>
        <option value="PREFORECLOSURE">Preforeclosure</option>
        <option value="FSBO">FSBO</option>
        <option value="CIRCLE_PROSPECT">Circle Prospect</option>
        <option value="SPHERE">Sphere of Influence (SOI)</option>
        <option value="SERVICE_PROVIDER">Service Provider</option>
        <option value="CLOSED_CLIENT">Closed Client</option>
        <option value="EXPIRED">Expired / Withdrawn</option>
        <option value="CANCELED">Canceled</option>
      </select>
      {isUpdating && (
        <span className="absolute right-8 top-3.5 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
      )}
    </div>
  );
}
