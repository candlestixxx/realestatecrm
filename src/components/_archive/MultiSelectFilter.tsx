'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface MultiSelectFilterProps {
  name: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export default function MultiSelectFilter({ name, options, placeholder = "Filter by status" }: MultiSelectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedValues = searchParams.getAll(name);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // reset page to 1 on filter changes
    params.set('page', '1');

    if (value === 'ALL') {
      params.delete(name);
    } else {
      const current = params.getAll(name);
      params.delete(name); // clear to rebuild

      let nextValues = [...current];
      if (nextValues.includes(value)) {
        nextValues = nextValues.filter(v => v !== value);
      } else {
        nextValues.push(value);
      }

      // If nothing selected, or if 'ALL' is implicitly intended, we just don't add
      nextValues.forEach(val => params.append(name, val));
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background border border-border rounded-md px-4 py-2 text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors"
      >
        <span>
          {selectedValues.length === 0
            ? placeholder
            : `${selectedValues.length} selected`}
        </span>
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          <div
            className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-muted/50 ${selectedValues.length === 0 ? 'bg-primary/5 text-primary' : ''}`}
            onClick={() => toggleValue('ALL')}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedValues.length === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
              {selectedValues.length === 0 && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            All Statuses
          </div>

          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                className={`px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-primary/5 text-primary' : ''}`}
                onClick={() => toggleValue(option.value)}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                {option.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
