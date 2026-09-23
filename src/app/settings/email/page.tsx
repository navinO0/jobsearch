'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EmailSettingsPage() {
  const [senderName, setSenderName] = useState('Alex Taylor');
  const [senderEmail, setSenderEmail] = useState('alex.taylor@example.com');
  const [replyTo, setReplyTo] = useState('alex.taylor@example.com');
  const [dailyLimit, setDailyLimit] = useState('20');
  const [hourlyLimit, setHourlyLimit] = useState('5');
  const [cooldownHours, setCooldownHours] = useState('48');
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
          <h1 className="text-xl font-bold tracking-tight">Email Outreach Safeguards</h1>
          <p className="text-xs text-muted-foreground">
            Configure delivery limits, anti-spam protections, and candidate domain safeguards.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Email settings saved successfully!</span>
        </div>
      )}

      <Card className="shadow-none border-border/80">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Sender Display Name</label>
              <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Sender Email Address</label>
              <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Reply-To Address</label>
              <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Same-Company Cooldown (Hours)</label>
              <Input value={cooldownHours} onChange={(e) => setCooldownHours(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Hourly Send Limit (Max)</label>
              <Input value={hourlyLimit} onChange={(e) => setHourlyLimit(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Daily Send Limit (Max)</label>
              <Input value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
            </div>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              Human Approval Policy:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Auto-send is permanently disabled by default. All drafted applications require manual authorization from the UI or Telegram inline buttons before dispatch.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-3 border-t border-border/40">
          <Button onClick={handleSave} className="h-9">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Safeguards
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
