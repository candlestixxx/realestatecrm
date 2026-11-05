'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, UserPlus, KeyRound, Trash2, ShieldCheck, Copy } from 'lucide-react';

/**
 * Settings → Team
 * White-label team management: invite agents, assign roles from the
 * brokerage hierarchy (OWNER > BROKER > ASSOCIATE_BROKER > REALTOR_AGENT >
 * AGENT / OFFICE_MANAGER), reset passwords, remove members.
 */

interface Member {
  memberId: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  joinedAt: string;
  hasPassword: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  BROKER: 'Broker',
  ASSOCIATE_BROKER: 'Associate Broker',
  REALTOR_AGENT: 'Realtor Agent',
  AGENT: 'Agent',
  OFFER_MANAGER: 'Office Manager',
  ADMIN: 'Admin',
};

const ROLE_RANK: Record<string, number> = {
  OWNER: 100, ADMIN: 90, BROKER: 80, ASSOCIATE_BROKER: 60, REALTOR_AGENT: 40, AGENT: 40, OFFER_MANAGER: 20,
};

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [yourRole, setYourRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'AGENT' });
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password?: string } | null>(null);

  const canManage = ['OWNER', 'BROKER', 'ADMIN'].includes(yourRole);

  const load = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load team');
      setMembers(data.members || []);
      setYourRole(data.yourRole || '');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invite failed');
      toast.success('Member added');
      setShowInvite(false);
      setInvite({ name: '', email: '', role: 'AGENT' });
      if (data.tempPassword) {
        setCreatedCreds({ email: data.member.email, password: data.tempPassword });
      } else {
        setCreatedCreds({ email: data.member.email });
      }
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const changeRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'role', memberId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Role updated');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const resetPassword = async (member: Member) => {
    const pw = window.prompt('New password for ' + (member.email || '') + ' (min 8 chars):');
    if (!pw) return;
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'password', memberId: member.memberId, newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Password reset — share it with the member securely');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeMember = async (member: Member) => {
    if (!window.confirm('Remove ' + (member.email || 'this member') + ' from the workspace?')) return;
    try {
      const res = await fetch('/api/team?memberId=' + encodeURIComponent(member.memberId), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success('Member removed');
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 text-foreground">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage workspace members, roles, and access.</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setShowInvite(v => !v)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-1.5 hover:opacity-90">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      {createdCreds && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
          <p className="text-sm text-emerald-400 font-bold flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Account ready</p>
          <p className="text-xs text-muted-foreground">
            {createdCreds.password
              ? 'Share these credentials over a secure channel (not email/chat). The password is shown only once:'
              : 'Existing account added to the workspace:'}
          </p>
          <div className="text-xs font-mono bg-background border border-border/40 rounded-lg p-3 space-y-1">
            <p>Email: {createdCreds.email}</p>
            {createdCreds.password && (
              <p className="flex items-center gap-2">
                Temp password: <strong>{createdCreds.password}</strong>
                <button type="button" onClick={() => { navigator.clipboard.writeText(createdCreds.password!); toast.success('Copied'); }}
                  className="text-primary hover:underline flex items-center gap-1"><Copy className="w-3 h-3" /> Copy</button>
              </p>
            )}
          </div>
          <button type="button" onClick={() => setCreatedCreds(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      {showInvite && (
        <form onSubmit={submitInvite} className="p-5 bg-muted/30 border border-border/60 rounded-2xl space-y-4 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Full Name *</label>
              <input type="text" required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Email *</label>
              <input type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground block uppercase mb-1">Role</label>
            <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm">
              {Object.keys(ROLE_LABELS)
                .filter(r => (ROLE_RANK[r] || 0) <= (ROLE_RANK[yourRole] || 0))
                .map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg">Add Member</button>
            <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 border border-border text-sm font-bold rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading team...</p>
      ) : (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left">
                <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">Member</th>
                <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">Role</th>
                <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase">Access</th>
                <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.memberId} className="border-b border-border/20 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground">{m.name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && (ROLE_RANK[m.role] || 0) <= (ROLE_RANK[yourRole] || 0) ? (
                      <select value={m.role} onChange={(e) => changeRole(m.memberId, e.target.value)}
                        className="bg-background border border-border/60 rounded-lg px-2 py-1.5 text-xs">
                        {Object.keys(ROLE_LABELS)
                          .filter(r => (ROLE_RANK[r] || 0) <= (ROLE_RANK[yourRole] || 0))
                          .map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs font-bold">{ROLE_LABELS[m.role] || m.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.hasPassword
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Password set</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">No password</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => resetPassword(m)} title="Reset password"
                          className="p-1.5 text-muted-foreground hover:text-primary border border-border rounded-lg"><KeyRound className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => removeMember(m)} title="Remove member"
                          className="p-1.5 text-muted-foreground hover:text-red-500 border border-border rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
