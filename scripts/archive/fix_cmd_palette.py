from pathlib import Path

p = Path("src/components/CommandPalette.tsx")
c = p.read_text(encoding="utf-8")

# Replace the empty state with quick navigation commands
old = """                  {query.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search.
                    </div>
                  )}"""

new = """                  {query.length === 0 && (
                    <Command.Group heading="Quick Navigation">
                      {[
                        { label: 'Dashboard', icon: '🏠', url: '/dashboard' },
                        { label: 'Leads', icon: '👥', url: '/dashboard/leads' },
                        { label: 'Deals', icon: '💰', url: '/dashboard/deals' },
                        { label: 'Tasks', icon: '✅', url: '/dashboard/tasks' },
                        { label: 'Campaigns', icon: '📧', url: '/dashboard/campaigns' },
                        { label: 'Inbox', icon: '📬', url: '/dashboard/inbox' },
                        { label: 'Listings', icon: '🏘️', url: '/dashboard/listings' },
                        { label: 'Reporting', icon: '📊', url: '/dashboard/reporting' },
                        { label: 'Team Chat', icon: '💬', url: '/dashboard/chat' },
                        { label: 'Help Center', icon: '❓', url: '/dashboard/help-center' },
                      ].map(cmd => (
                        <Command.Item
                          key={cmd.url}
                          value={'nav-' + cmd.label}
                          onSelect={() => handleSelect(cmd.url)}
                          className="flex items-center px-4 py-2.5 cursor-pointer rounded-md hover:bg-muted/50 aria-selected:bg-muted/50"
                        >
                          <span className="mr-2 text-sm">{cmd.icon}</span>
                          <span className="text-sm text-foreground">{cmd.label}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground">Navigate</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}"""

c = c.replace(old, new)

# Update placeholder
c = c.replace(
    'placeholder="Search leads, contacts, deals, tasks..."',
    'placeholder="Search or type a page name..."'
)

p.write_text(c, encoding="utf-8")
print("CommandPalette enhanced with quick navigation")
