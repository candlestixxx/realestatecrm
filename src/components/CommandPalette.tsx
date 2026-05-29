'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, User, Building2, Briefcase, CheckSquare, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

type SearchResult = {
  id: string;
  type: 'lead' | 'contact' | 'deal' | 'task';
  title: string;
  subtitle: string;
  url: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);




  const debouncedText = debouncedQuery[0];
  useEffect(() => {
    let isMounted = true;

    // Instead of calling fetchResults directly which updates state, wrap it
    const doFetch = async () => {
        if (!debouncedText || debouncedText.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedText)}`);
            if (response.ok && isMounted) {
                const data = await response.json();
                setResults(data.results || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    doFetch();

    return () => { isMounted = false; };
  }, [debouncedText]);


  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery('');
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <User className="w-4 h-4 mr-2 text-blue-500" />;
      case 'contact':
        return <Building2 className="w-4 h-4 mr-2 text-green-500" />;
      case 'deal':
        return <Briefcase className="w-4 h-4 mr-2 text-amber-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 mr-2 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 mr-2" />;
    }
  };



  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center text-sm text-muted-foreground bg-muted/50 hover:bg-muted transition-colors px-3 py-1.5 rounded-md border border-border shrink-0 select-none cursor-pointer"
      >
        <Search className="w-4 h-4 mr-2" />
        <span className="hidden md:inline">Press <kbd className="mx-1 px-1 bg-background border border-border rounded font-sans text-xs">⌘K</kbd> to search</span>
        <span className="md:hidden">Search</span>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm p-4"
      >
        <Command
          className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
          shouldFilter={false}
          loop
        >
          <div className="flex items-center px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search leads, contacts, deals, tasks..."
              className="flex-1 h-14 bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {query.length > 0 && results.length === 0 && !loading && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </Command.Empty>
            )}

            {query.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            )}

            {results.map((result) => (
              <Command.Item
                key={`${result.type}-${result.id}`}
                value={`${result.type}-${result.id}`}
                onSelect={() => handleSelect(result.url)}
                className="flex items-center px-4 py-3 cursor-pointer rounded-md hover:bg-muted/50 aria-selected:bg-muted/50 group"
              >
                {getIcon(result.type)}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground group-aria-selected:text-primary">
                    {result.title}
                  </span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  )}
                </div>
                <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                  {result.type}
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Command.Dialog>
    </>
  );
}
