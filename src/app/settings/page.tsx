'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Cpu,
  Mail,
  FolderOpen,
  Bot,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SettingsHubPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Platform Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage AI model routing, Google Workspace credentials, outreach throttles, and Telegram bot parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Routing */}
        <Card className="shadow-none border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                AI Provider & Models
              </CardTitle>
              <Badge variant="secondary" className="text-xs uppercase font-mono">
                {settings?.ai?.provider || 'OPENROUTER'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Configured models for matching, ATS resume tailoring, cover letters, and research.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-muted-foreground">Match Model: <span className="font-mono text-foreground">{settings?.ai?.matchModel}</span></p>
            <p className="text-muted-foreground">Resume Model: <span className="font-mono text-foreground">{settings?.ai?.resumeModel}</span></p>
          </CardContent>
          <div className="p-4 pt-0">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/settings/ai">
                Configure AI Models
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Google Workspace */}
        <Card className="shadow-none border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Google Drive & Workspace
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                Connected
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Root folder hierarchy, Google Sheets tracking, and Calendar reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-muted-foreground">Root Path: <span className="font-mono text-foreground">{settings?.google?.rootFolder}</span></p>
            <p className="text-muted-foreground">Drive Folder Cache: <span className="text-emerald-600 font-semibold">Active</span></p>
          </CardContent>
          <div className="p-4 pt-0">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/settings/google">
                Configure Google Integration
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Email Outreach */}
        <Card className="shadow-none border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email Outreach & Safeguards
              </CardTitle>
              <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
                Guard Active
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Strict human approval gates, daily limits, and company domain cooldowns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-muted-foreground">Hourly Limit: <span className="font-semibold text-foreground">5 emails/hr</span></p>
            <p className="text-muted-foreground">Daily Limit: <span className="font-semibold text-foreground">20 emails/day</span></p>
          </CardContent>
          <div className="p-4 pt-0">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/settings/email">
                Configure Outreach Settings
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Telegram Alerts */}
        <Card className="shadow-none border-border/80 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                Telegram Delivery
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Chat: {settings?.telegram?.chatId || '617149298'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              One-by-one rich job notifications with opaque interactive buttons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <p className="text-muted-foreground">Score Threshold: <span className="font-semibold text-foreground">≥ 70% ATS match</span></p>
            <p className="text-muted-foreground">Delivery Mode: <span className="font-semibold text-foreground">Sequential One-by-One</span></p>
          </CardContent>
          <div className="p-4 pt-0">
            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/settings/telegram">
                Configure Telegram Bot
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
