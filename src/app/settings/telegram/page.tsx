'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TelegramSettingsPage() {
  const [chatId, setChatId] = useState('617149298');
  const [minScore, setMinScore] = useState('70');
  const [oneByOne, setOneByOne] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Telegram Delivery Settings</h1>
          <p className="text-xs text-muted-foreground">
            Configure bot delivery rules, destination chat ID, and match threshold.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Telegram settings saved!</span>
        </div>
      )}

      <Card className="shadow-none border-border/80">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Destination Telegram Chat ID</label>
            <Input value={chatId} onChange={(e) => setChatId(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              User or channel chat ID where one-by-one job notifications are transmitted.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Minimum Match Score Threshold (%)</label>
            <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              Only openings matching at or above this percentage will trigger immediate Telegram alerts.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={oneByOne}
                onChange={(e) => setOneByOne(e.target.checked)}
                className="rounded border-border text-primary"
              />
              Deliver Openings One-by-One with Inline Action Buttons
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-3 border-t border-border/40">
          <Button onClick={handleSave} className="h-9">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Configuration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
