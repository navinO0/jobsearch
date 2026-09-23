'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function EmailQueuePage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.emails) {
        setEmails(data.emails.filter((e: any) => e.status === 'APPROVAL_REQUIRED' || e.status === 'PENDING'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecision = async (id: string, action: 'approve' | 'cancel') => {
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      setActionNotice(data.message || (action === 'approve' ? 'Email approved for dispatch' : 'Email cancelled'));
      await fetchQueue();
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e: any) {
      setActionNotice(e.message);
    }
  };

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
            <h1 className="text-2xl font-bold tracking-tight">Review & Approval Queue</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Strict human approval gate: drafted applications remain in queue until explicitly authorized.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQueue} disabled={loading}>
          <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">
          <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
          <p className="text-sm">Loading approval queue...</p>
        </div>
      ) : emails.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-semibold text-base">Approval Queue is Clear</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No outgoing emails are waiting for manual review. All approved items have been scheduled or dispatched.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {emails.map((em) => (
            <Card key={em.id} className="shadow-none border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      {em.subject}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      To: <b className="text-foreground">{em.recipient_email}</b>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Approval Required
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/20 border border-border/40 rounded-lg text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {em.body_text}
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-border/40 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => handleDecision(em.id, 'cancel')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Cancel Draft
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleDecision(em.id, 'approve')}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Authorize & Send
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
