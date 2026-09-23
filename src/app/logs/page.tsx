'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LogsPage() {
  const [loading, setLoading] = useState(true);
  const [errorEvents, setErrorEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setErrorEvents(data.errorEvents || []);
        setAuditLogs(data.auditLogs || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs & DLQ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured error events, retry dead letter queue, and transactional audit trails.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Logs
        </Button>
      </div>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid grid-cols-2 max-w-sm mb-6">
          <TabsTrigger value="errors" className="text-xs">
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
            Error Events ({errorEvents.length})
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Audit Trail ({auditLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RotateCcw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                  Loading error events...
                </div>
              ) : errorEvents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 mb-2 opacity-80" />
                  <p className="text-xs">No unresolved error events in DLQ.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {errorEvents.map((err) => (
                    <div key={err.id} className="p-4 hover:bg-muted/20 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {err.error_type} in {err.workflow_name || 'Pipeline'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(err.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-mono bg-muted/40 p-2 rounded">
                        {err.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Node: {err.node_name || 'N/A'} • Retries: {err.retry_count || 0}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RotateCcw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                  Loading audit logs...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-xs">No audit logs recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-muted/20 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-foreground">Action: {log.action}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Entity: {log.entity_type} ({log.entity_id}) • Actor: {log.actor}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
