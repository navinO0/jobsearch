'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Play,
  FileText,
  Send,
  KanbanSquare,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Search,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const pathname = usePathname();
  const [triggering, setTriggering] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleTriggerRun = async () => {
    setTriggering(true);
    setNotification(null);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'search' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ msg: 'Search Pipeline Started', type: 'success' });
      } else {
        setNotification({ msg: data.error || 'Failed to trigger pipeline', type: 'error' });
      }
    } catch (e: any) {
      setNotification({ msg: e.message, type: 'error' });
    } finally {
      setTriggering(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Openings', href: '/jobs' },
    { name: 'Search', href: '/search' },
    { name: 'Resumes', href: '/resumes' },
    { name: 'Applications', href: '/applications' },
    { name: 'Outreach', href: '/emails' },
    { name: 'Telegram', href: '/telegram' },
    { name: 'Sources', href: '/sources' },
    { name: 'Settings', href: '/settings' },
    { name: 'Logs', href: '/logs' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-bold text-sm">
              JP
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              JobPulse
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleTriggerRun}
            disabled={triggering}
            variant="default"
            size="sm"
            className="text-xs h-8 font-medium"
          >
            {triggering ? (
              <div className="w-3.5 h-3.5 border-2 border-background border-t-foreground rounded-full animate-spin mr-1.5" />
            ) : (
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            )}
            <span>{triggering ? 'Searching...' : 'Run Search'}</span>
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-1.5 text-xs font-medium flex items-center justify-center space-x-2 border-b ${
            notification.type === 'success'
              ? 'bg-muted text-foreground border-border'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}
    </header>
  );
}
