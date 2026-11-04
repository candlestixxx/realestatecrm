from pathlib import Path

p = Path("src/app/dashboard/partners/page.tsx")
c = p.read_text(encoding="utf-8")

# Replace the read-only permissions display with editable toggles
old = """            {/* Permissions */}
            {selectedPartner.permissions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Partner Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedPartner.permissions[0]).filter(([k]) => k.startsWith('can')).map(([k, v]) => (
                    <span key={k} className={'px-2 py-1 rounded text-xs ' + (v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500')}>
                      {k.replace('can', '').replace(/([A-Z])/g, ' $1').trim()} {v ? 'Yes' : 'No'}
                    </span>
                  ))}
                </div>
              </div>
            )}"""

new = """            {/* Permissions */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Partner Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {(['canViewLeads', 'canViewDeals', 'canViewContacts', 'canCreateReferral', 'canEditReferral'] as const).map(k => {
                  const val = selectedPartner.permissions[0]?.[k] || false;
                  return (
                    <button
                      key={k}
                      onClick={async () => {
                        const body: any = { partnerId: selectedPartner.id };
                        body[k] = !val;
                        try {
                          await fetch('/api/partner-permissions', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                          });
                          // Update local state
                          setSelectedPartner({
                            ...selectedPartner,
                            permissions: [{ ...selectedPartner.permissions[0], [k]: !val }],
                          });
                        } catch {}
                      }}
                      className={'px-2 py-1 rounded text-xs cursor-pointer transition-colors ' + (val ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
                      title={'Click to toggle ' + k.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                    >
                      {k.replace('can', '').replace(/([A-Z])/g, ' $1').trim()} {val ? 'Yes' : 'No'}
                    </button>
                  );
                })}
              </div>
            </div>"""

c = c.replace(old, new)
p.write_text(c, encoding="utf-8")
print("Partner permissions now editable via API")
