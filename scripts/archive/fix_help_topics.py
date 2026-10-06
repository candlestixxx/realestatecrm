from pathlib import Path

p = Path("src/app/dashboard/help-center/page.tsx")
c = p.read_text(encoding="utf-8")

# Add 2 new topics before the closing ];
new_topics = """    simulationLogs: [
      '\U0001F50D [Monitor] Scanning Macomb County legal notices... Found 3 new filings.',
      '\U0001F4C4 [Parser] Extracted: "8485 Sherman Ave, Warren MI 48089" \u2014 Case #2024-CV-1234.',
      '\u26A0\uFE0F [Alert] Auction date: 2025-03-15 | Redemption period: 6 months.',
      '\U0001F464 [Lead] Created distressed property lead and assigned to investor pipeline.'
    ]
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts & Quick Navigation',
    category: 'Platform',
    description: 'Power-user keyboard shortcuts for navigating the CRM, searching records, and running commands.',
    steps: [
      'Press Cmd+K (or Ctrl+K) anywhere to open the Command Palette.',
      'When the palette is empty, see quick navigation links to top pages.',
      'Type at least 2 characters to search leads, contacts, deals, and tasks.',
      'Use arrow keys to navigate results and Enter to open the selected record.'
    ],
    simulationLogs: [
      '\u2325 [Palette] Opened command palette with Cmd+K.',
      '\U0001F50D [Search] Query "8485 Sherman" \u2014 found 1 matching lead.',
      '\u23CE [Navigate] Opening lead detail page for "8485 Sherman Ave".',
      '\u2705 [Done] Command palette used in 1.2 seconds.'
    ]
  },
  {
    id: 'collaboration',
    title: 'Team Chat & Internal Collaboration',
    category: 'Communications',
    description: 'Private direct messages and group chat channels for your team. Keep deal discussions in context.',
    steps: [
      'Open Team Chat from the sidebar or the Unified Inbox page.',
      'Create a private DM with any team member or start a group channel.',
      'Chat messages are persisted per workspace for compliance.',
      'Reference deals and leads directly in chat messages.'
    ],
    simulationLogs: [
      '\U0001F4AC [Chat] Opened Team Chat \u2014 3 active conversations.',
      '\U0001F464 [DM] Started private chat with "Hank Mendez".',
      '\U0001F4E2 [Group] Created group "Deal #45 \u2014 Closing Team" with 4 members.',
      '\u2705 [Sync] Chat history synced and saved to workspace.'
    ]
  }
];"""

c = c.replace("    ]\n  }\n];", new_topics)
p.write_text(c, encoding="utf-8")
print("Added 2 help-center topics: shortcuts, collaboration")
