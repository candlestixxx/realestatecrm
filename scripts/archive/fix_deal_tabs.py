from pathlib import Path

p = Path("src/components/DealDetailLayoutClient.tsx")
c = p.read_text(encoding="utf-8")

# 1. Add state for requirements and stakeholders
c = c.replace(
    "  const [activeTab, setActiveTab] = useState<'roadmap' | 'vault' | 'messages' | 'tasks'>('roadmap');",
    "  const [activeTab, setActiveTab] = useState<'roadmap' | 'vault' | 'messages' | 'tasks' | 'requirements' | 'stakeholders'>('roadmap');\n  const [requirements, setRequirements] = useState<any[]>([]);\n  const [stakeholders, setStakeholders] = useState<any[]>([]);"
)

# 2. Add tab buttons
c = c.replace(
    """              { id: 'roadmap', label: 'Roadmap Checklist' },
              { id: 'vault', label: 'Documents Vault' },
              { id: 'messages', label: 'Co-Op Communication' },
              { id: 'tasks', label: 'Task List' },""",
    """              { id: 'roadmap', label: 'Roadmap Checklist' },
              { id: 'vault', label: 'Documents Vault' },
              { id: 'messages', label: 'Co-Op Communication' },
              { id: 'tasks', label: 'Task List' },
              { id: 'requirements', label: 'Requirements' },
              { id: 'stakeholders', label: 'Stakeholders' },"""
)

# 3. Add tab content before closing </div> of min-h-[450px]
tab_content = """            {/* REQUIREMENTS TAB */}
            {activeTab === 'requirements' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Deal Requirements</h3>
                  <p className="text-xs text-muted-foreground">Track closing requirements like title, inspection, appraisal, and financing.</p>
                </div>
                {requirements.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">No requirements yet. Add requirements via the API or ask your coordinator.</p>
                ) : (
                  <div className="space-y-2">
                    {requirements.map((req: any) => (
                      <div key={req.id} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-3">
                        <span className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (req.status === 'COMPLETED' ? 'bg-green-500' : req.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-red-500')} />
                        <div className="flex-1">
                          <p className="font-bold text-xs text-foreground">{req.title}</p>
                          {req.description && <p className="text-[10px] text-muted-foreground mt-0.5">{req.description}</p>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">{req.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STAKEHOLDERS TAB */}
            {activeTab === 'stakeholders' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Deal Stakeholders</h3>
                  <p className="text-xs text-muted-foreground">People involved: title company, lender, inspector, appraiser, client.</p>
                </div>
                {stakeholders.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">No stakeholders assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {stakeholders.map((s: any) => (
                      <div key={s.id} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {s.role.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-xs text-foreground">{s.contact ? s.contact.firstName + ' ' + s.contact.lastName : s.user?.name || 'Unassigned'}</p>
                          <p className="text-[10px] text-muted-foreground">{s.role} · {s.permissions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
"""

c = c.replace(
    """              </div>
            )}

          </div>

        </div>

      </div>""",
    """              </div>
            )}
""" + tab_content + """
          </div>

        </div>

      </div>"""
)

p.write_text(c, encoding="utf-8")
print("DealDetailLayoutClient updated with Requirements + Stakeholders tabs")
