from pathlib import Path

# AILearningMemory - add try/catch to data export and deletion handlers
p = Path('src/components/AILearningMemory.tsx')
c = p.read_text(encoding='utf-8')

c = c.replace(
    '''onClick={async () => {
              const res = await fetch('/api/ai/memory-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, dataExportRequested: true }),
              });
              if (res.ok) toast.success('Data export request submitted');
            }}''',
    '''onClick={async () => {
              try {
                const res = await fetch('/api/ai/memory-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...settings, dataExportRequested: true }),
                });
                if (res.ok) toast.success('Data export request submitted');
                else toast.error('Export request failed');
              } catch { toast.error('Network error'); }
            }}''',
    1
)

c = c.replace(
    '''onClick={async () => {
              const res = await fetch('/api/ai/memory-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, dataDeletionRequested: true }),
              });
              if (res.ok) toast.success('Data deletion request submitted');
            }}''',
    '''onClick={async () => {
              try {
                const res = await fetch('/api/ai/memory-settings', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...settings, dataDeletionRequested: true }),
                });
                if (res.ok) toast.success('Data deletion request submitted');
                else toast.error('Deletion request failed');
              } catch { toast.error('Network error'); }
            }}''',
    1
)

p.write_text(c, encoding='utf-8')
print('AILearningMemory: 2 try/catch blocks added')

# WebsiteBuilder saveSite
p = Path('src/components/dashboard/WebsiteBuilder.tsx')
c = p.read_text(encoding='utf-8')
c = c.replace(
    '''  const saveSite = async () => {
    await fetch('/api/websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug, title,
        content: blocks,
        workspaceId: getClientWorkspaceSlug(),
      }),
    });
  };''',
    '''  const saveSite = async () => {
    try {
      await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, title,
          content: blocks,
          workspaceId: getClientWorkspaceSlug(),
        }),
      });
    } catch (e) {
      console.error('Save failed:', e);
    }
  };''',
    1
)
p.write_text(c, encoding='utf-8')
print('WebsiteBuilder: try/catch added to saveSite')
