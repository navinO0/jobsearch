'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function EmailsPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [rateLimitOk, setRateLimitOk] = useState(true);
  const [rateLimitReason, setRateLimitReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      setEmails(data.emails || []);
      setRateLimitOk(data.rateLimitOk);
      setRateLimitReason(data.rateLimitReason || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'cancel') => {
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      setActionMsg(data.message || 'Action executed');
      fetchEmails();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: any) {
      setActionMsg(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Email Outbox</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Guarded outbox pattern with manual review gates and company cooldown throttles.
        </p>
      </div>

      {/* Metric Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="border rounded-md p-3 bg-card flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground text-[11px]">Safety Policy</div>
            <div className="font-medium text-foreground">Manual Approval</div>
          </div>
        </div>
        <div className="border rounded-md p-3 bg-card flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-muted-foreground text-[11px]">Safety Limits</div>
            <div className="font-medium text-foreground">5 / hr • 25 / day</div>
          </div>
        </div>
        <div className="border rounded-md p-3 bg-card flex items-center gap-3">
          {rateLimitOk ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <div>
            <div className="text-muted-foreground text-[11px]">Rate Status</div>
            <div className="font-medium text-foreground">{rateLimitOk ? 'Available' : rateLimitReason}</div>
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="p-2.5 rounded-md bg-muted border border-border text-foreground text-xs">
          {actionMsg}
        </div>
      )}

      {/* Outbox Table */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Pending & Dispatched Outbox</CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {emails.length}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-xs text-muted-foreground p-6 text-center">Loading outbox...</div>
          ) : emails.length === 0 ? (
            <div className="text-xs text-muted-foreground p-6 text-center">
              No emails currently in the outbox.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b">
                  <tr>
                    <th className="p-3 font-medium">Recipient</th>
                    <th className="p-3 font-medium">Subject</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {emails.map((e) => (
                    <tr key={e.id} className="hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">
                        {e.recipient_name ? `${e.recipient_name} <${e.recipient_email}>` : e.recipient_email}
                      </td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{e.subject}</td>
                      <td className="p-3">
                        <Badge
                          variant={e.status === 'SENT' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {e.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-1.5">
                        {e.status === 'APPROVAL_REQUIRED' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(e.id, 'approve')}
                              className="h-6 text-[10px] px-2"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(e.id, 'cancel')}
                              className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
