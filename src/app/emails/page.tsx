'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Email Outbox & Safety Dispatch
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review generated application emails, enforce rate-limit guards, and approve delivery to verified recruiter contacts.
        </p>
      </div>

      {/* Safety Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4 flex items-center space-x-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div>
            <div className="text-xs text-slate-400">Safety Policy</div>
            <div className="text-sm font-bold text-white">Manual Approval Required</div>
          </div>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4 flex items-center space-x-3">
          <Clock className="w-8 h-8 text-cyan-400" />
          <div>
            <div className="text-xs text-slate-400">Hourly / Daily Throttle</div>
            <div className="text-sm font-bold text-white">5 / hr • 25 / day</div>
          </div>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4 flex items-center space-x-3">
          {rateLimitOk ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          )}
          <div>
            <div className="text-xs text-slate-400">Rate Limit Status</div>
            <div className="text-sm font-bold text-white">{rateLimitOk ? 'Normal (Ready)' : rateLimitReason}</div>
          </div>
        </Card>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-sm">
          {actionMsg}
        </div>
      )}

      {/* Outbox Table */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Outbox Queue</span>
            <Badge variant="outline" className="text-xs border-slate-700">
              {emails.length} queued messages
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-xs text-slate-500 py-4">Loading outbox...</div>
          ) : emails.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No emails currently in the outbox. Generated application emails requiring approval will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {emails.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-200">
                        {e.recipient_name ? `${e.recipient_name} <${e.recipient_email}>` : e.recipient_email}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">{e.subject}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            e.status === 'SENT'
                              ? 'success'
                              : e.status === 'APPROVAL_REQUIRED'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {e.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(e.created_at).toLocaleString()}</td>
                      <td className="p-3 text-right space-x-2">
                        {e.status === 'APPROVAL_REQUIRED' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(e.id, 'approve')}
                              className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(e.id, 'cancel')}
                              className="h-7 text-[11px] border-slate-700 text-red-400 hover:text-red-300"
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
