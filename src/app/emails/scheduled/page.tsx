'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Mail,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ScheduledEmailsPage() {
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.emails) {
        setScheduledEmails(data.emails.filter((e: any) => e.status === 'SCHEDULED' || e.status === 'APPROVED'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduled();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
              <Link href="/emails">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Scheduled Outreach Dispatch</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Timed application delivery with automatic throttling (max 5/hr) and same-company cooldowns.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchScheduled} disabled={loading}>
          <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Hourly Send Limit</p>
          <p className="text-xl font-bold mt-1">5 <span className="text-xs text-muted-foreground font-normal">/ hour max</span></p>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Daily Send Limit</p>
          <p className="text-xl font-bold mt-1">20 <span className="text-xs text-muted-foreground font-normal">/ day max</span></p>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Company Cooldown</p>
          <p className="text-xl font-bold mt-1">48h <span className="text-xs text-muted-foreground font-normal">inter-application</span></p>
        </Card>
      </div>

      <Card className="shadow-none border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Scheduled Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <RotateCcw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
              Loading scheduled queue...
            </div>
          ) : scheduledEmails.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No emails currently scheduled for delayed delivery.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledEmails.map((item) => (
                <div key={item.id} className="p-4 bg-muted/20 border border-border/40 rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-foreground">{item.subject}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">To: {item.recipient_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
