'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  UserCheck,
  Play,
  Activity,
  FileText,
  Send,
  KanbanSquare,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Search,
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
        setNotification({ msg: 'Search Pipeline Started across all active sources!', type: 'success' });
      } else {
        setNotification({ msg: data.error || 'Failed to trigger pipeline', type: 'error' });
      }
    } catch (e: any) {
      setNotification({ msg: e.message, type: 'error' });
    } finally {
      setTriggering(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: Briefcase },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Resumes', href: '/resumes', icon: FileText },
    { name: 'Applications', href: '/applications', icon: KanbanSquare },
    { name: 'Emails', href: '/emails', icon: Send },
    { name: 'Sources', href: '/sources', icon: Globe2 },
    { name: 'Preferences', href: '/profile', icon: UserCheck },
    { name: 'Runs & Health', href: '/runs', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-[#0b1120]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                JobPulse
              </span>
              <Badge variant="success" className="ml-1.5 py-0 px-1.5 text-[10px] font-semibold">
                v2.0 Production
              </Badge>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden xl:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-secondary text-cyan-400 border border-slate-700/60 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-secondary/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleTriggerRun}
            disabled={triggering}
            variant="gradient"
            size="sm"
            className="flex items-center space-x-2 font-semibold"
          >
            {triggering ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{triggering ? 'Searching...' : 'Run Hourly Search'}</span>
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`px-4 py-2 text-xs font-medium flex items-center justify-center space-x-2 transition-all border-y ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/80 border-red-500/30 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}
    </header>
  );
}
