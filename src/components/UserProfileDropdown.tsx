'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { 
  User, 
  CreditCard, 
  RefreshCw, 
  Gift, 
  LogOut, 
  Plus, 
  Shuffle 
} from 'lucide-react';

export default function UserProfileDropdown({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const initial = (userName || userEmail || '?')[0].toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-9 h-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm hover:bg-primary/30 transition-all shadow-sm cursor-pointer select-none"
      >
        {initial}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-50 w-72 bg-background border border-border/80 rounded-2xl shadow-2xl overflow-hidden py-3 text-left">
          {/* Header Info block */}
          <div className="px-4 py-2 flex flex-col items-center text-center space-y-1.5 pb-4 border-b border-border/40">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shadow-inner select-none">
              {initial}
            </div>
            <div>
              <span className="text-sm font-black text-foreground block">{userName}</span>
              <span className="text-xs text-muted-foreground block font-semibold">{userEmail}</span>
            </div>

            {/* Quick account action buttons */}
            <div className="flex gap-2 pt-2.5 w-full">
              <button className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 border border-border/80 hover:bg-muted text-[10px] font-black rounded-lg transition-colors cursor-pointer text-foreground">
                <Plus className="w-3 h-3" />
                Add Account
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 border border-border/80 hover:bg-muted text-[10px] font-black rounded-lg transition-colors cursor-pointer text-foreground">
                <Shuffle className="w-3 h-3" />
                Switch Account
              </button>
            </div>
          </div>

          {/* Settings / System menus */}
          <div className="py-2.5 space-y-1 px-2 border-b border-border/40">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <CreditCard className="w-4 h-4" />
              Billing Center
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <RefreshCw className="w-4 h-4" />
              Product Updates
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground transition-all cursor-pointer">
              <Gift className="w-4 h-4" />
              Earn Rewards
            </button>
          </div>

          {/* Logout button */}
          <div className="pt-2 px-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-xs font-black rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
