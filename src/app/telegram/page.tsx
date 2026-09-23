'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bot,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TelegramPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});
  const [testSending, setTestSending] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchTelegramData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setCallbacks(data.callbacks || []);
        setConfig(data.botConfig || {});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramData();
  }, []);

  const handleSendTestAlert = async () => {
    setTestSending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_message',
          text: '🤖 <b>Telegram Notification Test</b>\n\nJob Search automation bot is healthy and transmitting alerts.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ msg: 'Test message transmitted to Telegram successfully!', ok: true });
        await fetchTelegramData();
      } else {
        setNotice({ msg: data.error || 'Failed to dispatch test message', ok: false });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, ok: false });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Telegram Notification Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monitor real-time one-by-one job alerts and interactive callback button interactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSendTestAlert}
            disabled={testSending}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {testSending ? 'Sending...' : 'Send Test Alert'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchTelegramData} disabled={loading}>
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            notice.ok
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {notice.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Config Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Bot Token Status</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="secondary"
              className={config.botConfigured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}
            >
              {config.botConfigured ? 'Connected' : 'Not Configured'}
            </Badge>
          </div>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Chat ID Target</p>
          <p className="text-base font-mono font-semibold mt-1">
            {config.chatId || '617149298'}
          </p>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Delivery Policy</p>
          <p className="text-base font-semibold mt-1">One-by-One (Score ≥ 70%)</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outbox Messages */}
        <Card className="shadow-none border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Recent Telegram Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading telegram outbox...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground">No telegram messages dispatched yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className="p-3 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{m.job_title || 'System Notification'}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {m.status}
                      </Badge>
                    </div>
                    {m.company_name && (
                      <p className="text-muted-foreground">Company: {m.company_name}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Sent: {m.sent_at ? new Date(m.sent_at).toLocaleString() : 'Queued'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Callback Actions */}
        <Card className="shadow-none border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Interactive Button Callbacks Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading callback activity...</p>
            ) : callbacks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No callback actions received yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {callbacks.map((c) => (
                  <div key={c.id} className="p-3 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        Action: {c.action}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(c.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Job ID: {c.job_id || 'N/A'} • User: {c.user_id || 'Admin'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
